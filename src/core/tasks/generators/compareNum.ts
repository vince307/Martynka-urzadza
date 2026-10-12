// COMPARE_NUM: two numbers and the signs <, >, = as tiles (ZADANIA.md,
// section 4). The hint spells out tens and units.
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { formatNumber } from '../../text/formatNumber';
import { countNoun } from '../../text/plural';
import { BOX } from '../symbols';
import type { Rng } from '../../rng';
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

const digitCount = (n: number): number => String(n).length;

/** Second number for large comparisons: a third of the pairs differ in length, many share a prefix. */
const largePartner = (a: number, max: number, rng: Rng): number => {
    if (rng.chance(1 / 6)) {
        return a;
    }
    const lenA = digitCount(a);
    if (rng.chance(1 / 3)) {
        const lens = Array.from({ length: digitCount(max) }, (_, i) => i + 1).filter((l) => l !== lenA);
        const len = rng.pick(lens);
        const low = len === 1 ? 1 : 10 ** (len - 1);
        return rng.int(low, Math.min(10 ** len - 1, max));
    }
    if (lenA >= 2 && rng.chance(1 / 2)) {
        const keep = rng.int(1, lenA - 1);
        const rest = 10 ** (lenA - keep);
        const b = Math.floor(a / rest) * rest + rng.int(0, rest - 1);
        return b <= max ? b : a;
    }
    return rng.int(1, max);
};

const largeHint = (a: number, b: number, sign: string): string[] => {
    const [fa, fb] = [formatNumber(a), formatNumber(b)];
    const last = `${fa} ${sign} ${fb}`;
    if (a === b) {
        return [pl.tasks.compareEqualHint];
    }
    const [la, lb] = [digitCount(a), digitCount(b)];
    if (la !== lb) {
        return [
            pl.tasks.compareDigitsHint(fa, countNoun(la, nouns.cyfra)),
            pl.tasks.compareDigitsHint(fb, countNoun(lb, nouns.cyfra)),
            pl.tasks.compareMoreDigits,
            last,
        ];
    }
    const [sa, sb] = [String(a), String(b)];
    let i = 0;
    while (sa[i] === sb[i]) {
        i += 1;
    }
    const place = pl.tasks.placeNames[la - 1 - i] ?? '';
    return [pl.tasks.compareFirstDiffHint(place, Number(sa[i]), Number(sb[i])), last];
};

export const generateCompareNum: Generator = (skill, rng): Task => {
    const p = parseCompareNumParams(skill.params);
    const a = rng.int(1, p.max);
    if (p.max > 100) {
        const b = largePartner(a, p.max, rng);
        const sign = a < b ? '<' : a > b ? '>' : '=';
        return {
            skillId: skill.id,
            prompt: `${formatNumber(a)} ${BOX} ${formatNumber(b)}`,
            answer: sign,
            choices: [...SIGNS],
            hint: largeHint(a, b, sign),
        };
    }
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
