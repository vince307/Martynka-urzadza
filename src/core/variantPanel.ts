// Variant panel reducer (S-09, test-plan risk #16): the only way the scene spends stars;
// the change branch (S-10) never spends.
import { currentTask, purchase } from './rooms';
import type { PurchaseResult } from './rooms';
import type { RoomDef, RoomState } from './types';

export type Preview = 0 | 1 | 2 | null;
export type PanelState =
    | { kind: 'closed' }
    | { kind: 'open'; mode: 'buy'; taskId: string; preview: Preview }
    | { kind: 'open'; mode: 'change'; slot: string; preview: Preview };
export type PanelEvent = { type: 'open' } | { type: 'pick'; variant: 0 | 1 | 2 } | { type: 'confirm' } | { type: 'close' } | { type: 'change'; slot: string };
export type Bought = Extract<PurchaseResult, { ok: true }>['bought'];
export interface PanelContext { room: RoomDef; state: RoomState; stars: number }
export interface PanelStep { panel: PanelState; state: RoomState; stars: number; bought: Bought | null; changed: { slot: string; variant: 0 | 1 | 2 } | null }

export function stepPanel(panel: PanelState, event: PanelEvent, ctx: PanelContext): PanelStep {
    const { room, state, stars } = ctx;
    const same = (next: PanelState): PanelStep => ({ panel: next, state, stars, bought: null, changed: null });
    const task = currentTask(room, state);

    if (panel.kind === 'closed') {
        if (event.type === 'change') {
            const known = room.slots.some((s) => s.id === event.slot);
            if (!known || state.chosen[event.slot] === undefined) return same(panel);
            return same({ kind: 'open', mode: 'change', slot: event.slot, preview: null });
        }
        if (event.type !== 'open' || !task || !(stars >= task.cost)) return same(panel);
        if (task.kind === 'stage') {
            // A stage has no variant panel: one tap buys it. Only this branch and the confirm below spend stars.
            const bought = purchase(room, state, stars, null);
            if (!bought.ok) return same(panel);
            return { panel, state: bought.state, stars: bought.stars, bought: bought.bought, changed: null };
        }
        return same({ kind: 'open', mode: 'buy', taskId: task.id, preview: null });
    }
    // Open panel: a panel for a task that is no longer the current one is stale.
    if (event.type === 'close') return same({ kind: 'closed' });
    if (event.type === 'open' || event.type === 'change') return same(panel);
    if (panel.mode === 'change') return stepChange(panel, event, ctx);
    if (!task || task.kind !== 'slot' || task.id !== panel.taskId) return same({ kind: 'closed' });
    if (event.type === 'pick') return same({ kind: 'open', mode: 'buy', taskId: panel.taskId, preview: event.variant });
    if (panel.preview === null) return same(panel);
    const result = purchase(room, state, stars, panel.preview);
    if (!result.ok) return same(panel);
    return { panel: { kind: 'closed' }, state: result.state, stars: result.stars, bought: result.bought, changed: null };
}

function stepChange(
    panel: Extract<PanelState, { kind: 'open'; mode: 'change' }>,
    event: Extract<PanelEvent, { type: 'pick' | 'confirm' }>,
    ctx: PanelContext,
): PanelStep {
    const { state, stars } = ctx;
    if (event.type === 'pick') return { panel: { ...panel, preview: event.variant }, state, stars, bought: null, changed: null };
    if (panel.preview === null) return { panel, state, stars, bought: null, changed: null };
    const changed = { slot: panel.slot, variant: panel.preview };
    const next: RoomState = { tasksDone: state.tasksDone, chosen: { ...state.chosen, [panel.slot]: panel.preview } };
    return { panel: { kind: 'closed' }, state: next, stars, bought: null, changed };
}
