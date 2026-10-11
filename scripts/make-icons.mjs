// Generates the placeholder app icons (turquoise tile with a butter star, in the
// art pack palette) as PNG files without any native dependency. Output is
// deterministic, so re-running it leaves committed files unchanged.
// Usage: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TURQUOISE = [0x54, 0xbe, 0xb4];
const BUTTER = [0xf1, 0xce, 0x6b];
const STAR_RADIUS = 0.3; // of the icon side; inside the 40 % maskable safe zone
const CORNER_RADIUS = 0.2; // of the icon side, for non-maskable variants
const SUPERSAMPLE = 4;

/** @type {Array<{ file: string, size: number, maskable: boolean }>} */
const ICONS = [
    { file: 'public/icons/icon-192.png', size: 192, maskable: false },
    { file: 'public/icons/icon-512.png', size: 512, maskable: false },
    { file: 'public/icons/icon-maskable-512.png', size: 512, maskable: true },
    { file: 'public/icons/apple-touch-icon-180.png', size: 180, maskable: true },
    { file: 'public/favicon.png', size: 48, maskable: false },
];

const crcTable = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c >>> 0;
});

const crc32 = (bytes) => {
    let crc = 0xffffffff;
    for (const b of bytes) {
        crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
    const typeBytes = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([length, typeBytes, data, crc]);
};

const encodePng = (size, rgba) => {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8; // bit depth
    header[9] = 6; // colour type RGBA
    const rows = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y += 1) {
        rows[y * (size * 4 + 1)] = 0; // filter: none
        rgba.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(rows, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
};

const starPolygon = (cx, cy, outer) => {
    const inner = outer * 0.382;
    const points = [];
    for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? outer : inner;
        points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    return points;
};

const insidePolygon = (points, x, y) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
};

const insideRoundedSquare = (size, radius, x, y) => {
    const nx = Math.max(radius - x, 0, x - (size - radius));
    const ny = Math.max(radius - y, 0, y - (size - radius));
    return nx * nx + ny * ny <= radius * radius;
};

const render = ({ size, maskable }) => {
    const star = starPolygon(size / 2, size / 2, size * STAR_RADIUS);
    const radius = size * CORNER_RADIUS;
    const rgba = Buffer.alloc(size * size * 4);
    const samples = SUPERSAMPLE * SUPERSAMPLE;
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            let background = 0;
            let foreground = 0;
            for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
                for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
                    const px = x + (sx + 0.5) / SUPERSAMPLE;
                    const py = y + (sy + 0.5) / SUPERSAMPLE;
                    if (maskable || insideRoundedSquare(size, radius, px, py)) {
                        background += 1;
                        if (insidePolygon(star, px, py)) {
                            foreground += 1;
                        }
                    }
                }
            }
            const alpha = background / samples;
            const mix = background === 0 ? 0 : foreground / background;
            const offset = (y * size + x) * 4;
            for (let c = 0; c < 3; c += 1) {
                rgba[offset + c] = Math.round(TURQUOISE[c] + (BUTTER[c] - TURQUOISE[c]) * mix);
            }
            rgba[offset + 3] = Math.round(alpha * 255);
        }
    }
    return encodePng(size, rgba);
};

for (const icon of ICONS) {
    const target = join(ROOT, icon.file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, render(icon));
    console.log(`${icon.file} (${icon.size}px${icon.maskable ? ', maskable' : ''})`);
}
