// COMPARE_QTY (E1.1, ZADANIA.md section 4): two groups of one icon, "where are there more / fewer?". Tiles "Po lewej", "Po prawej",
// "Tyle samo"; equal groups come with a fixed share, so "Tyle samo" is a real answer and not a trap that never works.
import { ICONS } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import type { Generator, Task } from '../types';

export type CompareQtyAsk = 'more' | 'less';

export interface CompareQtyParams {
    max: number;                 // the most icons in one group, 2..10
    ask: CompareQtyAsk[];
    equalShare: number;          // chance of equal groups, 0..0.5
}

const ASKS: readonly CompareQtyAsk[] = ['more', 'less'];
const MAX_EQUAL_SHARE = 0.5;
const isAsk = (v: unknown): v is CompareQtyAsk => ASKS.includes(v as CompareQtyAsk);

export const parseCompareQtyParams = (params: Record<string, unknown>): CompareQtyParams => {
    const fail = (why: string): never => {
        throw new TypeError(`COMPARE_QTY ${why}`);
    };
    const { max, ask, equalShare } = params;
    if (!Number.isInteger(max) || (max as number) < 2 || (max as number) > 10) fail(`needs an integer params.max in 2..10, got ${String(max)}`);
    if (!Array.isArray(ask) || ask.length === 0 || !ask.every(isAsk)) fail(`needs params.ask as a non-empty list of ${ASKS.join(', ')}`);
    if (typeof equalShare !== 'number' || !(equalShare >= 0 && equalShare <= MAX_EQUAL_SHARE)) fail(`needs params.equalShare in 0..${MAX_EQUAL_SHARE}`);
    return { max: max as number, ask: ask as CompareQtyAsk[], equalShare: equalShare as number };
};

export const generateCompareQty: Generator = (skill, rng): Task => {
    const p = parseCompareQtyParams(skill.params);
    const ask = rng.pick(p.ask);
    const left = rng.int(1, p.max);
    let right = left;
    if (!rng.chance(p.equalShare)) {
        // A different count, uniform over the other values.
        right = rng.int(1, p.max - 1);
        if (right >= left) right += 1;
    }
    const icon = rng.pick(ICONS);
    const forms = nouns[icon.noun];
    const tiles = pl.tasks.compareQtyTiles;
    const answer = left === right ? tiles.same : (ask === 'more') === left > right ? tiles.left : tiles.right;
    return {
        skillId: skill.id,
        prompt: pl.tasks.compareQtyPrompt(ask === 'more', forms[2]),
        visual: { kind: 'icons', icon: icon.id, groups: [left, right], framed: false },
        answer,
        choices: rng.shuffle([tiles.left, tiles.right, tiles.same]),
        hint: [pl.tasks.compareQtyCountHint, pl.tasks.compareQtyCountsHint(countNoun(left, forms), countNoun(right, forms)), pl.tasks.compareQtyAnswerHint(answer)],
    };
};
