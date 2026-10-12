import { describe, expect, it } from 'vitest';
import { fromRoman, romanBreakdown, toRoman } from '../src/core/text/roman';

describe('roman numerals', () => {
    it.each([[1, 'I'], [4, 'IV'], [5, 'V'], [9, 'IX'], [10, 'X'], [11, 'XI'], [12, 'XII'], [40, 'XL'], [90, 'XC'], [400, 'CD'], [1994, 'MCMXCIV'], [2000, 'MM'], [3999, 'MMMCMXCIX']])(
        '%i ↔ %s',
        (n, text) => {
            expect(toRoman(n)).toBe(text);
            expect(fromRoman(text)).toBe(n);
        },
    );

    it('round-trips 1..3999', () => {
        for (let n = 1; n <= 3999; n += 1) {
            expect(fromRoman(toRoman(n))).toBe(n);
        }
    });

    it('rejects invalid input', () => {
        expect(() => toRoman(0)).toThrow(RangeError);
        expect(() => fromRoman('IIII')).toThrow(RangeError);
        expect(() => fromRoman('abc')).toThrow(RangeError);
    });

    it('breaks numerals into additive and subtractive pieces that sum to the value', () => {
        expect(romanBreakdown('VII')).toEqual({ steps: ['V = 5', 'I = 1', 'I = 1'], sum: '5 + 1 + 1 = 7' });
        expect(romanBreakdown('IX')).toEqual({ steps: ['IX = 10 − 1 = 9'], sum: '9' });
        expect(romanBreakdown('XIV')).toEqual({ steps: ['X = 10', 'IV = 5 − 1 = 4'], sum: '10 + 4 = 14' });
        for (let n = 1; n <= 100; n += 1) {
            const { sum } = romanBreakdown(toRoman(n));
            expect(Number(sum.split('= ').pop()), toRoman(n)).toBe(n);
        }
    });
});
