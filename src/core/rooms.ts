// Room purchase logic (S-09), pure: no Phaser, no registry. The scene passes
// the balance in and writes the result back (plan "State sequencing").
import type { SessionSave } from './save';
import type { RoomDef, RoomListEntry, RoomState, RoomTaskDef } from './types';

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
