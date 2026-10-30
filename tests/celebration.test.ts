// Celebration view (S-22 phase 1). Oracle: a literal three-row table written here, never data from src/data.
import { describe, expect, it } from 'vitest';
import { celebrationView, type CelebrationIntensity, type CelebrationSpec } from '../src/core/celebration';

const TABLE: Record<CelebrationIntensity, CelebrationSpec> = {
    room: { holdMs: 700, burstCount: 3, keepsake: false },
    house: { holdMs: 1200, burstCount: 5, keepsake: true },
    street: { holdMs: 1800, burstCount: 8, keepsake: true },
};

describe('celebrationView', () => {
    it('gives back the row of the asked intensity', () => {
        expect(celebrationView('room', false, TABLE)).toEqual({ intensity: 'room', revealMs: 700, burstCount: 3, keepsake: false });
        expect(celebrationView('house', false, TABLE)).toEqual({ intensity: 'house', revealMs: 1200, burstCount: 5, keepsake: true });
        expect(celebrationView('street', false, TABLE)).toEqual({ intensity: 'street', revealMs: 1800, burstCount: 8, keepsake: true });
    });

    it('is a static reveal with no burst under reduced motion, for every intensity', () => {
        for (const i of ['room', 'house', 'street'] as const) {
            const v = celebrationView(i, true, TABLE);
            expect(v.revealMs).toBe(0);
            expect(v.burstCount).toBe(0);
        }
    });

    it('passes the keepsake flag through under reduced motion', () => {
        expect(celebrationView('room', true, TABLE).keepsake).toBe(false);
        expect(celebrationView('house', true, TABLE).keepsake).toBe(true);
    });
});
