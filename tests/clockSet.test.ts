import { describe, expect, it } from 'vitest';
import { clockValue, initialClockSet, reachableTimes, stepClockSet, type ClockSetEvent, type ClockSetState } from '../src/core/clockSet';
import { clockHandAngles, clockSetLayout } from '../src/core/round/pictureLayout';
import { balance } from '../src/data/balance';
import { TASK_LAYOUT } from '../src/data/layout';

// The geometry comes from the screen layout, never from the reducer: every touch point is built from the layout's centre
// and hand lengths, so a reducer that disagreed with the drawn dial would miss its own hands.
const layout = clockSetLayout(TASK_LAYOUT.drag, TASK_LAYOUT.clockSet.dial);
const geo = { centre: layout.centre, hourLength: layout.hourLength, minuteLength: layout.minuteLength };
const rules = (snapMinutes: 60 | 5) => ({ snapMinutes, grabRadius: balance.clockSet.grabRadius, startDistance: balance.clockSet.startDistance });

const at = (angle: number, radius: number): { x: number; y: number } => ({
    x: layout.centre.x + Math.sin((angle * Math.PI) / 180) * radius,
    y: layout.centre.y - Math.cos((angle * Math.PI) / 180) * radius,
});
const hourTip = (hour: number, minute: number): { x: number; y: number } => at(clockHandAngles(hour, minute).hour, layout.hourLength);
const minuteTip = (minute: number): { x: number; y: number } => at(minute * 6, layout.minuteLength);

const run = (state: ClockSetState, snap: 60 | 5, events: ClockSetEvent[]): ClockSetState =>
    events.reduce((s, e) => stepClockSet(s, e, geo, rules(snap)), state);
