import { describe, expect, it } from 'vitest';
import { generateRoman } from '../src/core/tasks/generators/roman';
import { fromRoman, toRoman } from '../src/core/text/roman';
import { E3 } from '../src/data/curriculum/E3';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateRoman', () => {
    for (const skill of skillsOfType(E3, 'ROMAN')) {
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateRoman, skill, {}, (task, where) => {
                expect(task.choices, where).toHaveLength(3);
                if (typeof task.answer === 'number') {
                    expect(task.answer, where).toBeLessThanOrEqual(12);
                    expect(task.prompt, where).toContain(toRoman(task.answer));
                } else {
                    const n = Number(/liczbę (\d+) /.exec(task.prompt)?.[1]);
                    expect(fromRoman(task.answer as string), where).toBe(n);
                    for (const c of task.choices as string[]) {
                        expect(fromRoman(c), where).toBeLessThanOrEqual(12);
                    }
                }
            });
        });
    }
});
