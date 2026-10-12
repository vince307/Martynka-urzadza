import { describe, expect, it } from 'vitest';
import { generateDiv, parseDivParams } from '../src/core/tasks/generators/div';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateDiv', () => {
    for (const skill of [...skillsOfType(E3, 'DIV'), ...skillsOfType(E4, 'DIV')]) {
        const p = parseDivParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateDiv, skill, { max: p.maxDividend }, (task, where) => {
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
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseDivParams({ maxDividend: 30, divisors: [0] })).toThrow(TypeError);
    });
});
