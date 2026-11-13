/**
 * Driver-neutral PostgreSQL boundary.
 *
 * This is an interface only: it intentionally creates no connection, imports
 * no database driver, and cannot execute until an approved adapter is supplied.
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
