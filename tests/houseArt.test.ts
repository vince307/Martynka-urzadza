import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOUSE_GEOMETRY } from '../src/data/houses';
import { HOUSE_ART } from '../src/data/houseArt';
import { ROOM_ART } from '../src/data/roomArt';
import { TASK_ART } from '../src/data/taskArt';
import { UI_ART } from '../src/data/uiArt';

const PUBLIC = join(__dirname, '..', 'public');
const HOUSE_DIR = join(PUBLIC, 'assets', 'house');

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

describe('house art table', () => {
    it('has a file of the stated pixel size for every entry (sizes from the pack manifest: 1920x1080, 608x342, 640x374)', () => {
        const expected: Record<string, [number, number]> = {
            'house/house-1-shell': [1920, 1080],
            'house/cell-closed': [608, 342],
            'house/cell-frame': [640, 374],
        };
        expect(HOUSE_ART.map((a) => a.key).sort()).toEqual(Object.keys(expected).sort());
        for (const art of HOUSE_ART) {
            const size = webpSize(readFileSync(join(PUBLIC, art.url)));
            expect(size, art.url).toEqual({ width: expected[art.key][0], height: expected[art.key][1] });
            expect([art.width, art.height], art.url).toEqual(expected[art.key]);
        }
    });

    it('has no orphan file in public/assets/house', () => {
        const named = HOUSE_ART.map((a) => a.url.replace('assets/house/', '')).sort();
        expect(readdirSync(HOUSE_DIR).sort()).toEqual(named);
    });

    it('keeps its keys apart from the task, UI and room tables', () => {
        const others = new Set<string>([...TASK_ART.map((a) => a.key), ...UI_ART.map((a) => a.key), ...ROOM_ART.map((a) => a.key)]);
        for (const art of HOUSE_ART) {
            expect(others.has(art.key), art.key).toBe(false);
        }
    });

    it('holds every art key the house geometry names', () => {
        const keys = new Set(HOUSE_ART.map((a) => a.key));
        for (const geometry of Object.values(HOUSE_GEOMETRY)) {
            for (const key of [geometry.shell, geometry.cellClosed, geometry.cellFrame]) {
                expect(keys.has(key), key).toBe(true);
            }
        }
    });

    it('weighs at most 80 000 B in all', () => {
        const total = HOUSE_ART.reduce((sum, a) => sum + statSync(join(PUBLIC, a.url)).size, 0);
        expect(total).toBeLessThanOrEqual(80_000);
    });

    it('is not loaded by BootScene (the boot budget stays as it was)', () => {
        const boot = readFileSync(join(__dirname, '..', 'src', 'scenes', 'BootScene.ts'), 'utf8');
        expect(boot).not.toContain('HOUSE_ART');
        expect(boot).not.toContain('houseArt');
    });
});
