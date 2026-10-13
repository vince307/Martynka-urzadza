// Child's hold / tap gesture in the room (S-10), pure, built on longPress.
// The scene looks up the slot under the finger at `down` and feeds events here.
import { IDLE, longPress } from './longPress';
import type { LongPressEvent, LongPressRules, LongPressState } from './longPress';

export interface RoomGestureState { press: LongPressState; slot: string | null }
export const ROOM_GESTURE_IDLE: RoomGestureState = { press: IDLE, slot: null };

export function roomGesture(
    state: RoomGestureState,
    event: LongPressEvent,
    ctx: { mode: 'normal' | 'change'; slot: string | null; rules: LongPressRules },
): { state: RoomGestureState; open: string | null; held: string | null } {
    // ctx.slot is read only at `down`; an empty press starts nothing.
    const slot = event.type === 'down' ? ctx.slot : state.slot;
    if (event.type === 'down' && slot === null) return { state: ROOM_GESTURE_IDLE, open: null, held: null };
    const before = state.press;
    const r = longPress(before, event, ctx.rules);
    let open: string | null = null;
    if (r.fire) open = slot;
    else if (event.type === 'up' && before.kind === 'holding' && r.state.kind === 'idle' && ctx.mode === 'change') open = slot;
    const held = r.state.kind === 'holding' ? slot : null;
    const next: RoomGestureState = r.state.kind === 'idle' ? ROOM_GESTURE_IDLE : { press: r.state, slot };
    return { state: next, open, held };
}
