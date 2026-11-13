import { describe,expect,it } from 'vitest';
import { createOpaqueSessionToken,hashSessionToken } from './lucia-session';

describe('Ariovelle local session primitives',()=>{
 it('generates high-entropy opaque tokens and stores only SHA-256 hashes',()=>{
  const token=createOpaqueSessionToken();
  expect(token.length).toBeGreaterThanOrEqual(40);
  expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
  expect(hashSessionToken(token)).not.toBe(token);
  expect(hashSessionToken(token)).toBe(hashSessionToken(token));
 });
 it('generates unique session tokens',()=>{
  expect(createOpaqueSessionToken()).not.toBe(createOpaqueSessionToken());
 });
});
