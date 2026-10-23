// The mode rule of the notebook backdrop (notebook-polish phase 3): the child's salon unless its scene picture is missing.
import { describe, expect, it } from 'vitest';
import { backdropMode } from '../src/core/backdrop';
import { emptyRoomState } from '../src/core/rooms';
import { miniaturePieces } from '../src/ui/widgets/RoomView';
import { FIRST_ROOM, ROOMS } from '../src/data/rooms';
import type { RoomState } from '../src/core/types';

const room = ROOMS[FIRST_ROOM];
const fresh: RoomState = emptyRoomState();
const renovated: RoomState = { tasksDone: 1, chosen: {} };
const everything = (state: RoomState): Set<string> => new Set(miniaturePieces(room, state).map((p) => p.key));

describe('backdropMode', () => {
    it('shows the salon when its scene picture is there, fresh and renovated', () => {
        expect(backdropMode(room, fresh, (k) => everything(fresh).has(k))).toBe('salon');
        expect(backdropMode(room, renovated, (k) => everything(renovated).has(k))).toBe('salon');
    });

    it('asks for the key RoomView draws first', () => {
        for (const state of [fresh, renovated]) {
            const first = miniaturePieces(room, state)[0].key;
            expect(backdropMode(room, state, (k) => k === first)).toBe('salon');
            expect(backdropMode(room, state, (k) => k !== first)).toBe('plain');
        }
    });

    it('is plain when the scene picture is missing', () => {
        expect(backdropMode(room, fresh, () => false)).toBe('plain');
        expect(backdropMode(room, renovated, (k) => k !== room.scene.after)).toBe('plain');
    });

    it('stays salon when only a slot picture is missing', () => {
        const slotKeys = new Set(room.slots.flatMap((s) => s.variants as readonly string[]));
        expect(backdropMode(room, renovated, (k) => !slotKeys.has(k))).toBe('salon');
    });
});
