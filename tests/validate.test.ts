import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Task } from '../src/core/tasks/types';
import { validationBounds } from '../src/core/tasks/bounds';
import { NEGATIVE_TYPES, validateTask } from '../src/core/tasks/validate';
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

describe('negative numbers allowed for temperatures (S-14)', () => {
    const cold: Task = {
        skillId: 'E6.1.temperature_x',
        prompt: 'Termometr pokazuje -5 °C. Ile stopni będzie, gdy ociepli się o 8?',
        answer: 3,
        hint: ['-5 + 8 = 3'],
    };
    const below: Task = { ...cold, answer: -4, choices: [-4, 4, -9, 9], hint: ['Zacznij od -5, idź w górę o 1', 'Wynik: \u22124'] };

    it('is off by default: a minus answer, minus choices and minus texts are all violations', () => {
        expect(validateTask(below).map((x) => x.rule)).toEqual(expect.arrayContaining(['negative']));
        expect(validateTask(cold).map((x) => x.rule)).toContain('negative');
    });

    it('with allowNegative a negative answer, choices and texts pass, the other rules still apply', () => {
        expect(validateTask(below, { allowNegative: true })).toEqual([]);
        expect(validateTask(cold, { allowNegative: true })).toEqual([]);
        expect(validateTask({ ...below, choices: [4, 4, -9, -4] }, { allowNegative: true }).map((x) => x.rule)).toEqual(['choices']);
        expect(validateTask({ ...below, answer: 7 }, { allowNegative: true }).map((x) => x.rule)).toEqual(['choices']);
        expect(validateTask({ ...below, hint: [] }, { allowNegative: true }).map((x) => x.rule)).toEqual(['hint']);
        expect(validateTask({ ...cold, answer: 40 }, { allowNegative: true, max: 30 }).map((x) => x.rule)).toEqual(['range']);
    });

    it('validationBounds sets the flag from the skill type in one place', () => {
        expect(NEGATIVE_TYPES.has('TEMPERATURE')).toBe(true);
        expect(NEGATIVE_TYPES.has('ADD_SUB')).toBe(false);
        expect(validationBounds({ type: 'TEMPERATURE', params: { low: -20, high: 20 } })).toEqual({ max: 40, allowNegative: true });
        expect(validationBounds({ type: 'ADD_SUB', params: { max: 20 } })).toEqual({ max: 20, allowNegative: false });
    });

    // Impl-review S-14: params of the art types are not on-screen units, so the bound is read per type (screenBound).
    it('bounds the art types in the units the child sees', () => {
        expect(validationBounds({ type: 'MONEY_CHANGE', params: { max: 10000, answer: 'number-zl' } }).max).toBe(100);
        expect(validationBounds({ type: 'MONEY_COUNT', params: { max: 100, answer: 'number-gr' } }).max).toBe(100);
        expect(validationBounds({ type: 'MONEY_COUNT', params: { max: 2000, answer: 'text' } }).max).toBe(2000);
        expect(validationBounds({ type: 'CAPACITY', params: { jugs: ['container-half-l'], maxLitres: 10 } }).max).toBe(20);
        expect(validationBounds({ type: 'CAPACITY', params: { jugs: ['container-1l'], maxLitres: 10 } }).max).toBe(10);
        expect(validationBounds({ type: 'TEMPERATURE', params: { low: 0, high: 30 } }).max).toBe(30);
    });
});

