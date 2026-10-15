// ORDINAL (E1.2, ZADANIA.md section 4): a row of different icons with a start mark on the left, "on which place from the left is the
// key?". The question uses the place ("na którym miejscu"), which needs no gender of the noun; the answer is a number tile.
import { ICONS } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import type { Generator, Task } from '../types';

export interface OrdinalParams {
    max: number;      // the most icons in the row, 3..10
}

const MIN_ROW = 3;
const MAX_ROW = 10;

export const parseOrdinalParams = (params: Record<string, unknown>): OrdinalParams => {
    const { max } = params;
    if (!Number.isInteger(max) || (max as number) < MIN_ROW || (max as number) > MAX_ROW) {
        throw new TypeError(`ORDINAL params.max must be an integer in ${MIN_ROW}..${MAX_ROW}, got ${String(max)}`);
    }
    return { max: max as number };
};

export const generateOrdinal: Generator = (skill, rng): Task => {
    const p = parseOrdinalParams(skill.params);
    const length = rng.int(MIN_ROW, p.max);
    const row = rng.shuffle(ICONS).slice(0, length);
    const place = rng.int(1, length);
    const nominative = nouns[row[place - 1].noun][0];
    return {
        skillId: skill.id,
        prompt: pl.tasks.ordinalPrompt(nominative),
        visual: { kind: 'row', icons: row.map((i) => i.id), mark: 'left' },
        answer: place,
        tileRange: { min: 1, max: length },
        hint: [pl.tasks.ordinalFromMarkHint, pl.tasks.ordinalPointHint, pl.tasks.ordinalAnswerHint(nominative, place)],
    };
};
