import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bootRoomArt, roomArt } from '../src/data/roomArt';
import { FIRST_ROOM, ROOMS } from '../src/data/rooms';

describe('bootRoomArt', () => {
    it('gives the entries of the current room', () => {
        expect(bootRoomArt(FIRST_ROOM)).toEqual(roomArt(ROOMS[FIRST_ROOM]));
    });

    it('falls back to the first room for an unknown or missing id', () => {
        expect(bootRoomArt('nowhere')).toEqual(roomArt(ROOMS[FIRST_ROOM]));
        expect(bootRoomArt(undefined)).toEqual(roomArt(ROOMS[FIRST_ROOM]));
    });

    it('is wired into the boot preload: BootScene does not iterate ROOM_ART to queue files', () => {
        const source = readFileSync(join(__dirname, '..', 'src', 'scenes', 'BootScene.ts'), 'utf8');
        expect(source).not.toMatch(/of ROOM_ART\b/);
        expect(source).toMatch(/of bootRoomArt\(/);
    });
});
