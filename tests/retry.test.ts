import { describe, expect, it } from 'vitest';
import { drawUntil } from '../src/core/tasks/retry';

describe('drawUntil', () => {
    it('returns the first draw that passes and draws no more than needed', () => {
        let calls = 0;
        const value = drawUntil('T', () => (calls += 1), (n) => n === 3);
        expect(value).toBe(3);
        expect(calls).toBe(3);
    });

    it('draws once when the first draw is fine', () => {
        let calls = 0;
        expect(drawUntil('T', () => (calls += 1), () => true)).toBe(1);
        expect(calls).toBe(1);
    });

    it('stops at max tries with a RangeError naming the label', () => {
        let calls = 0;
        const run = () => {
            calls = 0;
            return drawUntil('PERIMETER triangle max 4', () => {
                calls += 1;
                // A broken helper would loop on; this makes that an assertion failure, not a hang.
                if (calls > 1001) throw new Error(`drawUntil kept drawing: ${calls} calls`);
                return calls;
            }, () => false);
        };
        expect(run).toThrow(RangeError);
        expect(run).toThrow(/PERIMETER triangle max 4: no draw in 1000 tries/);
        expect(calls).toBe(1000);
    });

    it('honours a custom max', () => {
        let calls = 0;
        expect(() =>
            drawUntil('T', () => {
                calls += 1;
                if (calls > 6) throw new Error(`drawUntil kept drawing: ${calls} calls`);
                return calls;
            }, () => false, 5),
        ).toThrow(/T: no draw in 5 tries/);
        expect(calls).toBe(5);
    });

    it('accepts a draw on the last allowed try', () => {
        let calls = 0;
        expect(drawUntil('T', () => (calls += 1), (n) => n === 5, 5)).toBe(5);
    });
});
