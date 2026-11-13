import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { createPostgresAdapter } from './postgres-adapter';
import { hashSessionToken, resolveLocalSession, revokeLocalSession } from './lucia-session';
import { withAuthenticatedWorkspace } from './authenticated-workspace';

const ownerUrl = process.env.ARIOVELLE_RLS_TEST_OWNER_DATABASE_URL;
const runtimeUrl = process.env.ARIOVELLE_RLS_TEST_RUNTIME_DATABASE_URL;
const ownerPool = ownerUrl ? new Pool({ connectionString: ownerUrl, max: 1, ssl: { rejectUnauthorized: true } }) : null;
const runtimePool = runtimeUrl ? new Pool({ connectionString: runtimeUrl, max: 1, ssl: { rejectUnauthorized: true } }) : null;
const runtimeDb = runtimePool ? createPostgresAdapter(runtimePool as never) : null;

afterAll(async () => {
  await Promise.all([ownerPool?.end(), runtimePool?.end()]);
});

describe.skipIf(!ownerPool || !runtimePool || !runtimeDb)('Lucia identity and local session PostgreSQL integration', () => {
  it('creates isolated identities, resolves hashed sessions and enforces workspace authorization', async () => {
    if (!ownerPool || !runtimePool || !runtimeDb) {
      throw new Error('Dedicated owner and runtime PostgreSQL URLs are required.');
    }
    const suffix = randomUUID();
    const subjectA = 'integration-a-' + suffix;
    const subjectB = 'integration-b-' + suffix;
    const tokenA = 'session-a-' + randomUUID();
    const tokenB = 'session-b-' + randomUUID();
    const hashA = hashSessionToken(tokenA);
    const hashB = hashSessionToken(tokenB);
    const expires = new Date(Date.now() + 60_000);
    let userA: string | undefined;
    let userB: string | undefined;
    let workspaceA: string | undefined;
    let workspaceB: string | undefined;
    const runtime = await runtimePool.connect();
    const owner = await ownerPool.connect();

    try {
      const a = await runtime.query(
        'SELECT * FROM app_private.establish_lucia_identity($1,$2,$3,$4,$5,$6,$7)',
        ['https://identity.integration.test', subjectA, 'a@example.test', true, 'Integration A', hashA, expires],
      );
      const b = await runtime.query(
        'SELECT * FROM app_private.establish_lucia_identity($1,$2,$3,$4,$5,$6,$7)',
        ['https://identity.integration.test', subjectB, 'b@example.test', true, 'Integration B', hashB, expires],
      );
      userA = a.rows[0]?.user_id;
      workspaceA = a.rows[0]?.personal_workspace_id;
      userB = b.rows[0]?.user_id;
      workspaceB = b.rows[0]?.personal_workspace_id;
      if (!userA || !userB || !workspaceA || !workspaceB) {
        throw new Error('Identity bootstrap did not return both users and personal workspaces.');
      }
      expect(userA).not.toBe(userB);
      expect(workspaceA).not.toBe(workspaceB);
      expect(await resolveLocalSession(runtimeDb, tokenA)).toBe(userA);
      expect(await resolveLocalSession(runtimeDb, tokenB)).toBe(userB);
      expect(await resolveLocalSession(runtimeDb, 'unknown-token')).toBeNull();

      const ownWorkspace = await withAuthenticatedWorkspace({
        db: runtimeDb,
        cookieHeader: 'ariovelle_session=' + tokenA,
        workspaceId: workspaceA,
        permission: 'workspace:read',
        work: async (tx, verifiedUserId) => {
          expect(verifiedUserId).toBe(userA);
          const result = await tx.query<{ id: string }>('SELECT id FROM public.workspaces');
          return result.rows.map((row) => row.id);
        },
      });
      expect(ownWorkspace).toEqual([workspaceA]);

      await expect(withAuthenticatedWorkspace({
        db: runtimeDb,
        cookieHeader: 'ariovelle_session=' + tokenA,
        workspaceId: workspaceB,
        permission: 'workspace:read',
        work: async () => true,
      })).rejects.toThrow('not an active member');

      const crossTenant = await withAuthenticatedWorkspace({
        db: runtimeDb,
        cookieHeader: 'ariovelle_session=' + tokenA,
        workspaceId: workspaceA,
        permission: 'workspace:read',
        work: async (tx) => {
          const result = await tx.query<{ id: string }>(
            'SELECT id FROM public.workspaces WHERE id=$1',
            [workspaceB],
          );
          return result.rowCount;
        },
      });
      expect(crossTenant).toBe(0);

      const persisted = await owner.query(
        'SELECT token_hash FROM public.app_sessions WHERE token_hash=ANY($1::char(64)[])',
        [[hashA, hashB]],
      );
      expect(persisted.rows.map((row) => String(row.token_hash).trim()).sort()).toEqual([hashA, hashB].sort());
      expect(persisted.rows.some((row) => row.token_hash === tokenA || row.token_hash === tokenB)).toBe(false);

      await revokeLocalSession(runtimeDb, tokenA);
      expect(await resolveLocalSession(runtimeDb, tokenA)).toBeNull();
      await expect(withAuthenticatedWorkspace({
        db: runtimeDb,
        cookieHeader: 'ariovelle_session=' + tokenA,
        workspaceId: workspaceA,
        permission: 'workspace:read',
        work: async () => true,
      })).rejects.toThrow('valid Ariovelle session');
    } finally {
      runtime.release();
      const userIds = [userA, userB].filter((id): id is string => Boolean(id));
      const workspaceIds = [workspaceA, workspaceB].filter((id): id is string => Boolean(id));
      if (userIds.length) {
        await owner.query('BEGIN');
        await owner.query('DELETE FROM public.app_sessions WHERE user_id=ANY($1::uuid[])', [userIds]);
        await owner.query('DELETE FROM public.external_identities WHERE user_id=ANY($1::uuid[])', [userIds]);
        await owner.query('DELETE FROM public.workspace_memberships WHERE user_id=ANY($1::uuid[])', [userIds]);
        if (workspaceIds.length) {
          await owner.query('DELETE FROM public.workspaces WHERE id=ANY($1::uuid[])', [workspaceIds]);
        }
        await owner.query('DELETE FROM public.user_profiles WHERE user_id=ANY($1::uuid[])', [userIds]);
        await owner.query('DELETE FROM public.user_preferences WHERE user_id=ANY($1::uuid[])', [userIds]);
        await owner.query('DELETE FROM public.users WHERE id=ANY($1::uuid[])', [userIds]);
        await owner.query('COMMIT');
      }
      owner.release();
    }
  });
});
