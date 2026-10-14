import { describe, expect, it } from 'vitest';
import { localDay } from '../src/core/day';

describe('localDay', () => {
    it('uses the local calendar fields, padded, late evening and just after midnight', () => {
        expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
        expect(localDay(new Date(2026, 0, 6, 0, 30))).toBe('2026-01-06');
        expect(localDay(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    });
});
