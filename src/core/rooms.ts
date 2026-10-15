// Room purchase logic (S-09), pure: no Phaser, no registry. The scene passes
// the balance in and writes the result back (plan "State sequencing").
import type { SessionSave } from './save';
import type { LegacyRoomLayout, RoomDef, RoomListEntry, RoomState, RoomTaskDef } from './types';

type Variant = 0 | 1 | 2;

export interface TaskButtonView {
    taskId: string;
    label: string;   // text key into pl.room.tasks
    cost: number;
    affordable: boolean;
    have: number;    // clamped to cost, so "have/need" never shows have > need
    need: number;
}

export type PurchaseResult =
    | { ok: true; state: RoomState; stars: number; bought: { kind: 'stage'; taskId: string } | { kind: 'slot'; taskId: string; slot: string; variant: Variant } }
    | { ok: false; reason: 'no-task' | 'short' | 'bad-variant' };

export function emptyRoomState(): RoomState {
    return { tasksDone: 0, chosen: {} };
}

export function currentTask(room: RoomDef, state: RoomState): RoomTaskDef | null {
    return room.tasks[state.tasksDone] ?? null;
}

export function nextTaskCost(room: RoomDef, state: RoomState): number | null {
    return currentTask(room, state)?.cost ?? null;
}

export function taskButtonView(room: RoomDef, state: RoomState, stars: number): TaskButtonView | null {
    const task = currentTask(room, state);
    if (!task) return null;
    return {
        taskId: task.id,
        label: task.label,
        cost: task.cost,
        affordable: stars >= task.cost,
        have: Math.min(stars, task.cost),
        need: task.cost,
    };
}

/** `variant` is ignored for a stage task (no variant, `chosen` untouched); a slot task needs 0-2. */
export function purchase(room: RoomDef, state: RoomState, stars: number, variant: number | null): PurchaseResult {
    const task = currentTask(room, state);
    if (!task) return { ok: false, reason: 'no-task' };
    if (task.kind === 'stage') {
        if (!(stars >= task.cost)) return { ok: false, reason: 'short' };
        return {
            ok: true,
            stars: stars - task.cost,
            state: { tasksDone: state.tasksDone + 1, chosen: state.chosen },
            bought: { kind: 'stage', taskId: task.id },
        };
    }
    if (variant !== 0 && variant !== 1 && variant !== 2) return { ok: false, reason: 'bad-variant' };
    if (!(stars >= task.cost)) return { ok: false, reason: 'short' };
    return {
        ok: true,
        stars: stars - task.cost,
        state: { tasksDone: state.tasksDone + 1, chosen: { ...state.chosen, [task.slot]: variant } },
        bought: { kind: 'slot', taskId: task.id, slot: task.slot, variant },
    };
}

/** How many `stage` tasks are done: the stage tasks inside the done prefix of the task list. */
export function stagesDone(room: RoomDef, state: RoomState): number {
    return room.tasks.slice(0, state.tasksDone).filter((t) => t.kind === 'stage').length;
}

export function roomDone(room: RoomDef, state: RoomState): boolean {
    return state.tasksDone >= room.tasks.length;
}

export interface RoomListItem {
    kind: 'room' | 'teaser';
    id: string | null;        // room id, null for a teaser
    nameKey: string | null;   // the room's key into pl.room.name, null for a teaser
    done: boolean;            // only a room can be done
    unlocked: boolean;
}

export function roomsListView(
    order: readonly RoomListEntry[],
    rooms: Readonly<Record<string, RoomDef>>,
    states: Readonly<Record<string, RoomState>>,
): RoomListItem[] {
    return order.map((entry) => {
        const id = 'room' in entry ? entry.room : null;
        const room = id === null ? undefined : rooms[id];
        const done = room !== undefined && id !== null && roomDone(room, states[id] ?? emptyRoomState());
        const after = entry.unlockAfter;
        const afterRoom = after === undefined ? undefined : rooms[after];
        const unlocked = after === undefined
            || (afterRoom !== undefined && roomDone(afterRoom, states[after] ?? emptyRoomState()));
        return { kind: id === null ? 'teaser' : 'room', id, nameKey: id, done, unlocked };
    });
}

/**
 * A save may name a room this build does not know (a renamed or removed room). The game then starts in the first
 * room; every other room's saved state is carried over unchanged, so a later build that knows it again finds it intact.
 * Pure: writes nothing, never mutates its input.
 */
export function repairCurrentRoom(
    session: SessionSave,
    knownIds: readonly string[],
    firstRoom: string,
): { session: SessionSave; repairedFrom: string | null } {
    if (knownIds.includes(session.currentRoom)) return { session, repairedFrom: null };
    const rooms = Object.prototype.hasOwnProperty.call(session.rooms, firstRoom)
        ? { ...session.rooms }
        : { ...session.rooms, [firstRoom]: emptyRoomState() };
    return { session: { ...session, currentRoom: firstRoom, rooms }, repairedFrom: session.currentRoom };
}

/**
 * A salon saved under the old 10-task list (S-16a) is carried to the new list at load. The marker is a `chosen` key that
 * is no slot of the new room (the old `floor`, `walls`, ...). Rule B: the new prefix is the shortest one whose cost
 * covers what the old prefix cost (rounding up, so nothing bought is lost), capped at the whole list; stars are never
 * touched and nothing is refunded. Every furniture task of the new prefix gets a `chosen` entry, the carried variant
 * (by `legacy.renames`) or 0 for a piece the rounding gifts, so it is drawn and can be changed. Pure, idempotent: with no
 * old key the very same session comes back. Other rooms and fields are kept as they are.
 */
export function remapLegacySalon(
    session: SessionSave,
    legacy: LegacyRoomLayout,
    room: Pick<RoomDef, 'tasks'>,
): { session: SessionSave; remappedFrom: number | null } {
    const unchanged = { session, remappedFrom: null };
    const old = Object.prototype.hasOwnProperty.call(session.rooms, legacy.roomId) ? session.rooms[legacy.roomId] : undefined;
    if (old === undefined) return unchanged;
    const newSlots = new Set(room.tasks.flatMap((t) => (t.kind === 'slot' ? [t.slot] : [])));
    if (!Object.keys(old.chosen).some((key) => !newSlots.has(key))) return unchanged;

    const spent = legacy.tasks.slice(0, old.tasksDone).reduce((sum, t) => sum + t.cost, 0);
    let prefix = 0;
    let cost = 0;
    while (prefix < room.tasks.length && cost < spent) {
        cost += room.tasks[prefix].cost;
        prefix += 1;
    }
    const carried: Record<string, 0 | 1 | 2> = {};
    for (const [key, variant] of Object.entries(old.chosen)) carried[legacy.renames[key] ?? key] = variant;
    const chosen: RoomState['chosen'] = {};
    for (const task of room.tasks.slice(0, prefix)) {
        if (task.kind === 'slot') chosen[task.slot] = carried[task.slot] ?? 0;
    }
    return {
        session: { ...session, rooms: { ...session.rooms, [legacy.roomId]: { tasksDone: prefix, chosen } } },
        remappedFrom: old.tasksDone,
    };
}
