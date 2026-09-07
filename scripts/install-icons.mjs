#!/usr/bin/env node
/** Install Trendora Tools brand assets.
 *  - Always writes public/brand/trendora-mark.svg
 *  - If scripts/icon-data-*.json exist, materializes those PNGs
 *  - Otherwise aliases existing public/icons/*.png for maskable / extra sizes
 *  Safe to run on postinstall even with no icon-data files.
 */
import {
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
  existsSync,
  copyFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(root, 'public/icons');
const brandDir = join(root, 'public/brand');
const resourcesDir = join(root, 'resources');
const androidResDir = join(root, 'resources/android');

function ensure(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeB64(path, b64) {
  ensure(dirname(path));
  writeFileSync(path, Buffer.from(b64, 'base64'));
  console.log('wrote', path);
}

function copyIfMissing(src, dest) {
  if (!existsSync(src)) return false;
  if (existsSync(dest)) return false;
  ensure(dirname(dest));
  copyFileSync(src, dest);
  console.log('aliased', dest, '<-', src);
  return true;
}

ensure(iconsDir);
ensure(brandDir);
ensure(androidResDir);

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

writeFileSync(join(brandDir, 'trendora-mark.svg'), svg);
console.log('wrote public/brand/trendora-mark.svg');

// Optional: materialize from chunked base64 JSON (if present)
const icons = {};
try {
  const dataFiles = readdirSync(scripts).filter(
    (n) => n.startsWith('icon-data-') && n.endsWith('.json')
  );
  for (const f of dataFiles) {
    Object.assign(icons, JSON.parse(readFileSync(join(scripts, f), 'utf8')));
  }
} catch {
  // ignore — fall through to aliases
}

for (const [name, b64] of Object.entries(icons)) {
  writeB64(join(iconsDir, name), b64);
}
if (icons['apple-touch-icon.png']) {
  writeB64(join(iconsDir, 'icon-180.png'), icons['apple-touch-icon.png']);
}
if (icons['icon-1024.png']) {
  writeB64(join(resourcesDir, 'icon.png'), icons['icon-1024.png']);
  writeB64(join(resourcesDir, 'icon-only.png'), icons['icon-1024.png']);
}
if (icons['icon-512-maskable.png']) {
  writeB64(join(androidResDir, 'icon-foreground.png'), icons['icon-512-maskable.png']);
  writeB64(join(androidResDir, 'icon-background.png'), icons['icon-512-maskable.png']);
}

// Fallbacks so PWA manifest + Termux mipmap copy always have files
const icon192 = join(iconsDir, 'icon-192.png');
const icon512 = join(iconsDir, 'icon-512.png');
const apple = join(iconsDir, 'apple-touch-icon.png');

copyIfMissing(icon192, join(iconsDir, 'icon-192-maskable.png'));
copyIfMissing(icon512, join(iconsDir, 'icon-512-maskable.png'));
copyIfMissing(apple, join(iconsDir, 'icon-180.png'));
copyIfMissing(icon192, join(iconsDir, 'icon-48.png'));
copyIfMissing(icon192, join(iconsDir, 'icon-72.png'));
copyIfMissing(icon192, join(iconsDir, 'icon-96.png'));
copyIfMissing(icon192, join(iconsDir, 'icon-144.png'));
copyIfMissing(icon512, join(resourcesDir, 'icon.png'));
copyIfMissing(icon512, join(resourcesDir, 'icon-only.png'));
copyIfMissing(join(iconsDir, 'icon-512-maskable.png'), join(androidResDir, 'icon-foreground.png'));
copyIfMissing(join(iconsDir, 'icon-512-maskable.png'), join(androidResDir, 'icon-background.png'));

console.log('Trendora Tools icons installed.');
