import { describe, expect, it } from 'vitest';
import { DataRepository, defaultSnapshot } from '../src/data/repositories';
import { MemoryStorageAdapter } from '../src/data/storage';

describe('repository', () => {
 it('saves and loads snapshots', () => {
   const storage = new MemoryStorageAdapter();
   const repo = new DataRepository(storage, 'test-key');

  const snapshot = defaultSnapshot();
  snapshot.preferences.currency = 'USD';

  repo.save(snapshot);
  const loaded = repo.load();

   expect(loaded.preferences.currency).toBe('USD');
 });

 it('clears saved data', () => {
   const storage = new MemoryStorageAdapter();
   const repo = new DataRepository(storage, 'test-key');

  const snapshot = defaultSnapshot();
  snapshot.preferences.currency = 'GBP';

  repo.save(snapshot);
  repo.clear();

    const loaded = repo.load();
    expect(loaded.preferences.currency).toBe('NGN');
  });
});
