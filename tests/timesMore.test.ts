import { describe, expect, it } from 'vitest';
import { generateTimesMore, parseTimesMoreParams } from '../src/core/tasks/generators/timesMore';
import { nouns } from '../src/data/nouns';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (variants: string[]): SkillDef => ({
    id: `T.times_more.${variants.join('')}`,
    stage: 'E5',
    step: 10,
    type: 'TIMES_MORE',
    params: { variants, max: 100, maxFactor: 10 },
    answer: 'keypad',
});

const GENITIVE_PLURAL = new Set(Object.values(nouns).map((forms) => forms[2]));

/** Independent oracle: the variant is told by the question, the numbers are read from the story. */
const solve = (prompt: string): { variant: 'more' | 'less' | 'factor'; expected: number; base: number } => {
    const n = (prompt.match(/\d+/g) ?? []).map(Number);
    if (/Ile razy więcej/.test(prompt)) {
        return { variant: 'factor', expected: n[1] / n[0], base: n[0] };
    }
    if (/razy mniej/.test(prompt)) {
        return { variant: 'less', expected: n[0] / n[1], base: n[0] };
    }
    return { variant: 'more', expected: n[0] * n[1], base: n[0] };
};

describe('generateTimesMore', () => {
    for (const variant of ['more', 'less', 'factor']) {
        it(`${variant}: 1000 draws, multiplication or division by the factor, never "o" arithmetic`, () => {
            forEachDraw(generateTimesMore, skill([variant]), { max: 100 }, (task, where) => {
                const s = solve(task.prompt);
                expect(s.variant, where).toBe(variant);
                expect(task.answer, where).toBe(s.expected);
                expect(Number.isInteger(s.expected), where).toBe(true);
                expect(s.expected, where).toBeGreaterThanOrEqual(2);
                if (variant === 'more') {
                    expect(task.answer as number, where).toBeGreaterThan(s.base);
                }
                expect(task.prompt, where).not.toMatch(/ o \d+ (więcej|mniej)/);
                // "razy więcej / mniej" governs the genitive plural: "3 razy więcej naklejek"
                const noun = /razy (?:więcej|mniej) (\p{L}+)/u.exec(task.prompt)?.[1];
                if (variant !== 'factor') {
                    expect(GENITIVE_PLURAL.has(noun ?? ''), `${where} noun ${String(noun)}`).toBe(true);
                }
                // the first hint names the operation, the last one states the result
                expect(task.hint[0], where).toMatch(variant === 'more' ? /mnożenie/ : /dzielenie/);
                expect(task.hint[0], where).not.toMatch(/=/);
                expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
            });
        });
    }

    it('rejects an unknown variant and a max that cannot hold a product', () => {
        expect(() => parseTimesMoreParams({ variants: ['o'], max: 100, maxFactor: 10 })).toThrow(TypeError);
        expect(() => parseTimesMoreParams({ variants: ['more'], max: 3, maxFactor: 10 })).toThrow(TypeError);
    });
});
