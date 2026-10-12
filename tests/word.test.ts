import { describe, expect, it } from 'vitest';
import { generateWord, parseWordParams } from '../src/core/tasks/generators/word';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { people } from '../src/data/wordTemplates';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateWord', () => {
    for (const skill of [...skillsOfType(E3, 'WORD'), ...skillsOfType(E4, 'WORD')]) {
        const p = parseWordParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateWord, skill, { max: p.max }, (task, where) => {
                expect(task.prompt, where).not.toMatch(/undefined|NaN/);
                for (const n of task.prompt.match(/\d+/g) ?? []) {
                    expect(Number(n), where).toBeLessThanOrEqual(p.max);
                }
                expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
                const named = people.filter((person) => task.prompt.includes(person.name));
                if (named.length > 0) {
                    expect(task.prompt.startsWith(named[0].name) || /^[A-ZŁŚŻŹĆ]/.test(task.prompt), where).toBe(true);
                }
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseWordParams({ max: 20, kinds: ['story'] })).toThrow(TypeError);
        expect(() => parseWordParams({ max: 2, kinds: ['sum'] })).toThrow(TypeError);
    });
});
