// Room purchase logic (S-09 phase 1, test-plan risk #16). Oracle: FR-016/US-02
// AC: stars are spent once, only on confirm, never below 0; a refused purchase
// changes nothing. The test room is written out here, not read from data.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sceneKey, stageFade, currentTask, emptyRoomState, roomGrowth, nextTaskCost, parentVisible, purchase, roomStateProblems, repairCurrentRoom, roomDone, roomsListView, stagesDone, taskButtonView } from '../src/core/rooms';
import { decodeSave, encodeSave, validateSave, type SessionSave } from '../src/core/save';
import { FIRST_ROOM, ROOMS } from '../src/data/rooms';
import type { RoomDef, RoomState } from '../src/core/types';
import { houseOf } from './helpers';
import { TEST_ROOM_PARTS, testSlot } from './roomFixtures';

const room: RoomDef = {
    id: 'test',
    ...TEST_ROOM_PARTS,
    slots: [
        testSlot('floor', 1),
        testSlot('sofa', 2),
    ],
    tasks: [
        { kind: 'slot', id: 't1', slot: 'floor', label: 'fixFloor', cost: 5 },
        { kind: 'slot', id: 't2', slot: 'sofa', label: 'sofa', cost: 8 },
    ],
};

const deepFreeze = <T extends object>(o: T): T => {
    for (const v of Object.values(o) as unknown[]) {
        if (typeof v === 'object' && v !== null) deepFreeze(v);
    }
    return Object.freeze(o);
};

describe('current task', () => {
    it('starts empty and points at the first task', () => {
        const s = emptyRoomState();
        expect(s.tasksDone).toBe(0);
        expect(s.chosen).toEqual({});
        expect(currentTask(room, s)?.id).toBe('t1');
        expect(nextTaskCost(room, s)).toBe(5);
    });
    it('advances with tasksDone and is null after the last task', () => {
        expect(currentTask(room, { tasksDone: 1, chosen: {} })?.id).toBe('t2');
        expect(nextTaskCost(room, { tasksDone: 1, chosen: {} })).toBe(8);
        expect(currentTask(room, { tasksDone: 2, chosen: {} })).toBeNull();
        expect(nextTaskCost(room, { tasksDone: 2, chosen: {} })).toBeNull();
        expect(taskButtonView(room, { tasksDone: 2, chosen: {} }, 99)).toBeNull();
    });
});

describe('taskButtonView', () => {
    const s = emptyRoomState();
    it('is not affordable one star short and shows have/need', () => {
        expect(taskButtonView(room, s, 4)).toMatchObject({ taskId: 't1', label: 'fixFloor', cost: 5, affordable: false, have: 4, need: 5 });
    });
    it('is affordable at exactly the cost', () => {
        expect(taskButtonView(room, s, 5)).toMatchObject({ affordable: true, have: 5, need: 5 });
    });
    it('clamps have to the cost when the balance is larger', () => {
        expect(taskButtonView(room, s, 6)).toMatchObject({ affordable: true, have: 5, need: 5 });
    });
});

describe('purchase', () => {
    it('with exactly the cost buys down to 0, advances one task and stores the variant', () => {
        const r = purchase(room, emptyRoomState(), 5, 2);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.stars).toBe(0);
        expect(r.state.tasksDone).toBe(1);
        expect(r.state.chosen).toEqual({ floor: 2 });
        expect(r.bought).toEqual({ kind: 'slot', taskId: 't1', slot: 'floor', variant: 2 });
    });
    it('one star short is refused and nothing changes', () => {
        const s = deepFreeze(emptyRoomState());
        expect(purchase(room, s, 4, 0)).toEqual({ ok: false, reason: 'short' });
        expect(s).toEqual({ tasksDone: 0, chosen: {} });
    });
    it('refuses variants outside 0..2 and non-integers', () => {
        for (const v of [-1, 3, 1.5, Number.NaN]) {
            expect(purchase(room, emptyRoomState(), 50, v)).toEqual({ ok: false, reason: 'bad-variant' });
        }
    });
    it('after the last task there is nothing to buy', () => {
        expect(purchase(room, { tasksDone: 2, chosen: {} }, 50, 0)).toEqual({ ok: false, reason: 'no-task' });
    });
    it('does not mutate its arguments and keeps earlier choices', () => {
        const s: RoomState = deepFreeze({ tasksDone: 1, chosen: { floor: 1 } });
        const r = purchase(room, s, 10, 0);
        expect(r.ok && r.state.chosen).toEqual({ floor: 1, sofa: 0 });
        expect(r.ok && r.stars).toBe(2);
        expect(s).toEqual({ tasksDone: 1, chosen: { floor: 1 } });
    });
});

