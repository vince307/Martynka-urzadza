// WRITTEN (S-14b): a written column with digit boxes. The column arithmetic is recomputed here from the operands,
// never read back from the generator's lines.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generateWritten, parseWrittenParams } from '../src/core/tasks/generators/written';
import { generators, parsers } from '../src/core/tasks/registry';
import { columnMarks } from '../src/core/tasks/written';
import type { TaskVisual } from '../src/core/tasks/visual';
import { validateTask } from '../src/core/tasks/validate';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

type Column = Extract<TaskVisual, { kind: 'column' }>;

const skill = (op: '+' | '−', digits: 2 | 3, carry: 'any' | 'required'): SkillDef => ({
    id: `E5.2.written_${op === '+' ? 'add' : 'sub'}_${digits}_${carry}`, stage: 'E5', step: 2, type: 'WRITTEN', params: { op, digits, carry }, answer: 'digits',
});
const column = (task: { visual?: TaskVisual }, where: string): Column => {
    if (task.visual?.kind !== 'column') throw new Error(`no column drawing ${where}`);
    return task.visual;
};
const digitsOf = (n: number, count: number): number[] => Array.from({ length: count }, (_, i) => Math.floor(n / 10 ** i) % 10);
const VARIANTS: [('+' | '−'), 2 | 3, 'any' | 'required'][] = [
    ['+', 2, 'any'], ['+', 2, 'required'], ['−', 2, 'any'], ['−', 2, 'required'],
    ['+', 3, 'any'], ['+', 3, 'required'], ['−', 3, 'any'], ['−', 3, 'required'],
];

describe('WRITTEN registration and params', () => {
    it('is registered next to its parser', () => {
        expect(Object.keys(generators).sort()).toEqual(Object.keys(parsers).sort());
        expect(generators.WRITTEN).toBe(generateWritten);
    });
    it('rejects params with no solutions', () => {
        expect(() => parseWrittenParams({ op: '×', digits: 2, carry: 'any' })).toThrow(TypeError);
        expect(() => parseWrittenParams({ op: '+', digits: 4, carry: 'any' })).toThrow(TypeError);
        expect(() => parseWrittenParams({ op: '+', digits: 2, carry: 'sometimes' })).toThrow(TypeError);
        expect(parseWrittenParams({ op: '−', digits: 3, carry: 'required' })).toEqual({ op: '−', digits: 3, carry: 'required' });
    });
});

