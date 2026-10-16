// HALF: half of an even number (ZADANIA.md, section 4, E3).
import { pl } from '../../../data/pl';
import { DIVIDE } from '../symbols';
import type { Generator, Task } from '../types';

export interface HalfParams {
    max: number;   // largest even number asked about
}

export const parseHalfParams = (params: Record<string, unknown>): HalfParams => {
    const { max } = params;
    if (!Number.isInteger(max) || (max as number) < 4) {
        throw new TypeError(`HALF params.max must be an integer >= 4, got ${String(max)}`);
    }
    return { max: max as number };
};

export const generateHalf: Generator = (skill, rng): Task => {
    const p = parseHalfParams(skill.params);
    const n = 2 * rng.int(1, Math.floor(p.max / 2));
    const half = n / 2;
    return {
        skillId: skill.id,
        prompt: pl.tasks.half(n),
        answer: half,
        hint: [pl.tasks.halfMethodHint, `${n} ${DIVIDE} 2 = ${half}`, `${half} + ${half} = ${n}`],
    };
};