const drag = (from: { x: number; y: number }, toAngle: number, radius: number, pointerId = 1): ClockSetEvent[] => {
    const to = at(toAngle, radius);
    return [
        { type: 'down', pointerId, ...from },
        { type: 'move', pointerId, x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
        { type: 'move', pointerId, ...to },
        { type: 'up', pointerId, ...to },
    ];
};

describe('stepClockSet: dragging a hand', () => {
    it('turns the hour hand to the nearest full hour on a full-hour clock (95 degrees is 3.00)', () => {
        const end = run(initialClockSet({ hour: 9, minute: 0 }), 60, drag(hourTip(9, 0), 95, layout.hourLength));
        expect(clockValue(end)).toBe('3.00');
        expect(end.carrying).toBeNull();
    });

    it('never makes hour 0: just either side of 12 is 12.00', () => {
        for (const angle of [2, 358, 0, 14, 346]) {
            const end = run(initialClockSet({ hour: 6, minute: 0 }), 60, drag(hourTip(6, 0), angle, layout.hourLength));
            expect(clockValue(end), `angle ${angle}`).toBe('12.00');
        }
    });

    it('keeps the minute hand still at 12 on a full-hour clock', () => {
        const start = initialClockSet({ hour: 4, minute: 0 });
        const end = run(start, 60, drag(minuteTip(0), 180, layout.minuteLength));
        expect(end.carrying).toBeNull();
        expect(clockValue(end)).toBe('4.00');
    });

    it('snaps the minute hand to five minutes (183 degrees is 30)', () => {
        const end = run(initialClockSet({ hour: 9, minute: 0 }), 5, drag(minuteTip(0), 183, layout.minuteLength));
        expect(clockValue(end)).toBe('9.30');
        expect(clockValue(run(initialClockSet({ hour: 9, minute: 0 }), 5, drag(minuteTip(0), 357, layout.minuteLength)))).toBe('9.00');
        expect(clockValue(run(initialClockSet({ hour: 9, minute: 0 }), 5, drag(minuteTip(0), 92, layout.minuteLength)))).toBe('9.15');
    });

    it('picks the hour by the angle of the hour hand, which drifts with the minutes (3.30 sits half way to 4)', () => {
        const start = initialClockSet({ hour: 9, minute: 30 });
        const grabbed = hourTip(9, 30);
        expect(clockValue(run(start, 5, drag(grabbed, 105, layout.hourLength)))).toBe('3.30');
        expect(clockValue(run(start, 5, drag(grabbed, 85, layout.hourLength)))).toBe('2.30');
        expect(clockValue(run(start, 5, drag(grabbed, 5, layout.hourLength)))).toBe('12.30');
    });

    it('goes by the angle, not by how far from the centre the finger is', () => {
        const near = run(initialClockSet({ hour: 9, minute: 0 }), 60, drag(hourTip(9, 0), 95, layout.hourLength * 0.3));
        const far = run(initialClockSet({ hour: 9, minute: 0 }), 60, drag(hourTip(9, 0), 95, layout.hourLength * 1.4));
        expect(clockValue(near)).toBe('3.00');
        expect(clockValue(far)).toBe('3.00');
    });
});

describe('stepClockSet: grabbing', () => {
    it('grabs the hand whose tip is under the finger', () => {
        const start = initialClockSet({ hour: 6, minute: 0 });
        expect(run(start, 5, [{ type: 'down', pointerId: 1, ...hourTip(6, 0) }]).carrying).toBe('hour');
        const half = initialClockSet({ hour: 9, minute: 30 });
        expect(run(half, 5, [{ type: 'down', pointerId: 1, ...minuteTip(30) }]).carrying).toBe('minute');
    });

    it('ignores a touch far from both hands', () => {
        const start = initialClockSet({ hour: 6, minute: 0 });
        const end = run(start, 5, [{ type: 'down', pointerId: 1, ...at(90, layout.minuteLength * 1.1) }]);
        expect(end.carrying).toBeNull();
    });

    it('takes the hand nearer in angle when both tips are in reach', () => {
        // 12.05: the tips are 30 degrees apart, a finger on the hour tip is in reach of both.
        const start = initialClockSet({ hour: 1, minute: 5 });
        const onHour = hourTip(1, 5);
        expect(run(start, 5, [{ type: 'down', pointerId: 1, ...onHour }]).carrying).toBe('hour');
        expect(run(start, 5, [{ type: 'down', pointerId: 1, ...minuteTip(5) }]).carrying).toBe('minute');
    });

    it('settles an exact tie in angle by the radius: past half way between the tips is the minute hand', () => {
        const start = initialClockSet({ hour: 12, minute: 0 });   // both hands at 12
        const mid = (layout.hourLength + layout.minuteLength) / 2;
        expect(run(start, 5, [{ type: 'down', pointerId: 1, ...at(0, mid - 4) }]).carrying).toBe('hour');
        expect(run(start, 5, [{ type: 'down', pointerId: 1, ...at(0, mid + 4) }]).carrying).toBe('minute');
    });

    it('does not move the hand until the finger has travelled the start distance', () => {
        const start = initialClockSet({ hour: 9, minute: 0 });
        const tip = hourTip(9, 0);
        const nudged = run(start, 60, [
            { type: 'down', pointerId: 1, ...tip },
            { type: 'move', pointerId: 1, x: tip.x + 3, y: tip.y - 3 },
            { type: 'up', pointerId: 1, x: tip.x + 3, y: tip.y - 3 },
        ]);
        expect(clockValue(nudged)).toBe('9.00');
    });
});

describe('stepClockSet: cancel, reset, other fingers', () => {
    const grabbed = (): ClockSetState => {
        const start = initialClockSet({ hour: 9, minute: 0 });
        const to = at(95, layout.hourLength);
        return run(start, 60, [{ type: 'down', pointerId: 1, ...hourTip(9, 0) }, { type: 'move', pointerId: 1, ...to }]);
    };

    it('shows the hand under the finger while it is carried', () => {
        expect(clockValue(grabbed())).toBe('3.00');
        expect(grabbed().carrying).toBe('hour');
    });

    it('puts the hands back where they were when the touch is cancelled (pointerupoutside)', () => {
        const end = stepClockSet(grabbed(), { type: 'cancel' }, geo, rules(60));
        expect(clockValue(end)).toBe('9.00');
        expect(end.carrying).toBeNull();
    });

    it('puts the hands back on reset (the scene went to sleep)', () => {
        const end = stepClockSet(grabbed(), { type: 'reset' }, geo, rules(60));
        expect(clockValue(end)).toBe('9.00');
        expect(end.carrying).toBeNull();
    });

    it('keeps a finished pose through reset', () => {
        const done = run(initialClockSet({ hour: 9, minute: 0 }), 60, drag(hourTip(9, 0), 95, layout.hourLength));
        expect(clockValue(stepClockSet(done, { type: 'reset' }, geo, rules(60)))).toBe('3.00');
    });

    it('ignores another finger while one carries a hand', () => {
        const other = at(200, layout.hourLength);
        const end = run(grabbed(), 60, [{ type: 'move', pointerId: 2, ...other }, { type: 'up', pointerId: 2, ...other }]);
        expect(clockValue(end)).toBe('3.00');
        expect(end.carrying).toBe('hour');
    });

    it('a new touch while carrying starts a new grab (not the stuck state of a lost up): the old pose returns first', () => {
        const start = initialClockSet({ hour: 9, minute: 30 });
        const mid = run(start, 5, [{ type: 'down', pointerId: 1, ...hourTip(9, 30) }, { type: 'move', pointerId: 1, ...at(105, layout.hourLength) }]);
        expect(clockValue(mid)).toBe('3.30');
        const next = stepClockSet(mid, { type: 'down', pointerId: 2, ...minuteTip(30) }, geo, rules(5));
        expect(next.carrying).toBe('minute');
        expect(next.pointerId).toBe(2);
        expect(clockValue(next)).toBe('9.30');
        // and a cancel of that second grab returns to the pose before it, not to the very first one
        expect(clockValue(stepClockSet(next, { type: 'cancel' }, geo, rules(5)))).toBe('9.30');
    });
});

describe('reachableTimes', () => {
    it('lists the 12 full hours (never 0.00) on a full-hour clock', () => {
        const times = reachableTimes(60);
        expect(times).toHaveLength(12);
        expect(times).toContain('12.00');
        expect(times).toContain('1.00');
        expect(times).not.toContain('0.00');
    });

    it('lists every five minutes of every hour on a five-minute clock', () => {
        const times = reachableTimes(5);
        expect(times).toHaveLength(144);
        expect(times).toContain('3.15');
        expect(times).toContain('12.55');
        expect(times).not.toContain('3.14');
    });
});
