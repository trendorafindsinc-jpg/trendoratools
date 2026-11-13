import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.ARIOVELLE_RLS_TEST_DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: 1,
      connectionTimeoutMillis: 5_000,
      ssl: { rejectUnauthorized: true },
    })
  : null;

afterAll(async () => {
  await pool?.end();
});

describe.skipIf(!databaseUrl)('PostgreSQL tenant RLS integration', () => {
  it('isolates two tenants and clears request context on rollback', async () => {
    if (!pool) throw new Error('ARIOVELLE_RLS_TEST_DATABASE_URL is required.');
    const client = await pool.connect();
    const userA = randomUUID();
    const userB = randomUUID();
    const workspaceA = randomUUID();
    const workspaceB = randomUUID();
    const membershipA = randomUUID();
    const membershipB = randomUUID();

    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO public.users (id, status, display_name)
         VALUES ($1, 'active', 'RLS integration A'), ($2, 'active', 'RLS integration B')`,
        [userA, userB],
      );
      await client.query(
        `INSERT INTO public.workspaces (id, type, name, owner_user_id, status)
         VALUES ($1, 'personal', 'RLS integration A', $2, 'active'),
                ($3, 'personal', 'RLS integration B', $4, 'active')`,
        [workspaceA, userA, workspaceB, userB],
      );
      await client.query(
        `INSERT INTO public.workspace_memberships (id, workspace_id, user_id, role, status)
         VALUES ($1, $2, $3, 'owner', 'active'), ($4, $5, $6, 'owner', 'active')`,
        [membershipA, workspaceA, userA, membershipB, workspaceB, userB],
      );
      await client.query(
        `INSERT INTO public.user_profiles (user_id, first_name)
         VALUES ($1, 'Alpha'), ($2, 'Beta')`,
        [userA, userB],
      );

      // Owner is a member of the runtime role only to run this isolated RLS test.
      await client.query('SET LOCAL ROLE ariovelle_runtime');
      await client.query(
        `SELECT set_config('app.user_id', $1, true),
                set_config('app.workspace_id', $2, true)`,
        [userA, workspaceA],
      );

      const usersA = await client.query('SELECT id FROM public.users ORDER BY id');
      expect(usersA.rows.map((row) => row.id)).toEqual([userA]);

      const workspacesA = await client.query('SELECT id FROM public.workspaces');
      expect(workspacesA.rows.map((row) => row.id)).toEqual([workspaceA]);

      const crossRead = await client.query(
        'SELECT user_id FROM public.user_profiles WHERE user_id = $1',
        [userB],
      );
      expect(crossRead.rowCount).toBe(0);

      const crossUpdate = await client.query(
        "UPDATE public.user_profiles SET first_name = 'Compromised' WHERE user_id = $1",
        [userB],
      );
      expect(crossUpdate.rowCount).toBe(0);

      const ownUpdate = await client.query(
        "UPDATE public.user_profiles SET first_name = 'Updated A' WHERE user_id = $1",
        [userA],
      );
      expect(ownUpdate.rowCount).toBe(1);

      await client.query('SAVEPOINT cross_tenant_insert');
      await expect(client.query(
        'INSERT INTO public.user_profiles (user_id, first_name) VALUES ($1, $2)',
        [userB, 'Forbidden'],
      )).rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK TO SAVEPOINT cross_tenant_insert');

      await client.query(
        `SELECT set_config('app.user_id', $1, true),
                set_config('app.workspace_id', $2, true)`,
        [userB, workspaceB],
      );
      const usersB = await client.query('SELECT id FROM public.users ORDER BY id');
      expect(usersB.rows.map((row) => row.id)).toEqual([userB]);

      const reverseRead = await client.query(
        'SELECT user_id FROM public.user_profiles WHERE user_id = $1',
        [userA],
      );
      expect(reverseRead.rowCount).toBe(0);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }

    const contextAfterRollback = await client.query(
      "SELECT current_setting('app.user_id', true) AS user_id, current_setting('app.workspace_id', true) AS workspace_id",
    );
    expect(contextAfterRollback.rows[0]).toEqual({ user_id: null, workspace_id: null });
  });
});
