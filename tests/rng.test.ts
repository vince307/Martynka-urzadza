import { describe, expect, it } from 'vitest';
import { createRng, seedFromString } from '../src/core/rng';

describe('createRng', () => {
    it('is deterministic for the same seed and differs between seeds', () => {
        const a = createRng(42);
        const b = createRng(42);
        const c = createRng(43);
        const seqA = Array.from({ length: 100 }, () => a.next());
        const seqB = Array.from({ length: 100 }, () => b.next());
        const seqC = Array.from({ length: 100 }, () => c.next());
        expect(seqA).toEqual(seqB);
        expect(seqA).not.toEqual(seqC);
        for (const x of seqA) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThan(1);
        }
    });

    it('int() stays inside the inclusive range and reaches every value', () => {
        const rng = createRng(7);
        const seen = new Set<number>();
        for (let i = 0; i < 10_000; i += 1) {
            const v = rng.int(1, 6);
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(6);
            seen.add(v);
        }
        expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
        expect(rng.int(3, 3)).toBe(3);
    });

    it('rejects non-integer seeds and hashes strings to seeds', () => {
        expect(() => createRng(1.5)).toThrow(RangeError);
        expect(seedFromString('E3.2.add_sub:0')).toBe(seedFromString('E3.2.add_sub:0'));
        expect(seedFromString('a')).not.toBe(seedFromString('b'));
        expect(Number.isInteger(seedFromString('x'))).toBe(true);
    });

    it('keeps the golden sequence for seed 42 (saved rngSeed values depend on it)', () => {
        const rng = createRng(42);
        expect([rng.next(), rng.next(), rng.next()]).toEqual([0.7364004673436284,0.20048261154443026,0.14578645839355886]);
    });

    it('int() rejects bad bounds', () => {
        const rng = createRng(1);
        expect(() => rng.int(5, 4)).toThrow(RangeError);
        expect(() => rng.int(0.5, 4)).toThrow(RangeError);
    });

    it('pick() chooses elements and rejects an empty list', () => {
        const rng = createRng(3);
        const items = ['a', 'b', 'c'] as const;
        for (let i = 0; i < 100; i += 1) {
            expect(items).toContain(rng.pick(items));
        }
        expect(() => rng.pick([])).toThrow(RangeError);
    });

    it('shuffle() keeps the multiset and leaves the input untouched', () => {
        const rng = createRng(11);
        const input = [1, 2, 2, 3, 4, 5];
        const copy = [...input];
        const out = rng.shuffle(input);
        expect(input).toEqual(copy);
        expect([...out].sort()).toEqual([...input].sort());
        expect(out).not.toBe(input);
    });

    it('chance() is exact at the ends', () => {
        const rng = createRng(5);
        for (let i = 0; i < 50; i += 1) {
            expect(rng.chance(0)).toBe(false);
            expect(rng.chance(1)).toBe(true);
        }
    });
});
