import { describe, expect, it } from 'vitest';
import { checksum, discoverMigrations, pendingMigrations, stripTransactionWrapper } from './migrate.mjs';

describe('schema migration controls', () => {
  it('discovers a contiguous, deterministically ordered migration set', async () => {
    const migrations = await discoverMigrations();
    expect(migrations.map((migration) => migration.version)).toEqual(['0000', '0001', '0002', '0003', '0004', '0005']);
    expect(migrations.every((migration) => /^[a-f0-9]{64}$/.test(migration.checksum))).toBe(true);
  });

  it('computes stable SHA-256 checksums over exact file contents', () => {
    expect(checksum('SELECT 1;')).toBe(checksum('SELECT 1;'));
    expect(checksum('SELECT 1;')).not.toBe(checksum('SELECT 2;'));
  });

  it('removes only the outer transaction wrapper so the runner can commit the ledger atomically', () => {
    const sql = '-- migration header\nBEGIN;\nCREATE TABLE example (id int);\nCOMMIT;\n';
    expect(stripTransactionWrapper(sql)).toContain('CREATE TABLE example');
    expect(stripTransactionWrapper(sql)).not.toMatch(/^\s*BEGIN\s*;/m);
    expect(stripTransactionWrapper(sql)).not.toMatch(/COMMIT\s*;\s*$/m);
  });

  it('refuses checksum drift and only returns genuinely pending migrations', () => {
    const migrations = [{ version: '0001', name: 'base', checksum: 'a'.repeat(64) }];
    expect(pendingMigrations(migrations, [])).toHaveLength(1);
    expect(pendingMigrations(migrations, [{ version: '0001', checksum: 'a'.repeat(64) }])).toHaveLength(0);
    expect(() => pendingMigrations(migrations, [{ version: '0001', checksum: 'b'.repeat(64) }]))
      .toThrow(/Checksum drift detected/);
  });
});
