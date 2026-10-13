// Adult gate logic (S-06 phase 3): the challenge must be out of reach of a
// child in grades 1-3 (two-digit factors, not round), answers are checked as
// typed digits and the digit field never overflows or starts with zero.
import { describe, expect, it } from 'vitest';
import { checkAnswer, createChallenge, gateInput, type GateKey } from '../src/core/parentGate';
import { createRng } from '../src/core/rng';
import { balance } from '../src/data/balance';

const range = balance.parentGate;

describe('createChallenge', () => {
    it('draws two-digit, non-round factors with a product over 100 (1000 draws)', () => {
        for (let seed = 1; seed <= 20; seed += 1) {
            const rng = createRng(20261012 + seed);
            for (let i = 0; i < 50; i += 1) {
                const { a, b } = createChallenge(rng, range);
                const where = `seed=${seed} draw=${i} ${a}x${b}`;
                for (const f of [a, b]) {
                    expect(Number.isInteger(f), where).toBe(true);
                    expect(f >= 11 && f <= 99, where).toBe(true);
                    expect(f % 10 !== 0, where).toBe(true);
                    expect(f >= range.factorMin && f <= range.factorMax, where).toBe(true);
                }
                expect(a * b, where).toBeGreaterThan(100);
            }
        }
    });

    it('is deterministic for a seed and varies across draws', () => {
        const first = createChallenge(createRng(7), range);
        expect(createChallenge(createRng(7), range)).toEqual(first);
        const rng = createRng(8);
        const seen = new Set<string>();
        for (let i = 0; i < 50; i += 1) {
            const { a, b } = createChallenge(rng, range);
            seen.add(`${a}x${b}`);
        }
        expect(seen.size).toBeGreaterThan(5);
    });
});

describe('checkAnswer', () => {
    const challenge = { a: 14, b: 17 };
    it('accepts the right product, rejects a wrong or empty answer', () => {
        expect(checkAnswer(challenge, '238')).toBe(true);
        expect(checkAnswer(challenge, '237')).toBe(false);
        expect(checkAnswer(challenge, '23')).toBe(false);
        expect(checkAnswer(challenge, '')).toBe(false);
    });
    it('is stateless: a wrong answer does not block the next try', () => {
        expect(checkAnswer(challenge, '1')).toBe(false);
        expect(checkAnswer(challenge, '1')).toBe(false);
        expect(checkAnswer(challenge, '238')).toBe(true);
    });
});

describe('gateInput', () => {
    const max = 3;
    it('appends digits up to the limit and ignores further digits', () => {
        let d = '';
        for (const k of ['2', '3', '8', '9'] as GateKey[]) d = gateInput(d, k, max);
        expect(d).toBe('238');
    });
    it('back removes the last digit and is a no-op on empty', () => {
        expect(gateInput('238', 'back', max)).toBe('23');
        expect(gateInput('', 'back', max)).toBe('');
    });
    it('never starts with a leading zero', () => {
        expect(gateInput('', '0', max)).toBe('');
        expect(gateInput('1', '0', max)).toBe('10');
    });
    it('can type a full answer for every possible challenge within the limit', () => {
        const top = range.factorMax * range.factorMax;
        expect(String(top).length).toBeLessThanOrEqual(range.maxDigits);
    });
});
