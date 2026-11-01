// House rules (F-04 rooms-as-data phase 1). Oracle: two synthetic rooms and literal lists written out here, never data read
// from src/data. A room is "in renovation" while it is the first known room of the house that is not done.
import { describe, expect, it } from 'vitest';
import { buildingStart, houseEqual, houseLayout, houseRoomIds, houseRoomList, mergeHouse, nextRoom, roomInRenovation } from '../src/core/house';
import { emptyRoomState } from '../src/core/rooms';
import { freshSession } from '../src/core/save';
import type { HouseState, RoomDef, RoomState } from '../src/core/types';
import { TEST_ROOM_PARTS } from './roomFixtures';

const mk = (id: string): RoomDef => ({
    id,
    ...TEST_ROOM_PARTS,
    slots: [],
    tasks: [{ kind: 'stage', id: `${id}-stage`, label: 'stage', cost: 5 }],
});
const known: Record<string, RoomDef> = { a: mk('a'), b: mk('b') };
const done: RoomState = { tasksDone: 1, chosen: {} };

const deepFreeze = <T extends object>(o: T): T => {
    for (const v of Object.values(o) as unknown[]) {
        if (typeof v === 'object' && v !== null) deepFreeze(v);
    }
    return Object.freeze(o);
};

const house = (...rooms: string[]): HouseState => ({ id: 'h', rooms: rooms.map((room, place) => ({ room, floor: 0, place })) });

describe('houseRoomList', () => {
    it('lists known rooms in house order, each unlocking after the previous one', () => {
        expect(houseRoomList(house('a', 'b'), known)).toEqual([{ room: 'a' }, { room: 'b', unlockAfter: 'a' }]);
    });
    it('turns the first unknown room into a teaser after the previous room and ends the list', () => {
        expect(houseRoomList(house('a', 'c', 'b'), known)).toEqual([{ room: 'a' }, { teaser: true, unlockAfter: 'a' }]);
    });
    it('is empty when the first room is unknown', () => {
        expect(houseRoomList(house('c', 'a'), known)).toEqual([]);
    });
});

describe('roomInRenovation', () => {
    it('is the first room while it is not done', () => {
        expect(roomInRenovation(house('a', 'b'), known, {})).toBe('a');
    });
    it('is the second room after the first is done', () => {
        expect(roomInRenovation(house('a', 'b'), known, { a: done })).toBe('b');
    });
    it('is null when every known room is done', () => {
        expect(roomInRenovation(house('a', 'b'), known, { a: done, b: done })).toBeNull();
    });
    it('skips a room the build does not know', () => {
        expect(roomInRenovation(house('c', 'a'), known, {})).toBe('a');
    });
});

describe('nextRoom', () => {
    it('keeps the current room when nothing is left to renovate', () => {
        const r = nextRoom({ rooms: { a: done, b: done }, currentRoom: 'b' }, house('a', 'b'), known);
        expect(r.currentRoom).toBe('b');
        expect(r.movedFrom).toBeNull();
    });
    it('moves to the next room and adds its empty state', () => {
        const input = deepFreeze({ rooms: { a: done }, currentRoom: 'a' });
        const r = nextRoom(input, house('a', 'b'), known);
        expect(r.currentRoom).toBe('b');
        expect(r.movedFrom).toBe('a');
        expect(r.rooms).toEqual({ a: { tasksDone: 1, chosen: {} }, b: emptyRoomState() });
        expect(Object.keys(input.rooms)).toEqual(['a']);
    });
    it('does not report a move when the current room is already the one in renovation', () => {
        const r = nextRoom({ rooms: { a: emptyRoomState() }, currentRoom: 'a' }, house('a', 'b'), known);
        expect(r).toEqual({ rooms: { a: emptyRoomState() }, currentRoom: 'a', movedFrom: null });
    });
});

describe('mergeHouse', () => {
    it('keeps a saved room the data does not know at the end and reports it', () => {
        const saved: HouseState = { id: 'h', rooms: [{ room: 'a', floor: 0, place: 0 }, { room: 'x', floor: 1, place: 3 }] };
        const r = mergeHouse(saved, house('a', 'b'));
        expect(r.extraRooms).toEqual(['x']);
        expect(r.house).toEqual({ id: 'h', rooms: [{ room: 'a', floor: 0, place: 0 }, { room: 'b', floor: 0, place: 1 }, { room: 'x', floor: 1, place: 3 }] });
    });
    it('takes the data cells for known rooms and returns copies', () => {
        const data = house('a', 'b');
        const r = mergeHouse({ id: 'h', rooms: [{ room: 'a', floor: 2, place: 9 }] }, data);
        expect(r.extraRooms).toEqual([]);
        expect(r.house.rooms).toEqual(data.rooms);
        expect(r.house).not.toBe(data);
        expect(r.house.rooms[0]).not.toBe(data.rooms[0]);
    });
});

