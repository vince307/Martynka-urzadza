import { describe, expect, it } from 'vitest';
import { generateDiv, parseDivParams } from '../src/core/tasks/generators/div';
import type { SkillDef } from '../src/core/types';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateDiv', () => {
    for (const skill of [...skillsOfType(E3, 'DIV'), ...skillsOfType(E4, 'DIV')]) {
        const p = parseDivParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            let ones = 0;
            forEachDraw(generateDiv, skill, { max: p.maxDividend }, (task, where) => {
                if (task.answer === 1) {
                    ones += 1;
                }
                const m = /^(\d+) : (\d+)$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const n = Number(m![1]);
                const d = Number(m![2]);
                expect(n % d, where).toBe(0);
                expect(task.answer, where).toBe(n / d);
                expect(n, where).toBeLessThanOrEqual(p.maxDividend);
                expect(n / d, where).toBeLessThanOrEqual(p.maxQuotient);
                if (p.divisors) {
                    expect(p.divisors, where).toContain(d);
                }
                expect(task.hint[0], where).toBe(`${d} · ${n / d} = ${n}`);
            });
            // n : n stays rare but present (about one draw in ten).
            expect(ones).toBeGreaterThan(30);
            expect(ones).toBeLessThan(200);
        });
    }

    it('draws the quotient from the list when given', () => {
        const quotients = [20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500];
        const params = { maxDividend: 1000, maxQuotient: 500, divisors: [2, 3, 4, 5, 6, 7, 8, 9], quotients };
        const skill: SkillDef = { id: 'T.divq', stage: 'E6', step: 8, type: 'DIV', params, answer: 'keypad' };
        expect(parseDivParams(params).quotients).toEqual(quotients);
        const seen = new Set<number>();
        forEachDraw(generateDiv, skill, { max: 1000 }, (task, where) => {
            expect(quotients, where).toContain(task.answer);
            const m = /^(\d+) : (\d+)$/.exec(task.prompt)!;
            expect(Number(m[1]), where).toBe(Number(m[2]) * (task.answer as number));
            expect(Number(m[1]), where).toBeLessThanOrEqual(1000);
            seen.add(task.answer as number);
        });
        expect(seen.size).toBeGreaterThan(5);
    });

    it('rejects quotients that fit no divisor', () => {
        expect(() => parseDivParams({ maxDividend: 100, divisors: [5], quotients: [50] })).toThrow(TypeError);
        expect(() => parseDivParams({ maxDividend: 100, quotients: [] })).toThrow(TypeError);
        expect(() => parseDivParams({ maxDividend: 100, quotients: [0, 5] })).toThrow(TypeError);
    });

    it('rejects malformed params', () => {
        expect(() => parseDivParams({ maxDividend: 30, divisors: [0] })).toThrow(TypeError);
        expect(() => parseDivParams({ maxDividend: 9, divisors: [10] })).toThrow(/no divisions/);
    });
});
