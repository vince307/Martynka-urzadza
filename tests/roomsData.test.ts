// Salon data invariants (S-09 phase 2, S-16a phase 3; test-plan risk #16 support). Oracle: PRD FR-016 (renovation tasks,
// cost 5-15 stars), plan section 9 (nothing distinguished by colour alone: a variant has a name and a colour) and the
// art pack's manifest (1920x1080 scene, six furniture slots with three variants, four fixed layers).
import { describe, expect, it } from 'vitest';
import { LEGACY_SALON_V2 } from '../src/core/migrations/legacySalon';
import { pl, roomText } from '../src/data/pl';
import { balance } from '../src/data/balance';
import { ROOM_LAYOUT } from '../src/data/layout';
import { FIRST_ROOM, ROOMS, SALON } from '../src/data/rooms';
import { FIRST_HOUSE } from '../src/data/houses';
import { houseRoomList, nextRoom, roomInRenovation } from '../src/core/house';
import { HOUSE_V5 } from '../src/core/migrations/house';
import { GAME_HEIGHT, GAME_WIDTH, MIN_TOUCH_TARGET } from '../src/data/layout';

const cleanRound = balance.round.length * balance.round.starPerTask + balance.round.cleanRoundBonus;

// Every registered room, not only the salon (M-R5, L-R10): a second room must not slip past the invariants.
describe('every room in ROOMS', () => {
    const rooms = Object.values(ROOMS);

    it('is keyed by its own id and placed in the first house', () => {
        expect(rooms.length).toBeGreaterThan(0);
        for (const [key, room] of Object.entries(ROOMS)) expect(room.id).toBe(key);
        const placed = FIRST_HOUSE.rooms.map((c) => c.room);
        for (const id of Object.keys(ROOMS)) expect(placed, id).toContain(id);
    });

    it('has one furniture task per slot, whole costs of 5-15 stars, the first within one clean round', () => {
        for (const room of rooms) {
            const slotIds = room.slots.map((s) => s.id);
            expect(new Set(slotIds).size, room.id).toBe(slotIds.length);
            const bought = room.tasks.flatMap((t) => (t.kind === 'slot' ? [t.slot] : []));
            expect([...bought].sort(), room.id).toEqual([...slotIds].sort());
            expect(new Set(room.tasks.map((t) => t.id)).size, room.id).toBe(room.tasks.length);
            for (const { cost } of room.tasks) {
                expect(Number.isInteger(cost), room.id).toBe(true);
                expect(cost, room.id).toBeGreaterThanOrEqual(5);
                expect(cost, room.id).toBeLessThanOrEqual(15);
            }
            expect(room.tasks[0]?.cost ?? 0, room.id).toBeLessThanOrEqual(cleanRound);
        }
    });

    it('has child-facing text for every slot, variant, decoration and task (L-R10)', () => {
        for (const room of rooms) {
            for (const slot of room.slots) {
                expect(roomText.slot(slot.id)?.trim().length ?? 0, `${room.id}/${slot.id}`).toBeGreaterThan(0);
                const names = [0, 1, 2].map((i) => roomText.variant(slot.id, i));
                for (const name of names) expect(name?.trim().length ?? 0, `${room.id}/${slot.id} variant`).toBeGreaterThan(0);
                expect(new Set(names).size, `${room.id}/${slot.id} variant names differ`).toBe(3);
            }
            for (const layer of room.decor) expect(roomText.decor(layer.id)?.trim().length ?? 0, `${room.id}/${layer.id}`).toBeGreaterThan(0);
            for (const task of room.tasks) expect(roomText.task(task.label)?.trim().length ?? 0, `${room.id}/${task.label}`).toBeGreaterThan(0);
        }
    });

    it('draws every piece inside the scene, in its picture, on a distinct depth below the controls band', () => {
        for (const room of rooms) {
            const pieces = [...room.slots, ...room.decor];
            for (const p of pieces) {
                const [l, t, w, h] = p.visibleRect;
                expect(l, p.id).toBeGreaterThanOrEqual(0);
                expect(t, p.id).toBeGreaterThanOrEqual(0);
                expect(l + w, p.id).toBeLessThanOrEqual(p.width);
                expect(t + h, p.id).toBeLessThanOrEqual(p.height);
                expect(p.x + l, p.id).toBeGreaterThanOrEqual(0);
                // Only the curtains may reach above the scene (pack curtainEdit.note); at least half stays inside.
                if (p.id === 'curtains') expect(p.y + t + h / 2, p.id).toBeGreaterThanOrEqual(0);
                else expect(p.y + t, p.id).toBeGreaterThanOrEqual(0);
                expect(p.x + l + w, p.id).toBeLessThanOrEqual(GAME_WIDTH);
                expect(p.y + t + h, p.id).toBeLessThanOrEqual(GAME_HEIGHT);
                expect(p.anchor[0], p.id).toBeLessThanOrEqual(p.width);
                expect(p.anchor[1], p.id).toBeLessThanOrEqual(p.height);
                expect(p.z, p.id).toBeLessThan(ROOM_LAYOUT.depth.outline);
            }
            expect(new Set(pieces.map((p) => p.z)).size, `${room.id} z values are distinct, so a tie never decides a touch`).toBe(pieces.length);
        }
    });

    it('names every texture once, under the room id', () => {
        for (const room of rooms) {
            const keys = [
                ...Object.values(room.scene),
                ...room.decor.map((l) => l.key),
                ...room.slots.flatMap((s) => s.variants),
            ];
            expect(new Set(keys).size, room.id).toBe(keys.length);
            for (const key of keys) expect(key.startsWith(`${room.id}/`), key).toBe(true);
        }
    });
});

