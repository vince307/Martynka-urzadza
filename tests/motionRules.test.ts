import { describe, expect, it } from 'vitest';
import { newlyDone, staggerDelays, summaryPopDelays } from '../src/core/motion';
import type { RoundView } from '../src/core/round/view';

type Dots = RoundView['dots'];
const dot = (status: 'done' | 'current' | 'todo'): Dots[number] => ({ status, outcome: null });

describe('staggerDelays', () => {
    it('spaces starts evenly so the last one still ends inside the span', () => {
        expect(staggerDelays(4, 400, 250)).toEqual([0, 50, 100, 150]);
    });
    it('keeps 12 items strictly increasing and the last start + item within the span', () => {
        const d = staggerDelays(12, 400, 250);
        expect(d).toHaveLength(12);
        expect(d[0]).toBe(0);
        expect(d[11] + 250).toBeLessThanOrEqual(400);
        d.slice(1).forEach((v, i) => expect(v).toBeGreaterThan(d[i]));
    });
    it('handles the edge cases', () => {
        expect(staggerDelays(0, 400, 250)).toEqual([]);
        expect(staggerDelays(1, 400, 250)).toEqual([0]);
        expect(staggerDelays(3, 200, 250)).toEqual([0, 0, 0]);
    });
});

describe('summaryPopDelays', () => {
    it('is one step per star', () => {
        expect(summaryPopDelays(5, 180)).toEqual([0, 180, 360, 540, 720]);
        expect(summaryPopDelays(0, 180)).toEqual([]);
        expect(summaryPopDelays(6, 180)).toHaveLength(6);
    });
});

describe('newlyDone', () => {
    it('lists the beads that just became done', () => {
        const prev = [dot('done'), dot('current'), dot('todo'), dot('todo'), dot('todo')];
        const next = [dot('done'), dot('done'), dot('current'), dot('todo'), dot('todo')];
        expect(newlyDone(prev, next)).toEqual([1]);
    });
    it('never pops beads of a new round', () => {
        const next = [dot('done'), dot('done'), dot('current')];
        expect(newlyDone(null, next)).toEqual([]);
        expect(newlyDone([dot('current'), dot('todo')], next)).toEqual([]);
    });
});
