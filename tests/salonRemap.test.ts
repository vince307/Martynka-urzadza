// Remap of a live salon save (S-16a phase 2, plan-review F1/F2). Oracle: nothing the child bought is lost silently,
// stars are never taken away, furniture the rounding gifts must be visible (a `chosen` entry). The new room is written
// out here, not read from data.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { remapLegacySalon } from '../src/core/rooms';
import { decodeSave, type SessionSave } from '../src/core/save';
import { freshSession } from '../src/core/save';
import type { LegacyRoomLayout, RoomDef, RoomState, RoomTaskDef } from '../src/core/types';

const tasks: RoomTaskDef[] = [
    { kind: 'stage', id: 'renovate', label: 'renovate', cost: 5 },
    { kind: 'slot', id: 'add-sofa', slot: 'sofa', label: 'addSofa', cost: 7 },
    { kind: 'slot', id: 'lay-rug', slot: 'rug', label: 'layRug', cost: 9 },
    { kind: 'slot', id: 'place-coffee-table', slot: 'coffee-table', label: 'x', cost: 10 },
    { kind: 'slot', id: 'place-cabinet', slot: 'cabinet', label: 'x', cost: 12 },
    { kind: 'slot', id: 'place-armchair', slot: 'armchair', label: 'x', cost: 13 },
    { kind: 'slot', id: 'hang-frames', slot: 'wall-frames', label: 'x', cost: 15 },
];
const room: Pick<RoomDef, 'tasks'> = { tasks };

const legacy: LegacyRoomLayout = {
    roomId: 'salon',
    tasks: [
        { slot: 'floor', cost: 5 }, { slot: 'walls', cost: 6 }, { slot: 'curtains', cost: 7 }, { slot: 'sofa', cost: 8 },
        { slot: 'rug', cost: 9 }, { slot: 'table', cost: 10 }, { slot: 'lamp', cost: 11 }, { slot: 'shelf', cost: 12 },
        { slot: 'plant', cost: 13 }, { slot: 'picture', cost: 15 },
    ],
    renames: { table: 'coffee-table', shelf: 'cabinet', picture: 'wall-frames' },
};

/** An old save that bought the first `n` old tasks; each piece gets variant ((index + 1) % 3). */
const oldSave = (n: number): SessionSave => {
    const chosen: RoomState['chosen'] = {};
    legacy.tasks.slice(0, n).forEach((t, i) => {
        chosen[t.slot] = ((i + 1) % 3) as 0 | 1 | 2;
    });
    return { ...freshSession('salon', 7), rooms: { salon: { tasksDone: n, chosen } } };
};

const cost = (n: number, list: readonly { cost: number }[]): number => list.slice(0, n).reduce((a, t) => a + t.cost, 0);
const NEW_SLOTS = new Set(tasks.flatMap((t) => (t.kind === 'slot' ? [t.slot] : [])));

