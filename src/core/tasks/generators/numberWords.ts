// NUMBER_WORDS: match digits and words both ways with three tiles
// (ZADANIA.md, section 4). Distractors are nearby numbers or, for full tens
// and hundreds, other numbers of the same kind.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { numberToWords } from '../../text/numberWords';
import { numberChoices, pickChoices } from '../distractors';
import type { Generator, Task } from '../types';

export interface NumberWordsParams {
    max: number;
    kind: 'any' | 'tens' | 'hundreds';
}

export const parseNumberWordsParams = (params: Record<string, unknown>): NumberWordsParams => {
    const { max, kind = 'any' } = params;
    if (!Number.isInteger(max) || (max as number) < 3 || (max as number) > 1000) {
        throw new TypeError(`NUMBER_WORDS params.max must be an integer in 3..1000, got ${String(max)}`);
    }
    if (kind !== 'any' && kind !== 'tens' && kind !== 'hundreds') {
        throw new TypeError(`NUMBER_WORDS params.kind must be any | tens | hundreds, got ${String(kind)}`);
    }
    const step = kind === 'tens' ? 10 : kind === 'hundreds' ? 100 : 1;
    if ((max as number) < 3 * step) {
        throw new TypeError(`NUMBER_WORDS kind ${kind} needs max >= ${3 * step}, got ${String(max)}`);
    }
    return { max: max as number, kind };
};

const pool = (p: NumberWordsParams): number[] => {
    const step = p.kind === 'tens' ? 10 : p.kind === 'hundreds' ? 100 : 1;
    const out: number[] = [];
    for (let n = step; n <= p.max; n += step) {
        out.push(n);
    }
    return out;
};

const choicesFor = (answer: number, p: NumberWordsParams, rng: Rng): number[] =>
    p.kind === 'any' ? numberChoices(answer, rng, { count: 3, min: 1, max: p.max }) : pickChoices(answer, pool(p), 3, rng);

const hintFor = (n: number): string => {
    const parts: number[] = [];
    const hundreds = Math.floor(n / 100) * 100;
    const tens = Math.floor((n % 100) / 10) * 10;
    const units = n % 10;
    if (hundreds > 0) {
        parts.push(hundreds);
    }
    if (n % 100 >= 10 && n % 100 < 20) {
        parts.push(n % 100);
    } else {
        if (tens > 0) {
            parts.push(tens);
        }
        if (units > 0) {
            parts.push(units);
        }
    }
    const sum = parts.length > 1 ? parts.join(' + ') : numberToWords(n);
    return pl.tasks.numberWordsHint(n, parts.length > 1 ? `${sum} (${parts.map(numberToWords).join(' + ')})` : sum);
};

export const generateNumberWords: Generator = (skill, rng): Task => {
    const p = parseNumberWordsParams(skill.params);
    const answer = rng.pick(pool(p));
    const numbers = choicesFor(answer, p, rng);
    if (rng.chance(0.5)) {
        return {
            skillId: skill.id,
            prompt: pl.tasks.numberToWords(answer),
            answer: numberToWords(answer),
            choices: numbers.map(numberToWords),
            hint: [hintFor(answer)],
        };
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.wordsToNumber(numberToWords(answer)),
        answer,
        choices: numbers,
        hint: [hintFor(answer)],
    };
};
