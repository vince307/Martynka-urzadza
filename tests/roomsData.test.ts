// Salon data invariants (S-09 phase 2, S-16a phase 3; test-plan risk #16 support). Oracle: PRD FR-016 (renovation tasks,
// cost 5-15 stars), plan section 9 (nothing distinguished by colour alone: a variant has a name and a colour) and the
// art pack's manifest (1920x1080 scene, six furniture slots with three variants, four fixed layers).
import { describe, expect, it } from 'vitest';
import { UI_ART_KEYS } from '../src/data/uiArt';
import { LEGACY_SALON_V2 } from '../src/core/migrations/legacySalon';
import { pl, roomText } from '../src/data/pl';
import { balance } from '../src/data/balance';
import { ROOM_LAYOUT } from '../src/data/layout';
import { BATHROOM, BRIDGE, CHILDREN, FIRST_ROOM, HANGAR, ROOMS, SALON } from '../src/data/rooms';
import { BUILDING_CHOICES, FIRST_HOUSE, HOUSES } from '../src/data/houses';
import { houseRoomList, nextRoom, roomInRenovation } from '../src/core/house';
import { HOUSE_V5 } from '../src/core/migrations/house';
import { GAME_HEIGHT, GAME_WIDTH, MIN_TOUCH_TARGET } from '../src/data/layout';

// Mostek (FR-044) costs up to 21 stars; the other rooms stay within 15.
const MAX_TASK_COST = 21;
const cleanRound = balance.round.length * balance.round.starPerTask + balance.round.cleanRoundBonus;

