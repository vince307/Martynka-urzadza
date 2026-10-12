// MISSING_OP: "8 □ 2 = 6", pick the missing sign from two tiles (ZADANIA.md,
// section 4). Only + and −: with b >= 1 exactly one of them fits.
import { pl } from '../../../data/pl';
import { applyOp, arithLine, opSign, SAME_SHARE, type Op } from '../arith';
import { BOX } from '../symbols';
import type { Generator, Task } from '../types';

export interface MissingOpParams {
    max: number;
    ops: Op[];
}

const MAX_ATTEMPTS = 1000;

export const parseMissingOpParams = (params: Record<string, unknown>): MissingOpParams => {
    const { max, ops } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`MISSING_OP params.max must be an integer >= 2, got ${String(max)}`);
    }
    if (!Array.isArray(ops) || ops.some((o) => o !== '+' && o !== '-')) {
        throw new TypeError(`MISSING_OP params.ops allows only '+' and '-' (· and : are ambiguous and out of scope), got ${JSON.stringify(ops)}`);
    }
    if (new Set(ops).size !== 2) {
        throw new TypeError(`MISSING_OP params.ops needs both '+' and '-' (one sign leaves no choice), got ${JSON.stringify(ops)}`);
    }
    return { max: max as number, ops: ['+', '-'] };
};

export const generateMissingOp: Generator = (skill, rng): Task => {
    const p = parseMissingOpParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const a = rng.int(1, p.max);
        const b = rng.int(1, p.max);
        const op = rng.pick(p.ops);
        const c = applyOp(a, b, op);
        if (c < 0 || c > p.max || (op === '-' && a === b && !rng.chance(SAME_SHARE))) {
            continue;
        }
        const answer = opSign(op);
        const prompt = `${a} ${BOX} ${b} = ${c}`;
        return {
            skillId: skill.id,
            prompt,
            speak: pl.tasks.missingOpSpeak(prompt),
            answer,
            choices: rng.shuffle([opSign('+'), opSign('-')]),
            hint: [pl.tasks.missingOpHint(a, op === '+'), arithLine(a, b, op)],
        };
    }
    throw new Error(`MISSING_OP: no operands with ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
