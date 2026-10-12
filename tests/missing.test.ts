import { describe, expect, it } from 'vitest';
import { generateMissing, parseMissingParams } from '../src/core/tasks/generators/missing';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

const skills = [...skillsOfType(E3, 'MISSING'), ...skillsOfType(E4, 'MISSING')];

const solve = (prompt: string, hidden: number): boolean => {
    const m = /^(\S+) ([+−·:]) (\S+) = (\S+)$/.exec(prompt);
    if (!m) {
        return false;
    }
    const [a, b, c] = [m[1], m[3], m[4]].map((x) => (x === '□' ? hidden : Number(x)));
    const op = m[2];
    return op === '+' ? a + b === c : op === '−' ? a - b === c : op === '·' ? a * b === c : a / b === c;
};

describe('generateMissing', () => {
    it('has skills in E3 and E4', () => {
        expect(skills.length).toBeGreaterThan(0);
    });

    for (const skill of skills) {
        const p = parseMissingParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateMissing, skill, { max: p.max }, (task, where) => {
                expect(task.prompt.split('□').length - 1, where).toBe(1);
                expect(typeof task.answer, where).toBe('number');
                expect(solve(task.prompt, task.answer as number), where).toBe(true);
                for (const n of task.prompt.match(/\d+/g) ?? []) {
                    expect(Number(n), where).toBeLessThanOrEqual(p.max);
                }
                expect(task.hint[0], where).toMatch(/\d+ [+−·:] \d+ = \d+/);
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseMissingParams({ max: 20, ops: ['%'] })).toThrow(TypeError);
        expect(() => parseMissingParams({ max: 1, ops: ['+'] })).toThrow(TypeError);
        expect(() => parseMissingParams({ max: 20, ops: ['+'], slots: ['top'] })).toThrow(TypeError);
    });
});
