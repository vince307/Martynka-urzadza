import { describe, expect, it } from 'vitest';
import { generateCompareNum, SIGNS } from '../src/core/tasks/generators/compareNum';
import { E4 } from '../src/data/curriculum/E4';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateCompareNum', () => {
    for (const skill of skillsOfType(E4, 'COMPARE_NUM')) {
        it(`${skill.id}: 1000 draws`, () => {
            const signs = { '<': 0, '>': 0, '=': 0 };
            forEachDraw(generateCompareNum, skill, {}, (task, where) => {
                const m = /^(\d+) □ (\d+)$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const a = Number(m![1]);
                const b = Number(m![2]);
                const expected = a < b ? '<' : a > b ? '>' : '=';
                expect(task.answer, where).toBe(expected);
                expect(task.choices, where).toEqual([...SIGNS]);
                signs[expected] += 1;
                expect(task.hint.length, where).toBeGreaterThan(0);
            });
            expect(signs['=']).toBeGreaterThan(50);
            expect(signs['<']).toBeGreaterThan(200);
            expect(signs['>']).toBeGreaterThan(200);
        });
    }
});

describe('generateCompareNum large numbers', () => {
    const NBSP = '\u00A0';
    const big = { id: 'T.big', type: 'COMPARE_NUM', params: { max: 1000000 } } as never;
    const num = (s: string): number => Number(s.replace(new RegExp(NBSP, 'g'), ''));

    it('max 1 000 000: grouped numbers, consistent sign, digit-based hints', () => {
        let grouped = 0;
        let differentLength = 0;
        forEachDraw(generateCompareNum, big, {}, (task, where) => {
            const m = /^(\d+(?:\u00A0\d{3})*) □ (\d+(?:\u00A0\d{3})*)$/.exec(task.prompt);
            expect(m, where).not.toBeNull();
            const [a, b] = [num(m![1]), num(m![2])];
            expect(task.answer, where).toBe(a < b ? '<' : a > b ? '>' : '=');
            const text = task.hint.join(' | ');
            expect(text, where).not.toMatch(/\d (dziesiąt|jedno)/);
            for (const n of [a, b]) {
                if (n >= 10000) {
                    grouped += 1;
                    expect(task.prompt, where).toContain(NBSP);
                }
            }
            if (String(a).length !== String(b).length) {
                differentLength += 1;
                // impl-review S-03: no trivial pairs such as 612 449 □ 2; lengths differ by one digit.
                expect(Math.abs(String(a).length - String(b).length), where).toBe(1);
            }
            if (a !== b) {
                const last = task.hint[task.hint.length - 1];
                expect(last, where).toBe(`${m![1]} ${task.answer as string} ${m![2]}`);
            }
        });
        expect(grouped).toBeGreaterThan(300);
        expect(differentLength).toBeGreaterThan(150);
    });

    it('a one-digit number "ma 1 cyfrę" (accusative, impl-review S-03)', () => {
        const mid = { id: 'T.mid', type: 'COMPARE_NUM', params: { max: 1000 } } as never;
        let oneDigit = 0;
        // forEachDraw runs validateTask, which flags "ma 1 cyfra".
        forEachDraw(generateCompareNum, mid, {}, (task) => {
            if (task.hint.some((h) => h.endsWith(' ma 1 cyfrę'))) {
                oneDigit += 1;
            }
        });
        expect(oneDigit).toBeGreaterThan(0);
    });

    it('max <= 100 keeps the tens and units hint', () => {
        const small = { id: 'T.small', type: 'COMPARE_NUM', params: { max: 100 } } as never;
        let seen = 0;
        forEachDraw(generateCompareNum, small, {}, (task) => {
            if (task.hint.length === 3) {
                seen += 1;
                expect(task.hint[0]).toMatch(/ to .*(dziesiąt|jedno)/);
            }
        });
        expect(seen).toBeGreaterThan(100);
    });
});
