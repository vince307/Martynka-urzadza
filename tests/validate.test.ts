import { describe, expect, it } from 'vitest';
import type { Task } from '../src/core/tasks/types';
import { validateTask } from '../src/core/tasks/validate';
import { nouns } from '../src/data/nouns';

const base: Task = { skillId: 's', prompt: '7 + 6', answer: 13, hint: ['7 + 3 = 10', '10 + 3 = 13'] };

describe('validateTask', () => {
    it('accepts a correct task', () => {
        expect(validateTask(base, { max: 20, nouns })).toEqual([]);
    });

    it('flags an answer outside the range', () => {
        const v = validateTask({ ...base, answer: 31 }, { max: 30 });
        expect(v.map((x) => x.rule)).toEqual(['range']);
    });

    it('flags negative numbers in prompt, hint, answer and choices', () => {
        // "5 − 7" is a well-formed subtraction; its negative result is caught through the answer.
        expect(validateTask({ ...base, prompt: '5 − 7' })).toEqual([]);
        expect(validateTask({ ...base, prompt: '−3 + 5' }).map((x) => x.rule)).toContain('negative');
        expect(validateTask({ ...base, hint: ['5 − 7 = -2'] }).map((x) => x.rule)).toContain('negative');
        expect(validateTask({ ...base, hint: ['5 − 7 = −2'] }).map((x) => x.rule)).toContain('negative');
        expect(validateTask({ ...base, answer: -1 }).map((x) => x.rule)).toContain('negative');
        expect(validateTask({ ...base, choices: [-1, 13, 2] }).map((x) => x.rule)).toContain('negative');
        expect(validateTask({ ...base, prompt: '13 − 6' })).toEqual([]);
    });

    it('flags duplicate choices and choices without the answer', () => {
        expect(validateTask({ ...base, choices: [3, 3, 13] }).map((x) => x.rule)).toEqual(['choices']);
        expect(validateTask({ ...base, choices: [3, 4, 5] }).map((x) => x.rule)).toEqual(['choices']);
        expect(validateTask({ ...base, choices: [3, 4, 13] })).toEqual([]);
    });

    it('flags an empty hint', () => {
        expect(validateTask({ ...base, hint: [] }).map((x) => x.rule)).toEqual(['hint']);
    });

    it('checks numeral agreement for dictionary nouns only', () => {
        expect(validateTask({ ...base, prompt: 'Ania ma 2 jabłek.' }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...base, prompt: 'Ania ma 2 jabłka.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: 'Ania ma 5 jabłek i 12 kredek.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, hint: ['22 gruszki'] }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: '3 smoki' }, { nouns })).toEqual([]);
    });
});
