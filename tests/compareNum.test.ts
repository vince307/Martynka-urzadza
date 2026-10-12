import { describe, expect, it } from 'vitest';
import { generateCompareNum, SIGNS } from '../src/core/tasks/generators/compareNum';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateCompareNum', () => {
    for (const skill of skillsOfType(E4, 'COMPARE_NUM')) {
        it(`${skill.id}: 1000 draws`, () => {
            const signs = { '<': 0, '>': 0, '=': 0 };
            forEachDraw(generateCompareNum, skill, {}, (task, where) => {
                const m = /^(\d+) □ (\d+)$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const a = Number(m![1]);
                const b = Number(m![2]);
                const expected = a < b ? '<' : a > b ? '>' : '=';
                expect(task.answer, where).toBe(expected);
                expect(task.choices, where).toEqual([...SIGNS]);
                signs[expected] += 1;
                expect(task.hint.length, where).toBeGreaterThan(0);
            });
            expect(signs['=']).toBeGreaterThan(50);
            expect(signs['<']).toBeGreaterThan(200);
            expect(signs['>']).toBeGreaterThan(200);
        });
    }
});
