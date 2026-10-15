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

    it('E6.3 has the tare skill and (phase 6) the two-unit length skill: 3 skills, threshold 2; E6.5 gains the tonne skill (threshold 1 -> 2)', () => {
        expect(idsOf(E6, 3)).toEqual(['E6.3.perimeter_composite', 'E6.3.mass_tare_kg', 'E6.3.length_two_units']);
        expect(threshold(E6, 3)).toBe(2);
        expect(idsOf(E6, 5)).toEqual(['E6.5.complement_100_1000', 'E6.5.place_read_1000', 'E6.5.mass_tonne']);
        expect(threshold(E6, 5)).toBe(2);
    });
});

describe('S-14c phase 6 skills', () => {
    it('E5.12 gains the plan scale (3 skills, threshold 2) and E5.5 the half-litre glasses (3 skills, threshold 2)', () => {
        expect(idsOf(E5, 12)).toEqual(['E5.12.perimeter_side_square', 'E5.12.perimeter_side_rect', 'E5.12.length_scale']);
        expect(threshold(E5, 12)).toBe(2);
        expect(idsOf(E5, 5)).toEqual(['E5.5.capacity_quarter_l', 'E5.5.mass_half_kg_e5', 'E5.5.capacity_half_l_e5']);
        expect(threshold(E5, 5)).toBe(2);
        const skills = E5.steps.flatMap((s) => s.skills);
        expect(skills.find((s) => s.id === 'E5.12.length_scale')).toMatchObject({ type: 'LENGTH', answer: 'keypad' });
        expect(skills.find((s) => s.id === 'E5.5.capacity_half_l_e5')).toMatchObject({ type: 'CAPACITY', answer: 'keypad' });
        expect(E6.steps.flatMap((s) => s.skills).find((s) => s.id === 'E6.3.length_two_units')).toMatchObject({ type: 'LENGTH', answer: 'keypad' });
    });
});
