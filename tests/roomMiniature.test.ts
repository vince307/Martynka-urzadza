import { describe, expect, it } from 'vitest';
import { miniaturePieces } from '../src/ui/widgets/RoomView';
import { shownVariants } from '../src/core/rooms';
import { SALON } from '../src/data/rooms';
import type { RoomState } from '../src/core/types';

const keys = (state: RoomState): string[] => miniaturePieces(SALON, state).map((p) => p.key);

describe('miniaturePieces', () => {
    it('shows the neglected room with its furnishings before the stage', () => {
        expect(keys({ tasksDone: 0, chosen: {} })).toEqual([SALON.scene.before, SALON.scene.furnishingsBefore]);
    });

    it('shows the renovated room with the decoration after the stage, without furnishings or shadows', () => {
        const k = keys({ tasksDone: 1, chosen: {} });
        expect(k[0]).toBe(SALON.scene.after);
        expect(k).toContain(SALON.decor[0].key);
        for (const id of ['lamp-table', 'plant-left', 'pouf']) expect(k).toContain(SALON.slots.find((s) => s.id === id)!.variants[0]);
        expect(k).not.toContain(SALON.scene.furnishingsBefore);
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
