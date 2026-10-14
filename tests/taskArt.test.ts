import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatMoney } from '../src/core/text/measure';
import { COIN_IDS, ICONS, JUGS, MONEY, NOTE_IDS, WEIGHTS } from '../src/data/measures';
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

    it('carries the measures.ts id of every entry, unique, and the key ends with it', () => {
        const known = new Set<string>([
            ...COIN_IDS,
            ...NOTE_IDS,
            ...WEIGHTS.map(({ id }) => id),
            ...JUGS.map(({ id }) => id),
            ...ICONS.map(({ id }) => id),
            'balance-scale',
            'thermometer-frame',
        ]);
        for (const art of TASK_ART) {
            expect(known.has(art.id), art.id).toBe(true);
            expect(art.key.endsWith(`/${art.id}`), art.key).toBe(true);
        }
        expect(new Set(TASK_ART.map((art) => art.id)).size).toBe(TASK_ART.length);
    });

    it('labels every stand-in in Polish from the data, never with the file id', () => {
        const byId = new Map(TASK_ART.map((art) => [art.id, art.label]));
        for (const { id, grosze } of MONEY) {
            expect(byId.get(id), id).toBe(formatMoney(grosze));
        }
        for (const { id, label } of [...WEIGHTS, ...JUGS]) {
            expect(byId.get(id), id).toBe(label);
        }
        for (const { id, noun } of ICONS) {
            expect(byId.get(id), id).toBe(noun);
        }
        const empty = TASK_ART.filter((art) => art.label === '').map((art) => art.id);
        expect(empty.sort()).toEqual(['balance-scale', 'thermometer-frame']);
        for (const art of TASK_ART.filter((entry) => entry.label !== '')) {
            expect(art.label, art.id).not.toBe(art.id);
            expect(art.label, art.id).not.toContain('-');
            expect(art.label, art.id).not.toMatch(/coin|note|weight|container/);
        }
    });

    it('keeps the whole set under 1 MB', () => {
        const total = TASK_ART.reduce((sum, art) => sum + statSync(join(PUBLIC, art.url)).size, 0);
        expect(total).toBeLessThan(1_000_000);
    });
});
