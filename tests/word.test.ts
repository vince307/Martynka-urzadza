import { describe, expect, it } from 'vitest';
import { generateWord, parseWordParams } from '../src/core/tasks/generators/word';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
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
                expect(task.prompt, where).toMatch(/^[A-ZŁŚŻŹĆ0-9]/);
                if (p.kinds.every((k) => k === 'groups' || k === 'share' || k === 'each')) {
                    expect(task.prompt, where).not.toMatch(/poduszk|książ|filiżan|kwiat|złot/);
                }
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseWordParams({ max: 20, kinds: ['story'] })).toThrow(TypeError);
        expect(() => parseWordParams({ max: 2, kinds: ['sum'] })).toThrow(TypeError);
        expect(() => parseWordParams({ max: 5, kinds: ['age'] })).toThrow(/age needs max/);
        expect(parseWordParams({ max: 6, kinds: ['age'] }).max).toBe(6);
    });
});
