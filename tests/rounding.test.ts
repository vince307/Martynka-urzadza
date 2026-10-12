import { describe, expect, it } from 'vitest';
import { generateRounding, parseRoundingParams } from '../src/core/tasks/generators/rounding';
import { createRng } from '../src/core/rng';
import { parseNumber } from '../src/core/text/formatNumber';
import type { SkillDef } from '../src/core/types';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateRounding', () => {
    for (const skill of skillsOfType(E4, 'ROUNDING')) {
        const p = parseRoundingParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateRounding, skill, { max: p.max }, (task, where) => {
                const n = Number(/liczby (\d+)\?$/.exec(task.prompt)?.[1]);
                expect(n % 10, where).not.toBe(5);
                expect(n % 10, where).not.toBe(0);
                expect(task.answer, where).toBe(Math.round(n / 10) * 10);
                expect(task.hint, where).toHaveLength(2);
            });
        });
    }

    for (const to of [100, 1000] as const) {
        it(`rounds to the nearest full ${to} (E6 range, no ties)`, () => {
            const skill: SkillDef = { id: `T.round${to}`, stage: 'E6', step: 4, type: 'ROUNDING', params: { max: 10000, to }, answer: 'keypad' };
            expect(() => parseRoundingParams(skill.params)).not.toThrow();
            const seen = new Set<number>();
            forEachDraw(generateRounding, skill, { max: 10000 }, (task, where) => {
                const n = parseNumber(/liczby (.+)\?$/.exec(task.prompt)![1]);
                expect(n % to, where).not.toBe(0);
                expect(n % to, where).not.toBe(to / 2);
                // Independent distance check: no other multiple of `to` is as close.
                const answer = task.answer as number;
                expect(answer % to, where).toBe(0);
                for (let m = 0; m <= 10000 + to; m += to) {
                    if (m !== answer) {
                        expect(Math.abs(n - answer), where).toBeLessThan(Math.abs(n - m));
                    }
                }
                seen.add(answer);
            });
            expect(seen.size).toBeGreaterThan(3);
        });
    }

    it('words the E6 prompts in the right gender', () => {
        const mk = (to: number): SkillDef => ({ id: 'T.r', stage: 'E6', step: 4, type: 'ROUNDING', params: { max: 10000, to }, answer: 'keypad' });
        expect(generateRounding(mk(100), createRng(1)).prompt).toMatch(/^Która pełna setka jest najbliżej liczby /);
        expect(generateRounding(mk(1000), createRng(1)).prompt).toMatch(/^Który pełny tysiąc jest najbliżej liczby /);
    });

    it('rejects unsupported params', () => {
        expect(() => parseRoundingParams({ max: 150, to: 100 })).toThrow(TypeError);
        expect(() => parseRoundingParams({ max: 20000, to: 100 })).toThrow(TypeError);
        expect(() => parseRoundingParams({ max: 100, to: 50 })).toThrow(TypeError);
        expect(() => parseRoundingParams({ max: 10 })).toThrow(TypeError);
    });
});
