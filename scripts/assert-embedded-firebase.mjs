#!/usr/bin/env node
/**
 * Verify a Vite/Capacitor output directory actually contains Firebase web
 * configuration. Never prints secret values — only PRESENT / MISSING.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PLACEHOLDER = '[SENSITIVE]';
const EXPECTED_GA4_ID = 'G-3NYQNHCLK0';

const root = process.argv[2];
if (!root) {
  console.error('Usage: node scripts/assert-embedded-firebase.mjs <output-dir>');
  process.exit(1);
}

if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`ERROR: Output directory is missing: ${root}`);
  process.exit(1);
}

function collectFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) collectFiles(full, acc);
    else if (/\.(js|mjs|cjs|html|json)$/i.test(name)) acc.push(full);
  }
  return acc;
}

const files = collectFiles(root);
if (files.length === 0) {
  console.error(`ERROR: No JS/HTML assets found in ${root}`);
  process.exit(1);
}

const blob = files.map((file) => readFileSync(file, 'utf8')).join('\n');

if (blob.includes(PLACEHOLDER)) {
  console.error(`ERROR: ${PLACEHOLDER} placeholder detected in ${root}.`);
  console.error('Vercel Secret values were inlined instead of Firebase web config.');
  process.exit(1);
}

const checks = [
  ['Firebase API key', /AIza[0-9A-Za-z_-]{20,}/],
  ['Firebase auth domain', /[a-z0-9-]+\.firebaseapp\.com/i],
  ['Firebase project ID', /projectId:\s*"[a-z0-9-]+"/],
  ['Firebase storage bucket', /[a-z0-9.-]+\.(appspot\.com|firebasestorage\.app)/i],
  ['Firebase messaging sender ID', /messagingSenderId:\s*"[0-9]{6,}"/],
  ['Firebase app ID', /1:[0-9]+:web:[0-9a-f]+/],
  ['GA4 measurement ID', new RegExp(EXPECTED_GA4_ID)],
];

let failed = false;
for (const [label, pattern] of checks) {
  const ok = pattern.test(blob);
  console.log(`${label}: ${ok ? 'PRESENT' : 'MISSING'}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error(`ERROR: Firebase/GA4 production configuration was not compiled into ${root}.`);
  console.error('Vite replaces import.meta.env.VITE_* at build time. The APK cannot read Vercel env at runtime.');
  process.exit(1);
}
