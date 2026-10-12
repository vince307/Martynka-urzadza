import { describe, expect, it } from 'vitest';
import { generateRounding, parseRoundingParams } from '../src/core/tasks/generators/rounding';
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

    it('rejects unsupported params', () => {
        expect(() => parseRoundingParams({ max: 100, to: 100 })).toThrow(TypeError);
        expect(() => parseRoundingParams({ max: 10 })).toThrow(TypeError);
    });
});
