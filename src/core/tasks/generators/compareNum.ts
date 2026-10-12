// COMPARE_NUM: two numbers and the signs <, >, = as tiles (ZADANIA.md,
// section 4). The hint spells out tens and units.
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import type { Generator, Task } from '../types';

export interface CompareNumParams {
    max: number;
}

export const SIGNS = ['<', '>', '='] as const;
const BOX = '□';

export const parseCompareNumParams = (params: Record<string, unknown>): CompareNumParams => {
    const { max } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`COMPARE_NUM params.max must be an integer >= 2, got ${String(max)}`);
    }
    return { max: max as number };
};

const describe = (n: number): string =>
    n < 10
        ? pl.tasks.compareUnitsHint(n, countNoun(n, nouns.jedność))
        : pl.tasks.compareHint(n, countNoun(Math.floor(n / 10), nouns.dziesiątka), countNoun(n % 10, nouns.jedność));

export const generateCompareNum: Generator = (skill, rng): Task => {
    const p = parseCompareNumParams(skill.params);
    const a = rng.int(0, p.max);
    // Equal pairs about one time in six; otherwise an independent second number.
    const b = rng.chance(1 / 6) ? a : rng.int(0, p.max);
    const sign = a < b ? '<' : a > b ? '>' : '=';
    return {
        skillId: skill.id,
        prompt: `${a} ${BOX} ${b}`,
        answer: sign,
        choices: [...SIGNS],
        hint: a === b ? [pl.tasks.compareEqualHint] : [describe(a), describe(b), `${a} ${sign} ${b}`],
    };
};
