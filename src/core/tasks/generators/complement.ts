// COMPLEMENT: how much is missing up to 10, 20, 30 or the next full ten
// (ZADANIA.md, section 4). Keypad answer; the hint shows the completed sum.
import { pl } from '../../../data/pl';
import type { Generator, Task } from '../types';

export interface ComplementParams {
    max: number;                  // upper bound for the target
    targets?: readonly number[];  // explicit targets (10, 20, 30); otherwise the next full ten
}

export const parseComplementParams = (params: Record<string, unknown>): ComplementParams => {
    const { max, targets } = params;
    if (!Number.isInteger(max) || (max as number) < 10) {
        throw new TypeError(`COMPLEMENT params.max must be an integer >= 10, got ${String(max)}`);
    }
    if (targets !== undefined) {
        if (!Array.isArray(targets) || targets.length === 0 || !targets.every((t) => Number.isInteger(t) && t >= 2 && t <= (max as number))) {
            throw new TypeError(`COMPLEMENT params.targets must be integers in 2..max, got ${JSON.stringify(targets)}`);
        }
        return { max: max as number, targets };
    }
    return { max: max as number };
};

export const generateComplement: Generator = (skill, rng): Task => {
    const p = parseComplementParams(skill.params);
    let n: number;
    let target: number;
    if (p.targets) {
        target = rng.pick(p.targets);
        n = rng.int(1, target - 1);
    } else {
        // Any number that is not a full ten; the target is the next ten.
        n = rng.int(1, p.max - 1);
        n = n % 10 === 0 ? n + rng.int(1, 9) : n;
        n = Math.min(n, p.max - 1);
        target = n + (10 - (n % 10));
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.complement(n, target),
        answer: target - n,
        hint: [pl.tasks.complementHint(n, target)],
    };
};
