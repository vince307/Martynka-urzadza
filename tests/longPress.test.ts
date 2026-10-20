// Long-press gesture (S-08 phase 2). Oracle: PRD US-03 AC and the plan's
// Critical Implementation Details: 2000 ms hold, 30 game px tolerance, one
// fire per gesture, a second finger or a cancel ends it. Thresholds are
// written out here on purpose, not read from the implementation.
import { describe, expect, it } from 'vitest';
import { IDLE, longPress, type LongPressEvent, type LongPressRules, type LongPressState } from '../src/core/longPress';
import { balance } from '../src/data/balance';

const rules: LongPressRules = { holdMs: 2000, moveTolerance: 30 };

const run = (events: LongPressEvent[], start: LongPressState = IDLE) => {
    let state = start;
    let fires = 0;
    for (const e of events) {
        const r = longPress(state, e, rules);
        state = r.state;
        if (r.fire) fires += 1;
    }
    return { state, fires };
};
const down = (id = 1, x = 100, y = 100, now = 1000): LongPressEvent => ({ type: 'down', id, x, y, now });
const tick = (now: number): LongPressEvent => ({ type: 'tick', now });

describe('balance.parentSettings', () => {
    it('holds the numbers of the plan', () => {
        expect(balance.parentSettings.holdMs).toBe(2000);
        expect(balance.parentSettings.moveTolerance).toBe(30);
        expect(balance.parentSettings.weakestCount).toBe(3);
        expect(balance.parentSettings.examplesPerSkill).toBe(2);
    });
});

describe('longPress', () => {
    it('a short tap (down, up) never fires', () => {
        const r = run([down(), tick(1100), { type: 'up', id: 1 }, tick(5000)]);
        expect(r.fires).toBe(0);
        expect(r.state.kind).toBe('idle');
    });

    it('does not fire at 1999 ms', () => {
        const r = run([down(), tick(2999)]);
        expect(r.fires).toBe(0);
        expect(r.state.kind).toBe('holding');
    });

    it('fires at exactly 2000 ms', () => {
        const r = run([down(), tick(3000)]);
        expect(r.fires).toBe(1);
        expect(r.state).toEqual({ kind: 'fired', id: 1 });
    });

    it('fires exactly once however many ticks follow', () => {
        const r = run([down(), tick(3000), tick(3016), tick(4000), tick(9000)]);
        expect(r.fires).toBe(1);
        expect(r.state.kind).toBe('fired');
    });

    it('a move of 30 px keeps the hold, 31 px cancels it', () => {
        expect(run([down(), { type: 'move', id: 1, x: 130, y: 100 }, tick(3000)]).fires).toBe(1);
        const far = run([down(), { type: 'move', id: 1, x: 131, y: 100 }, tick(3000)]);
        expect(far.fires).toBe(0);
        expect(far.state.kind).toBe('idle');
    });

    it('measures the tolerance as a euclidean distance (22 + 22 is over 30)', () => {
        expect(run([down(), { type: 'move', id: 1, x: 122, y: 122 }, tick(3000)]).fires).toBe(0);
        expect(run([down(), { type: 'move', id: 1, x: 121, y: 121 }, tick(3000)]).fires).toBe(1);
    });

    it('measures from the start point, not from the last move', () => {
        const r = run([
            down(),
            { type: 'move', id: 1, x: 120, y: 100 },
            { type: 'move', id: 1, x: 140, y: 100 },
            tick(3000),
        ]);
        expect(r.fires).toBe(0);
    });

    it('cancel and reset end a hold', () => {
        expect(run([down(), { type: 'cancel' }, tick(3000)]).fires).toBe(0);
        expect(run([down(), { type: 'reset' }, tick(3000)]).fires).toBe(0);
    });

    it('a second finger cancels the hold', () => {
        const r = run([down(1), down(2, 300, 300, 1500), tick(3000), tick(3600)]);
        expect(r.fires).toBe(0);
        expect(r.state.kind).toBe('idle');
    });

    it('ignores up and move of another finger', () => {
        const r = run([down(1), { type: 'up', id: 2 }, { type: 'move', id: 2, x: 900, y: 900 }, tick(3000)]);
        expect(r.fires).toBe(1);
    });

    it('fired ignores moves and downs, up returns to idle, then a new gesture works', () => {
        const fired: LongPressState = { kind: 'fired', id: 1 };
        expect(run([{ type: 'move', id: 1, x: 900, y: 900 }, down(2)], fired).state).toEqual(fired);
        expect(run([{ type: 'up', id: 2 }], fired).state).toEqual(fired);
        const again = run([down(), tick(3000), { type: 'up', id: 1 }, down(1, 50, 50, 10000), tick(12000)]);
        expect(again.fires).toBe(2);
    });

    it('cancel and reset clear a fired state', () => {
        expect(run([{ type: 'cancel' }], { kind: 'fired', id: 1 }).state.kind).toBe('idle');
        expect(run([{ type: 'reset' }], { kind: 'fired', id: 1 }).state.kind).toBe('idle');
    });

    it('tick and up in idle do nothing', () => {
        const r = run([tick(5000), { type: 'up', id: 1 }]);
        expect(r.fires).toBe(0);
        expect(r.state.kind).toBe('idle');
    });
});

describe('longPress tap outcome (F-02)', () => {
    const step = (state: LongPressState, e: LongPressEvent) => longPress(state, e, rules);
    const taps = (events: LongPressEvent[]) => {
        let state: LongPressState = IDLE;
        const out: { fire: boolean; tap: boolean }[] = [];
        for (const e of events) {
            const r = step(state, e);
            state = r.state;
            out.push({ fire: r.fire, tap: r.tap });
        }
        return out;
    };
    it('a short steady press reports a tap on up and never fires', () => {
        const r = taps([down(), { type: 'up', id: 1 }]);
        expect(r[1]).toEqual({ fire: false, tap: true });
        expect(r.some((x) => x.fire)).toBe(false);
    });
    it('a press that drifted past the tolerance is not a tap', () => {
        const r = taps([down(), { type: 'move', id: 1, x: 200, y: 100 }, { type: 'up', id: 1 }]);
        expect(r.some((x) => x.tap)).toBe(false);
    });
    it('a full hold fires once and its release is not a tap', () => {
        const r = taps([down(), tick(3100), { type: 'up', id: 1 }]);
        expect(r.filter((x) => x.fire)).toHaveLength(1);
        expect(r.some((x) => x.tap)).toBe(false);
    });
    it('a second finger or a cancel ends the gesture without a tap', () => {
        expect(taps([down(), down(2), { type: 'up', id: 1 }]).some((x) => x.tap)).toBe(false);
        expect(taps([down(), { type: 'cancel' }, { type: 'up', id: 1 }]).some((x) => x.tap)).toBe(false);
    });
});
