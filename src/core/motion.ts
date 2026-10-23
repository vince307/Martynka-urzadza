import type { RoundView } from './round/view';

/** Start delays (ms) for `count` items entering one after another so the last one ends inside `spanMs`. */
export const staggerDelays = (count: number, spanMs: number, itemMs: number): number[] => {
    if (count <= 0) return [];
    const room = Math.max(0, spanMs - itemMs);
    if (count === 1 || room === 0) return Array.from({ length: count }, () => 0);
    return Array.from({ length: count }, (_, i) => Math.round((i * room) / (count - 1)));
};

/** Start delays (ms) of the summary stars popping in one by one. */
export const summaryPopDelays = (stars: number, stepMs: number): number[] =>
    Array.from({ length: Math.max(0, stars) }, (_, i) => i * stepMs);

/** Indices of progress beads that turned `done` between two views; a new round (no previous view or another length) pops nothing. */
export const newlyDone = (prev: RoundView['dots'] | null, next: RoundView['dots']): number[] => {
    if (prev === null || prev.length !== next.length) return [];
    const out: number[] = [];
    next.forEach((dot, i) => {
        if (dot.status === 'done' && prev[i]?.status !== 'done') out.push(i);
    });
    return out;
};
