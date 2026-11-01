import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHOICE_ART } from '../src/data/choiceArt';
import { HOUSE_ART } from '../src/data/houseArt';
import { BUILDING_CHOICES } from '../src/data/houses';
import { ROOM_ART } from '../src/data/roomArt';
import { TASK_ART } from '../src/data/taskArt';
import { UI_ART } from '../src/data/uiArt';

const PUBLIC = join(__dirname, '..', 'public');
const CHOICE_DIR = join(PUBLIC, 'assets', 'choice');

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

describe('choice art table', () => {
    it('has a 720x480 WebP file for every entry', () => {
        expect(CHOICE_ART.map((a) => a.key).sort()).toEqual(['choice/house', 'choice/space']);
        for (const art of CHOICE_ART) {
            expect(webpSize(readFileSync(join(PUBLIC, art.url))), art.url).toEqual({ width: 720, height: 480 });
            expect([art.width, art.height], art.url).toEqual([720, 480]);
        }
    });

    it('has no orphan file in public/assets/choice', () => {
        const named = CHOICE_ART.map((a) => a.url.replace('assets/choice/', '')).sort();
        expect(readdirSync(CHOICE_DIR).sort()).toEqual(named);
    });

    it('keeps its keys apart from every other art table', () => {
        const others = new Set<string>([...TASK_ART, ...UI_ART, ...ROOM_ART, ...HOUSE_ART].map((a) => a.key));
        for (const art of CHOICE_ART) expect(others.has(art.key), art.key).toBe(false);
    });

    it('holds the art key of every building choice', () => {
        const keys = new Set(CHOICE_ART.map((a) => a.key));
        for (const choice of BUILDING_CHOICES) expect(keys.has(choice.art), choice.art).toBe(true);
    });

    it('weighs at most 130 000 B in all', () => {
        expect(CHOICE_ART.reduce((sum, a) => sum + statSync(join(PUBLIC, a.url)).size, 0)).toBeLessThanOrEqual(130_000);
    });
});

describe('choice art wiring', () => {
    const read = (file: string): string => readFileSync(join(__dirname, '..', 'src', 'scenes', file), 'utf8');
    it('queues the boot through bootGroups and judges no room on a fresh install', () => {
        const boot = read('BootScene.ts');
        expect(boot).toContain('bootQueue(bootGroups(this.placementNeeded()))');
        expect(boot).toContain('this.placementNeeded() ? [] : bootRoomArt');
    });
    it('loads the chosen room through the runtime loader when the HUD starts', () => {
        expect(read('UIScene.ts')).toMatch(/roomArtLoader[^\n]*\)\?\.ensure\(\[chosenRoom\]\)/);
    });
});
