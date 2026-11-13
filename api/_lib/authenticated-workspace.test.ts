import { describe,expect,it,vi } from 'vitest';
import { withAuthenticatedWorkspace } from './authenticated-workspace';
import type { DatabaseAdapter,SqlExecutor } from './database';

const userId='00000000-0000-4000-8000-000000000001';
const workspaceId='00000000-0000-4000-8000-000000000002';
function fakeDb(allowed=true,role='owner'){
 const calls:Array<{sql:string;params:readonly unknown[]}>=[];
 const executor:SqlExecutor={async query(sql,params=[]){
  calls.push({sql,params});
  if(sql.includes('resolve_ariovelle_session')) return {rows:[{user_id:userId}],rowCount:1} as never;
  if(sql.includes('is_active_workspace_member')) return {rows:[{allowed}],rowCount:1} as never;
  if(sql.includes('FROM workspace_memberships')) return {rows:[{role,membership_status:'active',workspace_status:'active'}],rowCount:1} as never;
  return {rows:[],rowCount:0} as never;
 }};
 const db:DatabaseAdapter={...executor,async transaction(work){return work(executor);}};
 return {db,calls};
}
describe('authenticated workspace boundary',()=>{
 it('derives identity from the hashed local session then checks membership in transaction context',async()=>{
  const {db,calls}=fakeDb();
  const result=await withAuthenticatedWorkspace({db,cookieHeader:'ariovelle_session=opaque-session-token',workspaceId,permission:'finance:read',work:async(tx,id)=>{
   expect(id).toBe(userId);
   await tx.query('SELECT id FROM public.workspaces');
   return 'ok';
  }});
  expect(result).toBe('ok');
  expect(calls[0].sql).toContain('resolve_ariovelle_session');
  expect(calls[1].sql).toContain('set_config');
  expect(calls[2].sql).toContain('is_active_workspace_member');
  expect(calls[3].params).toEqual([userId,workspaceId]);
 });
 it('rejects a missing session before workspace access',async()=>{
  const {db,calls}=fakeDb();
  await expect(withAuthenticatedWorkspace({db,cookieHeader:undefined,workspaceId,permission:'finance:read',work:async()=>true})).rejects.toThrow('valid Ariovelle session');
  expect(calls).toHaveLength(0);
 });
 it('rejects inactive workspace membership before caller queries',async()=>{
  const {db,calls}=fakeDb(false);
  await expect(withAuthenticatedWorkspace({db,cookieHeader:'ariovelle_session=opaque-session-token',workspaceId,permission:'finance:read',work:async()=>true})).rejects.toThrow('active member');
  expect(calls.some(call=>call.sql.includes('FROM workspace_memberships'))).toBe(false);
 });
 it('enforces workspace role permissions after RLS context is established',async()=>{
  const {db,calls}=fakeDb(true,'viewer');
  await expect(withAuthenticatedWorkspace({db,cookieHeader:'ariovelle_session=opaque-session-token',workspaceId,permission:'finance:write',work:async()=>true})).rejects.toThrow('required workspace permission');
  expect(calls.some(call=>call.sql.includes('FROM workspace_memberships'))).toBe(true);
 });
});