describe('roomDone (S-10)', () => {
    it('is false while a task is left and true once all are done', () => {
        expect(roomDone(room, { tasksDone: 0, chosen: {} })).toBe(false);
        expect(roomDone(room, { tasksDone: 1, chosen: { floor: 0 } })).toBe(false);
        expect(roomDone(room, { tasksDone: 2, chosen: { floor: 0, sofa: 1 } })).toBe(true);
    });
});

describe('roomsListView (FR-019: unlocking is data, not scene logic)', () => {
    const rooms = { test: room };
    const order = [{ room: 'test' }, { teaser: true as const, unlockAfter: 'test' }];
    const finished: RoomState = { tasksDone: 2, chosen: {} };

    it('lists an unfinished room as unlocked and not done, and its teaser as locked', () => {
        const view = roomsListView(order, rooms, { test: { tasksDone: 1, chosen: {} } });
        expect(view).toEqual([
            { kind: 'room', id: 'test', nameKey: 'test', done: false, unlocked: true },
            { kind: 'teaser', id: null, nameKey: null, done: false, unlocked: false },
        ]);
    });

    it('unlocks the teaser once the room it follows is done', () => {
        const view = roomsListView(order, rooms, { test: finished });
        expect(view[0]).toMatchObject({ done: true, unlocked: true });
        expect(view[1]).toMatchObject({ kind: 'teaser', unlocked: true, done: false });
    });

    it('treats a missing state as an empty room and an unknown unlockAfter as locked', () => {
        const view = roomsListView([...order, { teaser: true, unlockAfter: 'nowhere' }], rooms, {});
        expect(view[0]).toMatchObject({ done: false, unlocked: true });
        expect(view[1]?.unlocked).toBe(false);
        expect(view[2]?.unlocked).toBe(false);
    });
});

describe('repairCurrentRoom (H-R3: a save naming an unknown room)', () => {
    const known = ['salon'];
    const done = (n: number): RoomState => ({ tasksDone: n, chosen: { floor: 1 } });
    const session = (currentRoom: string, rooms: Record<string, RoomState>): SessionSave => ({
        stars: 7,
        rooms,
        currentRoom,
        settings: { autoRead: true },
        learner: null,
        variants: { roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] },
        house: houseOf('salon'),
    });

    it('keeps a known room: the same session object, nothing repaired', () => {
        const input = session('salon', { salon: done(2) });
        const out = repairCurrentRoom(input, known, 'salon');
        expect(out.session).toBe(input);
        expect(out.repairedFrom).toBeNull();
    });

    it('moves an unknown current room to the first room and leaves every other room untouched', () => {
        const kitchen = done(3);
        const salon = done(4);
        const input = session('kuchnia', { kuchnia: kitchen, salon });
        const out = repairCurrentRoom(input, known, 'salon');
        expect(out.repairedFrom).toBe('kuchnia');
        expect(out.session.currentRoom).toBe('salon');
        expect(out.session.rooms.kuchnia).toBe(kitchen);
        expect(out.session.rooms.salon).toBe(salon);
        expect(out.session.stars).toBe(7);
    });

    it('adds an empty first room only when it is missing', () => {
        const kitchen = done(3);
        const out = repairCurrentRoom(session('kuchnia', { kuchnia: kitchen }), known, 'salon');
        expect(out.session.rooms.salon).toEqual(emptyRoomState());
        expect(out.session.rooms.kuchnia).toBe(kitchen);
        expect(Object.keys(out.session.rooms).sort()).toEqual(['kuchnia', 'salon']);
    });

    it('never mutates its input and yields a session that passes validateSave', () => {
        const input = session('kuchnia', { kuchnia: done(1) });
        const before = structuredClone(input);
        const out = repairCurrentRoom(input, known, 'salon');
        expect(input).toEqual(before);
        expect(validateSave(JSON.parse(JSON.stringify(encodeSave(out.session))))).toBe(true);
    });

    it.each(['save-v1.json', 'save-v1-fresh.json'])('repairs the frozen fixture %s (currentRoom outside ROOMS)', (name) => {
        const raw: unknown = JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
        const decoded = decodeSave(raw);
        if (decoded.kind !== 'ok') throw new Error('fixture must decode');
        const living = decoded.session.rooms.living;
        const out = repairCurrentRoom(decoded.session, Object.keys(ROOMS), FIRST_ROOM);
        expect(out.repairedFrom).toBe('living');
        expect(out.session.currentRoom).toBe('salon');
        expect(out.session.rooms.living).toBe(living);
    });
});

