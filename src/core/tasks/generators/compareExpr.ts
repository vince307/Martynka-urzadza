// COMPARE_EXPR: compare the results of two expressions, "3 + 4 □ 9 − 1"
// (ZADANIA.md, section 4). Answer is a sign tile; "=" appears about one time
// in six and never as two identical expressions.
import { applyOp, arithLine, opSign, type Op } from '../arith';
import { BOX } from '../symbols';
import type { Generator, Task } from '../types';
import { SIGNS } from './compareNum';

export interface CompareExprParams {
    max: number;
    ops: Op[];
}

const MAX_ATTEMPTS = 1000;
const EQUAL_SHARE = 1 / 6;

export const parseCompareExprParams = (params: Record<string, unknown>): CompareExprParams => {
    const { max, ops } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`COMPARE_EXPR params.max must be an integer >= 2, got ${String(max)}`);
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every((o) => o === '+' || o === '-')) {
        throw new TypeError(`COMPARE_EXPR params.ops must be a non-empty list of '+' / '-', got ${JSON.stringify(ops)}`);
    }
    // Sums only: below 4 there are no two different expressions (1 + 1, 1 + 2 and 2 + 1 only).
    if (!ops.includes('-') && (max as number) < 4) {
        throw new TypeError(`COMPARE_EXPR ops ['+'] needs max >= 4, got ${String(max)}`);
    }
    return { max: max as number, ops: ops as Op[] };
};

interface Expr {
    a: number;
    b: number;
    op: Op;
    value: number;
}

const text = (e: Expr): string => `${e.a} ${opSign(e.op)} ${e.b}`;
/** Same expression, also with the terms of an addition swapped. */
const sameExpr = (x: Expr, y: Expr): boolean =>
    x.op === y.op && ((x.a === y.a && x.b === y.b) || (x.op === '+' && x.a === y.b && x.b === y.a));

export const generateCompareExpr: Generator = (skill, rng): Task => {
    const p = parseCompareExprParams(skill.params);
    const draw = (): Expr | null => {
        const a = rng.int(1, p.max);
        const b = rng.int(1, p.max);
        const op = rng.pick(p.ops);
        const value = applyOp(a, b, op);
        return value < 0 || value > p.max ? null : { a, b, op, value };
    };
    const forceEqual = rng.chance(EQUAL_SHARE);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const left = draw();
        const right = draw();
        if (!left || !right || sameExpr(left, right) || (left.value === right.value) !== forceEqual) {
            continue;
        }
        const sign = left.value < right.value ? '<' : left.value > right.value ? '>' : '=';
        return {
            skillId: skill.id,
            prompt: `${text(left)} ${BOX} ${text(right)}`,
            answer: sign,
            choices: [...SIGNS],
            hint: [arithLine(left.a, left.b, left.op), arithLine(right.a, right.b, right.op), `${left.value} ${sign} ${right.value}`],
        };
    }
    throw new Error(`COMPARE_EXPR: no expressions with ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
