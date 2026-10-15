// TIME_UNITS: hours and minutes, minutes and seconds, days and hours, quarters of an hour, both directions
// (ZADANIA.md, section 4, E6). "Ile minut to 3 godziny?" has no verb to agree with the numeral.
import { timeUnitsPairs } from '../../../data/elapsed';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import { DIVIDE, TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export type TimeUnitsPair = keyof typeof timeUnitsPairs;

export interface TimeUnitsParams {
    pairs: readonly TimeUnitsPair[];
    max: number;
}

const isPair = (x: unknown): x is TimeUnitsPair => typeof x === 'string' && Object.prototype.hasOwnProperty.call(timeUnitsPairs, x);

/** Largest count of big units asked: at least 2, and the bigger number on screen stays within max. */
const maxCount = (pair: TimeUnitsPair, max: number): number => Math.min(timeUnitsPairs[pair].maxN, Math.floor(max / timeUnitsPairs[pair].factor));

export const parseTimeUnitsParams = (params: Record<string, unknown>): TimeUnitsParams => {
    const { pairs, max } = params;
    if (!Array.isArray(pairs) || pairs.length === 0 || !pairs.every(isPair)) {
        throw new TypeError(`TIME_UNITS params.pairs must be a non-empty list of ${Object.keys(timeUnitsPairs).join(' ')}, got ${JSON.stringify(pairs)}`);
    }
    if (!Number.isInteger(max) || pairs.some((pair) => maxCount(pair, max as number) < 2)) {
        throw new TypeError(`TIME_UNITS params.max must be an integer that holds two units of every pair, got ${String(max)}`);
    }
    return { pairs, max: max as number };
};

export const generateTimeUnits: Generator = (skill, rng): Task => {
    const p = parseTimeUnitsParams(skill.params);
    const pair = rng.pick(p.pairs);
    const def = timeUnitsPairs[pair];
    const big = nouns[def.big];
    const small = nouns[def.small];
    const n = rng.int(2, maxCount(pair, p.max));
    const total = n * def.factor;
    const fact = pl.tasks.timeUnitsFact(big[0], countNoun(def.factor, small));
    if (rng.chance(0.5)) {
        return {
            skillId: skill.id,
            prompt: pl.tasks.timeUnitsAsk(small[2], countNoun(n, big)),
            answer: total,
            hint: [fact, `${n} ${TIMES} ${def.factor} = ${total}`],
        };
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.timeUnitsAsk(big[2], countNoun(total, small)),
        answer: n,
        hint: [fact, `${total} ${DIVIDE} ${def.factor} = ${n}`],
    };
};
