// Phase 5 data: the new playable skills of E5.7, E6.3 and E6.5 and the unlock thresholds the PR body lists.
import { describe, expect, it } from 'vitest';
import { unlockThreshold } from '../src/core/curriculum';
import { balance } from '../src/data/balance';
import { E5 } from '../src/data/curriculum/E5';
import { E6 } from '../src/data/curriculum/E6';

const idsOf = (stage: typeof E5, step: number): string[] => stage.steps.find((s) => s.step === step)!.skills.map((s) => s.id);
const threshold = (stage: typeof E5, step: number): number => unlockThreshold(idsOf(stage, step).length, balance.curriculum.unlockShare);

describe('S-14c phase 5 skills', () => {
    it('E5.7 gains unit choice on tiles and grams on the keypad; threshold 1 -> 2', () => {
        expect(idsOf(E5, 7)).toEqual(['E5.7.compare_diff_100', 'E5.7.length_ruler_mm', 'E5.7.unit_choice', 'E5.7.mass_grams']);
        const skills = E5.steps.find((s) => s.step === 7)!.skills;
        expect(skills.find((s) => s.id === 'E5.7.unit_choice')).toMatchObject({ type: 'UNIT_CHOICE', answer: 'tiles' });
        expect(skills.find((s) => s.id === 'E5.7.mass_grams')).toMatchObject({ type: 'MASS', answer: 'keypad' });
        expect(threshold(E5, 7)).toBe(2);
    });

    it('E6.3 gains the tare skill (2 skills, threshold 1; phase 6 adds the third) and E6.5 the tonne skill (threshold 1 -> 2)', () => {
        expect(idsOf(E6, 3)).toEqual(['E6.3.perimeter_composite', 'E6.3.mass_tare_kg']);
        expect(threshold(E6, 3)).toBe(1);
        expect(idsOf(E6, 5)).toEqual(['E6.5.complement_100_1000', 'E6.5.place_read_1000', 'E6.5.mass_tonne']);
        expect(threshold(E6, 5)).toBe(2);
    });
});
