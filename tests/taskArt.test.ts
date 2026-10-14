import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COIN_IDS, ICONS, JUGS, NOTE_IDS, WEIGHTS } from '../src/data/measures';
import { TASK_ART } from '../src/data/taskArt';

const PUBLIC = join(__dirname, '..', 'public');
const TASKS = join(PUBLIC, 'assets', 'tasks');

/** Width and height from a WebP header (lossy VP8, lossless VP8L or extended VP8X); null when it is no WebP. */
const webpSize = (bytes: Buffer): { width: number; height: number } | null => {
    if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
        return null;
    }
    const kind = bytes.toString('ascii', 12, 16);
    if (kind === 'VP8X') {
        return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
    }
    if (kind === 'VP8 ') {
        return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    }
    if (kind === 'VP8L') {
        const bits = bytes.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
};

const filesUnder = (dir: string, base = ''): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? filesUnder(join(dir, entry.name), `${base}${entry.name}/`) : [`${base}${entry.name}`],
    );

describe('task art table', () => {
    it('has a WebP file of the tabled size for every entry', () => {
        for (const art of TASK_ART) {
            const bytes = readFileSync(join(PUBLIC, art.url));
            expect(webpSize(bytes), art.url).toEqual({ width: art.width, height: art.height });
        }
    });

    it('names every texture after its file path without the extension', () => {
        for (const art of TASK_ART) {
            expect(art.url, art.key).toBe(`assets/${art.key}.webp`);
        }
        expect(new Set(TASK_ART.map((art) => art.key)).size).toBe(TASK_ART.length);
    });

    it('leaves no file in public/assets/tasks without a table entry', () => {
        const tabled = new Set(TASK_ART.map((art) => art.url.replace('assets/tasks/', '')));
        expect(filesUnder(TASKS).sort()).toEqual([...tabled].sort());
    });

    it('has a texture for every money, weight, jug and icon id and the scale and thermometer frame', () => {
        const keys = new Set(TASK_ART.map((art) => art.key));
        const ids = [
            ...[...COIN_IDS, ...NOTE_IDS].map((id) => `tasks/money/${id}`),
            ...[...WEIGHTS, ...JUGS].map(({ id }) => `tasks/measuring/${id}`),
            ...ICONS.map(({ id }) => `tasks/icons/${id}`),
            'tasks/measuring/balance-scale',
            'tasks/measuring/thermometer-frame',
        ];
        expect(TASK_ART).toHaveLength(38);
        for (const id of ids) {
            expect(keys.has(id), id).toBe(true);
        }
    });

    it('keeps the whole set under 1 MB', () => {
        const total = TASK_ART.reduce((sum, art) => sum + statSync(join(PUBLIC, art.url)).size, 0);
        expect(total).toBeLessThan(1_000_000);
    });
});
