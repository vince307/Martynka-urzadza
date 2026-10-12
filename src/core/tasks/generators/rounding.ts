// ROUNDING: the nearest full ten (ZADANIA.md, section 4, E4). Numbers ending
// in 5 are skipped because the catalogue does not settle the tie rule yet.
import { pl } from '../../../data/pl';
import type { Generator, Task } from '../types';

export interface RoundingParams {
    max: number;   // upper bound for the number asked about
    to: 10;        // only tens in E4; hundreds and thousands arrive with E6
}

export const parseRoundingParams = (params: Record<string, unknown>): RoundingParams => {
    const { max, to = 10 } = params;
    if (!Number.isInteger(max) || (max as number) < 20) {
        throw new TypeError(`ROUNDING params.max must be an integer >= 20, got ${String(max)}`);
    }
    if (to !== 10) {
        throw new TypeError(`ROUNDING params.to supports only 10 for now, got ${String(to)}`);
    }
    return { max: max as number, to: 10 };
};

export const generateRounding: Generator = (skill, rng): Task => {
    const p = parseRoundingParams(skill.params);
    let n = rng.int(11, p.max - 1);
    while (n % 10 === 0 || n % 10 === 5) {
        n = rng.int(11, p.max - 1);
    }
    const low = n - (n % 10);
    const high = low + 10;
    const nearest = n % 10 < 5 ? low : high;
    return {
        skillId: skill.id,
        prompt: pl.tasks.rounding(n),
        answer: nearest,
        hint: pl.tasks.roundingHint(n, low, high, nearest),
    };
};
