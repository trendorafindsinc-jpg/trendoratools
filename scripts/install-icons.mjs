#!/usr/bin/env node
/** Assemble Trendora Tools icons from chunked icon-data-*.json */
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = dirname(fileURLToPath(import.meta.url));

function ensure(dir) { mkdirSync(dir, { recursive: true }); }
function writeB64(path, b64) {
  ensure(dirname(path));
  writeFileSync(path, Buffer.from(b64, 'base64'));
  console.log('wrote', path);
}

const icons = {};
for (const f of readdirSync(scripts).filter(n => n.startsWith('icon-data-') && n.endsWith('.json'))) {
  Object.assign(icons, JSON.parse(readFileSync(join(scripts, f), 'utf8')));
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <rect x="28" y="28" width="72" height="18" rx="4" fill="#fff"/>
  <rect x="53" y="42" width="22" height="58" rx="4" fill="#fff"/>
  <circle cx="92" cy="92" r="6" fill="#22d3ee"/>
</svg>
`;

ensure(join(root, 'public/icons'));
ensure(join(root, 'public/brand'));
ensure(join(root, 'resources/android'));

writeFileSync(join(root, 'public/brand/trendora-mark.svg'), svg);
console.log('wrote public/brand/trendora-mark.svg');

for (const [name, b64] of Object.entries(icons)) {
  writeB64(join(root, 'public/icons', name), b64);
}
if (icons['apple-touch-icon.png']) writeB64(join(root, 'public/icons/icon-180.png'), icons['apple-touch-icon.png']);
if (icons['icon-1024.png']) {
  writeB64(join(root, 'resources/icon.png'), icons['icon-1024.png']);
  writeB64(join(root, 'resources/icon-only.png'), icons['icon-1024.png']);
}
if (icons['icon-512-maskable.png']) {
  writeB64(join(root, 'resources/android/icon-foreground.png'), icons['icon-512-maskable.png']);
  writeB64(join(root, 'resources/android/icon-background.png'), icons['icon-512-maskable.png']);
}
console.log('Trendora Tools icons installed.');
