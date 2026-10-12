// CHAIN: three terms evaluated from the left, "2 + 3 + 4", "9 − 2 − 3",
// "5 + 4 − 3" (ZADANIA.md, section 4). Every intermediate result and the final
// one stay in [1, max]; the hint shows both steps.
import { applyOp, arithLine, opSign, type Op } from '../arith';
import type { Generator, Task } from '../types';

export interface ChainParams {
    max: number;
    ops: Op[];
    terms: 3;
}

const MAX_ATTEMPTS = 1000;

export const parseChainParams = (params: Record<string, unknown>): ChainParams => {
    const { max, ops, terms } = params;
    if (!Number.isInteger(max) || (max as number) < 3) {
        throw new TypeError(`CHAIN params.max must be an integer >= 3, got ${String(max)}`);
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every((o) => o === '+' || o === '-')) {
        throw new TypeError(`CHAIN params.ops must be a non-empty list of '+' / '-', got ${JSON.stringify(ops)}`);
    }
    if (terms !== 3) {
        throw new TypeError(`CHAIN params.terms must be 3, got ${String(terms)}`);
    }
    return { max: max as number, ops: ops as Op[], terms: 3 };
};

const inRange = (n: number, max: number): boolean => n >= 1 && n <= max;

export const generateChain: Generator = (skill, rng): Task => {
    const p = parseChainParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const a = rng.int(1, p.max);
        const b = rng.int(1, p.max);
        const c = rng.int(1, p.max);
        const op1 = rng.pick(p.ops);
        const op2 = rng.pick(p.ops);
        const mid = applyOp(a, b, op1);
        if (!inRange(mid, p.max)) {
            continue;
        }
        const end = applyOp(mid, c, op2);
        if (!inRange(end, p.max)) {
            continue;
        }
        return {
            skillId: skill.id,
            prompt: `${a} ${opSign(op1)} ${b} ${opSign(op2)} ${c}`,
            answer: end,
            hint: [arithLine(a, b, op1), arithLine(mid, c, op2)],
        };
    }
    throw new Error(`CHAIN: no terms with ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
