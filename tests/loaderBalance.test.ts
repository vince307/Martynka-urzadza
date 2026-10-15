import { describe, expect, it } from 'vitest';
import { checkBootLimits } from '../src/core/bootLoad';
import { balance } from '../src/data/balance';

describe('balance.loader (audit H-2)', () => {
    const { timeoutMs, maxRetries } = balance.loader;

    it('keeps the per-file limit between 5 and 20 s', () => {
        expect(timeoutMs).toBeGreaterThanOrEqual(5000);
        expect(timeoutMs).toBeLessThanOrEqual(20000);
    });

    it('allows at most two retries', () => {
        expect(Number.isInteger(maxRetries)).toBe(true);
        expect(maxRetries).toBeGreaterThanOrEqual(0);
        expect(maxRetries).toBeLessThanOrEqual(2);
    });

    it('bounds the worst case for one stalled file to 30 s', () => {
        expect((maxRetries + 1) * timeoutMs).toBeLessThanOrEqual(30000);
    });
});

describe('balance.loader total limit (audit A-1, A-2)', () => {
    const { timeoutMs, maxRetries, slowAfterMs, totalMs } = balance.loader;

    it('passes checkBootLimits', () => {
        expect(() => checkBootLimits({ slowAfterMs, totalMs })).not.toThrow();
    });

    it('keeps the total limit between 30 and 60 s', () => {
        expect(totalMs).toBeGreaterThanOrEqual(30000);
        expect(totalMs).toBeLessThanOrEqual(60000);
    });

    it('keeps the total limit above the worst case of one stalled file', () => {
        expect(totalMs).toBeGreaterThan((maxRetries + 1) * timeoutMs);
    });

    it('shows the slow line between 3 and 15 s', () => {
        expect(slowAfterMs).toBeGreaterThanOrEqual(3000);
        expect(slowAfterMs).toBeLessThanOrEqual(15000);
    });
});
