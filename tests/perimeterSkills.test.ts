import { describe, expect, it } from 'vitest';
import { unlockThreshold } from '../src/core/curriculum';
import { balance } from '../src/data/balance';
import { E4 } from '../src/data/curriculum/E4';
import { generatePerimeter } from '../src/core/tasks/generators/perimeter';
import { forEachDraw } from './helpers';

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

describe('S-13b new playable perimeter steps', () => {
    it('E5.12 has two keypad skills and unlocks at 1 (ceil(0.5 * 2))', async () => {
        const { E5 } = await import('../src/data/curriculum/E5');
        const step = E5.steps.find((s) => s.step === 12)!;
        expect(step.skills.map((s) => [s.id, s.answer])).toEqual([
            ['E5.12.perimeter_side_square', 'keypad'],
            ['E5.12.perimeter_side_rect', 'keypad'],
        ]);
        expect(unlockThreshold(step.skills.length, balance.curriculum.unlockShare)).toBe(1);
    });

    it('E5.12 side of a square divides by 4 inside the multiplication table (two-digit quotients wait for E6.4)', async () => {
        const { E5 } = await import('../src/data/curriculum/E5');
        const square = E5.steps.find((s) => s.step === 12)!.skills.find((s) => s.id === 'E5.12.perimeter_side_square')!;
        forEachDraw(generatePerimeter, square, {}, (task, where) => {
            expect(task.answer as number, where).toBeLessThanOrEqual(10);
        });
    });

    it('E6.3 has one composite skill on the keypad and every new playable step has a short childName', async () => {
        const { E5 } = await import('../src/data/curriculum/E5');
        const { E6 } = await import('../src/data/curriculum/E6');
        const step = E6.steps.find((s) => s.step === 3)!;
        expect(step.skills.map((s) => s.id)).toEqual(['E6.3.perimeter_composite']);
        for (const s of [E5.steps.find((x) => x.step === 12)!, step]) {
            expect(s.childName?.length ?? 0).toBeGreaterThan(0);
            expect(s.childName!.length).toBeLessThanOrEqual(28);
        }
    });
});
