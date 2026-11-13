import type { DatabaseAdapter, SqlExecutor } from './database';
import type { VerifiedInternalUserId } from './workspace-access';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class WorkspaceContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceContextError';
  }
}

/**
 * Establish transaction-local identity and workspace context on an existing
 * transaction. This is exported so authentication, membership checks and
 * protected queries can share one transaction without a session-revocation
 * race between separate database transactions.
 */
export async function setVerifiedRequestContext(
  transaction: SqlExecutor,
  userId: VerifiedInternalUserId,
  workspaceId: string,
): Promise<void> {
  if (!UUID_PATTERN.test(userId)) {
    throw new WorkspaceContextError('Verified internal user ID must be a UUID.');
  }
  if (!UUID_PATTERN.test(workspaceId)) {
    throw new WorkspaceContextError('Workspace ID must be a UUID.');
  }

  await transaction.query(
    `SELECT
       set_config('app.user_id', $1, true),
       set_config('app.workspace_id', $2, true)`,
    [userId, workspaceId],
  );

  const check = await transaction.query<{ allowed: boolean }>(
    'SELECT app_private.is_active_workspace_member($1::uuid) AS allowed',
    [workspaceId],
  );
  if (check.rows[0]?.allowed !== true) {
    throw new WorkspaceContextError('Verified user is not an active member of this workspace.');
  }
}

/**
 * Runs work in one database transaction with transaction-local identity and
 * workspace GUCs. The workspace is revalidated by PostgreSQL before work.
 * set_config(..., true) clears the context automatically at COMMIT/ROLLBACK.
 */
export async function withVerifiedRequestContext<Result>(
  db: DatabaseAdapter,
  userId: VerifiedInternalUserId,
  workspaceId: string,
  work: (transaction: SqlExecutor) => Promise<Result>,
): Promise<Result> {
  return db.transaction(async (transaction) => {
    await setVerifiedRequestContext(transaction, userId, workspaceId);
    return work(transaction);
  });
}
