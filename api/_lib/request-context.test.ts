import { describe, expect, it, vi } from 'vitest';
import type { DatabaseAdapter, SqlExecutor } from './database';
import { withVerifiedRequestContext, WorkspaceContextError } from './request-context';
import type { VerifiedInternalUserId } from './workspace-access';

const userId = '00000000-0000-4000-8000-000000000001' as VerifiedInternalUserId;
const workspaceId = '00000000-0000-4000-8000-000000000002';

function fakeDb(allowed = true) {
  const statements: Array<{ sql: string; params?: readonly unknown[] }> = [];
  const transaction: SqlExecutor = {
    async query<Row extends Record<string, unknown>>(sql: string, params?: readonly unknown[]) {
      statements.push({ sql, params });
      return {
        rows: (sql.includes('is_active_workspace_member')
          ? [{ allowed }]
          : []) as Row[],
        rowCount: sql.includes('is_active_workspace_member') ? 1 : 0,
      };
    },
  };
  const db: DatabaseAdapter = {
    query: transaction.query,
    async transaction<Result>(work: (tx: SqlExecutor) => Promise<Result>) {
      return work(transaction);
    },
  };
  return { db, statements };
}

describe('verified transaction request context', () => {
  it('sets identity and workspace with transaction-local parameters before work', async () => {
    const { db, statements } = fakeDb(true);
    const work = vi.fn(async () => 'ok');
    await expect(withVerifiedRequestContext(db, userId, workspaceId, work))
      .resolves.toBe('ok');
    expect(statements[0].sql).toContain("set_config('app.user_id', $1, true)");
    expect(statements[0].sql).toContain("set_config('app.workspace_id', $2, true)");
    expect(statements[0].params).toEqual([userId, workspaceId]);
    expect(statements[1].sql).toContain('app_private.is_active_workspace_member');
    expect(work).toHaveBeenCalledOnce();
  });

  it('does not execute request work for a non-member workspace', async () => {
    const { db } = fakeDb(false);
    const work = vi.fn(async () => 'should not run');
    await expect(withVerifiedRequestContext(db, userId, workspaceId, work))
      .rejects.toBeInstanceOf(WorkspaceContextError);
    expect(work).not.toHaveBeenCalled();
  });

  it('rejects invalid identity and workspace identifiers before opening a transaction', async () => {
    const transaction = vi.fn();
    const db = { transaction } as unknown as DatabaseAdapter;
    await expect(withVerifiedRequestContext(
      db,
      'not-a-uuid' as VerifiedInternalUserId,
      workspaceId,
      async () => 'unused',
    )).rejects.toBeInstanceOf(WorkspaceContextError);
    await expect(withVerifiedRequestContext(
      db,
      userId,
      'not-a-uuid',
      async () => 'unused',
    )).rejects.toBeInstanceOf(WorkspaceContextError);
    expect(transaction).not.toHaveBeenCalled();
  });
});
