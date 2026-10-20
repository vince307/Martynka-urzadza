// Change health-lines-and-smoke, phase 4 (B-3): the boot limits are read from an injected wall clock.
import { describe, expect, it } from 'vitest';
import {
    bootLimitDue,
    bootLimitSchedule,
    bootLimitWait,
    endHidden,
    hiddenMsAt,
    noHidden,
    startHidden,
} from '../src/core/bootLimits';

const limits = { slowAfterMs: 8000, totalMs: 50000 };

describe('bootLimitSchedule / bootLimitDue', () => {
    const schedule = bootLimitSchedule(limits, 1000);

    it('puts the moments relative to the start of the load', () => {
        expect(schedule).toEqual({ slowAt: 9000, cutAt: 51000 });
    });

    it('is none before the slow moment, slow between, cut from the cut moment', () => {
        expect(bootLimitDue(schedule, 1000)).toBe('none');
        expect(bootLimitDue(schedule, 8999)).toBe('none');
        expect(bootLimitDue(schedule, 9000)).toBe('slow');
        expect(bootLimitDue(schedule, 50999)).toBe('slow');
        expect(bootLimitDue(schedule, 51000)).toBe('cut');
    });

    it('counts only visible time: a tab hidden for a minute is not past the cut (audit H-1)', () => {
        const fromZero = bootLimitSchedule(limits, 0);
        const hidden = 60000; // hidden 10 000 -> 70 000
        expect(bootLimitDue(fromZero, 70000, hidden)).toBe('slow');
        expect(bootLimitDue(fromZero, 109999, hidden)).toBe('slow');
        expect(bootLimitDue(fromZero, 110000, hidden)).toBe('cut');
    });

    it('never makes a due moment earlier because of hidden time', () => {
        const order = { none: 0, slow: 1, cut: 2 } as const;
        for (const wall of [0, 5000, 8000, 30000, 50000, 80000]) {
            expect(order[bootLimitDue(schedule, wall + 1000, 1000)]).toBeLessThanOrEqual(
                order[bootLimitDue(schedule, wall + 1000)],
            );
        }
    });

    it('treats a clock that is not a number as not due', () => {
        expect(bootLimitDue(schedule, Number.NaN)).toBe('none');
    });
});

describe('bootLimitWait', () => {
    it('waits for the rest, at least 1 ms', () => {
        expect(bootLimitWait(9000, 8990.2)).toBe(10);
        expect(bootLimitWait(9000, 9000)).toBe(1);
        expect(bootLimitWait(9000, 9500)).toBe(1);
    });

    it('waits for the visible rest when the tab was hidden', () => {
        expect(bootLimitWait(50000, 70000, 60000)).toBe(40000);
    });
});

describe('hidden span', () => {
    it('is zero for a page never hidden', () => {
        expect(hiddenMsAt(noHidden, 123456)).toBe(0);
    });

    it('counts a closed span and an open one up to now', () => {
        const open = startHidden(noHidden, 10000);
        expect(hiddenMsAt(open, 25000)).toBe(15000);
        const closed = endHidden(open, 70000);
        expect(hiddenMsAt(closed, 90000)).toBe(60000);
        expect(hiddenMsAt(startHidden(closed, 100000), 105000)).toBe(65000);
    });

    it('is idempotent: a second hide or a second show changes nothing', () => {
        const open = startHidden(noHidden, 10000);
        expect(startHidden(open, 20000)).toEqual(open);
        const closed = endHidden(open, 30000);
        expect(endHidden(closed, 40000)).toEqual(closed);
        expect(hiddenMsAt(closed, 90000)).toBe(20000);
    });
});
