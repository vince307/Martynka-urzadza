// Room purchase logic (S-09), pure: no Phaser, no registry. The scene passes
// the balance in and writes the result back (plan "State sequencing").
import type { RoomDef, RoomState, RoomTaskDef } from './types';

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
    | { ok: true; state: RoomState; stars: number; bought: { taskId: string; slot: string; variant: Variant } }
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

export function purchase(room: RoomDef, state: RoomState, stars: number, variant: number): PurchaseResult {
    const task = currentTask(room, state);
    if (!task) return { ok: false, reason: 'no-task' };
    if (variant !== 0 && variant !== 1 && variant !== 2) return { ok: false, reason: 'bad-variant' };
    if (!(stars >= task.cost)) return { ok: false, reason: 'short' };
    return {
        ok: true,
        stars: stars - task.cost,
        state: { tasksDone: state.tasksDone + 1, chosen: { ...state.chosen, [task.slot]: variant } },
        bought: { taskId: task.id, slot: task.slot, variant },
    };
}
