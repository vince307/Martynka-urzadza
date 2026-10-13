// Slot hit-testing (S-10): one rectangle helper shared by touch and drawing,
// so what the child sees and what answers a touch cannot drift apart.
import type { RoomDef, SlotDef } from './types';

export interface Point { x: number; y: number }
export interface Box { left: number; top: number; right: number; bottom: number }
export type SlotSizes = Record<string, { width: number; height: number }>;

/** Slot rectangle: its position is the centre. */
export function slotBox(slot: SlotDef, size: { width: number; height: number }): Box {
    return {
        left: slot.x - size.width / 2,
        top: slot.y - size.height / 2,
        right: slot.x + size.width / 2,
        bottom: slot.y + size.height / 2,
    };
}

const inside = (b: Box, p: Point): boolean => p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom;

/** Furnished slot under the point: highest depth wins, a tie goes to the later slot. */
export function slotAt(
    room: RoomDef, sizes: SlotSizes, chosen: Readonly<Record<string, number>>, point: Point,
): string | null {
    let best: SlotDef | null = null;
    for (const slot of room.slots) {
        const size = sizes[slot.id];
        if (!size || chosen[slot.id] === undefined) continue;
        if (!inside(slotBox(slot, size), point)) continue;
        if (!best || slot.depth >= best.depth) best = slot;
    }
    return best?.id ?? null;
}

/**
 * A point (grid of `step` px inside the slot rectangle) where `slotAt` returns this slot with a margin of `step / 2`
 * on every side; null if none. The margin matters: a real touch on the scaled canvas lands a pixel or so off the asked
 * point (520 game px is 346.67 page px at 1280 wide), so a point on the slot's edge can miss it.
 */
export function holdPoint(
    room: RoomDef, sizes: SlotSizes, chosen: Readonly<Record<string, number>>, slotId: string, step = 20,
): Point | null {
    const slot = room.slots.find((s) => s.id === slotId);
    const size = sizes[slotId];
    if (!slot || !size || chosen[slotId] === undefined) return null;
    const box = slotBox(slot, size);
    const m = step / 2;
    const near = [-m, 0, m];
    const clear = (x: number, y: number): boolean =>
        near.every((dx) => near.every((dy) => slotAt(room, sizes, chosen, { x: x + dx, y: y + dy }) === slotId));
    for (let y = box.top; y <= box.bottom; y += step) {
        for (let x = box.left; x <= box.right; x += step) {
            if (clear(x, y)) return { x, y };
        }
    }
    return null;
}
