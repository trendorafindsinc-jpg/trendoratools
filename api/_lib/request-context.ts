import type { DatabaseAdapter, SqlExecutor } from './database';
import type { VerifiedInternalUserId } from './workspace-access';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class WorkspaceContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceContextError';
  }
}

type ContextCheckRow = { allowed: boolean };

/**
 * Runs work in one database transaction with transaction-local identity and
 * workspace GUCs. userId must be created only by a verified server identity
 * adapter. The workspace is revalidated by PostgreSQL before work executes.
 *
 * SET LOCAL semantics are implemented with set_config(..., true), so context
 * is cleared automatically at COMMIT/ROLLBACK and cannot leak through pooling.
 */
export async function withVerifiedRequestContext<Result>(
  db: DatabaseAdapter,
  userId: VerifiedInternalUserId,
  workspaceId: string,
  work: (transaction: SqlExecutor) => Promise<Result>,
): Promise<Result> {
  if (!UUID_PATTERN.test(userId)) {
    throw new WorkspaceContextError('Verified internal user ID must be a UUID.');
  }
  if (!UUID_PATTERN.test(workspaceId)) {
    throw new WorkspaceContextError('Workspace ID must be a UUID.');
  }

  return db.transaction(async (transaction) => {
    await transaction.query(
      `SELECT
         set_config('app.user_id', $1, true),
         set_config('app.workspace_id', $2, true)`,
      [userId, workspaceId],
    );

    const check = await transaction.query<ContextCheckRow>(
      'SELECT app_private.is_active_workspace_member($1::uuid) AS allowed',
      [workspaceId],
    );
    if (check.rows[0]?.allowed !== true) {
      throw new WorkspaceContextError('Verified user is not an active member of this workspace.');
    }

    return work(transaction);
  });
}
