// ROUNDING: the nearest full ten (E4), hundred or thousand (E6) (ZADANIA.md,
// section 4). Numbers exactly halfway (ending in 5, 50 or 500) are skipped
// because the catalogue does not settle the tie rule yet.
import { pl } from '../../../data/pl';
import { formatNumber } from '../../text/formatNumber';
import type { Generator, Task } from '../types';

export interface RoundingParams {
    max: number;   // upper bound for the number asked about
    to: 10 | 100 | 1000;   // tens in E4; hundreds and thousands in E6
}

const MAX_NUMBER = 10000;

export const parseRoundingParams = (params: Record<string, unknown>): RoundingParams => {
    const { max, to = 10 } = params;
    if (!Number.isInteger(max) || (max as number) < 20) {
        throw new TypeError(`ROUNDING params.max must be an integer >= 20, got ${String(max)}`);
    }
    if (to !== 10 && to !== 100 && to !== 1000) {
        throw new TypeError(`ROUNDING params.to must be 10, 100 or 1000, got ${String(to)}`);
    }
    if ((max as number) > MAX_NUMBER) {
        throw new TypeError(`ROUNDING params.max must be at most ${MAX_NUMBER}, got ${String(max)}`);
    }
    // Hundreds and thousands need room for at least two neighbouring multiples.
    if (to !== 10 && (max as number) < 2 * to) {
        throw new TypeError(`ROUNDING params.max must be at least ${2 * to} for to ${to}, got ${String(max)}`);
    }
    return { max: max as number, to };
};

export const generateRounding: Generator = (skill, rng): Task => {
    const p = parseRoundingParams(skill.params);
    const { to } = p;
    const first = to === 10 ? 11 : to + 1;
    let n = rng.int(first, p.max - 1);
    while (n % to === 0 || n % to === to / 2) {
        n = rng.int(first, p.max - 1);
    }
    const low = n - (n % to);
    const high = low + to;
    const nearest = n % to < to / 2 ? low : high;
    return {
        skillId: skill.id,
        prompt: pl.tasks.rounding(formatNumber(n), to),
        answer: nearest,
        hint: pl.tasks.roundingHint(formatNumber(n), formatNumber(low), formatNumber(high), formatNumber(nearest)),
    };
};
