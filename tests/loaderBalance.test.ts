import { describe, expect, it } from 'vitest';
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
