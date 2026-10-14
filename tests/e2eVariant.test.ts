import { describe, expect, it } from 'vitest';
import { e2eDay, e2eVariant } from '../src/testing/e2eHook';

describe('e2eDay', () => {
    it('reads a real calendar day', () => {
        expect(e2eDay('?e2eDay=2026-10-14')).toBe('2026-10-14');
        expect(e2eDay('?a=1&e2eDay=2028-02-29')).toBe('2028-02-29');
    });

    it('returns null for a missing, malformed or non-existent day', () => {
        for (const search of ['', '?e2eDay=', '?e2eDay=2026-10-1', '?e2eDay=26-10-14', '?e2eDay=2026-13-01', '?e2eDay=2026-02-30', '?e2eDay=2027-02-29', '?e2eDay=today']) {
            expect(e2eDay(search), search).toBeNull();
        }
    });
});

describe('e2eVariant', () => {
    it('reads the four seams', () => {
        for (const value of ['off', 'word', 'dice', 'puzzle']) {
            expect(e2eVariant(`?e2eVariant=${value}`)).toBe(value);
        }
    });

    it('returns null for anything else', () => {
        for (const search of ['', '?e2eVariant=', '?e2eVariant=round', '?e2eVariant=OFF', '?e2eVariant=on']) {
            expect(e2eVariant(search), search).toBeNull();
        }
    });
});
