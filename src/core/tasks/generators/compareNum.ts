// COMPARE_NUM: two numbers and the signs <, >, = as tiles (ZADANIA.md,
// section 4). The hint spells out tens and units.
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import { BOX } from '../symbols';
import type { Generator, Task } from '../types';

export interface CompareNumParams {
    max: number;
}

export const SIGNS = ['<', '>', '='] as const;

export const parseCompareNumParams = (params: Record<string, unknown>): CompareNumParams => {
    const { max } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`COMPARE_NUM params.max must be an integer >= 2, got ${String(max)}`);
    }
    return { max: max as number };
};

/** "47 to 4 dziesiątki i 7 jedności", "40 to 4 dziesiątki", "7 to 7 jedności", "100 to 10 dziesiątek". */
const describe = (n: number): string => {
    const parts: string[] = [];
    if (Math.floor(n / 10) > 0) {
        parts.push(countNoun(Math.floor(n / 10), nouns.dziesiątka));
    }
    if (n % 10 > 0) {
        parts.push(countNoun(n % 10, nouns.jedność));
    }
    return pl.tasks.compareHint(n, parts.join(` ${pl.words.and} `));
};

export const generateCompareNum: Generator = (skill, rng): Task => {
    const p = parseCompareNumParams(skill.params);
    const a = rng.int(1, p.max);
    // Equal pairs about one time in six; otherwise an independent second number.
    const b = rng.chance(1 / 6) ? a : rng.int(1, p.max);
    const sign = a < b ? '<' : a > b ? '>' : '=';
    return {
        skillId: skill.id,
        prompt: `${a} ${BOX} ${b}`,
        answer: sign,
        choices: [...SIGNS],
        hint: a === b ? [pl.tasks.compareEqualHint] : [describe(a), describe(b), `${a} ${sign} ${b}`],
    };
};
