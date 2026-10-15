import { describe, expect, it } from 'vitest';
import { generateOrderOps, parseOrderOpsParams } from '../src/core/tasks/generators/orderOps';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const FORMS = ['a+b*c', 'a-b:c', 'a*b+c', 'a:b-c'] as const;
const skill = (form: string, max = 100): SkillDef => ({
    id: `T.order_ops.${form}`,
    stage: 'E5',
    step: 11,
    type: 'ORDER_OPS',
    params: { forms: [form], max },
    answer: 'keypad',
});

const apply = (x: number, op: string, y: number): number => (op === '+' ? x + y : op === '−' ? x - y : op === '·' ? x * y : x / y);
const HIGH = new Set(['·', ':']);

/** Independent oracle: reads the printed expression and applies the precedence rule itself. */
const read = (prompt: string): { a: number; o1: string; b: number; o2: string; c: number; right: number; leftToRight: number } => {
    const m = /^(\d+) ([+−·:]) (\d+) ([+−·:]) (\d+)$/.exec(prompt);
    if (!m) {
        throw new Error(`unparsable prompt "${prompt}"`);
    }
    const [a, b, c] = [Number(m[1]), Number(m[3]), Number(m[5])];
    const [o1, o2] = [m[2], m[4]];
    const right = HIGH.has(o2) && !HIGH.has(o1) ? apply(a, o1, apply(b, o2, c)) : apply(apply(a, o1, b), o2, c);
    return { a, o1, b, o2, c, right, leftToRight: apply(apply(a, o1, b), o2, c) };
};

describe('generateOrderOps', () => {
    for (const form of FORMS) {
        it(`${form}: 1000 draws, the answer follows the precedence rule (and left-to-right is wrong where the rule matters)`, () => {
            forEachDraw(generateOrderOps, skill(form), { max: 100 }, (task, where) => {
                const e = read(task.prompt);
                expect(task.answer, where).toBe(e.right);
                // the rule matters only when the high-precedence operation stands second; "6 · 8 + 3" and "56 : 7 − 3" read the same left to right
                if (HIGH.has(e.o2) && !HIGH.has(e.o1)) {
                    expect(e.leftToRight, where).not.toBe(e.right);
                }
                expect(Number.isInteger(e.right) && e.right >= 1, where).toBe(true);
                for (const n of [e.a, e.b, e.c]) {
                    expect(n, where).toBeLessThanOrEqual(100);
                }
                // the multiplication or division is the one in the tables, with an integer result
                const [hi1, hi2] = HIGH.has(e.o2) ? [e.b, e.c] : [e.a, e.b];
                const op = HIGH.has(e.o2) ? e.o2 : e.o1;
                expect(Number.isInteger(apply(hi1, op, hi2)), where).toBe(true);
                expect(Math.max(hi1, hi2), where).toBeLessThanOrEqual(op === '·' ? 10 : 100);
            });
        });

        it(`${form}: the hint is three steps of one operation each, the high-precedence one first`, () => {
            forEachDraw(generateOrderOps, skill(form), { max: 100 }, (task, where) => {
                const e = read(task.prompt);
                const hiOp = HIGH.has(e.o2) ? e.o2 : e.o1;
                const [x, y] = HIGH.has(e.o2) ? [e.b, e.c] : [e.a, e.b];
                const mid = apply(x, hiOp, y);
                expect(task.hint, where).toHaveLength(3);
                expect(task.hint[0], where).toMatch(/^Najpierw (mnożenie|dzielenie): /);
                expect(task.hint[0], where).toContain(`${x} ${hiOp} ${y}`);
                expect(task.hint[1], where).toBe(`${x} ${hiOp} ${y} = ${mid}`);
                expect(task.hint[2], where).toMatch(new RegExp(`^.* = ${e.right}$`));
                expect(task.hint[2], where).toContain(String(mid));
            });
        });
    }

    it('rejects a form list that is empty or unknown and a max too small for a product', () => {
        expect(() => parseOrderOpsParams({ forms: [], max: 100 })).toThrow(TypeError);
        expect(() => parseOrderOpsParams({ forms: ['a+b'], max: 100 })).toThrow(TypeError);
        expect(() => parseOrderOpsParams({ forms: ['a+b*c'], max: 5 })).toThrow(TypeError);
    });
});
