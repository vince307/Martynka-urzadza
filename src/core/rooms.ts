// Room purchase logic (S-09), pure: no Phaser, no registry. The scene passes
// the balance in and writes the result back (plan "State sequencing").
import type { SessionSave } from './save';
import type { LayerDef, RoomDef, RoomListEntry, RoomState, RoomTaskDef, SlotDef } from './types';

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

/** The variant a slot shows: the bought one; else its `shownBeforePurchase` once a stage task is done; else null (nothing). */
export function shownVariant(room: RoomDef, state: RoomState, slotId: string): Variant | null {
    const bought = state.chosen[slotId];
    if (bought === 0 || bought === 1 || bought === 2) return bought;
    const slot = room.slots.find((s) => s.id === slotId);
    if (slot?.shownBeforePurchase === undefined || stagesDone(room, state) === 0) return null;
    return slot.shownBeforePurchase;
}

/** Every slot that shows something, keyed by slot id. */
export function shownVariants(room: RoomDef, state: RoomState): Record<string, Variant> {
    const out: Record<string, Variant> = {};
    for (const slot of room.slots) {
        const v = shownVariant(room, state, slot.id);
        if (v !== null) out[slot.id] = v;
    }
    return out;
}

export type RoomProblemKind = 'unknown-room' | 'tasks-overflow' | 'unknown-slot' | 'chosen-not-bought' | 'variant-out-of-range';
export interface RoomProblem { room: string; kind: RoomProblemKind }

/**
 * Where a saved room state disagrees with the catalogue (R-4). Report only: nothing here changes, drops or repairs a room.
 */
export function roomStateProblems(rooms: Readonly<Record<string, RoomState>>, catalogue: Readonly<Record<string, RoomDef>>): RoomProblem[] {
    const out: RoomProblem[] = [];
    for (const [id, state] of Object.entries(rooms)) {
        const def = Object.prototype.hasOwnProperty.call(catalogue, id) ? catalogue[id] : undefined;
        if (!def) {
            out.push({ room: id, kind: 'unknown-room' });
            continue;
        }
        const kinds = new Set<RoomProblemKind>();
        if (state.tasksDone > def.tasks.length) kinds.add('tasks-overflow');
        for (const [slotId, variant] of Object.entries(state.chosen)) {
            const slot = def.slots.find((s) => s.id === slotId);
            if (!slot) {
                kinds.add('unknown-slot');
                continue;
            }
            const taskIndex = def.tasks.findIndex((t) => t.kind === 'slot' && t.slot === slotId);
            if (taskIndex < 0 || taskIndex >= state.tasksDone) kinds.add('chosen-not-bought');
            if (!Number.isInteger(variant) || variant < 0 || variant >= slot.variants.length) kinds.add('variant-out-of-range');
        }
        for (const kind of kinds) out.push({ room: id, kind });
    }
    return out;
}

/** A room this build does not know (an older placeholder build may have saved one) is logged, never shown to a parent. */
export function parentVisible(problem: RoomProblem): boolean {
    return problem.kind !== 'unknown-room';
}

/**
 * R-2: a room whose task list grew since the save was written. A saved `tasksDone` equal to a length the list once had
 * (`RoomDef.formerTaskCounts`) while the list is now longer means the child meets new tasks. Log only: it is not a
 * `RoomProblemKind`, nothing is repaired or shown to a parent. It also names a child who really bought exactly that many under the new list.
 */
export function roomGrowth(rooms: Readonly<Record<string, RoomState>>, catalogue: Readonly<Record<string, RoomDef>>): { room: string; from: number; to: number }[] {
    const out: { room: string; from: number; to: number }[] = [];
    for (const [id, state] of Object.entries(rooms)) {
        const def = Object.prototype.hasOwnProperty.call(catalogue, id) ? catalogue[id] : undefined;
        if (def && state.tasksDone < def.tasks.length && (def.formerTaskCounts ?? []).includes(state.tasksDone)) {
            out.push({ room: id, from: state.tasksDone, to: def.tasks.length });
        }
    }
    return out;
}

export interface WornPiece { id: string; key: string; x: number; y: number; width: number; height: number; z: number; soft: boolean }
export interface ContactShadowPiece { id: string; cx: number; cy: number; width: number; height: number }

const findPiece = (room: RoomDef, id: string): { slot: SlotDef } | { layer: LayerDef } => {
    const slot = room.slots.find((s) => s.id === id);
    if (slot !== undefined) return { slot };
    const layer = room.decor.find((d) => d.id === id);
    if (layer !== undefined) return { layer };
    throw new Error(`Unknown room piece "${id}" in room "${room.id}"`);
};

/** The worn set the room shows before its stage task: graded copies of the real furniture, sorted by `z`. Never part of `chosen` or `shownVariants`. */
export function wornPieces(room: RoomDef, state: RoomState): WornPiece[] {
    const out = room.worn.map((w): WornPiece => {
        const found = findPiece(room, w.piece);
        const art = 'slot' in found ? found.slot : found.layer;
        const key = 'slot' in found ? found.slot.variants[w.variant ?? 0] : found.layer.key;
        return { id: art.id, key, x: art.x, y: art.y, width: art.width, height: art.height, z: art.z, soft: w.soft === true };
    });
    if (stagesDone(room, state) > 0) return [];
    return out.sort((a, b) => a.z - b.z);
}

/** Soft ellipses under the pieces that stand on the floor, right after the stage and until the room is done. */
export function contactShadowPieces(room: RoomDef, state: RoomState, heightRatio: number): ContactShadowPiece[] {
    if (stagesDone(room, state) === 0 || roomDone(room, state)) return [];
    const out: ContactShadowPiece[] = [];
    for (const def of room.contactShadows) {
        const found = findPiece(room, def.piece);
        if ('slot' in found && shownVariant(room, state, found.slot.id) === null) continue;
        const art = 'slot' in found ? found.slot : found.layer;
        const width = art.visibleRect[2] * def.widthFactor;
        out.push({ id: art.id, cx: art.x + art.anchor[0] + def.offset[0], cy: art.y + art.anchor[1] + def.offset[1], width, height: width * heightRatio });
    }
    return out;
}
