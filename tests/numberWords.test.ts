import { describe, expect, it } from 'vitest';
import { numberToWords } from '../src/core/text/numberWords';

describe('numberToWords', () => {
    it.each([
        [0, 'zero'],
        [1, 'jeden'],
        [5, 'pięć'],
        [10, 'dziesięć'],
        [11, 'jedenaście'],
        [15, 'piętnaście'],
        [19, 'dziewiętnaście'],
        [20, 'dwadzieścia'],
        [23, 'dwadzieścia trzy'],
        [30, 'trzydzieści'],
        [44, 'czterdzieści cztery'],
        [99, 'dziewięćdziesiąt dziewięć'],
        [100, 'sto'],
        [105, 'sto pięć'],
        [112, 'sto dwanaście'],
        [230, 'dwieście trzydzieści'],
        [500, 'pięćset'],
        [999, 'dziewięćset dziewięćdziesiąt dziewięć'],
        [1000, 'tysiąc'],
    ])('%i → %s', (n, words) => {
        expect(numberToWords(n)).toBe(words);
    });

    it('rejects out-of-range values', () => {
        expect(() => numberToWords(-1)).toThrow(RangeError);
        expect(() => numberToWords(1001)).toThrow(RangeError);
        expect(() => numberToWords(2.5)).toThrow(RangeError);
    });

    it('is injective on 0..1000', () => {
        const seen = new Set<string>();
        for (let n = 0; n <= 1000; n += 1) {
            seen.add(numberToWords(n));
        }
        expect(seen.size).toBe(1001);
    });
});
