#!/usr/bin/env node
/** Generate Ariovelle brand artwork and retain legacy raster icon fallbacks. */
import {
  mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync, copyFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(root, 'public/icons');
const brandDir = join(root, 'public/brand');
const resourcesDir = join(root, 'resources');
const androidResDir = join(root, 'resources/android');

function ensure(dir) { mkdirSync(dir, { recursive: true }); }
function writeB64(path, b64) {
  ensure(dirname(path));
  writeFileSync(path, Buffer.from(b64, 'base64'));
  console.log('wrote', path);
}
function copyIfMissing(src, dest) {
  if (!existsSync(src) || existsSync(dest)) return false;
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
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e6d2a7"/>
      <stop offset="100%" stop-color="#a98243"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="29" fill="#0b111b"/>
  <path d="M64 20 105 99H88L64 52 40 99H23Z" fill="url(#gold)"/>
  <path d="M46 78h36l8 15H38Z" fill="#0b111b"/>
</svg>
`;
writeFileSync(join(brandDir, 'ariovelle-mark.svg'), svg);
console.log('wrote public/brand/ariovelle-mark.svg');

const icons = {};
try {
  const dataFiles = readdirSync(scripts).filter(n => n.startsWith('icon-data-') && n.endsWith('.json'));
  for (const file of dataFiles) Object.assign(icons, JSON.parse(readFileSync(join(scripts, file), 'utf8')));
} catch { /* Optional icon-data files; use existing raster assets. */ }

for (const [name, b64] of Object.entries(icons)) writeB64(join(iconsDir, name), b64);
if (icons['apple-touch-icon.png']) writeB64(join(iconsDir, 'icon-180.png'), icons['apple-touch-icon.png']);
if (icons['icon-1024.png']) {
  writeB64(join(resourcesDir, 'icon.png'), icons['icon-1024.png']);
  writeB64(join(resourcesDir, 'icon-only.png'), icons['icon-1024.png']);
}
if (icons['icon-512-maskable.png']) {
  writeB64(join(androidResDir, 'icon-foreground.png'), icons['icon-512-maskable.png']);
  writeB64(join(androidResDir, 'icon-background.png'), icons['icon-512-maskable.png']);
}

const icon192 = join(iconsDir, 'icon-192.png');
const icon512 = join(iconsDir, 'icon-512.png');
const apple = join(iconsDir, 'apple-touch-icon.png');
copyIfMissing(icon192, join(iconsDir, 'icon-192-maskable.png'));
copyIfMissing(icon512, join(iconsDir, 'icon-512-maskable.png'));
copyIfMissing(apple, join(iconsDir, 'icon-180.png'));
for (const size of ['48', '72', '96', '144']) copyIfMissing(icon192, join(iconsDir, 'icon-' + size + '.png'));
copyIfMissing(icon512, join(resourcesDir, 'icon.png'));
copyIfMissing(icon512, join(resourcesDir, 'icon-only.png'));
copyIfMissing(join(iconsDir, 'icon-512-maskable.png'), join(androidResDir, 'icon-foreground.png'));
copyIfMissing(join(iconsDir, 'icon-512-maskable.png'), join(androidResDir, 'icon-background.png'));
console.log('Ariovelle icons installed.');
