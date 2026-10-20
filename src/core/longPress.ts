// Long-press gesture as a pure reducer (S-08, plan "Maszyna przytrzymania").
// Time is always an argument (the scene passes the loop clock), never read
// from pointer timestamps. One finger only: a second finger ends the gesture.
// `tap` is true only on the release of the held finger while still holding
// (short and steady); a drifted, cancelled or fired press never taps (F-02).
export type LongPressState =
    | { kind: 'idle' }
    | { kind: 'holding'; id: number; x: number; y: number; since: number }
    | { kind: 'fired'; id: number };

export type LongPressEvent =
    | { type: 'down'; id: number; x: number; y: number; now: number }
    | { type: 'move'; id: number; x: number; y: number }
    | { type: 'up'; id: number }
    | { type: 'cancel' }
    | { type: 'reset' }
    | { type: 'tick'; now: number };

export interface LongPressRules {
    /** Milliseconds the finger must stay down. */
    holdMs: number;
    /** Largest drift from the start point, in game pixels. */
    moveTolerance: number;
}

export const IDLE: LongPressState = { kind: 'idle' };

const idle = (): { state: LongPressState; fire: boolean; tap: boolean } => ({ state: IDLE, fire: false, tap: false });

/** Next state and whether the gesture fired on this event (at most once per gesture). */
export const longPress = (
    state: LongPressState,
    event: LongPressEvent,
    rules: LongPressRules,
): { state: LongPressState; fire: boolean; tap: boolean } => {
    const same = { state, fire: false, tap: false };
    if (event.type === 'cancel' || event.type === 'reset') return idle();
    switch (state.kind) {
        case 'idle':
            if (event.type === 'down') {
                return { state: { kind: 'holding', id: event.id, x: event.x, y: event.y, since: event.now }, fire: false, tap: false };
            }
            return same;
        case 'holding':
            if (event.type === 'down') return event.id === state.id ? same : idle();
            if (event.type === 'up') return event.id === state.id ? { state: IDLE, fire: false, tap: true } : same;
            if (event.type === 'move') {
                if (event.id !== state.id) return same;
                return Math.hypot(event.x - state.x, event.y - state.y) > rules.moveTolerance ? idle() : same;
            }
            if (event.now - state.since >= rules.holdMs) return { state: { kind: 'fired', id: state.id }, fire: true, tap: false };
            return same;
        case 'fired':
            return event.type === 'up' && event.id === state.id ? idle() : same;
    }
};
