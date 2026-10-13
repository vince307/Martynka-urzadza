// Variant panel reducer (S-09, test-plan risk #16): the only way the scene spends stars.
import { currentTask, purchase } from './rooms';
import type { PurchaseResult } from './rooms';
import type { RoomDef, RoomState } from './types';

export type Preview = 0 | 1 | 2 | null;
export type PanelState = { kind: 'closed' } | { kind: 'open'; taskId: string; preview: Preview };
export type PanelEvent = { type: 'open' } | { type: 'pick'; variant: 0 | 1 | 2 } | { type: 'confirm' } | { type: 'close' };
export type Bought = Extract<PurchaseResult, { ok: true }>['bought'];
export interface PanelContext { room: RoomDef; state: RoomState; stars: number }
export interface PanelStep { panel: PanelState; state: RoomState; stars: number; bought: Bought | null }

export function stepPanel(panel: PanelState, event: PanelEvent, ctx: PanelContext): PanelStep {
    const { room, state, stars } = ctx;
    const same = (next: PanelState): PanelStep => ({ panel: next, state, stars, bought: null });
    const task = currentTask(room, state);

    if (panel.kind === 'closed') {
        if (event.type !== 'open' || !task || !(stars >= task.cost)) return same(panel);
        return same({ kind: 'open', taskId: task.id, preview: null });
    }
    // Open panel: a panel for a task that is no longer the current one is stale.
    if (event.type === 'close') return same({ kind: 'closed' });
    if (event.type === 'open') return same(panel);
    if (!task || task.id !== panel.taskId) return same({ kind: 'closed' });
    if (event.type === 'pick') return same({ kind: 'open', taskId: panel.taskId, preview: event.variant });
    if (panel.preview === null) return same(panel);
    const result = purchase(room, state, stars, panel.preview);
    if (!result.ok) return same(panel);
    return { panel: { kind: 'closed' }, state: result.state, stars: result.stars, bought: result.bought };
}
