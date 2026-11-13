import type { DatabaseAdapter } from './database';
import { hashSessionToken } from './lucia-session';

export type StoredOAuthTransaction = {
  state: string;
  browserBinding: string;
  encryptedTransaction: string;
  expiresAt: Date;
};

/** Store a short-lived, one-time OAuth transaction server-side. Only hashes of
 * state and browser binding are indexed; nonce/verifier remain encrypted. */
export async function storeOAuthTransaction(
  db: DatabaseAdapter,
  input: StoredOAuthTransaction,
): Promise<void> {
  if (!input.state || !input.browserBinding || !input.encryptedTransaction) {
    throw new Error('OAuth transaction fields are required.');
  }
  const result = await db.query<{ created: boolean }>(
    'SELECT app_private.create_lucia_oauth_transaction($1,$2,$3,$4) AS created',
    [
      hashSessionToken(input.state),
      hashSessionToken(input.browserBinding),
      input.encryptedTransaction,
      input.expiresAt,
    ],
  );
  if (result.rows[0]?.created !== true) {
    throw new Error('OAuth transaction could not be stored.');
  }
}

/** Atomically consumes the matching transaction; a replay returns null. */
export async function consumeOAuthTransaction(
  db: DatabaseAdapter,
  state: string,
  browserBinding: string,
  now = new Date(),
): Promise<string | null> {
  if (!state || !browserBinding || state.length > 256 || browserBinding.length > 256) {
    return null;
  }
  const result = await db.query<{ transaction_data: string }>(
    'SELECT transaction_data FROM app_private.consume_lucia_oauth_transaction($1,$2,$3)',
    [hashSessionToken(state), hashSessionToken(browserBinding), now],
  );
  return result.rows[0]?.transaction_data ?? null;
}
