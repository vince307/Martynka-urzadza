import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOM_ART } from '../src/data/roomArt';
import { TASK_ART } from '../src/data/taskArt';
import { UI_ART, UI_ART_KEYS } from '../src/data/uiArt';

const PUBLIC = join(__dirname, '..', 'public');

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

describe('UI art table', () => {
    it('has no orphan file in public/assets/ui that the table does not name', () => {
        const tabled = new Set(UI_ART.map((art) => art.url.replace('assets/ui/', '')));
        expect(readdirSync(join(PUBLIC, 'assets', 'ui')).filter((name) => !tabled.has(name))).toEqual([]);
    });

    it('has a WebP file of the tabled size for every entry', () => {
        expect(UI_ART).toHaveLength(5);
        for (const art of UI_ART) {
            const bytes = readFileSync(join(PUBLIC, art.url));
            expect(webpSize(bytes), art.url).toEqual({ width: art.width, height: art.height });
        }
    });

    it('names every texture ui/<file> after its path, unique, with a map entry per id', () => {
        for (const art of UI_ART) {
            expect(art.url, art.key).toBe(`assets/${art.key}.webp`);
            expect(UI_ART_KEYS[art.id]).toBe(art.key);
        }
        expect(new Set(UI_ART.map((art) => art.key)).size).toBe(UI_ART.length);
        expect(Object.keys(UI_ART_KEYS).sort()).toEqual(UI_ART.map((art) => art.id).sort());
    });

    it('keeps its keys disjoint from the task and room art', () => {
        const others = new Set([...TASK_ART, ...ROOM_ART].map((art) => art.key));
        for (const art of UI_ART) {
            expect(others.has(art.key), art.key).toBe(false);
        }
    });

    it('labels stand-ins in Polish, never with a file name', () => {
        for (const art of UI_ART) {
            expect(art.label, art.id).not.toContain('-');
            expect(art.label, art.id).not.toMatch(/[A-Z]/);
        }
    });
});
