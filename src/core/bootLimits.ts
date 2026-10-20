// Pure scheduler for the boot limits (audit B-3, H-1): the scene arms window timers and asks this rule, with
// performance.now() injected, whether the slow line or the total cut is due. The limits count the wall clock minus the
// time the tab was hidden (the Phaser queue advances only on scene updates, which stop in a hidden tab).
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

/** Time the tab spent hidden: a closed total plus the start of a span still open. */
export interface HiddenSpan {
    readonly since: number | null;
    readonly total: number;
}

export const noHidden: HiddenSpan = { since: null, total: 0 };

/** A hide while a span is already open changes nothing. */
export const startHidden = (span: HiddenSpan, now: number): HiddenSpan =>
    span.since !== null ? span : { since: now, total: span.total };

/** A show without an open span changes nothing. */
export const endHidden = (span: HiddenSpan, now: number): HiddenSpan =>
    span.since === null ? span : { since: null, total: span.total + Math.max(0, now - span.since) };

/** Hidden milliseconds up to `now`, counting an open span. */
export const hiddenMsAt = (span: HiddenSpan, now: number): number =>
    span.total + (span.since === null ? 0 : Math.max(0, now - span.since));

/** `hiddenMs` is the hidden total at `wall`; the limits run on `wall - hiddenMs`. */
export const bootLimitDue = (schedule: BootLimitSchedule, wall: number, hiddenMs = 0): BootLimitDue => {
    const now = wall - hiddenMs;
    if (!(now >= schedule.slowAt)) return 'none'; // also NaN
    return now >= schedule.cutAt ? 'cut' : 'slow';
};

/** How long a timer that fired early must wait for the moment to come; at least 1 ms. */
export const bootLimitWait = (at: number, wall: number, hiddenMs = 0): number =>
    Math.max(1, Math.ceil(at - (wall - hiddenMs)));

/** True once the visible time reaches `at`; a timer that fired a hair early asks this and waits for the rest. */
export const bootLimitReached = (at: number, wall: number, hiddenMs = 0): boolean => wall - hiddenMs >= at;
