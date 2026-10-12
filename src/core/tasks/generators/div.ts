// DIV: exact division n : d (ZADANIA.md, section 4); the hint is the
// multiplication that checks it (4 · 7 = 28).
import type { Rng } from '../../rng';
import { DIVIDE, TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export interface DivParams {
    maxDividend: number;
    maxQuotient: number;            // default 10
    divisors?: readonly number[];   // fixed divisors (:5, :10)
}

const MAX_ATTEMPTS = 1000;

export const parseDivParams = (params: Record<string, unknown>): DivParams => {
    const { maxDividend, maxQuotient = 10, divisors } = params;
    if (!Number.isInteger(maxDividend) || (maxDividend as number) < 4) {
        throw new TypeError(`DIV params.maxDividend must be an integer >= 4, got ${String(maxDividend)}`);
    }
    if (!Number.isInteger(maxQuotient) || (maxQuotient as number) < 1) {
        throw new TypeError(`DIV params.maxQuotient must be an integer >= 1, got ${String(maxQuotient)}`);
    }
    if (divisors !== undefined && (!Array.isArray(divisors) || divisors.length === 0 || !divisors.every((d) => Number.isInteger(d) && d >= 1))) {
        throw new TypeError(`DIV params.divisors must be positive integers, got ${JSON.stringify(divisors)}`);
    }
    const smallest = Math.min(...((divisors as number[] | undefined) ?? [2]));
    if (smallest > (maxDividend as number)) {
        throw new TypeError(`DIV params have no divisions: smallest divisor ${smallest} exceeds maxDividend ${String(maxDividend)}`);
    }
    return { maxDividend: maxDividend as number, maxQuotient: maxQuotient as number, divisors };
};

/** Quotient 1 (n : n) about one draw in ten; otherwise 2..maxQuotient. */
const ONE_SHARE = 0.1;
const drawQuotient = (p: DivParams, rng: Rng): number =>
    p.maxQuotient < 2 || rng.chance(ONE_SHARE) ? 1 : rng.int(2, p.maxQuotient);

export const generateDiv: Generator = (skill, rng): Task => {
    const p = parseDivParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const d = p.divisors ? rng.pick(p.divisors) : rng.int(2, 10);
        const q = drawQuotient(p, rng);
        if (d * q <= p.maxDividend) {
            return {
                skillId: skill.id,
                prompt: `${d * q} ${DIVIDE} ${d}`,
                answer: q,
                hint: [`${d} ${TIMES} ${q} = ${d * q}`],
            };
        }
    }
    throw new Error(`DIV: no division for ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
