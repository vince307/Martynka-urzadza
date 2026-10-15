// CHOOSE_OP: a word problem from data/wordTemplates.ts, the child picks the
// operation that solves it from three tiles (ZADANIA.md, section 4). Only
// kinds with one direct operation: sum / moreBy add, left subtracts.
// `picture` (S-14d, E1): two groups of icons where the second one comes or leaves; the arrow decides the operation.
import { ICONS } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { contextsFor, templates } from '../../../data/wordTemplates';
import { pl } from '../../../data/pl';
import { countNoun, pluralCategory } from '../../text/plural';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';
import { drawNumbers, MIN_MAX, pickTwoPeople } from './word';

export type WordChooseOpKind = 'sum' | 'left' | 'moreBy';
export type ChooseOpKind = WordChooseOpKind | 'picture';

export interface ChooseOpParams {
    max: number;
    kinds: ChooseOpKind[];
}

const KINDS: readonly ChooseOpKind[] = ['sum', 'left', 'moreBy', 'picture'];
/** A picture shows at most this many icons in the group that stays (a plate of the kit holds ten). */
const PICTURE_MAX = 10;
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
        const min = kind === 'picture' ? MIN_TILES_MAX : Math.max(MIN_TILES_MAX, MIN_MAX[kind]);
        if ((max as number) < min) {
            throw new TypeError(`CHOOSE_OP kind ${kind} needs max >= ${min}, got ${String(max)}`);
        }
        if (kind === 'picture' && (max as number) > PICTURE_MAX) {
            throw new TypeError(`CHOOSE_OP kind picture needs max <= ${PICTURE_MAX}, got ${String(max)}`);
        }
    }
    return { max: max as number, kinds };
};

export const generateChooseOp: Generator = (skill, rng): Task => {
    const p = parseChooseOpParams(skill.params);
    const picked = rng.pick(p.kinds);
    // A picture is a sum when the second group comes and a difference when it leaves.
    const motion = picked === 'picture' ? rng.pick(['come', 'go'] as const) : undefined;
    const kind: WordChooseOpKind = picked === 'picture' ? (motion === 'come' ? 'sum' : 'left') : picked;
    const plus = kind !== 'left';
    const sign = plus ? '+' : MINUS;
    const other = plus ? MINUS : '+';
    const template = rng.pick(templates.filter((t) => t.kind === kind));
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const drawn = drawNumbers(kind, { max: p.max, kinds: [], maxFactor: 10 }, rng);
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
        if (motion) {
            const icon = rng.pick(ICONS);
            const forms = nouns[icon.noun];
            const was = pluralCategory(a) === 'few' ? pl.words.were : pl.words.was;
            return {
                skillId: skill.id,
                prompt: `${pl.tasks.chooseOpPictureStory(was, countNoun(a, forms), motion, b)} ${pl.tasks.chooseOp}`,
                visual: { kind: 'icons', icon: icon.id, groups: [a, b], framed: false, motion },
                answer,
                choices: rng.shuffle([answer, flipped, `${a} ${sign} ${rng.pick(spare)}`]),
                hint: [pl.tasks.chooseOpHint[kind], `${answer} = ${result}`],
            };
        }
        const [person, friend] = pickTwoPeople(rng);
        const story = template.build({ a, b, c: 0, person, other: friend, ctx: rng.pick(contextsFor(template)) });
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
