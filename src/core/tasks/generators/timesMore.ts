// TIMES_MORE: "3 razy więcej", "4 razy mniej", "ile razy więcej" (ZADANIA.md, section 4, E5).
// "razy" is multiplication or division; the first hint says so and contrasts it with "o".
// The noun after "razy więcej / mniej" is the genitive plural. For the difference "o ile" see COMPARE_DIFF.
import { contexts } from '../../../data/wordTemplates';
import { pl } from '../../../data/pl';
import { DIVIDE, TIMES } from '../symbols';
import type { Generator, Task } from '../types';
import { countNoun } from '../../text/plural';
import { pickTwoPeople } from './word';

export type TimesMoreVariant = 'more' | 'less' | 'factor';

export interface TimesMoreParams {
    max: number;
    maxFactor: number;
    variants: readonly TimesMoreVariant[];
}

const VARIANTS: readonly TimesMoreVariant[] = ['more', 'less', 'factor'];
const MAX_ATTEMPTS = 1000;
const isVariant = (x: unknown): x is TimesMoreVariant => VARIANTS.includes(x as TimesMoreVariant);

export const parseTimesMoreParams = (params: Record<string, unknown>): TimesMoreParams => {
    const { max, maxFactor, variants } = params;
    if (!Number.isInteger(maxFactor) || (maxFactor as number) < 2) {
        throw new TypeError(`TIMES_MORE params.maxFactor must be an integer >= 2, got ${String(maxFactor)}`);
    }
    if (!Number.isInteger(max) || (max as number) < 4 * 2) {
        throw new TypeError(`TIMES_MORE params.max must be an integer >= 8, got ${String(max)}`);
    }
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every(isVariant)) {
        throw new TypeError(`TIMES_MORE params.variants must be a non-empty list of ${VARIANTS.join(' ')}, got ${JSON.stringify(variants)}`);
    }
    return { max: max as number, maxFactor: maxFactor as number, variants };
};

export const generateTimesMore: Generator = (skill, rng): Task => {
    const p = parseTimesMoreParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const variant = rng.pick(p.variants);
        const a = rng.int(2, p.max);
        const k = rng.int(2, p.maxFactor);
        const total = a * k;
        // a is the smaller amount; the answer is never the number that ends the first hint.
        if (total > p.max || a === k) {
            continue;
        }
        const ctx = rng.pick(contexts.filter((c) => c.portable));
        const [person, other] = pickTwoPeople(rng);
        const gen = ctx.noun[2];
        const has = pl.words.has;
        if (variant === 'more') {
            return {
                skillId: skill.id,
                prompt: `${person.name} ${has} ${countNoun(a, ctx.noun)}. ${other.name} ${has} ${k} razy więcej ${gen}. Ile ${gen} ${has} ${other.name}?`,
                answer: total,
                hint: [pl.tasks.timesMoreMore(`${a} ${TIMES} ${k}`), `${a} ${TIMES} ${k} = ${total}`],
            };
        }
        if (variant === 'less') {
            return {
                skillId: skill.id,
                prompt: `${person.name} ${has} ${countNoun(total, ctx.noun)}. ${other.name} ${has} ${k} razy mniej ${gen}. Ile ${gen} ${has} ${other.name}?`,
                answer: a,
                hint: [pl.tasks.timesMoreLess(`${total} ${DIVIDE} ${k}`), `${total} ${DIVIDE} ${k} = ${a}`],
            };
        }
        return {
            skillId: skill.id,
            prompt: `${person.name} ${has} ${countNoun(a, ctx.noun)}, a ${other.name} ${has} ${countNoun(total, ctx.noun)}. Ile razy więcej ${gen} ${has} ${other.name}?`,
            answer: k,
            hint: [pl.tasks.timesMoreFactor(`${total} ${DIVIDE} ${a}`), `${total} ${DIVIDE} ${a} = ${k}`],
        };
    }
    throw new Error(`TIMES_MORE: no task after ${MAX_ATTEMPTS} attempts (params ${JSON.stringify(skill.params)})`);
};
