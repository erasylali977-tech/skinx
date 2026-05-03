#!/usr/bin/env node
// Generates solid #0c1527 PNG splash screens for all iOS device sizes.
// Run: node scripts/gen-splash.mjs
// Then re-add the PWA to your iPhone home screen to pick up the new images.

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── Minimal PNG encoder (no external deps) ──────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return ((c ^ 0xFFFFFFFF) >>> 0);
}

function pngChunk(type, data) {
  const tb  = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}

/**
 * Generates a solid-color RGB PNG using the Up filter on rows 1+ so that
 * all subsequent rows compress to near-zero, keeping file size < 5 KB.
 */
function solidPNG(w, h, r, g, b) {
  const SIG  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const IHDR = Buffer.allocUnsafe(13);
  IHDR.writeUInt32BE(w, 0); IHDR.writeUInt32BE(h, 4);
  IHDR[8] = 8; IHDR[9] = 2; IHDR[10] = 0; IHDR[11] = 0; IHDR[12] = 0;

  const stride = 1 + w * 3;          // 1 filter byte + 3 channels per pixel
  const raw    = Buffer.alloc(h * stride, 0);

  // Row 0 — filter 0 (None): store raw RGB values
  raw[0] = 0;
  for (let x = 0; x < w; x++) {
    raw[1 + x * 3]     = r;
    raw[1 + x * 3 + 1] = g;
    raw[1 + x * 3 + 2] = b;
  }
  // Rows 1…H-1 — filter 2 (Up): delta from previous row = 0 for solid color
  for (let y = 1; y < h; y++) raw[y * stride] = 2;

  return Buffer.concat([
    SIG,
    pngChunk('IHDR', IHDR),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Device sizes ────────────────────────────────────────────────────────────
const SIZES = [
  { name: 'iphone-se',          w:  640, h: 1136 },
  { name: 'iphone-8',           w:  750, h: 1334 },
  { name: 'iphone-8-plus',      w: 1242, h: 2208 },
  { name: 'iphone-x',           w: 1125, h: 2436 },
  { name: 'iphone-xr',          w:  828, h: 1792 },
  { name: 'iphone-xs-max',      w: 1242, h: 2688 },
  { name: 'iphone-12-mini',     w: 1080, h: 2340 },
  { name: 'iphone-12',          w: 1170, h: 2532 },
  { name: 'iphone-12-pro-max',  w: 1284, h: 2778 },
  { name: 'iphone-14-pro',      w: 1179, h: 2556 },
  { name: 'iphone-14-pro-max',  w: 1290, h: 2796 },
  { name: 'iphone-15-pro',      w: 1179, h: 2556 },
  { name: 'iphone-15-pro-max',  w: 1290, h: 2796 },
];

const OUT = join(ROOT, 'public', 'splashes');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const [R, G, B] = [0x0c, 0x15, 0x27]; // #0c1527 — deep navy

console.log('Generating iOS splash screens (#0c1527)…');
for (const { name, w, h } of SIZES) {
  const buf  = solidPNG(w, h, R, G, B);
  const path = join(OUT, `${name}.png`);
  writeFileSync(path, buf);
  console.log(`  ✓ ${name}.png  ${w}×${h}  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log('\nDone — public/splashes/ ready.');
