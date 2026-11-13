import { describe, expect, it } from 'vitest';
import { buildPostgresPoolConfig } from './postgres-pool';

describe('runtime PostgreSQL pool configuration', () => {
  it('uses bounded serverless pooling and verified TLS', () => {
    const config = buildPostgresPoolConfig('postgresql://app:secret@db.example.test/ariovelle?sslmode=require');
    expect(config).toMatchObject({
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true,
      keepAlive: true,
      application_name: 'ariovelle-api',
      ssl: { rejectUnauthorized: true },
    });
    expect(config.connectionString).toContain('db.example.test');
  });

  it.each(['', 'https://db.example.test/ariovelle', 'postgres://db.example.test'])(
    'rejects invalid database URLs: %s',
    (url) => expect(() => buildPostgresPoolConfig(url)).toThrow(),
  );
});
