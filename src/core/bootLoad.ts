// Pure decision for the boot loading screen (audit A-1, A-2): the scene only renders the phase.
export interface BootLimits {
    /** After this long the screen shows the calm "still loading" line. */
    slowAfterMs: number;
    /** One limit for the whole boot load; past it the game starts with what loaded. */
    totalMs: number;
}

export type BootLoadPhase = 'loading' | 'slow' | 'over';

export function bootLoadPhase(elapsedMs: number, limits: BootLimits): BootLoadPhase {
    if (!(elapsedMs >= limits.slowAfterMs)) return 'loading'; // also NaN and negative
    return elapsedMs >= limits.totalMs ? 'over' : 'slow';
}

function positiveFinite(n: number): boolean {
    return Number.isFinite(n) && n > 0;
}

export function checkBootLimits(limits: BootLimits): void {
    if (!positiveFinite(limits.slowAfterMs) || !positiveFinite(limits.totalMs)) {
        throw new Error('Boot limits must be finite positive numbers');
    }
    if (limits.slowAfterMs >= limits.totalMs) {
        throw new Error('Boot slowAfterMs must be below totalMs');
    }
}
