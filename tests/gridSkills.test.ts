import { describe, expect, it } from 'vitest';
import { unlockThreshold } from '../src/core/curriculum';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { E3 } from '../src/data/curriculum/E3';

// Phase 5 of drawn-grid-tasks-e3-e4: the unlock thresholds of the steps that got drawn-grid skills.
describe('E3 steps with number cells and the coordinate grid', () => {
    const step = (n: number) => E3.steps.find((s) => s.step === n)!;
    const need = (n: number) => unlockThreshold(step(n).skills.length, balance.curriculum.unlockShare);

    it('E3.5 has the ruler plus the magic square and the pyramid (threshold 1 -> 2)', () => {
        expect(step(5).skills.map((s) => s.id)).toEqual(['E3.5.length_ruler_cm_15', 'E3.5.magic_square_30', 'E3.5.pyramid_30']);
        expect(need(5)).toBe(2);
    });
    it('E3.7 has five skills with the grid pair on tiles (threshold 2 -> 3)', () => {
        expect(step(7).skills).toHaveLength(5);
        expect(step(7).skills.filter((s) => s.type === 'GRID').map((s) => s.answer)).toEqual(['tiles', 'tiles']);
        expect(need(7)).toBe(3);
    });
    it('is reachable through the stage table', () => {
        expect(stages.E3).toBe(E3);
    });
});
