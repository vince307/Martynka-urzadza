// Change health-lines-and-smoke, phase 4 (B-3): the boot limits are read from an injected wall clock.
import { describe, expect, it } from 'vitest';
import { bootLimitDue, bootLimitSchedule, bootLimitWait } from '../src/core/bootLimits';

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

    it('counts the wall clock: a tab hidden for a minute is past the cut at once', () => {
        expect(bootLimitDue(schedule, 1000 + 60000)).toBe('cut');
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
});
