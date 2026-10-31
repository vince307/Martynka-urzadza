import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

/** Width and height from the PNG IHDR chunk. */
function pngSize(path: string): [number, number] {
    const bytes = readFileSync(join(ROOT, path));
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

/** RGBA pixel at (x, y) of an 8-bit RGBA, non-interlaced PNG (what scripts/make-icons.py writes). */
function pngPixel(path: string, x: number, y: number): number[] {
    const bytes = readFileSync(join(ROOT, path));
    const [width, height] = pngSize(path);
    expect([bytes[24], bytes[25], bytes[28]]).toEqual([8, 6, 0]);
    const chunks: Buffer[] = [];
    for (let at = 8; at < bytes.length; ) {
        const length = bytes.readUInt32BE(at);
        if (bytes.subarray(at + 4, at + 8).toString('ascii') === 'IDAT') chunks.push(bytes.subarray(at + 8, at + 8 + length));
        at += 12 + length;
    }
    const raw = inflateSync(Buffer.concat(chunks));
    const stride = width * 4;
    const rows: Buffer[] = [];
    for (let row = 0; row <= y && row < height; row += 1) {
        const filter = raw[row * (stride + 1)];
        const line = Buffer.from(raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1)));
        const up = rows[row - 1];
        for (let i = 0; i < stride; i += 1) {
            const a = i >= 4 ? line[i - 4] : 0;
            const b = up ? up[i] : 0;
            const c = up && i >= 4 ? up[i - 4] : 0;
            const p = a + b - c;
            const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
            const predictor = [0, a, b, (a + b) >> 1, paeth][filter];
            line[i] = (line[i] + predictor) & 0xff;
        }
        rows.push(line);
    }
    return [...rows[y].subarray(x * 4, x * 4 + 4)];
}

const LOGO_GREEN = [0x34, 0x66, 0x50, 255];

describe('app icons', () => {
    it.each([
        ['public/icons/icon-192.png', 192],
        ['public/icons/icon-512.png', 512],
        ['public/icons/icon-maskable-512.png', 512],
        ['public/icons/apple-touch-icon-180.png', 180],
        ['public/favicon.png', 48],
    ])('%s is %i px square', (path, side) => {
        expect(pngSize(path)).toEqual([side, side]);
    });

    it('icon-512 is the Bystrow logo: a green rounded square on a transparent corner', () => {
        expect(pngPixel('public/icons/icon-512.png', 2, 2)[3]).toBe(0);
        expect(pngPixel('public/icons/icon-512.png', 256, 435)).toEqual(LOGO_GREEN);
    });

    it.each(['public/icons/icon-maskable-512.png', 'public/icons/apple-touch-icon-180.png'])(
        '%s is logo green to the edges (masked by Android, rounded by iOS)',
        (path) => {
            expect(pngPixel(path, 1, 1)).toEqual(LOGO_GREEN);
        },
    );

    it('every manifest icon exists under public/', () => {
        const config = readFileSync(join(ROOT, 'vite/config.shared.mjs'), 'utf8');
        // Relative to the manifest (the game is served under /graj/), so no leading "/".
        const sources = [...config.matchAll(/src:\s*'(icons\/[^']+)'/g)].map((m) => m[1]);
        expect(sources.length).toBeGreaterThanOrEqual(3);
        for (const src of sources) expect(existsSync(join(ROOT, 'public', src))).toBe(true);
    });
});
