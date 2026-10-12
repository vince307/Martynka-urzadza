import { describe, expect, it } from 'vitest';
import { generateHalf, parseHalfParams } from '../src/core/tasks/generators/half';
import { E3 } from '../src/data/curriculum/E3';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateHalf', () => {
    for (const skill of skillsOfType(E3, 'HALF')) {
        const p = parseHalfParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateHalf, skill, { max: p.max }, (task, where) => {
                const n = Number(/z (\d+)\?$/.exec(task.prompt)?.[1]);
                expect(n % 2, where).toBe(0);
                expect(n, where).toBeLessThanOrEqual(p.max);
                expect(task.answer, where).toBe(n / 2);
            });
        });
    }
});
