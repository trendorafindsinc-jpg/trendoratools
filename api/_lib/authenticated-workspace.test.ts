import { describe, expect, it, vi } from 'vitest';
import { withAuthenticatedWorkspace } from './authenticated-workspace';
import type { DatabaseAdapter, SqlExecutor } from './database';

const userId = '00000000-0000-4000-8000-000000000001';
const workspaceId = '00000000-0000-4000-8000-000000000002';

function fakeDb(options: { allowed?: boolean; role?: string; session?: boolean } = {}) {
  const calls: Array<{ sql: string; params: readonly unknown[] }> = [];
  let transactionCount = 0;
  const executor: SqlExecutor = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes('resolve_ariovelle_session')) {
        return { rows: options.session === false ? [] : [{ user_id: userId }], rowCount: 1 } as never;
      }
      if (sql.includes('is_active_workspace_member')) {
        return { rows: [{ allowed: options.allowed !== false }], rowCount: 1 } as never;
      }
      if (sql.includes('FROM workspace_memberships')) {
        return {
          rows: [{ role: options.role ?? 'owner', membership_status: 'active', workspace_status: 'active' }],
          rowCount: 1,
        } as never;
      }
      return { rows: [], rowCount: 0 } as never;
    },
  };
  const db: DatabaseAdapter = {
    query: executor.query,
    async transaction(work) {
      transactionCount += 1;
      return work(executor);
    },
  };
  return { db, calls, get transactionCount() { return transactionCount; } };
}

describe('authenticated workspace boundary', () => {
  it('resolves identity, sets RLS context, checks permission and runs work in one transaction', async () => {
    const state = fakeDb();
    const result = await withAuthenticatedWorkspace({
      db: state.db,
      cookieHeader: 'ariovelle_session=opaque-session-token',
      workspaceId,
      permission: 'finance:read',
      work: async (tx, id) => {
        expect(id).toBe(userId);
        await tx.query('SELECT id FROM public.workspaces');
        return 'ok';
      },
    });
    expect(result).toBe('ok');
    expect(state.transactionCount).toBe(1);
    expect(state.calls.map((call) => call.sql)).toEqual([
      expect.stringContaining('resolve_ariovelle_session'),
      expect.stringContaining('set_config'),
      expect.stringContaining('is_active_workspace_member'),
      expect.stringContaining('FROM workspace_memberships'),
      'SELECT id FROM public.workspaces',
    ]);
  });

  it('rejects a missing session before opening a transaction', async () => {
    const state = fakeDb();
    await expect(withAuthenticatedWorkspace({
      db: state.db,
      cookieHeader: undefined,
      workspaceId,
      permission: 'finance:read',
      work: async () => true,
    })).rejects.toThrow('valid Ariovelle session');
    expect(state.transactionCount).toBe(0);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects an expired, revoked or unknown local session before workspace access', async () => {
    const state = fakeDb({ session: false });
    await expect(withAuthenticatedWorkspace({
      db: state.db,
      cookieHeader: 'ariovelle_session=opaque-session-token',
      workspaceId,
      permission: 'finance:read',
      work: async () => true,
    })).rejects.toThrow('valid Ariovelle session');
    expect(state.calls).toHaveLength(1);
  });

  it('rejects inactive workspace membership before permission or caller queries', async () => {
    const state = fakeDb({ allowed: false });
    await expect(withAuthenticatedWorkspace({
      db: state.db,
      cookieHeader: 'ariovelle_session=opaque-session-token',
      workspaceId,
      permission: 'finance:read',
      work: async () => true,
    })).rejects.toThrow('active member');
    expect(state.calls.some((call) => call.sql.includes('FROM workspace_memberships'))).toBe(false);
  });

  it('enforces workspace role permissions after RLS context is established', async () => {
    const state = fakeDb({ role: 'viewer' });
    await expect(withAuthenticatedWorkspace({
      db: state.db,
      cookieHeader: 'ariovelle_session=opaque-session-token',
      workspaceId,
      permission: 'finance:write',
      work: async () => true,
    })).rejects.toThrow('required workspace permission');
    expect(state.calls.some((call) => call.sql.includes('FROM workspace_memberships'))).toBe(true);
  });
});
