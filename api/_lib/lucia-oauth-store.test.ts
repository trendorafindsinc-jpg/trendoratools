import { describe, expect, it } from 'vitest';
import type { DatabaseAdapter } from './database';
import { consumeOAuthTransaction, storeOAuthTransaction } from './lucia-oauth-store';

function fakeDb(options: { created?: boolean; transactionData?: string | null } = {}) {
  const calls: Array<{ sql: string; params: readonly unknown[] }> = [];
  const db: DatabaseAdapter = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes('create_lucia_oauth_transaction')) {
        return { rows: [{ created: options.created ?? true }], rowCount: 1 } as never;
      }
      return {
        rows: options.transactionData ? [{ transaction_data: options.transactionData }] : [],
        rowCount: options.transactionData ? 1 : 0,
      } as never;
    },
    async transaction(work) {
      return work(db);
    },
  };
  return { db, calls };
}

describe('server-side Lucia OAuth transaction store', () => {
  it('stores hashes of state and browser binding, not their raw values', async () => {
    const { db, calls } = fakeDb();
    const state = 'state-secret-value';
    const browserBinding = 'browser-binding-secret';
    const encryptedTransaction = 'authenticated-ciphertext';
    await storeOAuthTransaction(db, {
      state,
      browserBinding,
      encryptedTransaction,
      expiresAt: new Date(Date.now() + 600_000),
    });
    expect(calls[0].sql).toContain('create_lucia_oauth_transaction');
    expect(calls[0].params).toEqual([
      '01cc0568b7c17d23a129c000c7ccb83b371ab9dfcb0f1c0508c9ab1b2ed80709',
      'a29c63517be9b16a3d225077d26642363af2396fb085150aa342454e17a9efb9',
      encryptedTransaction,
      expect.any(Date),
    ]);
    expect(calls[0].params).not.toContain(state);
    expect(calls[0].params).not.toContain(browserBinding);
  });

  it('fails closed if the database does not confirm transaction storage', async () => {
    const { db } = fakeDb({ created: false });
    await expect(storeOAuthTransaction(db, {
      state: 'state',
      browserBinding: 'binding',
      encryptedTransaction: 'ciphertext',
      expiresAt: new Date(Date.now() + 60_000),
    })).rejects.toThrow('could not be stored');
  });

  it('returns the encrypted payload once and returns null when already consumed', async () => {
    const { db, calls } = fakeDb({ transactionData: 'encrypted-payload' });
    await expect(consumeOAuthTransaction(db, 'state', 'binding'))
      .resolves.toBe('encrypted-payload');
    expect(calls[0].sql).toContain('consume_lucia_oauth_transaction');
    const empty = fakeDb();
    await expect(consumeOAuthTransaction(empty.db, 'state', 'binding')).resolves.toBeNull();
  });

  it('rejects malformed or oversized callback bindings without database access', async () => {
    const { db, calls } = fakeDb();
    await expect(consumeOAuthTransaction(db, '', 'binding')).resolves.toBeNull();
    await expect(consumeOAuthTransaction(db, 'state', 'x'.repeat(257))).resolves.toBeNull();
    expect(calls).toHaveLength(0);
  });
});
