// Salon data invariants (S-09 phase 2, test-plan risk #16 support). Oracle: PRD
// FR-016 (10 renovation tasks, cost 5-15 stars, one slot each), plan section 9
// (nothing distinguished by colour alone) and the room geometry in ROOM_LAYOUT.
import { describe, expect, it } from 'vitest';
import { pl } from '../src/data/pl';
import { balance } from '../src/data/balance';
import { ROOM_LAYOUT } from '../src/data/layout';
import { FIRST_ROOM, ROOMS, ROOM_ORDER, SALON, SALON_PLACEHOLDERS, captionAnchor } from '../src/data/rooms';
import { MIN_TOUCH_TARGET } from '../src/data/layout';

const BACKGROUND_SLOTS = ['floor', 'walls'];
const cleanRound = balance.round.length * balance.round.starPerTask + balance.round.cleanRoundBonus;

describe('salon data', () => {
    it('has ten slots and ten tasks, one task per slot', () => {
        expect(SALON.slots).toHaveLength(10);
        expect(SALON.tasks).toHaveLength(10);
        const slotIds = SALON.slots.map((s) => s.id);
        expect(new Set(slotIds).size).toBe(10);
        for (const task of SALON.tasks) expect(slotIds).toContain(task.slot);
        expect(new Set(SALON.tasks.map((t) => t.slot)).size).toBe(10);
        expect(new Set(SALON.tasks.map((t) => t.id)).size).toBe(10);
    });

    it('is registered as the first room', () => {
        expect(FIRST_ROOM).toBe('salon');
        expect(ROOMS[FIRST_ROOM]).toBe(SALON);
    });

    it('costs whole stars between 5 and 15, never falling, the first within one clean round', () => {
        const costs = SALON.tasks.map((t) => t.cost);
        for (const cost of costs) {
            expect(Number.isInteger(cost)).toBe(true);
            expect(cost).toBeGreaterThanOrEqual(5);
            expect(cost).toBeLessThanOrEqual(15);
        }
        for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1] ?? 0);
        expect(costs[0]).toBeLessThanOrEqual(cleanRound);
    });

    it('gives every slot a placeholder with three variants that differ by pattern, not colour alone', () => {
        for (const slot of SALON.slots) {
            const look = SALON_PLACEHOLDERS[slot.id];
            expect(look, slot.id).toBeDefined();
            expect(new Set(look?.variants.map((v) => v.pattern)).size, slot.id).toBe(3);
            expect(slot.variants).toHaveLength(3);
        }
        expect(Object.keys(SALON_PLACEHOLDERS).sort()).toEqual(SALON.slots.map((s) => s.id).sort());
    });

    it('keeps every slot inside the room area and furniture above the panel tray', () => {
        const { area, tray } = ROOM_LAYOUT;
        for (const slot of SALON.slots) {
            const look = SALON_PLACEHOLDERS[slot.id];
            const w = look?.width ?? 0;
            const h = look?.height ?? 0;
            expect(slot.x - w / 2, slot.id).toBeGreaterThanOrEqual(area.left);
            expect(slot.x + w / 2, slot.id).toBeLessThanOrEqual(area.left + area.width);
            expect(slot.y - h / 2, slot.id).toBeGreaterThanOrEqual(area.top);
            expect(slot.y + h / 2, slot.id).toBeLessThanOrEqual(area.top + area.height);
            if (!BACKGROUND_SLOTS.includes(slot.id)) expect(slot.y + h / 2, slot.id).toBeLessThanOrEqual(tray.top);
        }
    });

    it('splits the background at the wall line and draws it below the furniture', () => {
        const { area, wallBottom } = ROOM_LAYOUT;
        const walls = SALON.slots.find((s) => s.id === 'walls');
        const floor = SALON.slots.find((s) => s.id === 'floor');
        expect((walls?.y ?? 0) + (SALON_PLACEHOLDERS.walls?.height ?? 0) / 2).toBe(wallBottom);
        expect((floor?.y ?? 0) - (SALON_PLACEHOLDERS.floor?.height ?? 0) / 2).toBe(wallBottom);
        expect(wallBottom).toBeGreaterThan(area.top);
        expect(wallBottom).toBeLessThan(area.top + area.height);
        const furniture = SALON.slots.filter((s) => !BACKGROUND_SLOTS.includes(s.id));
        const maxBackground = Math.max(walls?.depth ?? 0, floor?.depth ?? 0);
        for (const slot of furniture) expect(slot.depth, slot.id).toBeGreaterThan(maxBackground);
    });

    it('has a non-empty child-facing label and caption for every task and slot', () => {
        expect(pl.room.name.length).toBeGreaterThan(0);
        for (const task of SALON.tasks) {
            const label = (pl.room.tasks as Record<string, string>)[task.label];
            expect(typeof label, task.label).toBe('string');
            expect(label?.trim().length, task.label).toBeGreaterThan(0);
        }
        for (const slot of SALON.slots) {
            const caption = (pl.room.slots as Record<string, string>)[slot.id];
            expect(typeof caption, slot.id).toBe('string');
            expect(caption?.trim().length, slot.id).toBeGreaterThan(0);
        }
    });

    it('writes the stars still missing as digits only', () => {
        expect(pl.room.short(3, 5)).toBe('masz 3/5');
        expect(pl.room.short(0, 15)).toBe('masz 0/15');
    });

    it('lists the salon first, then a teaser that unlocks after a listed room (FR-019)', () => {
        expect(ROOM_ORDER.length).toBeGreaterThanOrEqual(2);
        expect(ROOM_ORDER[0]).toMatchObject({ room: FIRST_ROOM });
        const ids = ROOM_ORDER.flatMap((e) => ('room' in e ? [e.room] : []));
        for (const id of ids) {
            expect(ROOMS[id], id).toBeDefined();
            expect(typeof (pl.room as { name: unknown }).name, id).toBe('string');
        }
        for (const entry of ROOM_ORDER) if (entry.unlockAfter !== undefined) expect(ids).toContain(entry.unlockAfter);
        expect(ROOM_ORDER.some((e) => 'teaser' in e)).toBe(true);
    });

    it('holds a child briefly (FR-018): shorter than the parent hold, above platform press thresholds, drift under half a target', () => {
        expect(balance.roomHold.holdMs).toBeLessThan(balance.parentSettings.holdMs);
        expect(balance.roomHold.holdMs).toBeGreaterThanOrEqual(500);
        expect(balance.roomHold.moveTolerance).toBeGreaterThan(0);
        expect(balance.roomHold.moveTolerance).toBeLessThan(MIN_TOUCH_TARGET / 2);
    });

    it('has the room-done and change-mode strings', () => {
        for (const text of [pl.room.done.title, pl.room.done.spoken, pl.room.done.teaser, pl.room.change.enter, pl.room.change.exit, pl.room.change.hint]) {
            expect(text.trim().length).toBeGreaterThan(0);
        }
    });

    it('keeps the salon captions apart from each other and inside the room area', () => {
        const { area, slot: slotLayout } = ROOM_LAYOUT;
        const boxes = SALON.slots.map((slot) => {
            const ph = SALON_PLACEHOLDERS[slot.id];
            if (!ph) throw new Error(slot.id);
            const text = (pl.room.slots as Record<string, string>)[slot.id] ?? '';
            const { x, y } = captionAnchor(slot, ph);
            const w = text.length * slotLayout.captionCharWidth;
            const h = 32;
            return { id: slot.id, left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
        });
        for (const b of boxes) {
            expect(b.left, b.id).toBeGreaterThanOrEqual(area.left);
            expect(b.right, b.id).toBeLessThanOrEqual(area.left + area.width);
            expect(b.top, b.id).toBeGreaterThanOrEqual(area.top);
            expect(b.bottom, b.id).toBeLessThanOrEqual(area.top + area.height);
        }
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i];
                const b = boxes[j];
                const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
                expect(apart, `${a.id} vs ${b.id}`).toBe(true);
            }
        }
    });
});
