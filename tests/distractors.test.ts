import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { numberChoices, pickChoices } from '../src/core/tasks/distractors';

describe('numberChoices', () => {
    it('returns distinct tiles in range containing the answer', () => {
        const rng = createRng(9);
        for (let i = 0; i < 1000; i += 1) {
            const answer = rng.int(0, 100);
            const tiles = numberChoices(answer, rng, { count: 3, min: 0, max: 100 });
            expect(tiles).toHaveLength(3);
            expect(new Set(tiles).size).toBe(3);
            expect(tiles).toContain(answer);
            for (const t of tiles) {
                expect(t).toBeGreaterThanOrEqual(0);
                expect(t).toBeLessThanOrEqual(100);
            }
        }
    });

    it('rejects impossible requests', () => {
        const rng = createRng(1);
        expect(() => numberChoices(5, rng, { count: 3, min: 5, max: 5 })).toThrow(RangeError);
        expect(() => numberChoices(50, rng, { count: 3, min: 0, max: 10 })).toThrow(RangeError);
    });
});

describe('pickChoices', () => {
    it('keeps the answer and draws others from the pool', () => {
        const rng = createRng(2);
        const pool = ['a', 'b', 'c', 'd'];
        for (let i = 0; i < 200; i += 1) {
            const tiles = pickChoices('a', pool, 3, rng);
            expect(tiles).toHaveLength(3);
            expect(tiles).toContain('a');
            expect(new Set(tiles).size).toBe(3);
        }
        expect(() => pickChoices('a', ['a', 'b'], 3, rng)).toThrow(RangeError);
    });
});
