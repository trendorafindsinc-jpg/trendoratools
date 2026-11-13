import { luciaCookieNames,parseCookies } from './lucia-oauth';
import { resolveLocalSession } from './lucia-session';
import { authorizeWorkspacePermission,type WorkspacePermission,type VerifiedInternalUserId } from './workspace-access';
import { withVerifiedRequestContext } from './request-context';
import type { DatabaseAdapter,SqlExecutor } from './database';

export class AuthenticationRequiredError extends Error {
 constructor(){super('A valid Ariovelle session is required.');this.name='AuthenticationRequiredError';}
}
export class WorkspacePermissionError extends Error {
 constructor(){super('The authenticated user does not have the required workspace permission.');this.name='WorkspacePermissionError';}
}

/**
 * Resolves the opaque HttpOnly session cookie to a server-verified internal ID,
 * then establishes identity + workspace context in the SAME transaction as
 * permission checks and caller queries. Never accept a user ID from the client.
 */
export async function withAuthenticatedWorkspace<Result>(input:{
 db:DatabaseAdapter;cookieHeader:string|undefined;workspaceId:string;
 permission:WorkspacePermission;
 work:(transaction:SqlExecutor,userId:VerifiedInternalUserId)=>Promise<Result>;
}):Promise<Result>{
 const token=parseCookies(input.cookieHeader)[luciaCookieNames.session];
 if(!token) throw new AuthenticationRequiredError();
 const userId=await resolveLocalSession(input.db,token);
 if(!userId) throw new AuthenticationRequiredError();
 return withVerifiedRequestContext(input.db,userId,input.workspaceId,async transaction=>{
  const access=await authorizeWorkspacePermission(transaction,userId,input.workspaceId,input.permission);
  if(!access.allowed) throw new WorkspacePermissionError();
  return input.work(transaction,userId);
 });
}
