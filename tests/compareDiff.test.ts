import { describe, expect, it } from 'vitest';
import { generateCompareDiff } from '../src/core/tasks/generators/compareDiff';
import { E3 } from '../src/data/curriculum/E3';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateCompareDiff', () => {
    for (const skill of skillsOfType(E3, 'COMPARE_DIFF')) {
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateCompareDiff, skill, { max: 20 }, (task, where) => {
                const nums = (task.prompt.match(/\d+/g) ?? []).map(Number);
                expect(nums, where).toHaveLength(2);
                expect(nums[0], where).not.toBe(nums[1]);
                expect(task.answer, where).toBe(Math.abs(nums[0] - nums[1]));
                expect(task.prompt, where).toMatch(/O ile (więcej|mniej)/);
            });
        });
    }
});
