import { describe, expect, it, vi } from 'vitest';
import { authorizeWorkspacePermission, type VerifiedInternalUserId } from './workspace-access';

const userId = '00000000-0000-4000-8000-000000000001' as VerifiedInternalUserId;
const workspaceId = '00000000-0000-4000-8000-000000000002';

function dbWith(row?: Record<string, unknown>) {
  return {
    query: vi.fn(async (_sql: string, _params?: readonly unknown[]) => ({
      rows: row ? [row] : [],
      rowCount: row ? 1 : 0,
    })),
  };
}

describe('workspace permission authorization', () => {
  it('uses bound user and workspace identifiers in the membership query', async () => {
    const db = dbWith({ role: 'member', membership_status: 'active', workspace_status: 'active' });
    const result = await authorizeWorkspacePermission(db, userId, workspaceId, 'finance:read');
    expect(result).toEqual({ allowed: true, role: 'member' });
    expect(db.query.mock.calls[0][1]).toEqual([userId, workspaceId]);
    expect(db.query.mock.calls[0][0]).toContain('wm.user_id = $1 AND wm.workspace_id = $2');
  });

  it('denies users without a membership', async () => {
    await expect(authorizeWorkspacePermission(dbWith(), userId, workspaceId, 'finance:read'))
      .resolves.toEqual({ allowed: false, reason: 'membership_not_found' });
  });

  it.each(['invited', 'suspended', 'removed'])('denies %s memberships', async (status) => {
    const db = dbWith({ role: 'owner', membership_status: status, workspace_status: 'active' });
    await expect(authorizeWorkspacePermission(db, userId, workspaceId, 'finance:read'))
      .resolves.toEqual({ allowed: false, reason: 'membership_inactive' });
  });

  it.each(['suspended', 'archived'])('denies %s workspaces', async (status) => {
    const db = dbWith({ role: 'owner', membership_status: 'active', workspace_status: status });
    await expect(authorizeWorkspacePermission(db, userId, workspaceId, 'finance:read'))
      .resolves.toEqual({ allowed: false, reason: 'workspace_inactive' });
  });

  it('prevents viewers from writing financial data', async () => {
    const db = dbWith({ role: 'viewer', membership_status: 'active', workspace_status: 'active' });
    await expect(authorizeWorkspacePermission(db, userId, workspaceId, 'finance:write'))
      .resolves.toEqual({ allowed: false, reason: 'permission_denied' });
  });

  it('allows members to write finance but not manage membership', async () => {
    const db = dbWith({ role: 'member', membership_status: 'active', workspace_status: 'active' });
    await expect(authorizeWorkspacePermission(db, userId, workspaceId, 'finance:write'))
      .resolves.toMatchObject({ allowed: true, role: 'member' });
    await expect(authorizeWorkspacePermission(db, userId, workspaceId, 'members:manage'))
      .resolves.toEqual({ allowed: false, reason: 'permission_denied' });
  });
});
