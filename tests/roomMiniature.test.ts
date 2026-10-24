import { describe, expect, it } from 'vitest';
import { miniaturePieces } from '../src/ui/widgets/RoomView';
import { shownVariants } from '../src/core/rooms';
import { SALON } from '../src/data/rooms';
import type { RoomState } from '../src/core/types';

const keys = (state: RoomState): string[] => miniaturePieces(SALON, state).map((p) => p.key);

describe('miniaturePieces', () => {
    it('shows the neglected room with the shadows and the graded worn set, all invisible stand-ins, before the stage', () => {
        const pieces = miniaturePieces(SALON, { tasksDone: 0, chosen: {} });
        expect(pieces.map((p) => p.key)).toEqual([
            'salon/before', 'salon/shadows',
            'salon/wall-frames', 'salon/rug', 'salon/cabinet', 'salon/lamp-table', 'salon/plant-left',
            'salon/sofa-morska', 'salon/plant-right', 'salon/armchair', 'salon/coffee-table', 'salon/pouf',
        ]);
        expect(pieces.slice(1).every((p) => p.alpha === 0)).toBe(true);
        expect(pieces[0].worn).toBeUndefined();
        expect(pieces[1].worn).toBeUndefined();
        expect(pieces.slice(2).map((p) => p.worn?.soft)).toEqual([false, true, false, false, false, true, false, true, false, true]);
    });

    it('shows the renovated room with the decoration after the stage, without furnishings or shadows', () => {
        const k = keys({ tasksDone: 1, chosen: {} });
        expect(k[0]).toBe(SALON.scene.after);
        expect(k).toContain(SALON.decor[0].key);
        for (const id of ['lamp-table', 'plant-left', 'pouf']) expect(k).toContain(SALON.slots.find((s) => s.id === id)!.variants[0]);
        expect(k).not.toContain(SALON.scene.shadows);
    });

    it('draws a bought piece by its chosen variant, ordered by z, and the shadows only for a finished room', () => {
        const chosen = Object.fromEntries(SALON.slots.map((s) => [s.id, 2 as const]));
        const done = miniaturePieces(SALON, { tasksDone: SALON.tasks.length, chosen });
        expect(done.map((p) => p.key)).toContain(SALON.scene.shadows);
        const slotKeys = done.map((p) => p.key).filter((k) => SALON.slots.some((s) => s.variants.includes(k)));
        const zs = slotKeys.map((k) => SALON.slots.find((s) => s.variants.includes(k))!.z);
        expect(zs).toEqual([...zs].sort((a, b) => a - b));
        expect(slotKeys).toHaveLength(SALON.slots.length);
        const sofa = SALON.slots[0];
        expect(slotKeys).toContain(sofa.variants[2]);
    });

    it('draws exactly the shown slots, in z order, for a renovated state', () => {
        const state: RoomState = { tasksDone: 1, chosen: { [SALON.slots[0].id]: 1 } };
        const shown = shownVariants(SALON, state);
        const expected = SALON.slots
            .filter((s) => shown[s.id] !== undefined)
            .sort((a, b) => a.z - b.z)
            .map((s) => s.variants[shown[s.id]]);
        const slotKeys = keys(state).filter((k) => SALON.slots.some((s) => s.variants.includes(k)));
        expect(slotKeys).toEqual(expected);
    });
});
