const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="100" fill="#050505"/>
  <path d="M256 32 L416 96 V240 C416 352 256 464 256 464 C256 464 96 352 96 240 V96 Z" fill="none" stroke="#00ff66" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M256 72 L376 120 V230 C376 320 256 410 256 410 C256 410 136 320 136 230 V120 Z" fill="#00ff66" fill-opacity="0.1" stroke="#00ff66" stroke-width="6"/>
  <text x="256" y="275" font-family="monospace, sans-serif" font-size="140" font-weight="900" fill="#00ff66" text-anchor="middle">&gt;_</text>
  <circle cx="256" cy="256" r="220" fill="none" stroke="#00ff66" stroke-width="4" stroke-dasharray="12 12" opacity="0.4"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

function generateCyberPngBuffer(size, isMaskable = false) {
  const width = size;
  const height = size;
  
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 5, g = 5, b = 5, a = 255;

      const outerR = size * 0.44;
      if (Math.abs(dist - outerR) < size * 0.015) {
        r = 0; g = 255; b = 102; a = 200;
      } else if (dist < outerR) {
        const factor = (1 - dist / outerR);
        g = Math.floor(5 + factor * 30);
      }

      const sx = Math.abs(dx) / (size * 0.32);
      const sy = (dy + size * 0.1) / (size * 0.35);
      if (sy > -0.7 && sy < 0.8) {
        const shieldBoundary = 1.0 - (sy > 0 ? Math.pow(sy, 1.8) * 0.8 : 0);
        if (Math.abs(sx - shieldBoundary) < 0.05 && sy > -0.65) {
          r = 0; g = 255; b = 102; a = 255;
        } else if (sx < shieldBoundary && sy > -0.65) {
          g = Math.min(255, g + 25);
        }
      }

      if (Math.abs(dy + size * 0.02) < size * 0.08) {
        if (dx > -size * 0.12 && dx < size * 0.04) {
          const arrowSlope = Math.abs(dy + size * 0.02) - (dx + size * 0.12);
          if (Math.abs(arrowSlope) < size * 0.025) {
            r = 0; g = 255; b = 102; a = 255;
          }
        }
        if (dx > size * 0.06 && dx < size * 0.14 && dy > size * 0.03 && dy < size * 0.07) {
          r = 0; g = 255; b = 102; a = 255;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), generateCyberPngBuffer(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), generateCyberPngBuffer(512));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), generateCyberPngBuffer(512, true));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generateCyberPngBuffer(180));

console.log('PWA Icons generated successfully in public/icons/');
