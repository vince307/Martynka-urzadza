import { describe, expect, it } from 'vitest';
import { generateComplement, parseComplementParams } from '../src/core/tasks/generators/complement';
import type { SkillDef } from '../src/core/types';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

const explicit: SkillDef = { id: 'x.complement_targets', stage: 'E3', step: 2, type: 'COMPLEMENT', params: { max: 30, targets: [10, 20, 30] }, answer: 'keypad' };
const skills = [...skillsOfType(E4, 'COMPLEMENT'), explicit];

describe('generateComplement', () => {
    for (const skill of skills) {
        const p = parseComplementParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateComplement, skill, { max: p.max }, (task, where) => {
                // impl-review S-03: "Ile trzeba dodać do 2, żeby było 10?" replaces the awkward "Ile brakuje od 2 do 10?".
                const m = /^Ile trzeba dodać do (\d+), żeby było (\d+)\?$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const n = Number(m![1]);
                const target = Number(m![2]);
                expect(task.answer, where).toBe(target - n);
                expect(target - n, where).toBeGreaterThan(0);
                expect(target % 10, where).toBe(0);
                if (p.targets) {
                    expect(p.targets, where).toContain(target);
                } else {
                    expect(target - n, where).toBeLessThanOrEqual(9);
                }
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseComplementParams({ max: 5 })).toThrow(TypeError);
        expect(() => parseComplementParams({ max: 30, targets: [40] })).toThrow(TypeError);
    });
});
