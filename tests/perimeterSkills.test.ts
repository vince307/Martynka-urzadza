import { describe, expect, it } from 'vitest';
import { unlockThreshold } from '../src/core/curriculum';
import { balance } from '../src/data/balance';
import { E4 } from '../src/data/curriculum/E4';

describe('E4.7 with the perimeter skills', () => {
    const step = E4.steps.find((s) => s.step === 7)!;
    it('has six skills, two of them PERIMETER on the keypad, and unlocks at 3 (was 2 of 4)', () => {
        expect(step.skills).toHaveLength(6);
        expect(step.skills.filter((s) => s.type === 'PERIMETER').map((s) => [s.id, s.answer])).toEqual([
            ['E4.7.perimeter_rect', 'keypad'],
            ['E4.7.perimeter_triangle', 'keypad'],
        ]);
        expect(unlockThreshold(step.skills.length, balance.curriculum.unlockShare)).toBe(3);
    });
});
