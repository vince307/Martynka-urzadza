// Salon data invariants (S-09 phase 2, test-plan risk #16 support). Oracle: PRD
// FR-016 (10 renovation tasks, cost 5-15 stars, one slot each), plan section 9
// (nothing distinguished by colour alone) and the room geometry in ROOM_LAYOUT.
import { describe, expect, it } from 'vitest';
import { pl, roomText } from '../src/data/pl';
import { balance } from '../src/data/balance';
import { ROOM_LAYOUT } from '../src/data/layout';
import { FIRST_ROOM, ROOMS, ROOM_ORDER, SALON, SALON_PLACEHOLDERS, captionAnchor } from '../src/data/rooms';
import { MIN_TOUCH_TARGET } from '../src/data/layout';
import { slotBox } from '../src/core/roomHit';

const BACKGROUND_SLOTS = ['floor', 'walls'];
const cleanRound = balance.round.length * balance.round.starPerTask + balance.round.cleanRoundBonus;

// Every registered room, not only the salon (M-R5, L-R10): a second room must not slip past the invariants.
describe('every room in ROOMS', () => {
    const rooms = Object.values(ROOMS);

    it('is keyed by its own id and listed in ROOM_ORDER', () => {
        expect(rooms.length).toBeGreaterThan(0);
        for (const [key, room] of Object.entries(ROOMS)) expect(room.id).toBe(key);
        const listed = ROOM_ORDER.flatMap((e) => ('room' in e ? [e.room] : []));
        expect([...listed].sort()).toEqual(Object.keys(ROOMS).sort());
    });

    it('has one task per slot, whole costs of 5-15 stars that never fall, the first within one clean round', () => {
        for (const room of rooms) {
            const slotIds = room.slots.map((s) => s.id);
            expect(new Set(slotIds).size, room.id).toBe(slotIds.length);
            expect(room.tasks, room.id).toHaveLength(slotIds.length);
            expect(new Set(room.tasks.map((t) => t.slot)).size, room.id).toBe(slotIds.length);
            for (const task of room.tasks) expect(slotIds, room.id).toContain(task.slot);
            let previous = 0;
            for (const { cost } of room.tasks) {
                expect(Number.isInteger(cost), room.id).toBe(true);
                expect(cost, room.id).toBeGreaterThanOrEqual(5);
                expect(cost, room.id).toBeLessThanOrEqual(15);
                expect(cost, room.id).toBeGreaterThanOrEqual(previous);
                previous = cost;
            }
            expect(room.tasks[0]?.cost ?? 0, room.id).toBeLessThanOrEqual(cleanRound);
        }
    });

    it('gives every slot a placeholder (M-R5)', () => {
        for (const room of rooms) {
            for (const slot of room.slots) expect(SALON_PLACEHOLDERS[slot.id], `${room.id}/${slot.id}`).toBeDefined();
        }
    });

    it('has child-facing text for every slot and task (L-R10)', () => {
        for (const room of rooms) {
            for (const slot of room.slots) expect(roomText.slot(slot.id)?.trim().length ?? 0, `${room.id}/${slot.id}`).toBeGreaterThan(0);
            for (const task of room.tasks) expect(roomText.task(task.label)?.trim().length ?? 0, `${room.id}/${task.label}`).toBeGreaterThan(0);
        }
    });
});

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

    // Visual gate S-10: the rug caption at the slot centre sat on the sofa (drawn later, higher depth), so "dywan"
    // read as a label of the sofa. A caption must stay clear of every slot drawn above its own.
    it('keeps every salon caption off the slots drawn above its slot', () => {
        const { slot: slotLayout } = ROOM_LAYOUT;
        for (const slot of SALON.slots) {
            const ph = SALON_PLACEHOLDERS[slot.id];
            if (!ph) throw new Error(slot.id);
            const text = (pl.room.slots as Record<string, string>)[slot.id] ?? '';
            const { x, y } = captionAnchor(slot, ph);
            const w = text.length * slotLayout.captionCharWidth;
            const h = 32;
            const cap = { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
            for (const above of SALON.slots.filter((s) => s.depth > slot.depth)) {
                const size = SALON_PLACEHOLDERS[above.id];
                if (!size) throw new Error(above.id);
                const b = slotBox(above, size);
                const apart = cap.right <= b.left || b.right <= cap.left || cap.bottom <= b.top || b.bottom <= cap.top;
                expect(apart, `${slot.id} caption under ${above.id}`).toBe(true);
            }
        }
    });
});