describe('remapLegacySalon', () => {
    for (let n = 0; n <= 10; n++) {
        describe(`old tasksDone ${n}`, () => {
            const before = oldSave(n);
            const { session, remappedFrom } = remapLegacySalon(before, legacy, room);
            const after = session.rooms.salon;

            it('covers the spent stars unless the new list is complete, and is the shortest such prefix', () => {
                const spent = cost(n, legacy.tasks);
                // old 9 and 10 spent 81 and 96, more than the whole new room (71): complete is the cap (plan-review F2)
                expect(cost(after.tasksDone, tasks) >= spent || after.tasksDone === tasks.length).toBe(true);
                if (after.tasksDone > 0) expect(cost(after.tasksDone - 1, tasks)).toBeLessThan(spent);
                expect(after.tasksDone).toBeLessThanOrEqual(tasks.length);
            });

            it('gives every furniture task of the new prefix a chosen entry and nothing else', () => {
                const prefix = tasks.slice(0, after.tasksDone);
                const slots = prefix.flatMap((t) => (t.kind === 'slot' ? [t.slot] : []));
                expect(Object.keys(after.chosen).sort()).toEqual([...slots].sort());
                for (const key of Object.keys(after.chosen)) expect(NEW_SLOTS.has(key)).toBe(true);
            });

            it('keeps the variant of every old furniture piece in its new slot, inside the new prefix', () => {
                legacy.tasks.slice(0, n).forEach((t) => {
                    const target = legacy.renames[t.slot] ?? t.slot;
                    if (!NEW_SLOTS.has(target)) return; // curtains, lamp, plant, floor, walls: fixed or merged
                    expect(after.chosen[target]).toBe(before.rooms.salon.chosen[t.slot]);
                });
            });

            it('never touches the stars or other fields and remembers the old count', () => {
                expect(session.stars).toBe(before.stars);
                expect(session.settings).toBe(before.settings);
                expect(session.currentRoom).toBe('salon');
                expect(remappedFrom).toBe(n === 0 ? null : n);
            });

            it('is idempotent: a second call returns the same object', () => {
                expect(remapLegacySalon(session, legacy, room).session).toBe(session);
            });
        });
    }

    it('rounds up and gifts a furniture piece with variant 0: old 2 becomes stage + sofa', () => {
        const { session } = remapLegacySalon(oldSave(2), legacy, room);
        expect(session.rooms.salon).toEqual({ tasksDone: 2, chosen: { sofa: 0 } });
    });

    it('old 4 becomes stage, sofa, rug, coffee-table: the sofa keeps its variant, the gifts get 0', () => {
        const { session } = remapLegacySalon(oldSave(4), legacy, room);
        expect(session.rooms.salon.tasksDone).toBe(4);
        expect(session.rooms.salon.chosen).toEqual({ sofa: 1, rug: 0, 'coffee-table': 0 });
    });

    it('old 9 and 10 (81 and 96 stars) land on the complete room', () => {
        expect(remapLegacySalon(oldSave(9), legacy, room).session.rooms.salon.tasksDone).toBe(7);
        expect(remapLegacySalon(oldSave(10), legacy, room).session.rooms.salon.tasksDone).toBe(7);
    });

    it('a fresh salon and a save already in the new shape are returned as they are', () => {
        const fresh = freshSession('salon', 3);
        expect(remapLegacySalon(fresh, legacy, room).session).toBe(fresh);
        const fresh2 = { ...fresh, rooms: { salon: { tasksDone: 3, chosen: { sofa: 2, rug: 1 } as RoomState['chosen'] } } };
        const out = remapLegacySalon(fresh2, legacy, room);
        expect(out.session).toBe(fresh2);
        expect(out.remappedFrom).toBeNull();
    });

    it('leaves a save without the room, and other rooms, untouched', () => {
        const other: SessionSave = { ...oldSave(3), rooms: { living: { tasksDone: 2, chosen: { floor: 1 } } }, currentRoom: 'living' };
        expect(remapLegacySalon(other, legacy, room).session).toBe(other);
        const both: SessionSave = { ...oldSave(3), rooms: { ...oldSave(3).rooms, living: { tasksDone: 2, chosen: { floor: 1 } } } };
        const out = remapLegacySalon(both, legacy, room).session;
        expect(out.rooms.living).toBe(both.rooms.living);
        expect(out.rooms.salon).not.toBe(both.rooms.salon);
    });

    it('does not mutate its input', () => {
        const before = oldSave(6);
        const snapshot = structuredClone(before);
        remapLegacySalon(before, legacy, room);
        expect(before).toEqual(snapshot);
    });

    it('frozen fixtures pass through unchanged', () => {
        for (const name of ['save-v1.json', 'save-v1-fresh.json', 'save-v2.json', 'save-v2-fresh.json']) {
            const decoded = decodeSave(JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')));
            if (decoded.kind !== 'ok') throw new Error(`fixture ${name} must decode`);
            expect(remapLegacySalon(decoded.session, legacy, room).session).toBe(decoded.session);
        }
    });
});
