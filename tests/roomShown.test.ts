// Shown look of a slot (S-16d phase 1). Oracle: author decision 2026-10-15 - lamp, left plant and pouf show their old
// look from the renovation stage until bought; any other unbought slot shows nothing. Synthetic room, no salon data.
import { describe, expect, it } from 'vitest';
import { shownVariant, shownVariants } from '../src/core/rooms';
import type { RoomDef, RoomState, SlotDef } from '../src/core/types';

const slot = (id: string, extra: Partial<SlotDef> = {}): SlotDef => ({
    id, x: 0, y: 0, z: 1, visibleRect: [0, 0, 10, 10], variants: [`${id}-0`, `${id}-1`, `${id}-2`], ...extra,
}) as SlotDef;

const room: RoomDef = {
    id: 'test', name: 'Test',
    scene: { before: 'b', after: 'a', furnishingsBefore: 'f', shadows: 's' },
    decor: [],
    slots: [slot('lamp', { shownBeforePurchase: 0 }), slot('rug'), slot('pouf', { shownBeforePurchase: 1 })],
    tasks: [
        { kind: 'stage', id: 'paint', label: 'x', cost: 1 },
        { kind: 'slot', id: 'rug', slot: 'rug', label: 'x', cost: 1 },
        { kind: 'slot', id: 'lamp', slot: 'lamp', label: 'x', cost: 1 },
    ],
};
const st = (tasksDone: number, chosen: RoomState['chosen'] = {}): RoomState => ({ tasksDone, chosen });

describe('shownVariant', () => {
    it('shows nothing unbought before the stage task is done', () => {
        expect(shownVariant(room, st(0), 'lamp')).toBeNull();
        expect(shownVariants(room, st(0))).toEqual({});
    });
    it('after the stage the default slots show their old look and a plain slot shows nothing', () => {
        expect(shownVariant(room, st(1), 'lamp')).toBe(0);
        expect(shownVariant(room, st(1), 'pouf')).toBe(1);
        expect(shownVariant(room, st(1), 'rug')).toBeNull();
        expect(shownVariants(room, st(1))).toEqual({ lamp: 0, pouf: 1 });
    });
    it('a bought slot shows its chosen variant, also over a default', () => {
        expect(shownVariant(room, st(3, { lamp: 2, rug: 1 }), 'lamp')).toBe(2);
        expect(shownVariants(room, st(3, { lamp: 2, rug: 1 }))).toEqual({ lamp: 2, rug: 1, pouf: 1 });
    });
    it('an unknown slot id gives null and the input is not mutated', () => {
        const state = st(1, { rug: 0 });
        const copy = JSON.stringify([room, state]);
        expect(shownVariant(room, state, 'nope')).toBeNull();
        shownVariants(room, state);
        expect(JSON.stringify([room, state])).toBe(copy);
    });
});
