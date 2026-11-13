import { randomUUID } from 'node:crypto';
import { afterAll,describe,expect,it } from 'vitest';
import { Pool } from 'pg';
import { createPostgresAdapter } from './postgres-adapter';
import { hashSessionToken,resolveLocalSession } from './lucia-session';
import { withVerifiedRequestContext } from './request-context';
import type { VerifiedInternalUserId } from './workspace-access';

const ownerUrl=process.env.ARIOVELLE_RLS_TEST_OWNER_DATABASE_URL;
const runtimeUrl=process.env.ARIOVELLE_RLS_TEST_RUNTIME_DATABASE_URL;
const ownerPool=ownerUrl?new Pool({connectionString:ownerUrl,max:1,ssl:{rejectUnauthorized:true}}):null;
const runtimePool=runtimeUrl?new Pool({connectionString:runtimeUrl,max:1,ssl:{rejectUnauthorized:true}}):null;
const runtimeDb=runtimePool?createPostgresAdapter(runtimePool as never):null;

afterAll(async()=>{await Promise.all([ownerPool?.end(),runtimePool?.end()]);});

describe.skipIf(!ownerPool||!runtimePool||!runtimeDb)('Lucia identity and local session PostgreSQL integration',()=>{
 it('creates one local identity, persists only a session hash, and enforces workspace isolation',async()=>{
  if(!ownerPool||!runtimePool||!runtimeDb) throw new Error('Dedicated owner and runtime PostgreSQL URLs are required.');
  const subjectA='integration-'+randomUUID(),subjectB='integration-'+randomUUID();
  const tokenA='session-'+randomUUID(),tokenB='session-'+randomUUID();
  const hashA=hashSessionToken(tokenA),hashB=hashSessionToken(tokenB);
  const expires=new Date(Date.now()+60_000);
  let userA:string|undefined,userB:string|undefined,workspaceA:string|undefined,workspaceB:string|undefined;
  const runtime=await runtimePool.connect(),owner=await ownerPool.connect();
  try{
   const a=await runtime.query('SELECT * FROM app_private.establish_lucia_identity($1,$2,$3,$4,$5,$6,$7)',[
    'https://identity.integration.test',subjectA,'a@example.test',true,'Integration A',hashA,expires
   ]);
   const b=await runtime.query('SELECT * FROM app_private.establish_lucia_identity($1,$2,$3,$4,$5,$6,$7)',[
    'https://identity.integration.test',subjectB,'b@example.test',true,'Integration B',hashB,expires
   ]);
   userA=a.rows[0].user_id;workspaceA=a.rows[0].personal_workspace_id;
   userB=b.rows[0].user_id;workspaceB=b.rows[0].personal_workspace_id;
   expect(userA).not.toBe(userB);
   expect(await resolveLocalSession(runtimeDb,tokenA)).toBe(userA);
   expect(await resolveLocalSession(runtimeDb,'unknown-token')).toBeNull();

   const ownWorkspace=await withVerifiedRequestContext(runtimeDb,userA as VerifiedInternalUserId,workspaceA,async tx=>{
    const result=await tx.query<{id:string}>('SELECT id FROM public.workspaces');
    return result.rows.map(row=>row.id);
   });
   expect(ownWorkspace).toEqual([workspaceA]);

   await expect(withVerifiedRequestContext(runtimeDb,userA as VerifiedInternalUserId,workspaceB,async()=>true))
    .rejects.toThrow('not an active member');

   const crossTenant=await withVerifiedRequestContext(runtimeDb,userA as VerifiedInternalUserId,workspaceA,async tx=>{
    const result=await tx.query<{id:string}>('SELECT id FROM public.workspaces WHERE id=$1',[workspaceB]);
    return result.rowCount;
   });
   expect(crossTenant).toBe(0);

   const persisted=await runtime.query('SELECT token_hash FROM public.app_sessions WHERE token_hash=ANY($1::char(64)[])',[ [hashA,hashB] ]);
   expect(persisted.rows.map(row=>row.token_hash.trim()).sort()).toEqual([hashA,hashB].sort());
   expect(persisted.rows.some(row=>row.token_hash===tokenA)).toBe(false);
  }finally{
   runtime.release();
   if(userA&&userB){
    await owner.query('BEGIN');
    await owner.query('DELETE FROM public.app_sessions WHERE user_id=ANY($1::uuid[])',[[userA,userB]]);
    await owner.query('DELETE FROM public.external_identities WHERE user_id=ANY($1::uuid[])',[[userA,userB]]);
    await owner.query('DELETE FROM public.workspace_memberships WHERE user_id=ANY($1::uuid[])',[[userA,userB]]);
    await owner.query('DELETE FROM public.workspaces WHERE id=ANY($1::uuid[])',[[workspaceA,workspaceB]]);
    await owner.query('DELETE FROM public.user_profiles WHERE user_id=ANY($1::uuid[])',[[userA,userB]]);
    await owner.query('DELETE FROM public.user_preferences WHERE user_id=ANY($1::uuid[])',[[userA,userB]]);
    await owner.query('DELETE FROM public.users WHERE id=ANY($1::uuid[])',[[userA,userB]]);
    await owner.query('COMMIT');
   }
   owner.release();
  }
 });
});
