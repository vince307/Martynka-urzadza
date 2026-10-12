// MULT: a · b with a numeric answer (ZADANIA.md, section 4). The hint splits
// the second factor in half (7 · 4 → 7 · 2 + 7 · 2) or states the trivial
// cases with 0 and 1.
import type { Rng } from '../../rng';
import { TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export interface MultParams {
    maxProduct: number;
    maxFactor: number;             // largest factor when `factors` is not given
    factors?: readonly number[];   // fixed second factors (·5, ·10)
    allowZeroOne: boolean;         // include ·0 and ·1 (E3.9)
}

const MAX_ATTEMPTS = 1000;

export const parseMultParams = (params: Record<string, unknown>): MultParams => {
    const { maxProduct, maxFactor = 10, factors, allowZeroOne = false } = params;
    if (!Number.isInteger(maxProduct) || (maxProduct as number) < 4) {
        throw new TypeError(`MULT params.maxProduct must be an integer >= 4, got ${String(maxProduct)}`);
    }
    if (!Number.isInteger(maxFactor) || (maxFactor as number) < 2) {
        throw new TypeError(`MULT params.maxFactor must be an integer >= 2, got ${String(maxFactor)}`);
    }
    if (factors !== undefined && (!Array.isArray(factors) || factors.length === 0 || !factors.every((f) => Number.isInteger(f) && f >= 0))) {
        throw new TypeError(`MULT params.factors must be non-negative integers, got ${JSON.stringify(factors)}`);
    }
    if (typeof allowZeroOne !== 'boolean') {
        throw new TypeError(`MULT params.allowZeroOne must be a boolean, got ${String(allowZeroOne)}`);
    }
    return { maxProduct: maxProduct as number, maxFactor: maxFactor as number, factors, allowZeroOne };
};

const drawFactors = (p: MultParams, rng: Rng): [number, number] | undefined => {
    const low = p.allowZeroOne ? 0 : 2;
    const a = rng.int(low, p.maxFactor);
    const b = p.factors ? rng.pick(p.factors) : rng.int(low, p.maxFactor);
    if (a * b > p.maxProduct || (a === 0 && b === 0)) {
        return undefined;
    }
    // Keep 0 and 1 rare (about one draw in four) so the step is not dominated by them.
    if (p.allowZeroOne && (a <= 1 || b <= 1) && !rng.chance(1 / 3)) {
        return undefined;
    }
    return [a, b];
};

/**
 * Hint: ·0, ·1, ·2, ·5 and ·10 are stated directly; an even factor is doubled
 * (7 · 4 → 7 · 2 = 14, 14 + 14 = 28); an odd one adds one more group
 * (7 · 3 → 7 · 2 = 14, 14 + 7 = 21).
 */
export const multHint = (a: number, b: number): string[] => {
    const product = a * b;
    if (a <= 2 || b <= 2 || b === 5 || b === 10) {
        return [`${a} ${TIMES} ${b} = ${product}`];
    }
    if (b % 2 === 0) {
        const half = a * (b / 2);
        return [`${a} ${TIMES} ${b / 2} = ${half}`, `${half} + ${half} = ${product}`];
    }
    const most = a * (b - 1);
    return [`${a} ${TIMES} ${b - 1} = ${most}`, `${most} + ${a} = ${product}`];
};

export const generateMult: Generator = (skill, rng): Task => {
    const p = parseMultParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const drawn = drawFactors(p, rng);
        if (drawn) {
            const [a, b] = drawn;
            return { skillId: skill.id, prompt: `${a} ${TIMES} ${b}`, answer: a * b, hint: multHint(a, b) };
        }
    }
    throw new Error(`MULT: no factors for ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
