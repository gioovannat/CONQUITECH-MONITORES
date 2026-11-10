import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create beautiful SVG icon for CONQUITECH-MA
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#115e59"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#042f2e" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  
  <!-- Subtle decorative ring -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#2dd4bf" stroke-width="4" stroke-opacity="0.2"/>

  <!-- Erlenmeyer flask / chemistry flask silhouette + checkmark -->
  <g filter="url(#shadow)">
    <!-- Flask neck and rim -->
    <rect x="226" y="90" width="60" height="24" rx="10" fill="#ffffff"/>
    <path d="M 236 114 L 236 170 L 150 330 A 28 28 0 0 0 174 370 L 338 370 A 28 28 0 0 0 362 330 L 276 170 L 276 114 Z" 
          fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>
    
    <!-- Liquid inside flask -->
    <path d="M 180 320 Q 220 300 256 316 T 332 312 L 348 344 A 20 20 0 0 1 332 358 L 180 358 A 20 20 0 0 1 164 344 Z" 
          fill="url(#accent)"/>
    <circle cx="220" cy="336" r="7" fill="#ffffff" fill-opacity="0.7"/>
    <circle cx="280" cy="326" r="5" fill="#ffffff" fill-opacity="0.7"/>
    <circle cx="250" cy="342" r="4" fill="#ffffff" fill-opacity="0.7"/>

    <!-- Prominent Checkmark badge for Attendance / Presença -->
    <circle cx="340" cy="330" r="56" fill="#10b981" stroke="#ffffff" stroke-width="10"/>
    <path d="M 318 330 L 334 346 L 364 316" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Text: CONQUITECH -->
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">CONQUITECH</text>
  <text x="256" y="474" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#a7f3d0" text-anchor="middle" letter-spacing="2">LAQI • UFMA 2026</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

// Pure Node.js PNG generator with CRC32 and Zlib
function createCRC32Table() {
  const cTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    cTable[n] = c;
  }
  return cTable;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePNG(width, height, isMaskable = false) {
  // Construct scanlines with RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  // CONQUITECH Teal gradient background and centered icon mark
  const r1 = 0, g1 = 122, b1 = 135;   // #007a87
  const r2 = 0, g2 = 143, b2 = 160;   // #008fa0
  const cx = width / 2;
  const cy = height / 2;
  const maxR = width * 0.45;
  const innerR = width * (isMaskable ? 0.32 : 0.38);

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: 0 (None)
    const factorY = y / height;
    
    for (let x = 0; x < width; x++) {
      const factorX = x / width;
      const t = (factorX + factorY) * 0.5;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = Math.round(r1 + (r2 - r1) * t);
      let g = Math.round(g1 + (g2 - g1) * t);
      let b = Math.round(b1 + (b2 - b1) * t);
      let a = 255;

      // Draw chemistry flask circle / check emblem
      if (dist < innerR && dist > innerR - Math.max(3, width * 0.02)) {
        // glowing ring
        r = 45; g = 212; b = 191; a = 240;
      } else if (dist <= innerR - Math.max(3, width * 0.02)) {
        // Flask body stylized
        const isFlask = Math.abs(dx) < (innerR * 0.6) && (dy > -innerR * 0.4 && dy < innerR * 0.6);
        const isCheck = (dx > 0 && dy > 0 && Math.hypot(dx - innerR*0.4, dy - innerR*0.4) < innerR * 0.35);

        if (isCheck) {
          r = 16; g = 185; b = 129; // emerald
        } else if (isFlask) {
          r = 255; g = 255; b = 255; // white
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(32, 32, false));

console.log('PWA icons successfully generated in public/ directory!');
