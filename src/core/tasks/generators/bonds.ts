// BONDS: a number split into two parts with one hidden (ZADANIA.md, section 4):
// "7 = 3 + □". Keypad answer; the hint asks the question, then shows the sum.
import { pl } from '../../../data/pl';
import { BOX } from '../symbols';
import type { Generator, Task } from '../types';

export interface BondsParams {
    totals: number[];   // numbers to split
    zero: boolean;      // allow 0 as a part (7 = 7 + 0)
}

export const parseBondsParams = (params: Record<string, unknown>): BondsParams => {
    const { totals, zero = false } = params;
    if (!Array.isArray(totals) || totals.length === 0 || !totals.every((t) => Number.isInteger(t) && t >= 1)) {
        throw new TypeError(`BONDS params.totals must be a non-empty list of integers >= 1, got ${JSON.stringify(totals)}`);
    }
    if (typeof zero !== 'boolean') {
        throw new TypeError(`BONDS params.zero must be a boolean, got ${String(zero)}`);
    }
    if (!zero && !totals.some((t) => t >= 2)) {
        throw new TypeError(`BONDS totals ${JSON.stringify(totals)} have no pair of positive parts; set zero or use totals >= 2`);
    }
    return { totals: totals as number[], zero };
};

export const generateBonds: Generator = (skill, rng): Task => {
    const p = parseBondsParams(skill.params);
    const lo = p.zero ? 0 : 1;
    // Uniform over (total, first part) pairs, not "first a total, then a part".
    const pairs = p.totals.flatMap((total) =>
        Array.from({ length: Math.max(0, total - 2 * lo + 1) }, (_, i) => [total, lo + i] as const),
    );
    const [total, shown] = rng.pick(pairs);
    const hidden = total - shown;
    const boxLeft = rng.chance(0.5);
    const equation = boxLeft ? `${total} = ${BOX} + ${shown}` : `${total} = ${shown} + ${BOX}`;
    return {
        skillId: skill.id,
        prompt: `${pl.tasks.bonds(total)}\n${equation}`,
        answer: hidden,
        tileRange: { min: 0, max: total },   // no tile may exceed the sum
        hint: [pl.tasks.bondsHint(shown, total), `${shown} + ${hidden} = ${total}`],
    };
};
