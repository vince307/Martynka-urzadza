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
        // "5 − 7" is a well-formed subtraction; a negative result is caught through the answer.
        expect(validateTask({ ...base, prompt: '5 − 7' })).toEqual([]);
        expect(validateTask({ ...base, prompt: '5 − 7', answer: -2 }, { max: 20 }).map((x) => x.rule)).toEqual(['negative', 'range']);
        expect(validateTask({ ...base, prompt: '□ − 7 = 5' })).toEqual([]);
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

    it('reads a grouped number as a whole when checking agreement', () => {
        // The number is read whole: 10 001 takes "jabłek", not the singular a reader of "001" would pick.
        expect(validateTask({ ...base, prompt: 'W sadzie jest 10\u00A0001 jabłek.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: 'W sadzie jest 10\u00A0002 jabłek.' }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...base, prompt: 'W sadzie jest 10\u00A0001 jabłko.' }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
    });

    it('checks numeral agreement for dictionary nouns only', () => {
        expect(validateTask({ ...base, prompt: 'Ania ma 2 jabłek.' }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...base, prompt: 'Ania ma 2 jabłka.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: 'Ania ma 5 jabłek i 12 kredek.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, hint: ['22 gruszki'] }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: '3 smoki' }, { nouns })).toEqual([]);
    });

    it('flags a feminine nominative after a verb where Polish needs the accusative (1 cyfrę)', () => {
        // impl-review S-03: "2 ma 1 cyfra" passed every check; the object of "ma" takes the accusative.
        expect(validateTask({ ...base, hint: ['2 ma 1 cyfra'] }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...base, prompt: 'Ania kupiła 1 gruszka.' }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...base, hint: ['2 ma 1 cyfrę'] }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: 'Ania ma 1 jabłko.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: 'Na półce jest 1 książka.' }, { nouns })).toEqual([]);
    });

    it('flags "za 1 godzina" (accusative after "za": za 1 godzinę)', () => {
        expect(validateTask({ ...base, prompt: 'Która będzie za 1 godzina?' }, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...base, prompt: 'Która będzie za 1 godzinę?' }, { nouns })).toEqual([]);
        expect(validateTask({ ...base, prompt: 'Która będzie za 2 godziny?' }, { nouns })).toEqual([]);
    });
});

describe('validateTask drawing', () => {
    const base = { skillId: 'T.1', prompt: 'Która godzina?', answer: '3.00', hint: ['Krótka wskazówka'] };
    it('reports a drawing that breaks its own rules', () => {
        const found = validateTask({ ...base, visual: { kind: 'clock', hour: 25, minute: 0 } });
        expect(found).toHaveLength(1);
        expect(found[0]).toMatchObject({ skillId: 'T.1', rule: 'visual' });
    });
    it('accepts a good drawing and a task without one', () => {
        expect(validateTask({ ...base, visual: { kind: 'clock', hour: 3, minute: 0 } })).toEqual([]);
        expect(validateTask(base)).toEqual([]);
    });
});
