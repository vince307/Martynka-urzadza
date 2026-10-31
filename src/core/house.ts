// House rules (F-04): which rooms a house lists, which one is in renovation, how a saved house meets the data house.
// Pure: no Phaser, no data import, every returned house or array is a fresh copy and no input is mutated.
import { emptyRoomState, roomDone } from './rooms';
import type { HouseRoomPlace, HouseState, RoomDef, RoomListEntry, RoomState } from './types';

type Known = Readonly<Record<string, RoomDef>>;

const known1 = (known: Known, id: string): RoomDef | undefined => (Object.prototype.hasOwnProperty.call(known, id) ? known[id] : undefined);
const copyCell = (c: HouseRoomPlace): HouseRoomPlace => ({ room: c.room, floor: c.floor, place: c.place });
export const copyHouse = (h: HouseState): HouseState => ({ id: h.id, rooms: h.rooms.map(copyCell) });

/** The rooms of a house in order while the build knows them; the first unknown room becomes a teaser and ends the list. */
export function houseRoomList(house: HouseState, known: Known): RoomListEntry[] {
    const list: RoomListEntry[] = [];
    let previous: string | null = null;
    for (const cell of house.rooms) {
        if (known1(known, cell.room) === undefined) {
            if (previous !== null) list.push({ teaser: true, unlockAfter: previous });
            break;
        }
        list.push(previous === null ? { room: cell.room } : { room: cell.room, unlockAfter: previous });
        previous = cell.room;
    }
    return list;
}

/** The first known room of the house that is not done, or null when every known room is done. */
export function roomInRenovation(house: HouseState, known: Known, states: Readonly<Record<string, RoomState>>): string | null {
    for (const cell of house.rooms) {
        const room = known1(known, cell.room);
        if (room === undefined) continue;
        const state = Object.prototype.hasOwnProperty.call(states, cell.room) ? states[cell.room] : emptyRoomState();
        if (!roomDone(room, state)) return cell.room;
    }
    return null;
}

/** The room the game opens in: the one in renovation, else the current one. A room moved to gets its empty state. */
export function nextRoom(
    session: { rooms: Record<string, RoomState>; currentRoom: string },
    house: HouseState,
    known: Known,
): { rooms: Record<string, RoomState>; currentRoom: string; movedFrom: string | null } {
    const target = roomInRenovation(house, known, session.rooms) ?? session.currentRoom;
    const rooms = { ...session.rooms };
    if (target === session.currentRoom) return { rooms, currentRoom: target, movedFrom: null };
    if (!Object.prototype.hasOwnProperty.call(rooms, target)) rooms[target] = emptyRoomState();
    return { rooms, currentRoom: target, movedFrom: session.currentRoom };
}

/** Data rooms in data order, then the saved rooms the data does not list (kept, appended, reported). */
export function mergeHouse(saved: HouseState, data: HouseState): { house: HouseState; extraRooms: string[] } {
    const inData = new Set(data.rooms.map((c) => c.room));
    const extra = saved.rooms.filter((c) => !inData.has(c.room));
    return {
        house: { id: saved.id, rooms: [...data.rooms.map(copyCell), ...extra.map(copyCell)] },
        extraRooms: extra.map((c) => c.room),
    };
}

/** The data house with the saved id; an unknown id gets the first house. */
export function houseLayout(saved: HouseState, houses: readonly HouseState[], first: HouseState): HouseState {
    return copyHouse(houses.find((h) => h.id === saved.id) ?? first);
}

/** Structural equality: same id, same cells in the same order. The load path decides "dirty" with this, never by reference. */
export function houseEqual(a: HouseState, b: HouseState): boolean {
    return a.id === b.id
        && a.rooms.length === b.rooms.length
        && a.rooms.every((c, i) => c.room === b.rooms[i].room && c.floor === b.rooms[i].floor && c.place === b.rooms[i].place);
}

/** The rooms of a house present in `known`, in house order (a fresh array). */
export function houseRoomIds(house: HouseState, known: Known): string[] {
    return house.rooms.filter((c) => known1(known, c.room) !== undefined).map((c) => c.room);
}
