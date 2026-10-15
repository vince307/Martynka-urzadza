// Small rooms for unit tests: the shape of a RoomDef without the geometry of a real room.
import type { RoomDef, SlotDef } from '../src/core/types';

export const testSlot = (id: string, z: number): SlotDef => ({
    id, x: 0, y: 0, width: 100, height: 100, z, anchor: [50, 90], visibleRect: [10, 10, 80, 80], variants: ['a', 'b', 'c'],
});

/** The parts of a RoomDef a test does not care about: its four scene pictures and no decoration. */
export const TEST_ROOM_PARTS: Pick<RoomDef, 'scene' | 'decor'> = {
    scene: { before: 'b', after: 'a', furnishingsBefore: 'f', shadows: 's' },
    decor: [],
};
