import { createHash } from 'node:crypto';
import { luciaCookieNames, parseCookies } from './lucia-oauth';
import { authorizeWorkspacePermission, type WorkspacePermission, type VerifiedInternalUserId } from './workspace-access';
import { setVerifiedRequestContext } from './request-context';
import type { DatabaseAdapter, SqlExecutor } from './database';

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('A valid Ariovelle session is required.');
    this.name = 'AuthenticationRequiredError';
  }
}
export class WorkspacePermissionError extends Error {
  constructor() {
    super('The authenticated user does not have the required workspace permission.');
    this.name = 'WorkspacePermissionError';
  }
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Resolves the opaque HttpOnly session cookie, validates active membership,
 * establishes transaction-local RLS context, checks role permission and runs
 * caller queries in ONE transaction. Session revocation/account disablement
 * therefore cannot race between identity resolution and protected work.
 */
export async function withAuthenticatedWorkspace<Result>(input: {
  db: DatabaseAdapter;
  cookieHeader: string | undefined;
  workspaceId: string;
  permission: WorkspacePermission;
  work: (transaction: SqlExecutor, userId: VerifiedInternalUserId) => Promise<Result>;
}): Promise<Result> {
  const token = parseCookies(input.cookieHeader)[luciaCookieNames.session];
  if (!token || token.length > 256) throw new AuthenticationRequiredError();

  return input.db.transaction(async (transaction) => {
    const session = await transaction.query<{ user_id: string | null }>(
      'SELECT app_private.resolve_ariovelle_session($1, now()) AS user_id',
      [hashSessionToken(token)],
    );
    const userId = session.rows[0]?.user_id as VerifiedInternalUserId | null | undefined;
    if (!userId) throw new AuthenticationRequiredError();

    await setVerifiedRequestContext(transaction, userId, input.workspaceId);
    const access = await authorizeWorkspacePermission(
      transaction,
      userId,
      input.workspaceId,
      input.permission,
    );
    if (!access.allowed) throw new WorkspacePermissionError();

    return input.work(transaction, userId);
  });
}