describe('salon data', () => {
    it('is the renovation stage first, then one furniture task per slot', () => {
        expect(SALON.slots).toHaveLength(11);
        expect(SALON.decor).toHaveLength(1);
        expect(SALON.tasks).toHaveLength(12);
        expect(SALON.tasks[0]).toMatchObject({ kind: 'stage', label: 'renovate' });
        for (const task of SALON.tasks.slice(1)) expect(task.kind).toBe('slot');
        expect(SALON.slots.every((s) => s.variants.length === 3)).toBe(true);
    });

    it('is registered as the first room', () => {
        expect(FIRST_ROOM).toBe('salon');
        expect(ROOMS[FIRST_ROOM]).toBe(SALON);
    });

    it('costs 129 stars in all, pacing documented for the tuning slice', () => {
        // 5, 7, 9, 10, 12, 13, 15 (S-16a) then 8, 10, 12, 13, 15 (S-16d); the pace is tuned in S-17.
        expect(SALON.tasks.map((t) => t.cost)).toEqual([5, 7, 9, 10, 12, 13, 15, 8, 10, 12, 13, 15]);
        expect(SALON.tasks.reduce((sum, t) => sum + t.cost, 0)).toBe(129);
    });

    it('keeps the order of the first tasks stable: new tasks are only ever appended (saved rooms count positions)', () => {
        expect(SALON.tasks.slice(0, 7).map((t) => t.id)).toEqual(['renovate', 'add-sofa', 'lay-rug', 'place-coffee-table', 'place-cabinet', 'place-armchair', 'hang-frames']);
    });

    // M-R4: a later slice appends to this literal and never edits an earlier entry (saved rooms count positions).
    it('M-R4: the task id order is append-only', () => {
        expect(SALON.tasks.map((t) => t.id)).toEqual([
            'renovate', 'add-sofa', 'lay-rug', 'place-coffee-table', 'place-cabinet', 'place-armchair', 'hang-frames',
            'hang-curtains', 'hang-shelf', 'swap-lamp', 'swap-plant', 'swap-pouf',
        ]);
    });

    it('shows the old look of exactly the lamp, left plant and pouf until they are bought', () => {
        const withDefault = SALON.slots.filter((s) => s.shownBeforePurchase !== undefined).map((s) => s.id);
        expect(withDefault.sort()).toEqual(['lamp-table', 'plant-left', 'pouf']);
        for (const s of SALON.slots) if (withDefault.includes(s.id)) expect(s.shownBeforePurchase).toBe(0);
        expect(SALON.decor.map((l) => l.id)).toEqual(['plant-right']);
    });

    // The v2 -> v3 step (core/migrations/legacySalon) tells an old save by a `chosen` key only the old list wrote (M-2).
    it('uses no slot id that means something else in the frozen legacy salon', () => {
        const slotIds = new Set(SALON.slots.map((s) => s.id));
        const legacyIds = new Set(LEGACY_SALON_V2.tasks.map((t) => t.slot));
        for (const [oldId, newId] of Object.entries(LEGACY_SALON_V2.renames)) {
            expect(legacyIds.has(oldId), oldId).toBe(true);
            expect(slotIds.has(newId), newId).toBe(true);
            expect(slotIds.has(oldId), `${oldId} would be mistaken for a new slot`).toBe(false);
        }
        const renamedAway = new Set(Object.keys(LEGACY_SALON_V2.renames));
        const dropped = [...legacyIds].filter((id) => !renamedAway.has(id) && !slotIds.has(id));
        expect(dropped.sort()).toEqual(['floor', 'lamp', 'plant', 'walls']);
        // `curtains` is the one old-only key that is also a live slot id: safe, LIFT_V2_SALON runs only for version < 3.
        expect(legacyIds.has('curtains') && slotIds.has('curtains')).toBe(true);
        // At least one old key must be foreign to the new room, or the marker could not tell an old save.
        expect(dropped.length + renamedAway.size).toBeGreaterThan(0);
    });

    it('has a non-empty child-facing label for every task, in the author\'s wording for the stage', () => {
        expect(pl.room.name.length).toBeGreaterThan(0);
        expect(pl.room.tasks.renovate).toBe('Odnów ściany i podłogę');
        for (const task of SALON.tasks) {
            const label = (pl.room.tasks as Record<string, string>)[task.label];
            expect(typeof label, task.label).toBe('string');
            expect(label?.trim().length, task.label).toBeGreaterThan(0);
        }
    });

    it('writes the stars still missing as digits only', () => {
        expect(pl.room.short(3, 5)).toBe('masz 3/5');
        expect(pl.room.short(0, 15)).toBe('masz 0/15');
    });

    it('lists the salon first, then a teaser that unlocks after it (FR-019), as the old literal did', () => {
        expect(houseRoomList(FIRST_HOUSE, ROOMS)).toEqual([{ room: 'salon' }, { teaser: true, unlockAfter: 'salon' }]);
        for (const id of Object.keys(ROOMS)) expect(typeof (pl.room as { name: unknown }).name, id).toBe('string');
    });

    it('keeps the frozen v5 house and the data house in step for the salon cell', () => {
        expect(HOUSE_V5.id).toBe(FIRST_HOUSE.id);
        expect(HOUSE_V5.rooms[0]).toEqual(FIRST_HOUSE.rooms[0]);
    });

    it('keeps a finished salon in the salon: the kitchen cell is invisible until the kitchen is data (F-04)', () => {
        const states = { salon: { tasksDone: SALON.tasks.length, chosen: {} } };
        expect(roomInRenovation(FIRST_HOUSE, ROOMS, states)).toBeNull();
        const moved = nextRoom({ rooms: states, currentRoom: 'salon' }, FIRST_HOUSE, ROOMS);
        expect(moved.currentRoom).toBe('salon');
        expect(moved.movedFrom).toBeNull();
        expect(Object.keys(moved.rooms)).not.toContain('kitchen');
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
});
