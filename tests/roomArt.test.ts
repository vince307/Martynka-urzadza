import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOM_ART, ROOM_SCENE_FILES, roomArt } from '../src/data/roomArt';
import { ROOMS } from '../src/data/rooms';
import bridgeSnapshot from './fixtures/room-art-bridge.json';
import hangarSnapshot from './fixtures/room-art-hangar.json';
import kitchenSnapshot from './fixtures/room-art-kitchen.json';
import salonSnapshot from './fixtures/room-art-salon.json';

const PUBLIC = join(__dirname, '..', 'public');
const ROOMS_DIR = join(PUBLIC, 'assets', 'rooms');

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
    it('equals the snapshot of each room (the salon one taken before the per-room refactor, the kitchen one from the pack manifest)', () => {
        expect(roomArt(ROOMS.salon)).toEqual(salonSnapshot);
        expect(roomArt(ROOMS.kitchen)).toEqual(kitchenSnapshot);
        expect(roomArt(ROOMS.bridge)).toEqual(bridgeSnapshot);
        expect(roomArt(ROOMS.hangar)).toEqual(hangarSnapshot);
        expect(ROOM_ART).toEqual([...salonSnapshot, ...kitchenSnapshot, ...bridgeSnapshot, ...hangarSnapshot]);
    });

    it('has a scene-file row for every room of the data', () => {
        for (const id of Object.keys(ROOMS)) {
            expect(Object.keys(ROOM_SCENE_FILES), id).toContain(id);
        }
    });

    it('has 37 salon, 21 kitchen, 21 bridge and 21 hangar entries, each a WebP file of the tabled size', () => {
        expect(roomArt(ROOMS.salon)).toHaveLength(37);
        expect(roomArt(ROOMS.kitchen)).toHaveLength(21);
        expect(roomArt(ROOMS.bridge)).toHaveLength(21);
        expect(roomArt(ROOMS.hangar)).toHaveLength(21);
        for (const art of ROOM_ART) {
            expect(webpSize(readFileSync(join(PUBLIC, art.url))), art.url).toEqual({ width: art.width, height: art.height });
        }
    });

    it('leaves no file in public/assets/rooms without a table entry', () => {
        const tabled = ROOM_ART.map((art) => art.url.replace('assets/rooms/', ''));
        expect(filesUnder(ROOMS_DIR).sort()).toEqual([...tabled].sort());
    });

    it('has exactly the texture keys the salon data names, each once', () => {
        const wanted = Object.values(ROOMS).flatMap((room) => [
            ...Object.values(room.scene),
            ...room.decor.map((layer) => layer.key),
            ...room.slots.flatMap((slot) => slot.variants),
        ]);
        expect(ROOM_ART.map((art) => art.key).sort()).toEqual([...wanted].sort());
        expect(new Set(wanted).size).toBe(wanted.length);
    });

    it('labels every stand-in in Polish except the full-scene pictures', () => {
        for (const art of ROOM_ART) {
            const scene = Object.values(ROOMS).some((room) => Object.values(room.scene).includes(art.key));
            expect(art.label === '', art.key).toBe(scene);
            expect(art.label, art.key).not.toMatch(/[-/]/);
        }
    });

    it('weighs at most 1 550 000 bytes per room', () => {
        for (const room of Object.values(ROOMS)) {
            const total = roomArt(room).reduce((sum, art) => sum + statSync(join(PUBLIC, art.url)).size, 0);
            expect(total, room.id).toBeLessThanOrEqual(1_550_000);
        }
    });
});
