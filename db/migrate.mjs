import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(ROOT, 'migrations');
const LOCK_KEY = 'ariovelle:ddl-migrations:v1';
const EXPECTED_BASELINE_TABLES = [
  'users', 'external_identities', 'user_profiles', 'user_preferences',
  'workspaces', 'workspace_memberships', 'audit_events',
  'migration_batches', 'migration_records', 'app_sessions', 'oauth_transactions',
];
const EXPECTED_BASELINE_FUNCTIONS = [
  'current_user_id', 'current_workspace_id', 'is_active_workspace_member',
  'is_workspace_owner', 'is_workspace_admin', 'establish_lucia_identity',
  'resolve_ariovelle_session', 'revoke_ariovelle_session',
  'create_lucia_oauth_transaction', 'consume_lucia_oauth_transaction',
];

export function checksum(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function stripTransactionWrapper(sql) {
  const withoutBegin = sql.replace(
    /^(\s*(?:(?:--[^\n]*\n)|\s)*)BEGIN\s*;\s*/i,
    '$1',
  );
  const withoutCommit = withoutBegin.replace(/\s*COMMIT\s*;\s*(?:(?:--[^\n]*\n)|\s)*$/i, '\n');
  if (/^\s*BEGIN\s*;/im.test(withoutCommit) || /\bCOMMIT\s*;\s*$/im.test(withoutCommit)) {
    throw new Error('Migration contains an unsupported nested transaction wrapper.');
  }
  return withoutCommit;
}

export async function discoverMigrations(directory = MIGRATIONS_DIR) {
  const names = (await readdir(directory))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  const migrations = [];
  for (const file of names) {
    const match = /^(\d{4})_([a-z0-9_]+)\.sql$/.exec(file);
    const content = await readFile(path.join(directory, file), 'utf8');
    migrations.push({
      version: match[1],
      name: match[2],
      file,
      content,
      checksum: checksum(content),
    });
  }
  for (let index = 0; index < migrations.length; index += 1) {
    const expected = String(index).padStart(4, '0');
    if (migrations[index].version !== expected) {
      throw new Error(`Migration sequence gap: expected ${expected}, found ${migrations[index].version}.`);
    }
  }
  if (migrations.length < 6 || migrations[0]?.version !== '0000') {
    throw new Error('Expected bootstrap migration 0000 and existing migrations 0001–0005.');
  }
  return migrations;
}

export function pendingMigrations(migrations, ledgerRows) {
  const applied = new Map(ledgerRows.map((row) => [row.version, row]));
  for (const migration of migrations) {
    const row = applied.get(migration.version);
    if (row && row.checksum.trim() !== migration.checksum) {
      throw new Error(`Checksum drift detected for migration ${migration.version} (${migration.name}). Refusing to continue.`);
    }
  }
  return migrations.filter((migration) => !applied.has(migration.version));
}

async function ledgerExists(client) {
  const result = await client.query("SELECT to_regclass('public.schema_migrations') AS ledger");
  return Boolean(result.rows[0]?.ledger);
}

async function readLedger(client) {
  if (!(await ledgerExists(client))) return [];
  const result = await client.query(
    'SELECT version, name, checksum, applied_at FROM public.schema_migrations ORDER BY version',
  );
  return result.rows;
}

async function assertBaseline(client) {
  const tables = await client.query(
    "SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'",
  );
  const byName = new Map(tables.rows.map((row) => [row.relname, row]));
  const missingTables = EXPECTED_BASELINE_TABLES.filter((name) => !byName.has(name));
  const missingRls = EXPECTED_BASELINE_TABLES.filter((name) => byName.has(name) && byName.get(name).relrowsecurity !== true);
  if (missingTables.length || missingRls.length) {
    throw new Error(`Existing-schema baseline rejected. Missing tables: ${missingTables.join(', ') || 'none'}; RLS missing: ${missingRls.join(', ') || 'none'}.`);
  }

  const policies = await client.query(
    "SELECT count(*)::int AS count FROM pg_policies WHERE schemaname='public'",
  );
  if (policies.rows[0]?.count !== 17) {
    throw new Error('Existing-schema baseline rejected: expected exactly 17 public RLS policies.');
  }

  const functions = await client.query(
    "SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='app_private'",
  );
  const functionNames = new Set(functions.rows.map((row) => row.proname));
  const missingFunctions = EXPECTED_BASELINE_FUNCTIONS.filter((name) => !functionNames.has(name));
  if (missingFunctions.length) {
    throw new Error(`Existing-schema baseline rejected. Missing app_private functions: ${missingFunctions.join(', ')}.`);
  }

  const roles = await client.query(
    "SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls, rolconfig FROM pg_roles WHERE rolname IN ('ariovelle_owner', 'ariovelle_runtime')",
  );
  const runtime = roles.rows.find((row) => row.rolname === 'ariovelle_runtime');
  const owner = roles.rows.find((row) => row.rolname === 'ariovelle_owner');
  if (!runtime || !owner) throw new Error('Existing-schema baseline rejected: expected owner and runtime roles.');
  if (runtime.rolsuper || runtime.rolcreaterole || runtime.rolcreatedb || runtime.rolbypassrls) {
    throw new Error('Existing-schema baseline rejected: runtime role is not least-privilege.');
  }
  const settings = new Set(runtime.rolconfig ?? []);
  for (const setting of ['statement_timeout=10s', 'lock_timeout=2s', 'idle_in_transaction_session_timeout=15s']) {
    if (!settings.has(setting)) throw new Error(`Existing-schema baseline rejected: runtime timeout missing (${setting}).`);
  }

  const grants = await client.query(`
    SELECT
      has_table_privilege('ariovelle_runtime', 'public.app_sessions', 'SELECT,INSERT,UPDATE,DELETE') AS sessions,
      has_table_privilege('ariovelle_runtime', 'public.oauth_transactions', 'SELECT,INSERT,UPDATE,DELETE') AS oauth,
      has_table_privilege('ariovelle_runtime', 'public.migration_batches', 'SELECT,INSERT,UPDATE,DELETE') AS batches,
      has_table_privilege('ariovelle_runtime', 'public.migration_records', 'SELECT,INSERT,UPDATE,DELETE') AS records,
      has_function_privilege('ariovelle_runtime', 'app_private.establish_lucia_identity(text,text,text,boolean,text,character,timestamp with time zone)', 'EXECUTE') AS identity_exec,
      has_function_privilege('ariovelle_runtime', 'app_private.create_lucia_oauth_transaction(character,character,text,timestamp with time zone)', 'EXECUTE') AS oauth_exec
  `);
  const grant = grants.rows[0];
  if (grant.sessions || grant.oauth || grant.batches || grant.records || !grant.identity_exec || !grant.oauth_exec) {
    throw new Error('Existing-schema baseline rejected: runtime table/function grants do not match the approved boundary.');
  }
}

async function recordMigration(client, migration, executionMs) {
  await client.query(
    `INSERT INTO public.schema_migrations (version, name, checksum, execution_ms, applied_by)
     VALUES ($1, $2, $3, $4, current_user)`,
    [migration.version, migration.name, migration.checksum, executionMs],
  );
}

async function applyOne(client, migration) {
  const started = Date.now();
  await client.query('BEGIN');
  try {
    await client.query(stripTransactionWrapper(migration.content));
    await recordMigration(client, migration, Date.now() - started);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function baselineExisting(client, migrations) {
  const existing = await client.query("SELECT to_regclass('public.users') AS users");
  if (!existing.rows[0]?.users) throw new Error('Baseline mode requires the existing Ariovelle schema.');
  await client.query('BEGIN');
  try {
    const bootstrap = migrations.find((migration) => migration.version === '0000');
    await client.query(stripTransactionWrapper(bootstrap.content));
    const current = await client.query('SELECT version FROM public.schema_migrations');
    if (current.rowCount !== 0) throw new Error('Baseline mode requires an empty DDL ledger.');
    await assertBaseline(client);
    for (const migration of migrations) {
      await recordMigration(client, migration, 0);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

function parseMode(args) {
  if (args.includes('--baseline-existing')) {
    if (!args.includes('--apply')) {
      throw new Error('Existing-schema reconciliation requires both --baseline-existing and --apply.');
    }
    return '--baseline-existing';
  }
  const modes = ['--plan', '--apply', '--verify'];
  const selected = modes.filter((mode) => args.includes(mode));
  if (selected.length !== 1) {
    throw new Error('Choose exactly one mode: --plan, --apply, --verify, or --baseline-existing --apply.');
  }
  return selected[0];
}

export async function runMigrationCommand({ mode, connectionString, migrations }) {
  const parsed = new URL(connectionString);
  if (parsed.hostname.includes('-pooler')) {
    throw new Error('Schema migrations require a direct, non-pooled PostgreSQL connection.');
  }
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000, ssl: parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' ? false : { rejectUnauthorized: true } });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [LOCK_KEY]);
    const hasLedger = await ledgerExists(client);
    const ledger = await readLedger(client);

    if (mode === '--baseline-existing') {
      if (ledger.length) throw new Error('Existing-schema baseline refused: DDL ledger already contains records.');
      await baselineExisting(client, migrations);
      return { mode, applied: migrations.length, pending: 0 };
    }

    if (!hasLedger) {
      const schema = await client.query("SELECT to_regclass('public.users') AS users");
      if (schema.rows[0]?.users) {
        if (mode === '--plan') return { mode, baselineRequired: true, pending: migrations.map(({ version, name }) => ({ version, name })) };
        throw new Error('Existing Ariovelle schema has no DDL ledger. Review the catalog, then use --baseline-existing --apply; do not replay migrations.');
      }
    }

    const pending = pendingMigrations(migrations, ledger);
    if (mode === '--plan') return { mode, pending: pending.map(({ version, name, checksum }) => ({ version, name, checksum })) };
    if (mode === '--verify') {
      if (pending.length) throw new Error(`Migration verification failed: ${pending.length} migration(s) are not recorded.`);
      return { mode, applied: ledger.length, pending: 0 };
    }

    for (const migration of pending) await applyOne(client, migration);
    const verified = pendingMigrations(migrations, await readLedger(client));
    if (verified.length) throw new Error('Migration runner post-apply verification failed.');
    return { mode, applied: pending.length, pending: 0 };
  } finally {
    try { await client.query('SELECT pg_advisory_unlock(hashtext($1))', [LOCK_KEY]); } finally { await client.end(); }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = parseMode(args);
  const connectionString = process.env.ARIOVELLE_MIGRATION_DATABASE_URL;
  if (!connectionString) throw new Error('Set ARIOVELLE_MIGRATION_DATABASE_URL to a direct development/test database URL.');
  const migrations = await discoverMigrations();
  const result = await runMigrationCommand({ mode, connectionString, migrations });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Migration command failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
