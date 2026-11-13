import { describe, expect, it, vi } from 'vitest';
import { createPostgresAdapter, type PgClient, type PgPool } from './postgres-adapter';

function fakePool(queryImpl?: PgPool['query']) {
  const statements: string[] = [];
  const client: PgClient = {
    async query(statement, parameters) {
      statements.push(statement);
      return queryImpl
        ? queryImpl(statement, parameters)
        : { rows: [] as never[], rowCount: 0 };
    },
    release: vi.fn(),
  };
  const pool: PgPool = {
    async query(statement, parameters) {
      statements.push(statement);
      return queryImpl
        ? queryImpl(statement, parameters)
        : { rows: [] as never[], rowCount: 0 };
    },
    connect: vi.fn(async () => client),
  };
  return { pool, client, statements };
}

describe('PostgreSQL adapter', () => {
  it('passes SQL parameters separately and normalizes nullable rowCount', async () => {
    const { pool } = fakePool(async () => ({ rows: [{ value: 7 }], rowCount: null }));
    const db = createPostgresAdapter(pool);
    await expect(db.query('SELECT $1::int AS value', [7])).resolves.toEqual({
      rows: [{ value: 7 }],
      rowCount: 1,
    });
  });

  it('commits successful transactions and always releases the client', async () => {
    const { pool, client, statements } = fakePool();
    const db = createPostgresAdapter(pool);
    await expect(db.transaction(async (tx) => {
      await tx.query('SELECT $1::text', ['bound']);
      return 'committed';
    })).resolves.toBe('committed');
    expect(statements).toEqual(['BEGIN', 'SELECT $1::text', 'COMMIT']);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rolls back failed transactions and rethrows the original error', async () => {
    const { pool, client, statements } = fakePool();
    const db = createPostgresAdapter(pool);
    const failure = new Error('operation failed');
    await expect(db.transaction(async () => { throw failure; })).rejects.toBe(failure);
    expect(statements).toEqual(['BEGIN', 'ROLLBACK']);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('releases the client when BEGIN fails', async () => {
    const failure = new Error('connection setup failed');
    const { pool, client, statements } = fakePool(async (statement) => {
      if (statement === 'BEGIN') throw failure;
      return { rows: [], rowCount: 0 };
    });
    const db = createPostgresAdapter(pool);
    await expect(db.transaction(async () => 'unused')).rejects.toBe(failure);
    expect(statements).toEqual(['BEGIN']);
    expect(client.release).toHaveBeenCalledOnce();
  });
});
