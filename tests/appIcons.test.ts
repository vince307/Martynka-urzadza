import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

/** Width and height from the PNG IHDR chunk. */
function pngSize(path: string): [number, number] {
    const bytes = readFileSync(join(ROOT, path));
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

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

    it('icon-512 is the pack art, not the generated placeholder', () => {
        expect(statSync(join(ROOT, 'public/icons/icon-512.png')).size).toBeGreaterThan(100 * 1024);
    });

    it('every manifest icon exists under public/', () => {
        const config = readFileSync(join(ROOT, 'vite/config.shared.mjs'), 'utf8');
        // Relative to the manifest (the game is served under /graj/), so no leading "/".
        const sources = [...config.matchAll(/src:\s*'(icons\/[^']+)'/g)].map((m) => m[1]);
        expect(sources.length).toBeGreaterThanOrEqual(3);
        for (const src of sources) expect(existsSync(join(ROOT, 'public', src))).toBe(true);
    });
});
