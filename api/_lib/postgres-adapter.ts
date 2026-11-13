import type { DatabaseAdapter, QueryResult, SqlExecutor } from './database';

export type PgQueryResult<Row extends Record<string, unknown>> = {
  rows: Row[];
  rowCount: number | null;
};

export interface PgQueryable {
  query<Row extends Record<string, unknown>>(
    statement: string,
    parameters?: readonly unknown[],
  ): Promise<PgQueryResult<Row>>;
}

export interface PgClient extends PgQueryable {
  release(): void;
}

export interface PgPool extends PgQueryable {
  connect(): Promise<PgClient>;
}

/**
 * Wrap a node-postgres-compatible pool. The pool is created by the server
 * composition root from a server-only DATABASE_URL; this module never reads
 * process.env, creates a pool, or exposes credentials.
 */
export function createPostgresAdapter(pool: PgPool): DatabaseAdapter {
  const executor: SqlExecutor = {
    async query<Row extends Record<string, unknown>>(
      statement: string,
      parameters: readonly unknown[] = [],
    ): Promise<QueryResult<Row>> {
      const result = await pool.query<Row>(statement, parameters);
      return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
    },
  };

  return {
    ...executor,
    async transaction<Result>(
      work: (transaction: SqlExecutor) => Promise<Result>,
    ): Promise<Result> {
      const client = await pool.connect();
      let transactionStarted = false;
      try {
        await client.query('BEGIN');
        transactionStarted = true;
        const transaction: SqlExecutor = {
          async query<Row extends Record<string, unknown>>(
            statement: string,
            parameters: readonly unknown[] = [],
          ): Promise<QueryResult<Row>> {
            const result = await client.query<Row>(statement, parameters);
            return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
          },
        };
        const value = await work(transaction);
        await client.query('COMMIT');
        transactionStarted = false;
        return value;
      } catch (error) {
        if (transactionStarted) {
          try {
            await client.query('ROLLBACK');
          } catch {
            // Preserve the original query/callback error; the connection is released below.
          }
        }
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
