// Room purchase logic (S-09 phase 1, test-plan risk #16). Oracle: FR-016/US-02
// AC: stars are spent once, only on confirm, never below 0; a refused purchase
// changes nothing. The test room is written out here, not read from data.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { currentTask, emptyRoomState, nextTaskCost, purchase, repairCurrentRoom, roomDone, roomsListView, taskButtonView } from '../src/core/rooms';
import { decodeSave, encodeSave, validateSave, type SessionSave } from '../src/core/save';
import { FIRST_ROOM, ROOMS } from '../src/data/rooms';
import type { RoomDef, RoomState } from '../src/core/types';

const room: RoomDef = {
    id: 'test',
    name: 'Test',
    background: 'bg',
    slots: [
        { id: 'floor', x: 0, y: 0, depth: 1, variants: ['a', 'b', 'c'] },
        { id: 'sofa', x: 0, y: 0, depth: 2, variants: ['a', 'b', 'c'] },
    ],
    tasks: [
        { id: 't1', slot: 'floor', label: 'fixFloor', cost: 5 },
        { id: 't2', slot: 'sofa', label: 'sofa', cost: 8 },
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
        expect(r.bought).toEqual({ taskId: 't1', slot: 'floor', variant: 2 });
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
