// CHOOSE_OP: a word problem from data/wordTemplates.ts, the child picks the
// operation that solves it from three tiles (ZADANIA.md, section 4). Only
// kinds with one direct operation: sum / moreBy add, left subtracts.
import { contexts, templates } from '../../../data/wordTemplates';
import { pl } from '../../../data/pl';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';
import { drawNumbers, MIN_MAX, pickTwoPeople } from './word';

export type ChooseOpKind = 'sum' | 'left' | 'moreBy';

export interface ChooseOpParams {
    max: number;
    kinds: ChooseOpKind[];
}

const KINDS: readonly ChooseOpKind[] = ['sum', 'left', 'moreBy'];
const MAX_ATTEMPTS = 1000;
const isKind = (value: unknown): value is ChooseOpKind => KINDS.includes(value as ChooseOpKind);

const MIN_TILES_MAX = 3;

export const parseChooseOpParams = (params: Record<string, unknown>): ChooseOpParams => {
    const { max, kinds } = params;
    if (!Number.isInteger(max)) {
        throw new TypeError(`CHOOSE_OP params.max must be an integer, got ${String(max)}`);
    }
    if (!Array.isArray(kinds) || kinds.length === 0 || !kinds.every(isKind)) {
        throw new TypeError(`CHOOSE_OP params.kinds must be a non-empty list of ${KINDS.join(', ')}, got ${JSON.stringify(kinds)}`);
    }
    for (const kind of kinds) {
        // The third tile needs another number besides the two of the story: max >= 3.
        const min = Math.max(MIN_TILES_MAX, MIN_MAX[kind]);
        if ((max as number) < min) {
            throw new TypeError(`CHOOSE_OP kind ${kind} needs max >= ${min}, got ${String(max)}`);
        }
    }
    return { max: max as number, kinds };
};

export const generateChooseOp: Generator = (skill, rng): Task => {
    const p = parseChooseOpParams(skill.params);
    const kind = rng.pick(p.kinds);
    const plus = kind !== 'left';
    const sign = plus ? '+' : MINUS;
    const other = plus ? MINUS : '+';
    const template = rng.pick(templates.filter((t) => t.kind === kind));
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const drawn = drawNumbers(kind, { max: p.max, kinds: p.kinds, maxFactor: 10 }, rng);
        if (!drawn) {
            continue;
        }
        const [a, b] = drawn;
        const result = plus ? a + b : a - b;
        if (result < 0 || result > p.max) {
            continue;
        }
        // Other numbers for the third tile: the same operation must stay non-negative and within max.
        const spare = Array.from({ length: plus ? p.max - a : a - 1 }, (_, i) => i + 1).filter((n) => n !== b);
        if (spare.length === 0) {
            continue;
        }
        // Swapping the terms of a sum is the same value, so the sign-flipped tile keeps the larger term first.
        const flipped = plus ? `${Math.max(a, b)} ${other} ${Math.min(a, b)}` : `${a} ${other} ${b}`;
        const answer = `${a} ${sign} ${b}`;
        const [person, friend] = pickTwoPeople(rng);
        const story = template.build({ a, b, c: 0, person, other: friend, ctx: rng.pick(contexts) });
        return {
            skillId: skill.id,
            prompt: `${story.prompt} ${pl.tasks.chooseOp}`,
            answer,
            choices: rng.shuffle([answer, flipped, `${a} ${sign} ${rng.pick(spare)}`]),
            hint: [pl.tasks.chooseOpHint[kind], ...story.hint],
        };
    }
    throw new Error(`CHOOSE_OP: no numbers for ${kind} with ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
