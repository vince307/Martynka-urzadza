// COUNT (ZADANIA.md, section 4): "How many apples?" over a picture of 1..20 icons of one kind. From eleven up the icons stand as a
// ten (one row) and the rest, which is the way the school teaches reading 11 and 12. Three tiles: the count and its neighbours.
import { ICONS } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { countNoun } from '../../text/plural';
import type { Generator, Task } from '../types';

export interface CountParams {
    min: number;
    max: number;
    tens: boolean;      // from 11: a ten and the rest as two groups
}

const MAX_COUNT = 20;
const TILES = 3;
const isInt = (x: unknown): x is number => Number.isInteger(x);

export const parseCountParams = (params: Record<string, unknown>): CountParams => {
    const fail = (why: string): never => {
        throw new TypeError(`COUNT ${why}`);
    };
    const { min, max, tens } = params;
    if (!isInt(min) || !isInt(max) || min < 1 || max > MAX_COUNT || min >= max) fail(`needs integer params.min < params.max inside 1..${MAX_COUNT}`);
    if (typeof tens !== 'boolean') fail('needs a boolean params.tens');
    if (tens === true && (min as number) < 11) fail('a ten and the rest needs params.min >= 11');
    return { min: min as number, max: max as number, tens: tens as boolean };
};

/** The count and its two neighbours; at the ends of 1..max the second tile comes from the far side. */
const tiles = (n: number, max: number, rng: Rng): number[] => {
    const inRange = (v: number): boolean => v >= 1 && v <= max;
    const near = [n - 1, n + 1].filter(inRange);
    const far = [n - 2, n + 2].filter(inRange);
    return rng.shuffle([n, ...[...near, ...far].slice(0, TILES - 1)]);
};

export const generateCount: Generator = (skill, rng): Task => {
    const p = parseCountParams(skill.params);
    const n = rng.int(p.min, p.max);
    const icon = rng.pick(ICONS).id;
    const noun = ICONS.find((i) => i.id === icon)?.noun ?? icon;
    const forms = nouns[noun];
    return {
        skillId: skill.id,
        prompt: pl.tasks.countPrompt(forms[2]),
        visual: { kind: 'icons', icon, groups: p.tens ? [10, n - 10] : [n], framed: false },
        answer: n,
        choices: tiles(n, p.max, rng),
        hint: p.tens
            ? [pl.tasks.countTenHint, `10 + ${n - 10} = ${n}`, pl.tasks.countAnswerHint(countNoun(n, forms))]
            : [pl.tasks.countPointHint, pl.tasks.countAnswerHint(countNoun(n, forms))],
    };
};
