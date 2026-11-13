import { describe, expect, it } from 'vitest';
import { readServerConfig, ServerConfigError } from './config';

describe('server configuration', () => {
  it('defaults to development with no database configured', () => {
    expect(readServerConfig({})).toEqual({
      environment: 'development',
      databaseUrl: null,
    });
  });

  it('accepts a valid PostgreSQL connection URL without connecting', () => {
    const databaseUrl = 'postgresql://ariovelle:secret@db.example.test:5432/ariovelle';
    expect(readServerConfig({ NODE_ENV: 'test', DATABASE_URL: databaseUrl })).toEqual({
      environment: 'test',
      databaseUrl,
    });
  });

  it('rejects unsupported runtime environments', () => {
    expect(() => readServerConfig({ NODE_ENV: 'preview' })).toThrow(ServerConfigError);
  });

  it('rejects malformed database URLs without echoing credentials', () => {
    expect(() => readServerConfig({ DATABASE_URL: 'not-a-url-secret' })).toThrow(
      'DATABASE_URL must be a valid PostgreSQL URL.',
    );
  });

  it('rejects non-PostgreSQL protocols', () => {
    expect(() => readServerConfig({ DATABASE_URL: 'https://example.test/db' })).toThrow(
      'DATABASE_URL must use postgres:// or postgresql://.',
    );
  });

  it('requires a database name', () => {
    expect(() => readServerConfig({ DATABASE_URL: 'postgres://db.example.test/' })).toThrow(
      'DATABASE_URL must include a host and database name.',
    );
  });
});
