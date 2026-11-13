import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, describe, expect, it } from 'vitest';

const ownerUrl = process.env.ARIOVELLE_RLS_TEST_OWNER_DATABASE_URL;
const runtimeUrl = process.env.ARIOVELLE_RLS_TEST_RUNTIME_DATABASE_URL;
const ownerPool = ownerUrl
  ? new Pool({ connectionString: ownerUrl, max: 1, connectionTimeoutMillis: 5_000, ssl: { rejectUnauthorized: true } })
  : null;
const runtimePool = runtimeUrl
  ? new Pool({ connectionString: runtimeUrl, max: 1, connectionTimeoutMillis: 5_000, ssl: { rejectUnauthorized: true } })
  : null;

afterAll(async () => {
  await Promise.all([ownerPool?.end(), runtimePool?.end()]);
});

describe.skipIf(!ownerPool || !runtimePool)('PostgreSQL tenant RLS integration', () => {
  it('isolates two tenants and clears transaction-local context on rollback', async () => {
    if (!ownerPool || !runtimePool) throw new Error('Both RLS integration database URLs are required.');
    const owner = await ownerPool.connect();
    const runtime = await runtimePool.connect();
    const userA = randomUUID();
    const userB = randomUUID();
    const workspaceA = randomUUID();
    const workspaceB = randomUUID();
    const membershipA = randomUUID();
    const membershipB = randomUUID();
    let contextAfterRollback: { user_id: string; workspace_id: string } | undefined;
    let fixturesCommitted = false;

    try {
      await owner.query('BEGIN');
      await owner.query(
        `INSERT INTO public.users (id, status, display_name)
         VALUES ($1, 'active', 'RLS integration A'), ($2, 'active', 'RLS integration B')`,
        [userA, userB],
      );
      await owner.query(
        `INSERT INTO public.workspaces (id, type, name, owner_user_id, status)
         VALUES ($1, 'personal', 'RLS integration A', $2, 'active'),
                ($3, 'personal', 'RLS integration B', $4, 'active')`,
        [workspaceA, userA, workspaceB, userB],
      );
      await owner.query(
        `INSERT INTO public.workspace_memberships (id, workspace_id, user_id, role, status)
         VALUES ($1, $2, $3, 'owner', 'active'), ($4, $5, $6, 'owner', 'active')`,
        [membershipA, workspaceA, userA, membershipB, workspaceB, userB],
      );
      await owner.query(
        `INSERT INTO public.user_profiles (user_id, first_name)
         VALUES ($1, 'Alpha'), ($2, 'Beta')`,
        [userA, userB],
      );
      await owner.query('COMMIT');
      fixturesCommitted = true;

      await runtime.query('BEGIN');
      await runtime.query(
        `SELECT set_config('app.user_id', $1, true),
                set_config('app.workspace_id', $2, true)`,
        [userA, workspaceA],
      );

      const usersA = await runtime.query('SELECT id FROM public.users ORDER BY id');
      expect(usersA.rows.map((row) => row.id)).toEqual([userA]);

      const workspacesA = await runtime.query('SELECT id FROM public.workspaces');
      expect(workspacesA.rows.map((row) => row.id)).toEqual([workspaceA]);

      const crossRead = await runtime.query(
        'SELECT user_id FROM public.user_profiles WHERE user_id = $1',
        [userB],
      );
      expect(crossRead.rowCount).toBe(0);

      const crossUpdate = await runtime.query(
        "UPDATE public.user_profiles SET first_name = 'Compromised' WHERE user_id = $1",
        [userB],
      );
      expect(crossUpdate.rowCount).toBe(0);

      const ownUpdate = await runtime.query(
        "UPDATE public.user_profiles SET first_name = 'Updated A' WHERE user_id = $1",
        [userA],
      );
      expect(ownUpdate.rowCount).toBe(1);

      await runtime.query('SAVEPOINT cross_tenant_insert');
      await expect(runtime.query(
        'INSERT INTO public.user_profiles (user_id, first_name) VALUES ($1, $2)',
        [userB, 'Forbidden'],
      )).rejects.toMatchObject({ code: '42501' });
      await runtime.query('ROLLBACK TO SAVEPOINT cross_tenant_insert');

      await runtime.query(
        `SELECT set_config('app.user_id', $1, true),
                set_config('app.workspace_id', $2, true)`,
        [userB, workspaceB],
      );
      const usersB = await runtime.query('SELECT id FROM public.users ORDER BY id');
      expect(usersB.rows.map((row) => row.id)).toEqual([userB]);

      const reverseRead = await runtime.query(
        'SELECT user_id FROM public.user_profiles WHERE user_id = $1',
        [userA],
      );
      expect(reverseRead.rowCount).toBe(0);
    } finally {
      try {
        await runtime.query('ROLLBACK');
        const cleared = await runtime.query(
          "SELECT current_setting('app.user_id', true) AS user_id, current_setting('app.workspace_id', true) AS workspace_id",
        );
        contextAfterRollback = cleared.rows[0];
      } finally {
        runtime.release();
      }

      try {
        if (fixturesCommitted) {
          await owner.query('BEGIN');
          await owner.query('DELETE FROM public.user_profiles WHERE user_id = ANY($1::uuid[])', [[userA, userB]]);
          await owner.query('DELETE FROM public.workspace_memberships WHERE id = ANY($1::uuid[])', [[membershipA, membershipB]]);
          await owner.query('DELETE FROM public.workspaces WHERE id = ANY($1::uuid[])', [[workspaceA, workspaceB]]);
          await owner.query('DELETE FROM public.users WHERE id = ANY($1::uuid[])', [[userA, userB]]);
          await owner.query('COMMIT');
        } else {
          await owner.query('ROLLBACK');
        }
      } catch (error) {
        await owner.query('ROLLBACK');
        throw error;
      } finally {
        owner.release();
      }
    }

    expect(contextAfterRollback).toEqual({ user_id: '', workspace_id: '' });
  });
});