describe('background stage task (S-16a)', () => {
    const staged: RoomDef = {
        id: 'staged',
        ...TEST_ROOM_PARTS,
        slots: [testSlot('sofa', 2)],
        tasks: [
            { kind: 'stage', id: 'walls', label: 'walls', cost: 5 },
            { kind: 'slot', id: 'sofa', slot: 'sofa', label: 'sofa', cost: 8 },
        ],
    };
    it('buys with no variant: spends the cost once, advances, leaves chosen untouched', () => {
        const r = purchase(staged, emptyRoomState(), 12, null);
        expect(r).toMatchObject({ ok: true, stars: 7, bought: { kind: 'stage', taskId: 'walls' } });
        if (r.ok) expect(r.state).toEqual({ tasksDone: 1, chosen: {} });
    });
    it('a stage never needs a valid variant, a slot still does', () => {
        expect(purchase(staged, emptyRoomState(), 12, 7).ok).toBe(true);
        expect(purchase(staged, { tasksDone: 1, chosen: {} }, 12, null)).toEqual({ ok: false, reason: 'bad-variant' });
    });
    it('a short balance refuses the stage', () => {
        expect(purchase(staged, emptyRoomState(), 4, null)).toEqual({ ok: false, reason: 'short' });
    });
    it('a slot purchase reports kind slot', () => {
        const r = purchase(staged, { tasksDone: 1, chosen: {} }, 8, 2);
        expect(r).toMatchObject({ ok: true, bought: { kind: 'slot', taskId: 'sofa', slot: 'sofa', variant: 2 } });
    });
    it('stagesDone counts stage tasks inside the done prefix', () => {
        expect(stagesDone(staged, { tasksDone: 0, chosen: {} })).toBe(0);
        expect(stagesDone(staged, { tasksDone: 1, chosen: {} })).toBe(1);
        expect(stagesDone(staged, { tasksDone: 2, chosen: {} })).toBe(1);
        expect(stagesDone(staged, { tasksDone: 99, chosen: {} })).toBe(1);
    });
});


describe('roomStateProblems (R-4)', () => {
    const salon = ROOMS.salon;
    const at = (tasksDone: number, chosen: RoomState['chosen'] = {}): Record<string, RoomState> => ({ salon: { tasksDone, chosen } });

    it('a state the game could have written has no problem', () => {
        expect(roomStateProblems(at(0), ROOMS)).toEqual([]);
        expect(roomStateProblems(at(2, { sofa: 1 }), ROOMS)).toEqual([]);
        expect(roomStateProblems(at(salon.tasks.length, { sofa: 0, rug: 2 }), ROOMS)).toEqual([]);
    });

    it('names a room the catalogue does not have', () => {
        expect(roomStateProblems({ living: { tasksDone: 3, chosen: {} } }, ROOMS)).toEqual([{ room: 'living', kind: 'unknown-room' }]);
    });

    it('names more tasks done than the room has', () => {
        expect(roomStateProblems(at(salon.tasks.length + 1), ROOMS)).toEqual([{ room: 'salon', kind: 'tasks-overflow' }]);
    });

    it('names a chosen slot the room does not have', () => {
        expect(roomStateProblems(at(3, { sofa: 0, ghost: 1 }), ROOMS)).toEqual([{ room: 'salon', kind: 'unknown-slot' }]);
    });

    it('names the audit case: curtains chosen with 7 tasks done (curtains is the 8th task)', () => {
        expect(roomStateProblems(at(7, { curtains: 1 }), ROOMS)).toEqual([{ room: 'salon', kind: 'chosen-not-bought' }]);
        expect(roomStateProblems(at(8, { curtains: 1 }), ROOMS)).toEqual([]);
    });

    it('names a variant beyond the slot variants', () => {
        const odd = JSON.parse('{"salon":{"tasksDone":3,"chosen":{"sofa":3}}}') as Record<string, RoomState>;
        expect(roomStateProblems(odd, ROOMS)).toEqual([{ room: 'salon', kind: 'variant-out-of-range' }]);
    });

    it('does not change its input', () => {
        const input = at(99, { ghost: 1 });
        const before = structuredClone(input);
        roomStateProblems(input, ROOMS);
        expect(input).toEqual(before);
    });

    it('only an unknown room is hidden from a parent', () => {
        expect(parentVisible({ room: 'living', kind: 'unknown-room' })).toBe(false);
        for (const kind of ['tasks-overflow', 'unknown-slot', 'chosen-not-bought', 'variant-out-of-range'] as const) {
            expect(parentVisible({ room: 'salon', kind })).toBe(true);
        }
    });

    it.each(['save-v1.json', 'save-v1-fresh.json', 'save-v1-legacy-salon.json', 'save-v2.json', 'save-v2-fresh.json', 'save-v2-legacy-salon.json', 'save-v3.json', 'save-v4.json'])(
        'the frozen fixture %s gives nothing a parent would see',
        (name) => {
            const raw: unknown = JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
            const decoded = decodeSave(raw);
            if (decoded.kind !== 'ok') throw new Error('fixture must decode');
            const problems = roomStateProblems(decoded.session.rooms, ROOMS);
            expect(problems.filter(parentVisible)).toEqual([]);
            if ('living' in decoded.session.rooms) expect(problems).toContainEqual({ room: 'living', kind: 'unknown-room' });
        },
    );
});

