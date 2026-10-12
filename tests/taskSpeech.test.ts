import { describe, expect, it } from 'vitest';
import { getGenerator } from '../src/core/tasks/registry';
import { spellRoman } from '../src/core/text/roman';
import { numberToWords } from '../src/core/text/numberWords';
import { stages } from '../src/data/curriculum';
import { pl } from '../src/data/pl';
import { monthsOf } from './taskSpeechHelpers';
import { forEachDraw } from './helpers';

// Spoken text (Task.speak) of the generators whose prompt is bare symbols or Roman
// numerals. Skills come from the real curriculum of every stage (S-05 phase 1).
const skillsOf = (type: string) => Object.values(stages).flatMap((stage) => stage?.steps.flatMap((s) => s.skills).filter((k) => k.type === type) ?? []);
const ROMAN_TOKEN = /\b[IVXLCDM]+\b/;

describe.each(['COMPARE_NUM', 'COMPARE_EXPR', 'MISSING_OP'])('%s speak', (type) => {
    const skills = skillsOf(type);
    it('has skills in the curriculum', () => expect(skills.length).toBeGreaterThan(0));
    for (const skill of skills) {
        it(`${skill.id}: asks about the sign, carries the whole expression, hides the answer`, () => {
            forEachDraw(getGenerator(type)!, skill, {}, (task, where) => {
                expect(task.speak, where).toBeDefined();
                expect(task.speak, where).toContain(task.prompt);
                expect(task.speak, where).toMatch(/^[^□]*\?/);
                // The question text carries no sign glyph of its own: the answer sign only appears inside the expression.
                const question = task.speak!.replace(task.prompt, '');
                expect(question, where).not.toMatch(/[<>=+−]/);
            });
        });
    }
});

describe('ROMAN speak', () => {
    for (const skill of skillsOf('ROMAN')) {
        it(`${skill.id}: reading tasks spell the letters, no numeral token, no value`, () => {
            forEachDraw(getGenerator('ROMAN')!, skill, {}, (task, where) => {
                if (typeof task.answer !== 'number') {
                    expect(task.speak, where).toBeUndefined();
                    return;
                }
                expect(task.speak, where).toBeDefined();
                expect(task.speak, where).not.toMatch(ROMAN_TOKEN);
                expect(task.speak, where).not.toMatch(/\d/);
                if (task.answer <= 1000) {
                    const words = numberToWords(task.answer).split(' ');
                    const spoken = task.speak!.toLowerCase().split(/[^\p{L}]+/u);
                    const at = spoken.findIndex((_, i) => words.every((w, j) => spoken[i + j] === w));
                    expect(at, where).toBe(-1);
                }
                const numeral = ROMAN_TOKEN.exec(task.prompt)![0];
                expect(task.speak, where).toContain(spellRoman(numeral, pl.tasks.romanLetters));
            });
        });
    }
});

describe('CALENDAR romanMonth speak', () => {
    for (const skill of skillsOf('CALENDAR').filter((k) => (k.params.variants as string[] | undefined)?.includes('romanMonth'))) {
        it(`${skill.id}: date with a spelled month numeral, not the month`, () => {
            let seen = 0;
            forEachDraw(getGenerator('CALENDAR')!, skill, {}, (task, where) => {
                if (!task.prompt.startsWith('Data ')) {
                    return;
                }
                seen += 1;
                expect(task.speak, where).toBeDefined();
                expect(task.speak, where).not.toMatch(ROMAN_TOKEN);
                expect(task.speak, where).not.toContain(String(task.answer));
                expect(task.speak, where).toContain(task.prompt.split(' ')[1]);
                for (const month of monthsOf()) {
                    expect(task.speak, where).not.toContain(month);
                }
            });
            expect(seen).toBeGreaterThan(100);
        });
    }
});

describe('spellRoman', () => {
    it('names every letter and separates them', () => {
        expect(spellRoman('VII', pl.tasks.romanLetters)).toBe('fau, i, i');
        expect(spellRoman('XLIX', pl.tasks.romanLetters)).toBe('iks, el, i, iks');
        expect(spellRoman('MCD', pl.tasks.romanLetters)).toBe('em, ce, de');
    });
});