describe('WRITTEN tasks', () => {
    for (const [op, digits, carry] of VARIANTS) {
        it(`${op} ${digits} digits, carry ${carry}: result has exactly the column count of digits, every line adds up`, () => {
            forEachDraw(generateWritten, skill(op, digits, carry), {}, (task, where) => {
                const v = column(task, where);
                expect(v.op, where).toBe(op);
                expect(v.columns, where).toBe(digits);
                expect(String(v.a).length, where).toBe(digits);
                expect(String(v.b).length, where).toBe(digits);
                const result = op === '+' ? v.a + v.b : v.a - v.b;
                expect(task.answer, where).toBe(result);
                expect(String(result).length, where).toBe(digits);
                // Recompute the method column by column from the operands.
                const a = digitsOf(v.a, digits);
                const b = digitsOf(v.b, digits);
                let events = 0;
                if (op === '+') {
                    let c = 0;
                    a.forEach((x, i) => {
                        const total = x + b[i] + c;
                        const expr = c ? `${x} + ${b[i]} + 1 = ${total}` : `${x} + ${b[i]} = ${total}`;
                        expect(task.hint[i], where).toContain(expr);
                        if (total >= 10) {
                            expect(task.hint[i], where).toContain(`Piszę ${total - 10}, 1 dalej.`);
                            events += 1;
                        } else {
                            expect(task.hint[i], where).not.toContain('dalej');
                        }
                        c = total >= 10 ? 1 : 0;
                    });
                } else {
                    const m = [...a];
                    a.forEach((_, i) => {
                        if (m[i] < b[i]) {
                            events += 1;
                            expect(task.hint[i], where).toContain(`${m[i]} − ${b[i]} nie da się. Pożyczam`);
                            expect(task.hint[i], where).toContain(`${m[i] + 10} − ${b[i]} = ${m[i] + 10 - b[i]}`);
                            let j = i + 1;
                            while (m[j] === 0) { m[j] = 9; j += 1; }
                            m[j] -= 1;
                            m[i] += 10;
                        } else {
                            expect(task.hint[i], where).toContain(`${m[i]} − ${b[i]} = ${m[i] - b[i]}`);
                        }
                    });
                }
                if (carry === 'required') expect(events, where).toBeGreaterThan(0);
                expect(task.hint.at(-1), where).toBe(`${v.a} ${op} ${v.b} = ${result}`);
                expect(task.hint, where).toHaveLength(digits + 1);
                expect(task.hint[0].length, where).toBeLessThanOrEqual(64);
                // The first hint step never states the result.
                expect(firstHint(task), where).not.toBeNull();
                expect(task.prompt, where).toContain(`${v.a} ${op} ${v.b}`);
            });
        });
    }
    it('draws digits 3 results of 100..999 and 2 digits results of 10..99', () => {
        const rng = createRng(7);
        for (let i = 0; i < 300; i += 1) {
            const t = generateWritten(skill('+', 2, 'any'), rng);
            expect(t.answer).toBeGreaterThanOrEqual(10);
            expect(t.answer).toBeLessThanOrEqual(99);
        }
    });
    it('a column task in digits mode passes the validator', () => {
        const t = { ...generateWritten(skill('+', 2, 'required'), createRng(3)), input: 'digits' as const };
        expect(validateTask(t, {})).toEqual([]);
    });
});

describe('columnMarks', () => {
    const col = (op: '+' | '−', a: number, b: number, columns: number): Column => ({ kind: 'column', op, a, b, columns });
    it('shows nothing when told none', () => {
        expect(columnMarks(col('+', 38, 27, 2), 'none')).toEqual({ carries: [], borrows: [] });
    });
    it('marks the carry of 38 + 27 above the tens', () => {
        expect(columnMarks(col('+', 38, 27, 2), 'all')).toEqual({ carries: [{ col: 1 }], borrows: [] });
    });
    it('marks one carry of 468 + 216 (tens 6 + 1 + 1 = 8 carries none)', () => {
        expect(columnMarks(col('+', 468, 216, 3), 'all').carries).toEqual([{ col: 1 }]);
    });
    it('marks both carries of 678 + 245 and only the first when told first', () => {
        expect(columnMarks(col('+', 678, 245, 3), 'all').carries).toEqual([{ col: 1 }, { col: 2 }]);
        expect(columnMarks(col('+', 678, 245, 3), 'first').carries).toEqual([{ col: 1 }]);
    });
    it('marks the borrow of 65 − 48: the tens 6 becomes 5, the ones 5 becomes 15', () => {
        expect(columnMarks(col('−', 65, 48, 2), 'all')).toEqual({
            carries: [], borrows: [{ col: 0, becomes: 15, lenders: [{ col: 1, struck: 6, now: 5 }] }],
        });
    });
    it('marks the borrow of 365 − 156', () => {
        expect(columnMarks(col('−', 365, 156, 3), 'all').borrows).toEqual([{ col: 0, becomes: 15, lenders: [{ col: 1, struck: 6, now: 5 }] }]);
    });
    it('chains the borrow of 500 − 284 through the zero', () => {
        expect(columnMarks(col('−', 500, 284, 3), 'all').borrows).toEqual([
            { col: 0, becomes: 10, lenders: [{ col: 1, struck: 0, now: 9 }, { col: 2, struck: 5, now: 4 }] },
        ]);
    });
    it('marks nothing for a subtraction without borrow', () => {
        expect(columnMarks(col('−', 98, 45, 2), 'all')).toEqual({ carries: [], borrows: [] });
    });
});
