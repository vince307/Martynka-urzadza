import { describe, expect, it } from 'vitest';
import { bootLoadPhase, checkBootLimits } from '../src/core/bootLoad';

const limits = { slowAfterMs: 8000, totalMs: 45000 };

describe('bootLoadPhase (audit A-1, A-2)', () => {
    it('is loading before the slow line', () => {
        expect(bootLoadPhase(0, limits)).toBe('loading');
        expect(bootLoadPhase(limits.slowAfterMs - 1, limits)).toBe('loading');
    });

    it('is slow from the slow line until the total limit', () => {
        expect(bootLoadPhase(limits.slowAfterMs, limits)).toBe('slow');
        expect(bootLoadPhase(limits.totalMs - 1, limits)).toBe('slow');
    });

    it('is over at and past the total limit', () => {
        expect(bootLoadPhase(limits.totalMs, limits)).toBe('over');
        expect(bootLoadPhase(limits.totalMs * 10, limits)).toBe('over');
    });

    it('treats a negative or NaN elapsed time as loading', () => {
        expect(bootLoadPhase(-5, limits)).toBe('loading');
        expect(bootLoadPhase(Number.NaN, limits)).toBe('loading');
    });
});

describe('checkBootLimits', () => {
    it('accepts sane limits', () => {
        expect(() => checkBootLimits(limits)).not.toThrow();
    });

    it.each([
        ['zero slow', { slowAfterMs: 0, totalMs: 10 }],
        ['negative total', { slowAfterMs: 1, totalMs: -10 }],
        ['NaN slow', { slowAfterMs: Number.NaN, totalMs: 10 }],
        ['infinite total', { slowAfterMs: 1, totalMs: Number.POSITIVE_INFINITY }],
        ['slow equal to total', { slowAfterMs: 10, totalMs: 10 }],
        ['slow above total', { slowAfterMs: 20, totalMs: 10 }],
    ])('rejects %s', (_name, bad) => {
        expect(() => checkBootLimits(bad)).toThrow();
    });
});
