import type { SqlExecutor } from './database';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type WorkspacePermission =
  | 'workspace:read'
  | 'finance:read'
  | 'finance:write'
  | 'members:manage'
  | 'settings:manage';

export type VerifiedInternalUserId = string & { readonly __verifiedInternalUserId: unique symbol };

const ROLE_PERMISSIONS: Record<WorkspaceRole, ReadonlySet<WorkspacePermission>> = {
  owner: new Set(['workspace:read', 'finance:read', 'finance:write', 'members:manage', 'settings:manage']),
  admin: new Set(['workspace:read', 'finance:read', 'finance:write', 'members:manage']),
  member: new Set(['workspace:read', 'finance:read', 'finance:write']),
  viewer: new Set(['workspace:read', 'finance:read']),
};

export type WorkspaceAccessResult =
  | { allowed: true; role: WorkspaceRole }
  | { allowed: false; reason: 'membership_not_found' | 'membership_inactive' | 'workspace_inactive' | 'permission_denied' };

type MembershipRow = {
  role: WorkspaceRole;
  membership_status: 'invited' | 'active' | 'suspended' | 'removed';
  workspace_status: 'active' | 'suspended' | 'archived';
};

/**
 * userId must originate from a verified server-side identity mapping, never
 * from a request body/header. Workspace IDs are always bound SQL parameters.
 */
export async function authorizeWorkspacePermission(
  db: SqlExecutor,
  userId: VerifiedInternalUserId,
  workspaceId: string,
  permission: WorkspacePermission,
): Promise<WorkspaceAccessResult> {
  const result = await db.query<MembershipRow>(
    `SELECT wm.role, wm.status AS membership_status, w.status AS workspace_status
       FROM workspace_memberships wm
       INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND wm.workspace_id = $2
      LIMIT 1`,
    [userId, workspaceId],
  );

  const membership = result.rows[0];
  if (!membership) return { allowed: false, reason: 'membership_not_found' };
  if (membership.membership_status !== 'active') {
    return { allowed: false, reason: 'membership_inactive' };
  }
  if (membership.workspace_status !== 'active') {
    return { allowed: false, reason: 'workspace_inactive' };
  }
  if (!ROLE_PERMISSIONS[membership.role]?.has(permission)) {
    return { allowed: false, reason: 'permission_denied' };
  }
  return { allowed: true, role: membership.role };
}
