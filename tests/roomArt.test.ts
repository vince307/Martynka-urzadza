import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOM_ART } from '../src/data/roomArt';
import { SALON } from '../src/data/rooms';

const PUBLIC = join(__dirname, '..', 'public');
const ROOMS = join(PUBLIC, 'assets', 'rooms');

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

describe('room art table', () => {
    it('has 26 entries, each a WebP file of the tabled size', () => {
        expect(ROOM_ART).toHaveLength(26);
        for (const art of ROOM_ART) {
            expect(webpSize(readFileSync(join(PUBLIC, art.url))), art.url).toEqual({ width: art.width, height: art.height });
        }
    });

    it('leaves no file in public/assets/rooms without a table entry', () => {
        const tabled = ROOM_ART.map((art) => art.url.replace('assets/rooms/', ''));
        expect(filesUnder(ROOMS).sort()).toEqual([...tabled].sort());
    });

    it('has exactly the texture keys the salon data names, each once', () => {
        const wanted = [
            ...Object.values(SALON.scene),
            ...SALON.decor.map((layer) => layer.key),
            ...SALON.slots.flatMap((slot) => slot.variants),
        ];
        expect(ROOM_ART.map((art) => art.key).sort()).toEqual([...wanted].sort());
        expect(new Set(wanted).size).toBe(wanted.length);
    });

    it('labels every stand-in in Polish except the full-scene pictures', () => {
        for (const art of ROOM_ART) {
            const scene = Object.values(SALON.scene).includes(art.key);
            expect(art.label === '', art.key).toBe(scene);
            expect(art.label, art.key).not.toMatch(/[-/]/);
        }
    });

    it('weighs at most 1 400 000 bytes in total', () => {
        const total = ROOM_ART.reduce((sum, art) => sum + statSync(join(PUBLIC, art.url)).size, 0);
        expect(total).toBeLessThanOrEqual(1_400_000);
    });
});
