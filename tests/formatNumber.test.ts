import { describe, expect, it } from 'vitest';
import { formatNumber, NUMBER_SOURCE, parseNumber } from '../src/core/text/formatNumber';

const NBSP = '\u00A0';

describe('formatNumber', () => {
    it('leaves numbers below 10 000 untouched', () => {
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(999)).toBe('999');
        expect(formatNumber(1000)).toBe('1000');
        expect(formatNumber(9999)).toBe('9999');
    });

    it('groups by three with a no-break space from 10 000', () => {
        expect(formatNumber(10000)).toBe(`10${NBSP}000`);
        expect(formatNumber(123456)).toBe(`123${NBSP}456`);
        expect(formatNumber(1000000)).toBe(`1${NBSP}000${NBSP}000`);
    });

    it('parseNumber inverts formatNumber', () => {
        for (const n of [0, 7, 9999, 10000, 10001, 99999, 100000, 654321, 1000000]) {
            expect(parseNumber(formatNumber(n))).toBe(n);
        }
    });

    it('NUMBER_SOURCE matches a grouped number as a whole', () => {
        const line = new RegExp(`^(${NUMBER_SOURCE}) ([+−]) (${NUMBER_SOURCE}) = (${NUMBER_SOURCE})$`);
        const m = line.exec(`10${NBSP}000 + 1 = 10${NBSP}001`);
        expect(m).not.toBeNull();
        expect(parseNumber(m![1])).toBe(10000);
        expect(parseNumber(m![3])).toBe(1);
        expect(parseNumber(m![4])).toBe(10001);
    });
});