describe('roomGrowth (R-2): a room whose task list grew past the saved tasksDone is reported, log only', () => {
    const grown: RoomDef = { ...room, formerTaskCounts: [1], tasks: [...room.tasks] };

    it('names the room when tasksDone equals a former length and the list is now longer', () => {
        expect(roomGrowth({ test: { tasksDone: 1, chosen: {} } }, { test: grown })).toEqual([{ room: 'test', from: 1, to: 2 }]);
    });

    it('is quiet for other counts, a finished room, an unknown room and a room with no former lengths', () => {
        expect(roomGrowth({ test: { tasksDone: 0, chosen: {} } }, { test: grown })).toEqual([]);
        expect(roomGrowth({ test: { tasksDone: 2, chosen: {} } }, { test: grown })).toEqual([]);
        expect(roomGrowth({ other: { tasksDone: 1, chosen: {} } }, { test: grown })).toEqual([]);
        expect(roomGrowth({ test: { tasksDone: 1, chosen: {} } }, { test: room })).toEqual([]);
    });

    it('the live salon: 7 done of 12 is reported, nothing else is', () => {
        expect(roomGrowth({ salon: { tasksDone: 7, chosen: {} } }, ROOMS)).toEqual([{ room: 'salon', from: 7, to: ROOMS.salon.tasks.length }]);
        expect(roomGrowth({ salon: { tasksDone: 6, chosen: {} } }, ROOMS)).toEqual([]);
        expect(roomGrowth({ salon: { tasksDone: ROOMS.salon.tasks.length, chosen: {} } }, ROOMS)).toEqual([]);
    });

    it('is not a room problem and changes nothing in its input', () => {
        const rooms = deepFreeze({ salon: { tasksDone: 7, chosen: {} } });
        expect(roomStateProblems(rooms, ROOMS)).toEqual([]);
        expect(() => roomGrowth(rooms, ROOMS)).not.toThrow();
    });
});

describe('sceneKey and stageFade (kids-room phase 1)', () => {
    const staged: RoomDef = {
        id: 'staged',
        ...TEST_ROOM_PARTS,
        scene: { before: 'b0', after: 'aft', shadows: 'sh' },
        slots: [testSlot('bed', 1)],
        tasks: [
            { kind: 'stage', id: 's1', label: 'one', cost: 5, scene: 'st1' },
            { kind: 'stage', id: 's2', label: 'two', cost: 5, scene: 'st2' },
            { kind: 'stage', id: 's3', label: 'three', cost: 5 },
            { kind: 'slot', id: 't4', slot: 'bed', label: 'bed', cost: 5 },
        ],
    };
    const at = (n: number): RoomState => ({ tasksDone: n, chosen: {} });

    it('sceneKey follows the last done stage', () => {
        expect([0, 1, 2, 3, 4].map((n) => sceneKey(staged, at(n)))).toEqual(['b0', 'st1', 'st2', 'aft', 'aft']);
    });

    it('stageFade starts from the previous picture and marks only the first as neglected', () => {
        expect(stageFade(staged, at(0))).toBeNull();
        expect(stageFade(staged, at(1))).toEqual({ from: 'b0', neglected: true });
        expect(stageFade(staged, at(2))).toEqual({ from: 'st1', neglected: false });
        expect(stageFade(staged, at(3))).toEqual({ from: 'st2', neglected: false });
        expect(stageFade(staged, at(4))).toBeNull();
    });

    it('salon, kitchen, Mostek and Hangar keep the old before/after ternary at every tasksDone', () => {
        for (const id of ['salon', 'kitchen', 'bridge', 'hangar']) {
            const r = ROOMS[id];
            for (let n = 0; n <= r.tasks.length; n++) {
                const st = at(n);
                const side = stagesDone(r, st) > 0 ? 'after' : 'before';
                expect(sceneKey(r, st)).toBe(r.scene[side]);
            }
        }
    });
});