// Every registered room, not only the salon (M-R5, L-R10): a second room must not slip past the invariants.
describe('every room in ROOMS', () => {
    const rooms = Object.values(ROOMS);

    it('is keyed by its own id and placed in exactly one house of HOUSES', () => {
        expect(rooms.length).toBeGreaterThan(0);
        for (const [key, room] of Object.entries(ROOMS)) expect(room.id).toBe(key);
        const placed = HOUSES.flatMap((h) => h.rooms.map((c) => c.room));
        // S-31 phase 3: no house lists the bathroom yet; phase 4 adds its HOUSES row and removes this exemption.
        for (const id of Object.keys(ROOMS)) expect(placed.filter((r) => r === id), id).toHaveLength(id === 'bathroom' ? 0 : 1);
    });

    it('has one furniture task per slot, whole costs of 5-21 stars, the first within one clean round', () => {
        for (const room of rooms) {
            const slotIds = room.slots.map((s) => s.id);
            expect(new Set(slotIds).size, room.id).toBe(slotIds.length);
            const bought = room.tasks.flatMap((t) => (t.kind === 'slot' ? [t.slot] : []));
            expect([...bought].sort(), room.id).toEqual([...slotIds].sort());
            expect(new Set(room.tasks.map((t) => t.id)).size, room.id).toBe(room.tasks.length);
            for (const { cost } of room.tasks) {
                expect(Number.isInteger(cost), room.id).toBe(true);
                expect(cost, room.id).toBeGreaterThanOrEqual(5);
                expect(cost, room.id).toBeLessThanOrEqual(MAX_TASK_COST);
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

describe('bridge data (FR-044)', () => {
    it('costs 6, 10, 13, 14, 17, 19, 21 = 100 stars, each above the salon task at the same index', () => {
        expect(BRIDGE.tasks.map((t) => t.cost)).toEqual([6, 10, 13, 14, 17, 19, 21]);
        expect(BRIDGE.tasks.reduce((sum, t) => sum + t.cost, 0)).toBe(100);
        BRIDGE.tasks.forEach((t, i) => expect(t.cost, `task ${i}`).toBeGreaterThan(SALON.tasks[i].cost));
    });

    it('is the stage first, then six furniture tasks, and the first room of the base', () => {
        expect(BRIDGE.tasks[0]).toMatchObject({ kind: 'stage', label: 'renovate' });
        expect(BRIDGE.slots).toHaveLength(6);
        expect(houseRoomList(HOUSES.find((h) => h.id === 'base-1')!, ROOMS)).toEqual([{ room: 'bridge' }, { room: 'hangar', unlockAfter: 'bridge' }]);
    });

    it('moves the child to the Hangar after the last Mostek task', () => {
        const states = { bridge: { tasksDone: BRIDGE.tasks.length, chosen: {} } };
        const moved = nextRoom({ rooms: states, currentRoom: 'bridge' }, HOUSES.find((h) => h.id === 'base-1')!, ROOMS);
        expect(moved.currentRoom).toBe('hangar');
        expect(moved.movedFrom).toBe('bridge');
    });
});

describe('hangar data (FR-047)', () => {
    // Written from designs/bystrow-space-base-v2/manifest.json rooms.hangar, not from hangarSlots: [id, x, y, width, height, z].
    const manifest: Array<[string, number, number, number, number, number]> = [
        ['hangar-rocket', 754, 254, 321, 532, 25],
        ['hangar-rover', 1114, 624, 418, 292, 40],
        ['hangar-workbench', 404, 434, 384, 292, 20],
        ['hangar-crates', 264, 544, 183, 242, 35],
        ['hangar-lamp', 1384, 404, 212, 276, 18],
        ['hangar-mat', 664, 644, 552, 270, 5],
    ];

    it('copies the six slots of the pack manifest', () => {
        expect(HANGAR.slots.map((s) => [s.id, s.x, s.y, s.width, s.height, s.z])).toEqual(manifest);
    });

    it('costs 6, 10, 13, 14, 17, 19, 21 = 100 stars', () => {
        expect(HANGAR.tasks.map((t) => t.cost)).toEqual([6, 10, 13, 14, 17, 19, 21]);
        expect(HANGAR.tasks.reduce((sum, t) => sum + t.cost, 0)).toBe(100);
    });

    it('is the stage first, then one task per slot, each slot bought once', () => {
        expect(HANGAR.tasks[0]).toMatchObject({ kind: 'stage', label: 'renovate' });
        const slotTasks = HANGAR.tasks.slice(1);
        expect(slotTasks.every((t) => t.kind === 'slot')).toBe(true);
        expect(slotTasks.map((t) => (t.kind === 'slot' ? t.slot : ''))).toEqual(manifest.map((m) => m[0]));
    });
});

describe('children data (FR-033)', () => {
    // Written from designs/martynka-evolution-v1/manifest.json rooms.children, not from childrenSlots: [id, x, y, width, height, z].
    const manifest: Array<[string, number, number, number, number, number]> = [
        ['children-bed', 405, 239, 410, 407, 20],
        ['children-desk', 1258, 397, 290, 262, 25],
        ['children-books', 810, 286, 220, 324, 15],
        ['children-toys', 411, 578, 371, 251, 40],
        ['children-reading', 1211, 558, 367, 301, 45],
        ['children-wardrobe', 1028, 308, 216, 346, 18],
    ];

    it('copies the six slots of the pack manifest', () => {
        expect(CHILDREN.slots.map((s) => [s.id, s.x, s.y, s.width, s.height, s.z])).toEqual(manifest);
    });

    it('is three stages first, then one task per slot in the pack order, each slot bought once', () => {
        expect(CHILDREN.tasks.slice(0, 3).map((t) => t.kind)).toEqual(['stage', 'stage', 'stage']);
        const slotTasks = CHILDREN.tasks.slice(3);
        expect(slotTasks.map((t) => (t.kind === 'slot' ? t.slot : ''))).toEqual(manifest.map((m) => m[0]));
    });

    it('costs 5, 6, 7, 7, 9, 10, 12, 13, 15 = 84 stars', () => {
        expect(CHILDREN.tasks.map((t) => t.cost)).toEqual([5, 6, 7, 7, 9, 10, 12, 13, 15]);
        expect(CHILDREN.tasks.reduce((sum, t) => sum + t.cost, 0)).toBe(84);
    });

    it('names the background of the first two stages and none on the third (it shows the after look)', () => {
        const scenes = CHILDREN.tasks.slice(0, 3).map((t) => (t.kind === 'stage' ? t.scene : 'not a stage'));
        expect(scenes).toEqual(['children/children-stage-1', 'children/children-stage-2', undefined]);
    });
});

describe('bathroom data (FR-033)', () => {
    // Written from designs/martynka-bathroom-v1/manifest.json rooms.bathroom, not from bathroomSlots: [id, x, y, width, height, z].
    const manifest: Array<[string, number, number, number, number, number]> = [
        ['bathroom-tub', 468, 284, 441, 492, 20],
        ['bathroom-sink', 943, 291, 313, 478, 25],
        ['bathroom-cabinet', 1310, 408, 210, 398, 30],
        ['bathroom-rug', 800, 712, 346, 188, 10],
        ['bathroom-plant', 363, 583, 205, 225, 40],
        ['bathroom-ducks', 1300, 316, 193, 129, 15],
    ];

    it('copies the six slots of the pack manifest', () => {
        expect(BATHROOM.slots.map((s) => [s.id, s.x, s.y, s.width, s.height, s.z])).toEqual(manifest);
    });

    it('is one stage first, then one task per slot in the pack order, each slot bought once', () => {
        expect(BATHROOM.tasks[0]).toMatchObject({ kind: 'stage', label: 'renovate' });
        expect(BATHROOM.tasks[0].kind === 'stage' && BATHROOM.tasks[0].scene).toBeFalsy();
        const slotTasks = BATHROOM.tasks.slice(1);
        expect(slotTasks.map((t) => (t.kind === 'slot' ? t.slot : ''))).toEqual(manifest.map((m) => m[0]));
    });

    it('costs 5, 7, 9, 10, 12, 13, 15 = 71 stars', () => {
        expect(BATHROOM.tasks.map((t) => t.cost)).toEqual([5, 7, 9, 10, 12, 13, 15]);
        expect(BATHROOM.tasks.reduce((sum, t) => sum + t.cost, 0)).toBe(71);
    });
});

describe('hangar flow (FR-047)', () => {
    it('keeps the child in the Hangar after its last task: Dalej stays', () => {
        const states = {
            bridge: { tasksDone: BRIDGE.tasks.length, chosen: {} },
            hangar: { tasksDone: HANGAR.tasks.length, chosen: {} },
        };
        const moved = nextRoom({ rooms: states, currentRoom: 'hangar' }, HOUSES.find((h) => h.id === 'base-1')!, ROOMS);
        expect(moved.currentRoom).toBe('hangar');
        expect(moved.movedFrom).toBeNull();
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
        for (const id of Object.keys(ROOMS)) {
            expect(roomText.name(id)?.length ?? 0, id).toBeGreaterThan(0);
            const thumb = ROOMS[id].thumbnail;
            if (thumb !== undefined) expect(Object.values(UI_ART_KEYS), id).toContain(thumb);
        }
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

    it('lists the salon first, then the kitchen and the children\'s room, each unlocking after the one before (S-22, S-25)', () => {
        expect(houseRoomList(FIRST_HOUSE, ROOMS)).toEqual([{ room: 'salon' }, { room: 'kitchen', unlockAfter: 'salon' }, { room: 'children', unlockAfter: 'kitchen' }]);
        for (const id of Object.keys(ROOMS)) expect(typeof roomText.name(id), id).toBe('string');
    });

    it('keeps the frozen v5 house and the data house in step for the salon cell', () => {
        expect(HOUSE_V5.id).toBe(FIRST_HOUSE.id);
        expect(HOUSE_V5.rooms[0]).toEqual(FIRST_HOUSE.rooms[0]);
    });

    it('moves a finished salon into the kitchen with an empty kitchen state and the salon untouched (S-22)', () => {
        const states = { salon: { tasksDone: SALON.tasks.length, chosen: {} } };
        expect(roomInRenovation(FIRST_HOUSE, ROOMS, states)).toBe('kitchen');
        const moved = nextRoom({ rooms: states, currentRoom: 'salon' }, FIRST_HOUSE, ROOMS);
        expect(moved.currentRoom).toBe('kitchen');
        expect(moved.movedFrom).toBe('salon');
        expect(moved.rooms.kitchen).toEqual({ tasksDone: 0, chosen: {} });
        expect(moved.rooms.salon).toEqual(states.salon);
    });

    it('moves a finished kitchen into the children\'s room with an empty state and the others untouched (S-25)', () => {
        const states = { salon: { tasksDone: SALON.tasks.length, chosen: {} }, kitchen: { tasksDone: ROOMS.kitchen.tasks.length, chosen: {} } };
        expect(roomInRenovation(FIRST_HOUSE, ROOMS, states)).toBe('children');
        const moved = nextRoom({ rooms: states, currentRoom: 'kitchen' }, FIRST_HOUSE, ROOMS);
        expect(moved.currentRoom).toBe('children');
        expect(moved.movedFrom).toBe('kitchen');
        expect(moved.rooms.children).toEqual({ tasksDone: 0, chosen: {} });
        expect(moved.rooms.salon).toEqual(states.salon);
        expect(moved.rooms.kitchen).toEqual(states.kitchen);
    });

    it('keeps the child in the children\'s room after its last task: Dalej stays (S-25)', () => {
        const states = { salon: { tasksDone: SALON.tasks.length, chosen: {} }, kitchen: { tasksDone: ROOMS.kitchen.tasks.length, chosen: {} }, children: { tasksDone: CHILDREN.tasks.length, chosen: {} } };
        const moved = nextRoom({ rooms: states, currentRoom: 'children' }, FIRST_HOUSE, ROOMS);
        expect(moved.currentRoom).toBe('children');
        expect(moved.movedFrom).toBeNull();
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

describe('BUILDING_CHOICES (FR-042)', () => {
    it('are exactly house and space, each naming a house of HOUSES', () => {
        expect(BUILDING_CHOICES.map((c) => c.id)).toEqual(['house', 'space']);
        expect(BUILDING_CHOICES.map((c) => c.house)).toEqual(['house-1', 'base-1']);
        for (const c of BUILDING_CHOICES) expect(HOUSES.some((h) => h.id === c.house), c.id).toBe(true);
    });
});
