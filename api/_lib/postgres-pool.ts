import { Pool, type PoolConfig } from 'pg';
import { createPostgresAdapter, type PgPool } from './postgres-adapter.js';

/**
 * Vercel Node.js / Fluid Compute pool configuration. A single connection per
 * warm function instance keeps serverless fan-out bounded; Neon PgBouncer
 * handles aggregate concurrency. Pool creation is lazy and does not connect.
 */
export function buildPostgresPoolConfig(databaseUrl: string): PoolConfig {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (
    (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') ||
    !parsed.hostname ||
    !parsed.pathname ||
    parsed.pathname === '/'
  ) {
    throw new Error('DATABASE_URL must include a PostgreSQL host and database name.');
  }

  return {
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    keepAlive: true,
    application_name: 'ariovelle-api',
    ssl: { rejectUnauthorized: true },
  };
}

/**
 * Creates a concrete node-postgres pool and the driver-neutral adapter.
 * Lucia auth routes use this factory with the server-only, least-privilege
 * DATABASE_URL. Each route owns and closes its pool after the request; never
 * pass a migration-owner URL or expose this connection to browser code.
 */
export function createRuntimePostgres(databaseUrl: string) {
  const pool = new Pool(buildPostgresPoolConfig(databaseUrl));
  const database = createPostgresAdapter(pool as unknown as PgPool);
  return { pool, database };
}
