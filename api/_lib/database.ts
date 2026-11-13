/**
 * Driver-neutral PostgreSQL boundary.
 *
 * This is a driver-neutral contract. Concrete adapters implement it; importing
 * this module creates no connection and performs no database I/O.
 * SQL must use positional parameters; never interpolate user input into SQL.
 */
export type QueryResult<Row extends Record<string, unknown>> = {
  rows: Row[];
  rowCount: number;
};

export interface SqlExecutor {
  query<Row extends Record<string, unknown>>(
    statement: string,
    parameters?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
}

export interface DatabaseAdapter extends SqlExecutor {
  transaction<Result>(
    work: (transaction: SqlExecutor) => Promise<Result>,
  ): Promise<Result>;
}
