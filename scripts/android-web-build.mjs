#!/usr/bin/env node
/**
 * Production web build for the Android APK.
 * Intended to run under: npx vercel env run -e production -- node scripts/android-web-build.mjs
 *
 * Rejects missing, empty, whitespace, and [SENSITIVE] placeholder values.
 * Never prints secret values.
 */
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PLACEHOLDER = '[SENSITIVE]';
const EXPECTED_GA4_ID = 'G-3NYQNHCLK0';
const REQUIRED_FIREBASE_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function statusOf(name) {
  const value = process.env[name];
  if (typeof value !== 'string') return 'MISSING';
  const trimmed = value.trim();
  if (!trimmed) return 'MISSING';
  if (trimmed === PLACEHOLDER) return 'PLACEHOLDER';
  return 'PRESENT';
}

let failed = false;
for (const name of REQUIRED_FIREBASE_VARS) {
  const status = statusOf(name);
  console.log(`${name}=${status}`);
  if (status !== 'PRESENT') failed = true;
}

const gaStatus = statusOf('VITE_GA_MEASUREMENT_ID');
const gaValue = (process.env.VITE_GA_MEASUREMENT_ID || '').trim();
console.log(`VITE_GA_MEASUREMENT_ID=${gaStatus === 'PRESENT' ? (gaValue === EXPECTED_GA4_ID ? EXPECTED_GA4_ID : 'WRONG_STREAM') : gaStatus}`);

if (failed || gaStatus !== 'PRESENT' || gaValue !== EXPECTED_GA4_ID) {
  console.error('');
  console.error('ERROR: Vercel Production did not inject usable Firebase/GA4 values into this Vite build.');
  console.error('');
  console.error('Typical causes:');
  console.error('  1) A leftover .env.local from `vercel env pull` overrode Production with [SENSITIVE] or empty values.');
  console.error('     Vercel CLI 56 merges local dotenv files on top of `env run` Production values.');
  console.error('  2) VITE_FIREBASE_* is marked Secret in Vercel. Firebase web config is public client configuration');
  console.error('     and must be Config visibility so Vite can embed it at build time.');
  console.error('  3) The required VITE_FIREBASE_* / VITE_GA_MEASUREMENT_ID variables are missing from Production.');
  console.error('');
  console.error(`Expected GA4 stream: ${EXPECTED_GA4_ID}`);
  process.exit(1);
}

console.log('==> Firebase production configuration: all required values present');
console.log(`==> GA4 production measurement ID: ${EXPECTED_GA4_ID}`);

rmSync('dist', { recursive: true, force: true });

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const assertScript = join(dirname(fileURLToPath(import.meta.url)), 'assert-embedded-firebase.mjs');
const assert = spawnSync(process.execPath, [assertScript, 'dist'], {
  stdio: 'inherit',
  env: process.env,
});
process.exit(assert.status ?? 1);