describe('houseLayout', () => {
    const first = house('a', 'b');
    const other: HouseState = { id: 'h2', rooms: [{ room: 'b', floor: 0, place: 0 }] };
    it('returns the data house with the saved id', () => {
        expect(houseLayout({ id: 'h2', rooms: [] }, [first, other], first)).toEqual(other);
    });
    it('falls back to the first house for an unknown id', () => {
        expect(houseLayout({ id: 'zzz', rooms: [] }, [first, other], first)).toEqual(first);
    });
});

describe('houseEqual', () => {
    it('is true for two separately built equal houses', () => {
        expect(houseEqual(house('a', 'b'), house('a', 'b'))).toBe(true);
    });
    it('is false for another id', () => {
        expect(houseEqual(house('a', 'b'), { ...house('a', 'b'), id: 'g' })).toBe(false);
    });
    it('is false for a swapped cell order', () => {
        const swapped = house('a', 'b');
        swapped.rooms.reverse();
        expect(houseEqual(house('a', 'b'), swapped)).toBe(false);
    });
    it('is false for a changed place or floor or length', () => {
        const moved = house('a', 'b');
        moved.rooms[1].place = 5;
        expect(houseEqual(house('a', 'b'), moved)).toBe(false);
        const up = house('a', 'b');
        up.rooms[1].floor = 1;
        expect(houseEqual(house('a', 'b'), up)).toBe(false);
        expect(houseEqual(house('a', 'b'), house('a'))).toBe(false);
    });
});

describe('houseRoomIds', () => {
    const cell = (room: string, place: number) => ({ room, floor: 0, place });
    it('lists the known rooms in house order, skipping unknown ones', () => {
        const house: HouseState = { id: 'h', rooms: [cell('a', 0), cell('unknown', 1), cell('b', 2)] };
        expect(houseRoomIds(house, known)).toEqual(['a', 'b']);
    });
    it('is empty for an all-unknown house', () => {
        expect(houseRoomIds({ id: 'h', rooms: [cell('x', 0), cell('y', 1)] }, known)).toEqual([]);
    });
    it('does not mutate its input and returns a fresh array', () => {
        const house: HouseState = { id: 'h', rooms: [cell('a', 0), cell('b', 1)] };
        const before = structuredClone(house);
        const a = houseRoomIds(house, known);
        expect(house).toEqual(before);
        a.push('z');
        expect(houseRoomIds(house, known)).toEqual(['a', 'b']);
    });
});

describe('buildingStart (S-28)', () => {
    const choices = [{ id: 'house' as const, house: 'h1', art: 'a' }, { id: 'space' as const, house: 'b1', art: 'b' }];
    const houses: HouseState[] = [
        { id: 'h1', rooms: [{ room: 'salon', floor: 0, place: 0 }] },
        { id: 'b1', rooms: [{ room: 'bridge', floor: 0, place: 0 }] },
    ];
    it('space starts in the first room of its house, with that room empty (literal)', () => {
        expect(buildingStart('space', choices, houses)).toEqual({
            house: { id: 'b1', rooms: [{ room: 'bridge', floor: 0, place: 0 }] },
            rooms: { bridge: { tasksDone: 0, chosen: {} } },
            currentRoom: 'bridge',
        });
    });
    it('house starts in the salon and returns a copy of the house', () => {
        const start = buildingStart('house', choices, houses);
        expect(start.currentRoom).toBe('salon');
        expect(start.rooms).toEqual({ salon: { tasksDone: 0, chosen: {} } });
        expect(start.house).not.toBe(houses[0]);
    });
    it('gives the house, rooms and current room freshSession gives for that house (impl-review: the two must not drift)', () => {
        for (const id of ['house', 'space'] as const) {
            const house = houses.find((h) => h.id === choices.find((c) => c.id === id)!.house)!;
            const fresh = freshSession(house, 7);
            expect(buildingStart(id, choices, houses)).toEqual({ house: fresh.house, rooms: fresh.rooms, currentRoom: fresh.currentRoom });
        }
    });
    it('throws a named error on an unknown choice or house', () => {
        expect(() => buildingStart('moon' as 'house', choices, houses)).toThrow(/unknown building choice/);
        expect(() => buildingStart('space', choices, [houses[0]])).toThrow(/unknown or empty house/);
    });
});
