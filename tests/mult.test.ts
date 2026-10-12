import { describe, expect, it } from 'vitest';
import { generateMult, multHint, parseMultParams } from '../src/core/tasks/generators/mult';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateMult', () => {
    for (const skill of [...skillsOfType(E3, 'MULT'), ...skillsOfType(E4, 'MULT')]) {
        const p = parseMultParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            let zeroOne = 0;
            forEachDraw(generateMult, skill, { max: p.maxProduct }, (task, where) => {
                const m = /^(\d+) · (\d+)$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const a = Number(m![1]);
                const b = Number(m![2]);
                expect(task.answer, where).toBe(a * b);
                expect(a * b, where).toBeLessThanOrEqual(p.maxProduct);
                if (p.factors) {
                    expect(p.factors, where).toContain(b);
                }
                if (!p.allowZeroOne) {
                    expect(Math.min(a, b), where).toBeGreaterThanOrEqual(2);
                }
                if (a <= 1 || b <= 1) {
                    zeroOne += 1;
                }
                expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${a * b}$`));
            });
            if (p.allowZeroOne) {
                expect(zeroOne).toBeGreaterThan(50);
                expect(zeroOne).toBeLessThan(400);
            }
        });
    }

    it('splits the second factor in the hint', () => {
        expect(multHint(7, 4)).toEqual(['7 · 2 = 14', '14 + 14 = 28']);
        expect(multHint(6, 1)).toEqual(['6 · 1 = 6']);
        expect(multHint(5, 7)).toEqual(['5 · 6 = 30', '30 + 5 = 35']);
        expect(multHint(7, 5)).toEqual(['7 · 5 = 35']);
        expect(multHint(8, 10)).toEqual(['8 · 10 = 80']);
    });

    it('splits full tens and hundreds by the table, then appends the zeros', () => {
        expect(multHint(4, 70)).toEqual(['4 · 7 = 28', '28 · 10 = 280']);
        expect(multHint(3, 200)).toEqual(['3 · 2 = 6', '6 · 100 = 600']);
        // Single line kept for the bare ·10 and ·100, and for a first factor of 10.
        expect(multHint(7, 10)).toEqual(['7 · 10 = 70']);
        expect(multHint(3, 100)).toEqual(['3 · 100 = 300']);
        expect(multHint(10, 3)).toEqual(['10 · 2 = 20', '20 + 10 = 30']);
    });

    it('rejects malformed params', () => {
        expect(() => parseMultParams({ maxProduct: 2 })).toThrow(TypeError);
        expect(() => parseMultParams({ maxProduct: 30, factors: [] })).toThrow(TypeError);
        expect(() => parseMultParams({ maxProduct: 9, factors: [10] })).toThrow(/no products/);
        expect(parseMultParams({ maxProduct: 9, factors: [10], allowZeroOne: true }).factors).toEqual([10]);
    });
});
