import { describe, expect, it } from 'vitest';
import { formatTime, spokenTime } from '../src/core/text/time';

describe('formatTime', () => {
    it('writes the school notation with a dot and two-digit minutes', () => {
        expect(formatTime(15, 0)).toBe('15.00');
        expect(formatTime(7, 5)).toBe('7.05');
        expect(formatTime(0, 30)).toBe('0.30');
        expect(formatTime(12, 45)).toBe('12.45');
    });
});

describe('spokenTime', () => {
    it('reads minutes after the hour and a full hour as the bare hour (never "8.15")', () => {
        expect(spokenTime(8, 15)).toBe('8 15');
        expect(spokenTime(7, 5)).toBe('7 05');
        expect(spokenTime(8, 0)).toBe('8');
        expect(spokenTime(22, 0)).toBe('22');
    });
});