describe('call sites validate programme skills through validationBounds (S-14)', () => {
    it('no test or script passes boundOf(skill) straight to validateTask', () => {
        const files = [...readdirSync('tests').filter((f) => f.endsWith('.ts')).map((f) => `tests/${f}`), 'scripts/sample.ts'];
        const offenders = files.filter((f) => /validateTask\([^;]*\bboundOf\(/.test(readFileSync(f, 'utf8')));
        expect(offenders).toEqual([]);
    });
});

describe('validateTask: tasks with several right tiles (check)', () => {
    const several: Task = {
        skillId: 's',
        prompt: '5 + □ < 8',
        answer: 1,
        choices: [1, 2, 3, 4],
        hint: ['h'],
        check: (x) => typeof x === 'number' && x < 3,
    };
    it('accepts two right and two wrong tiles', () => {
        expect(validateTask(several)).toEqual([]);
    });
    it('flags an answer the check refuses', () => {
        expect(validateTask({ ...several, answer: 3 }).map((x) => x.rule)).toEqual(['check-answer']);
    });
    it('flags a task whose every tile passes the check', () => {
        expect(validateTask({ ...several, check: () => true }).map((x) => x.rule)).toEqual(['check-no-wrong']);
    });
    it('flags a tiles task with only one right tile', () => {
        expect(validateTask({ ...several, check: (x) => x === 1 }).map((x) => x.rule)).toEqual(['check-one-right']);
    });
    it('leaves set answers (EVEN_ODD select) alone', () => {
        const select: Task = { ...several, answer: [2, 4], choices: [1, 2, 3, 4], check: (x) => Array.isArray(x) };
        expect(validateTask(select)).toEqual([]);
    });

    it('"trwa 1 godzinę" takes the accusative like the other verbs of duration', () => {
        const t = { ...base, prompt: 'Film trwa 1 godzina.' };
        expect(validateTask(t, { nouns }).map((x) => x.rule)).toEqual(['inflection']);
        expect(validateTask({ ...t, prompt: 'Film trwa 1 godzinę.' }, { nouns })).toEqual([]);
        expect(validateTask({ ...t, prompt: 'Film trwa 2 godziny.' }, { nouns })).toEqual([]);
    });
});

describe('validateTask: faces (S-14d)', () => {
    const tri = 'shape:triangle:red:big';
    const circ = 'shape:circle:blue:small';
    const sq = 'shape:square:green:big';
    const faceTask: Task = { skillId: 's', prompt: 'Dotknij trójkąta.', answer: tri, choices: [tri, circ, sq], hint: ['Trójkąt ma 3 boki i 3 rogi.'] };

    it('accepts distinct faces', () => {
        expect(validateTask(faceTask)).toEqual([]);
    });

    it('flags a repeated face among the choices', () => {
        expect(validateTask({ ...faceTask, choices: [tri, circ, tri] }).map((x) => x.rule)).toContain('faces-distinct');
    });

    it('flags a code that is not a face, and faces mixed with plain text', () => {
        expect(validateTask({ ...faceTask, choices: [tri, 'shape:cube:red:big', sq] }).map((x) => x.rule)).toContain('faces-distinct');
        expect(validateTask({ ...faceTask, choices: [tri, circ, 'parzysta'] }).map((x) => x.rule)).toContain('faces-distinct');
    });

    it('flags an answer that is not among the faces', () => {
        expect(validateTask({ ...faceTask, answer: 'shape:star:red:big' }).map((x) => x.rule)).toContain('choices');
    });

    it('checks every face of a list answer against the choices', () => {
        expect(validateTask({ ...faceTask, input: 'select', answer: [tri, sq] })).toEqual([]);
        expect(validateTask({ ...faceTask, input: 'select', answer: [tri, 'shape:star:red:big'] }).map((x) => x.rule)).toContain('choices');
    });
});

describe('validateTask: pattern drawing (S-14d)', () => {
    const a = 'shape:circle:red:big';
    const b = 'shape:square:red:big';
    const row = (items: (string | null)[]): Task => ({
        skillId: 's',
        prompt: 'Co będzie dalej?',
        answer: a,
        choices: [a, b, 'shape:triangle:red:big'],
        hint: ['Szlaczek się powtarza.'],
        visual: { kind: 'pattern', items },
    });

    it('accepts a row of faces with the empty place last', () => {
        expect(validateTask(row([a, b, a, b, a, b, a, null]))).toEqual([]);
    });

    it('flags a row without the empty place at the end', () => {
        expect(validateTask(row([a, b, a, b, a, b, a, b])).map((x) => x.rule)).toContain('visual');
        expect(validateTask(row([a, b, null, b, a, b, a, null])).map((x) => x.rule)).toContain('visual');
        expect(validateTask(row([a, b, a, b, a, b, null, a])).map((x) => x.rule)).toContain('visual');
    });

    it('flags a row that is too short or too long, or that holds a non-face', () => {
        expect(validateTask(row([a, b, a, null])).map((x) => x.rule)).toContain('visual');
        expect(validateTask(row([a, b, a, b, a, b, a, b, a, b, null])).map((x) => x.rule)).toContain('visual');
        expect(validateTask(row([a, b, a, b, 'x', b, a, null])).map((x) => x.rule)).toContain('visual');
    });
});

