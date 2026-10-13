// Child's gesture in the room (S-10 phase 1). Oracle: FR-018 / US-02 AC: holding a furnished
// piece opens its change panel, a tap outside change mode opens nothing, in change mode a tap
// does, and lifting the finger after the hold fired opens nothing more. Thresholds are written out.
import { describe, expect, it } from 'vitest';
import { ROOM_GESTURE_IDLE, roomGesture } from '../src/core/roomGesture';
import type { RoomGestureState } from '../src/core/roomGesture';
import type { LongPressEvent, LongPressRules } from '../src/core/longPress';

const rules: LongPressRules = { holdMs: 600, moveTolerance: 40 };
type Mode = 'normal' | 'change';

const run = (events: Array<[LongPressEvent, string | null]>, mode: Mode = 'normal') => {
    let state: RoomGestureState = ROOM_GESTURE_IDLE;
    const opens: Array<string | null> = [];
    let held: string | null = null;
    for (const [e, slot] of events) {
        const r = roomGesture(state, e, { mode, slot, rules });
        state = r.state;
        held = r.held;
        opens.push(r.open);
    }
    return { state, opens, held };
};
const down = (now = 1000): LongPressEvent => ({ type: 'down', id: 1, x: 100, y: 100, now });
const tick = (now: number): LongPressEvent => ({ type: 'tick', now });
const up: LongPressEvent = { type: 'up', id: 1 };

describe('roomGesture', () => {
    it('a tap outside change mode opens nothing', () => {
        expect(run([[down(), 'sofa'], [tick(1100), null], [up, null]]).opens.every((o) => o === null)).toBe(true);
    });
    it('a tap in change mode opens the slot under the finger', () => {
        const r = run([[down(), 'sofa'], [tick(1100), null], [up, null]], 'change');
        expect(r.opens).toEqual([null, null, 'sofa']);
    });
    it('holding for the threshold opens the slot exactly once', () => {
        const r = run([[down(), 'rug'], [tick(1599), null], [tick(1600), null], [tick(2500), null]]);
        expect(r.opens).toEqual([null, null, 'rug', null]);
    });
    it('shows the held slot while the finger is down, before and not after firing', () => {
        expect(run([[down(), 'rug'], [tick(1100), null]]).held).toBe('rug');
        expect(run([[down(), 'rug'], [tick(1700), null]]).held).toBeNull();
    });
    it('lifting after the hold fired opens nothing more, in either mode', () => {
        for (const mode of ['normal', 'change'] as const) {
            const r = run([[down(), 'sofa'], [tick(1700), null], [up, null]], mode);
            expect(r.opens).toEqual([null, 'sofa', null]);
        }
    });
    it('drift beyond the tolerance, cancel or reset ends the gesture', () => {
        const drift: LongPressEvent = { type: 'move', id: 1, x: 300, y: 100 };
        for (const end of [drift, { type: 'cancel' } as LongPressEvent, { type: 'reset' } as LongPressEvent]) {
            const r = run([[down(), 'sofa'], [end, null], [tick(3000), null], [up, null]], 'change');
            expect(r.opens.every((o) => o === null)).toBe(true);
            expect(r.state).toEqual(ROOM_GESTURE_IDLE);
            expect(r.held).toBeNull();
        }
    });
    it('a press on nothing starts nothing', () => {
        const r = run([[down(), null], [tick(3000), null], [up, null]], 'change');
        expect(r.opens.every((o) => o === null)).toBe(true);
        expect(r.state).toEqual(ROOM_GESTURE_IDLE);
    });
});
