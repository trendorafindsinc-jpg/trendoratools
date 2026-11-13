import { Pool, type PoolConfig } from 'pg';
import { createPostgresAdapter } from './postgres-adapter';

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
 * This factory is deliberately not imported by any HTTP route or app entry
 * point yet. Call it only from a future server composition root after the
 * verified identity and RLS gates are approved.
 */
export function createRuntimePostgres(databaseUrl: string) {
  const pool = new Pool(buildPostgresPoolConfig(databaseUrl));
  const database = createPostgresAdapter(pool as unknown as ConstructorParameters<typeof Pool>[0] extends never
    ? never
    : Parameters<typeof createPostgresAdapter>[0] extends never
      ? never
      : import('./postgres-adapter').PgPool);
  return { pool, database };
}
