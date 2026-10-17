// Slot hit-testing (S-10, S-16a): one rectangle helper shared by touch and drawing, so what the child sees and what
// answers a touch cannot drift apart. A slot's rectangle is the `visibleRect` of its picture in the scene; the highest
// `z` wins, and a transparent pixel of a picture lets the touch through to the piece below.
import { balance } from '../data/balance';
import { ROOM_LAYOUT } from '../data/layout';
import type { RoomDef, SlotDef } from './types';

export interface Point { x: number; y: number }
export interface Box { left: number; top: number; right: number; bottom: number }
/** Alpha (0-255) of the slot's picture at a point given in the picture's own pixels; null = no picture to ask (the rectangle alone counts). */
export type AlphaAt = (slotId: string, localX: number, localY: number) => number | null;

/** Rectangle of the object in scene space: the picture's `visibleRect` moved to the picture's position. */
export function slotBox(slot: SlotDef): Box {
    const [l, t, w, h] = slot.visibleRect;
    return { left: slot.x + l, top: slot.y + t, right: slot.x + l + w, bottom: slot.y + t + h };
}

const inside = (b: Box, p: Point): boolean => p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom;

/** Furnished slot under the point: highest `z` wins, a tie goes to the later slot; a transparent pixel of a picture lets the touch through to the next one. */
export function slotAt(
    room: RoomDef, chosen: Readonly<Record<string, number>>, point: Point, alphaAt?: AlphaAt,
): string | null {
    let best: SlotDef | null = null;
    for (const slot of room.slots) {
        if (chosen[slot.id] === undefined) continue;
        if (!inside(slotBox(slot), point)) continue;
        const alpha = alphaAt?.(slot.id, point.x - slot.x, point.y - slot.y) ?? null;
        if (alpha !== null && alpha < balance.roomHit.minAlpha) continue;
        if (!best || slot.z >= best.z) best = slot;
    }
    return best?.id ?? null;
}

/**
 * A point (grid of `step` px inside the slot rectangle) where `slotAt` returns this slot with a margin of `step / 2`
 * on every side, inside the scene rectangle; null if none. The margin matters: a real touch on the scaled canvas lands a pixel or so off the asked
 * point (520 game px is 346.67 page px at 1280 wide), so a point on the slot's edge can miss it.
 */
export function holdPoint(
    room: RoomDef, chosen: Readonly<Record<string, number>>, slotId: string, step = 20, alphaAt?: AlphaAt,
): Point | null {
    const slot = room.slots.find((s) => s.id === slotId);
    if (!slot || chosen[slotId] === undefined) return null;
    const m = step / 2;
    // A picture may start above the scene (the curtains): scan only the part a finger can reach, inside the scene by the margin.
    const full = slotBox(slot);
    const sc = ROOM_LAYOUT.scene;
    const box: Box = {
        left: Math.max(full.left, sc.left + m), top: Math.max(full.top, sc.top + m),
        right: Math.min(full.right, sc.left + sc.width - m), bottom: Math.min(full.bottom, sc.top + sc.height - m),
    };
    const near = [-m, 0, m];
    const clear = (x: number, y: number): boolean =>
        near.every((dx) => near.every((dy) => slotAt(room, chosen, { x: x + dx, y: y + dy }, alphaAt) === slotId));
    for (let y = box.top; y <= box.bottom; y += step) {
        for (let x = box.left; x <= box.right; x += step) {
            if (clear(x, y)) return { x, y };
        }
    }
    return null;
}

/** Chosen slots that have no hold point (a finger cannot reach them), for the e2e hook and the log. */
export function unreachableSlots(
    room: RoomDef, chosen: Readonly<Record<string, number>>, alphaAt?: AlphaAt,
): string[] {
    return room.slots
        .filter((s) => chosen[s.id] !== undefined && holdPoint(room, chosen, s.id, undefined, alphaAt) === null)
        .map((s) => s.id);
}
