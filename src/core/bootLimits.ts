// Pure scheduler for the boot limits on the wall clock (audit B-3): the scene arms window timers and asks this rule,
// with performance.now() injected, whether the slow line or the total cut is due. A paused game loop does not pause it.
import type { BootLimits } from './bootLoad';

export interface BootLimitSchedule {
    /** Wall-clock moment (ms, the injected clock) from which the slow line is due. */
    readonly slowAt: number;
    /** Wall-clock moment from which the total cut is due. */
    readonly cutAt: number;
}

export type BootLimitDue = 'none' | 'slow' | 'cut';

export const bootLimitSchedule = (limits: BootLimits, now: number): BootLimitSchedule => ({
    slowAt: now + limits.slowAfterMs,
    cutAt: now + limits.totalMs,
});

export const bootLimitDue = (schedule: BootLimitSchedule, now: number): BootLimitDue => {
    if (!(now >= schedule.slowAt)) return 'none'; // also NaN
    return now >= schedule.cutAt ? 'cut' : 'slow';
};

/** How long a timer that fired early must wait for the moment to come; at least 1 ms. */
export const bootLimitWait = (at: number, now: number): number => Math.max(1, Math.ceil(at - now));
