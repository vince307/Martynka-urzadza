import { describe, expect, it } from 'vitest';
import { e2eMonth } from '../src/testing/e2eHook';

describe('e2eMonth', () => {
    it('reads a month 0-11 from the query string', () => {
        expect(e2eMonth('?e2eMonth=9')).toBe(9);
        expect(e2eMonth('?a=1&e2eMonth=0')).toBe(0);
        expect(e2eMonth('?e2eMonth=11')).toBe(11);
    });

    it('returns null for a missing, out-of-range or malformed value', () => {
        for (const search of ['', '?x=1', '?e2eMonth=', '?e2eMonth=12', '?e2eMonth=-1', '?e2eMonth=abc', '?e2eMonth=1.5', '?e2eMonth=007']) {
            expect(e2eMonth(search), search).toBeNull();
        }
    });
});
