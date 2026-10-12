// Tile choices for tasks answered by tapping: the correct answer plus
// plausible, distinct, never negative distractors in a shuffled order.
import type { Rng } from '../rng';

export interface NumberChoiceOptions {
    count: number;          // total tiles including the answer (3–4)
    min: number;            // lowest allowed tile
    max: number;            // highest allowed tile
}

const swapDigits = (n: number): number => {
    const text = String(n);
    if (text.length < 2 || text[0] === text[1]) {
        return n;
    }
    return Number(text[1] + text[0] + text.slice(2));
};

/** Candidates close to the answer: neighbours, ±10, swapped digits, then anything in range. */
export const numberChoices = (answer: number, rng: Rng, opts: NumberChoiceOptions): number[] => {
    if (opts.count < 2 || answer < opts.min || answer > opts.max) {
        throw new RangeError(`numberChoices(${answer}) needs count >= 2 and answer within ${opts.min}..${opts.max}`);
    }
    const near = rng.shuffle([answer - 1, answer + 1, answer - 2, answer + 2, answer - 10, answer + 10, swapDigits(answer)]);
    const chosen = new Set<number>([answer]);
    for (const candidate of near) {
        if (chosen.size >= opts.count) {
            break;
        }
        if (candidate >= opts.min && candidate <= opts.max && !chosen.has(candidate)) {
            chosen.add(candidate);
        }
    }
    let guard = 0;
    while (chosen.size < opts.count && guard < 1000) {
        chosen.add(rng.int(opts.min, opts.max));
        guard += 1;
    }
    if (chosen.size < opts.count) {
        throw new RangeError(`numberChoices(${answer}) cannot find ${opts.count} distinct tiles in ${opts.min}..${opts.max}`);
    }
    return rng.shuffle([...chosen]);
};

/** The answer plus `count − 1` other items from the pool, shuffled. */
export const pickChoices = <T>(answer: T, pool: readonly T[], count: number, rng: Rng): T[] => {
    const others = pool.filter((item) => item !== answer);
    if (others.length < count - 1) {
        throw new RangeError(`pickChoices needs ${count - 1} distractors, pool has ${others.length}`);
    }
    return rng.shuffle([answer, ...rng.shuffle(others).slice(0, count - 1)]);
};
