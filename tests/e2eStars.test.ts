import { describe, expect, it } from 'vitest';
import { E2E_MAX_STARS, e2eStars } from '../src/testing/e2eHook';

describe('e2eStars', () => {
    it('reads a star balance from the query string', () => {
        expect(e2eStars('?e2eStars=96')).toBe(96);
        expect(e2eStars('?a=1&e2eStars=0')).toBe(0);
        expect(e2eStars(`?e2eStars=${E2E_MAX_STARS}`)).toBe(E2E_MAX_STARS);
    });

    it('returns null for a missing, negative, fractional, malformed or too large value', () => {
        for (const search of ['', '?x=1', '?e2eStars=', '?e2eStars=-1', '?e2eStars=1.5', '?e2eStars=abc', `?e2eStars=${E2E_MAX_STARS + 1}`, '?e2eStars=%2096']) {
            expect(e2eStars(search), search).toBeNull();
        }
    });
});
