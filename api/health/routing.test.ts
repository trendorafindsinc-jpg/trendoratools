import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Vercel filesystem API routing contract', () => {
  it('keeps the documented health URLs backed by their Node function modules', async () => {
    const routes = [
      ['/api/health/live', 'api/health/live.ts'],
      ['/api/health/ready', 'api/health/ready.ts'],
    ];
    for (const [url, file] of routes) {
      await expect(access(path.join(root, file))).resolves.toBeUndefined();
      expect(url).toBe('/' + file.replace(/\.ts$/, '').replace(/^api\//, 'api/'));
    }
  });

  it('does not add rewrites that shadow filesystem API functions or re-enable Git deployments', async () => {
    const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
    expect(config.git?.deploymentEnabled).toBe(false);
    expect(config.rewrites ?? []).toEqual([]);
    expect(config.routes ?? []).toEqual([]);
  });
});
