/**
 * Generates PWA icons (PNG) from pure Node.js — no external deps.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CRC32 ──────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

// ── Draw pixel ─────────────────────────────────────────────────────────────
function createPNG(size, bg, accent) {
  const cx = size / 2,
    cy = size / 2;
  const outerR = size * 0.42;
  const padR = size * 0.38;
  const innerR = size * 0.2;

  const raw = Buffer.alloc(size * (1 + size * 4));

  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4);
    raw[row] = 0; // filter: None

    for (let x = 0; x < size; x++) {
      const off = row + 1 + x * 4;
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      // Outer ring → accent
      // Inner fill → slightly lighter accent
      // Padding between → darker
      // Background → bg
      let r,
        g,
        b,
        a = 255;

      if (d > outerR) {
        // Background — sharp edge for maskable safe area
        [r, g, b] = bg;
      } else if (d > padR) {
        // Outer ring border
        [r, g, b] = accent;
        a = Math.round(255 * (1 - (d - padR) / (outerR - padR)));
      } else if (d > innerR) {
        // Ring body
        [r, g, b] = accent;
      } else {
        // Inner highlight (slightly lighter)
        r = Math.min(255, accent[0] + 30);
        g = Math.min(255, accent[1] + 5);
        b = Math.min(255, accent[2] + 5);
      }

      // Volleyball curve lines (3 curves at 120° intervals)
      const angle = Math.atan2(y - cy, x - cx);
      const normalized =
        ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const lineAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
      const lineWidth = size * 0.03;
      if (d > innerR && d < padR) {
        for (const la of lineAngles) {
          const diff = Math.abs(
            ((normalized - la + Math.PI) % (Math.PI * 2)) - Math.PI,
          );
          if (diff < lineWidth / d) {
            r = Math.max(0, accent[0] - 40);
            g = Math.max(0, accent[1] - 5);
            b = Math.max(0, accent[2] - 5);
          }
        }
      }

      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG sig
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Generate ───────────────────────────────────────────────────────────────
const iconsDir = join(__dirname, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

const BG = [13, 17, 23]; // #0D1117
const ACCENT = [227, 6, 19]; // #E30613

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const s of sizes) {
  writeFileSync(join(iconsDir, `icon-${s}.png`), createPNG(s, BG, ACCENT));
  console.log(`✓ icons/icon-${s}.png`);
}

// Apple touch icon
writeFileSync(
  join(__dirname, "../public/apple-touch-icon.png"),
  createPNG(180, BG, ACCENT),
);
console.log("✓ apple-touch-icon.png");

// Small favicon
writeFileSync(
  join(__dirname, "../public/favicon.png"),
  createPNG(32, BG, ACCENT),
);
console.log("✓ favicon.png");

// Maskable icon (safe zone = 80% inner, so extend bg to edges)
writeFileSync(
  join(iconsDir, "icon-512-maskable.png"),
  createPNG(512, BG, ACCENT),
);
console.log("✓ icons/icon-512-maskable.png");

console.log("\n🏐 Todos os ícones gerados em public/icons/");
