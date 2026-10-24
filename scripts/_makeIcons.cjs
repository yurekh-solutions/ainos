// Builds the app icon set from the brand alpha mark:
//   src/app/icon.png        -> browser tab / PWA (transparent)
//   src/app/apple-icon.png  -> iOS home screen (opaque, iOS ignores alpha)
//   src/app/favicon.ico     -> legacy /favicon.ico (16/32/48, transparent)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'public', 'ainos-alpha.png');
const APP = path.join(root, 'src', 'app');

/** Renders the trimmed mark centred on a square tile with breathing room. */
async function tile(size, padRatio, background) {
  const inner = Math.max(8, Math.round(size * (1 - padRatio * 2)));
  const glyph = await sharp(SRC)
    .trim({ threshold: 1 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** Minimal ICO container that embeds PNG frames (supported by every modern browser). */
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  let offset = 6 + frames.length * 16;
  const entries = frames.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]);
}

(async () => {
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const white = { r: 255, g: 255, b: 255, alpha: 1 };

  // 6% padding keeps the glyph legible at 16px without clipping the swash.
  const icon = await tile(512, 0.06, transparent);
  fs.writeFileSync(path.join(APP, 'icon.png'), icon);

  const apple = await tile(180, 0.1, white);
  fs.writeFileSync(path.join(APP, 'apple-icon.png'), apple);

  const frames = [];
  for (const size of [16, 32, 48]) {
    frames.push({ size, data: await tile(size, size <= 16 ? 0.02 : 0.04, transparent) });
  }
  fs.writeFileSync(path.join(APP, 'favicon.ico'), buildIco(frames));

  console.log(`icon.png ${icon.length} bytes, apple-icon.png ${apple.length} bytes, favicon.ico ${frames.reduce((n, f) => n + f.data.length, 0) + 6 + frames.length * 16} bytes`);
})();
