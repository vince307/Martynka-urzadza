// COMPARE_NUM: two numbers and the signs <, >, = as tiles (ZADANIA.md,
// section 4). Up to 100 the hint spells out tens and units; above 100 it
// compares digit counts or the first differing digit from the left.
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
        // One digit more or less: 612 449 □ 2 would be a trivial comparison (impl-review S-03).
        // A length holding only max itself (7 digits for 1 000 000) is skipped, so the
        // partner is not "1 000 000" in a sixth of the draws.
        const lens = [lenA - 1, lenA + 1].filter((l) => l >= 1 && l <= digitCount(max - 1));
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
    // Same length as a, so lengths differ only in the branch above.
    return rng.int(lenA === 1 ? 1 : 10 ** (lenA - 1), Math.min(10 ** lenA - 1, max));
};

/** Object of "ma": accusative "1 cyfrę", then "2 cyfry", "5 cyfr". */
const digitsPhrase = (n: number): string => (n === 1 ? pl.tasks.oneDigit : countNoun(n, nouns.cyfra));

const largeHint = (a: number, b: number, sign: string): string[] => {
    const [fa, fb] = [formatNumber(a), formatNumber(b)];
    const last = `${fa} ${sign} ${fb}`;
    if (a === b) {
        return [pl.tasks.compareEqualHint];
    }
    const [la, lb] = [digitCount(a), digitCount(b)];
    if (la !== lb) {
        return [
            pl.tasks.compareDigitsHint(fa, digitsPhrase(la)),
            pl.tasks.compareDigitsHint(fb, digitsPhrase(lb)),
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
        const prompt = `${formatNumber(a)} ${BOX} ${formatNumber(b)}`;
        return {
            skillId: skill.id,
            prompt,
            speak: pl.tasks.compareSpeak(prompt),
            answer: sign,
            choices: [...SIGNS],
            hint: largeHint(a, b, sign),
        };
    }
    // Equal pairs about one time in six; otherwise an independent second number.
    const b = rng.chance(1 / 6) ? a : rng.int(1, p.max);
    const sign = a < b ? '<' : a > b ? '>' : '=';
    const prompt = `${a} ${BOX} ${b}`;
    return {
        skillId: skill.id,
        prompt,
        speak: pl.tasks.compareSpeak(prompt),
        answer: sign,
        choices: [...SIGNS],
        hint: a === b ? [pl.tasks.compareEqualHint] : [describe(a), describe(b), `${a} ${sign} ${b}`],
    };
};
