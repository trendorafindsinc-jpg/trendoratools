import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseAdapter, SqlExecutor } from './database';
import type { VerifiedInternalUserId } from './workspace-access';

export type LocalIdentity = { id: VerifiedInternalUserId; subject: string; email: string|null; emailVerified: boolean; displayName: string|null; personalWorkspaceId: string };
export type SessionRecord = { token:string; expiresAt:Date };
export function hashSessionToken(token:string):string { return createHash('sha256').update(token).digest('hex'); }
export function createOpaqueSessionToken():string { return randomBytes(32).toString('base64url'); }

/**
 * Calls narrowly scoped SECURITY DEFINER functions installed by migration 0004.
 * Runtime role receives EXECUTE only; it does not receive direct user/session bootstrap table privileges.
 */
export async function establishLuciaSession(db:DatabaseAdapter,input:{issuer:string;subject:string;email?:string;emailVerified?:boolean;displayName?:string;ttlSeconds:number;now?:Date}):Promise<{identity:LocalIdentity;session:SessionRecord}> {
  const token=createOpaqueSessionToken(), expiresAt=new Date((input.now??new Date()).getTime()+input.ttlSeconds*1000);
  const identity=await db.transaction(async(tx:SqlExecutor)=>{
    const result=await tx.query<{user_id:string;personal_workspace_id:string}>(
      'SELECT * FROM app_private.establish_lucia_identity($1,$2,$3,$4,$5,$6,$7)',
      [input.issuer,input.subject,input.email??null,input.emailVerified??false,input.displayName??null,hashSessionToken(token),expiresAt],
    );
    const row=result.rows[0];
    if(!row) throw new Error('Identity bootstrap did not return an application identity.');
    return {id:row.user_id as VerifiedInternalUserId,subject:input.subject,email:input.email??null,emailVerified:input.emailVerified??false,displayName:input.displayName??null,personalWorkspaceId:row.personal_workspace_id};
  });
  return {identity,session:{token,expiresAt}};
}
export async function resolveLocalSession(db:DatabaseAdapter,token:string,now=new Date()):Promise<VerifiedInternalUserId|null> {
  if(!token||token.length>256) return null;
  const result=await db.query<{user_id:string|null}>('SELECT app_private.resolve_ariovelle_session($1,$2) AS user_id',[hashSessionToken(token),now]);
  return result.rows[0]?.user_id as VerifiedInternalUserId|null ?? null;
}
export async function revokeLocalSession(db:DatabaseAdapter,token:string):Promise<void> {
  if(!token||token.length>256) return;
  await db.query('SELECT app_private.revoke_ariovelle_session($1)',[hashSessionToken(token)]);
}
