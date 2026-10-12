import { describe, expect, it } from 'vitest';
import { generateNumberWords, parseNumberWordsParams } from '../src/core/tasks/generators/numberWords';
import { numberToWords } from '../src/core/text/numberWords';
import type { SkillDef } from '../src/core/types';
import { E3 } from '../src/data/curriculum/E3';
import { forEachDraw, skillsOfType } from './helpers';

const tens: SkillDef = { id: 'x.number_words_tens', stage: 'E4', step: 1, type: 'NUMBER_WORDS', params: { max: 100, kind: 'tens' }, answer: 'tiles' };
const hundreds: SkillDef = { id: 'x.number_words_hundreds', stage: 'E4', step: 8, type: 'NUMBER_WORDS', params: { max: 1000, kind: 'hundreds' }, answer: 'tiles' };

describe('generateNumberWords', () => {
    for (const skill of [...skillsOfType(E3, 'NUMBER_WORDS'), tens, hundreds]) {
        const p = parseNumberWordsParams(skill.params);
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateNumberWords, skill, {}, (task, where) => {
                expect(task.choices, where).toHaveLength(3);
                if (typeof task.answer === 'number') {
                    expect(task.answer, where).toBeLessThanOrEqual(p.max);
                    expect(task.prompt, where).toContain(numberToWords(task.answer));
                    for (const c of task.choices as number[]) {
                        expect(c, where).toBeGreaterThanOrEqual(1);
                        if (p.kind === 'tens') {
                            expect(c % 10, where).toBe(0);
                        }
                        if (p.kind === 'hundreds') {
                            expect(c % 100, where).toBe(0);
                        }
                    }
                } else {
                    const n = Number(/liczbę (\d+)\?$/.exec(task.prompt)?.[1]);
                    expect(task.answer, where).toBe(numberToWords(n));
                }
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseNumberWordsParams({ max: 20, kind: 'tens' })).toThrow(TypeError);
        expect(() => parseNumberWordsParams({ max: 2000 })).toThrow(TypeError);
    });
});
