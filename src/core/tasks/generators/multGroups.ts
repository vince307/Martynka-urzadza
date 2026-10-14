// MULT_GROUPS (ZADANIA.md, section 4): `g` framed groups (plates) of `k` icons each. `result`: how many icons altogether (number
// tiles); `expr`: which multiplication the picture shows (text tiles "3 · 4"). The wrong expressions are sums and wrong products;
// the swapped "4 · 3" is also correct, so it is never offered, nor is a sum that happens to equal the product (2 + 2).
import { ICONS, PLATE_ICONS } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { inflect } from '../../text/plural';
import { TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export interface MultGroupsParams {
    variant: 'result' | 'expr';
    groups: [number, number];      // the number of plates, min..max
    size: [number, number];        // icons on a plate, min..max
    max: number;                   // the most icons altogether
}

const MAX_ICONS = 30;
const MAX_GROUPS = 8;
const isInt = (x: unknown): x is number => Number.isInteger(x);

const pairOf = (name: string, value: unknown, low: number, high: number, fail: (why: string) => never): [number, number] => {
    if (!Array.isArray(value) || value.length !== 2 || !isInt(value[0]) || !isInt(value[1]) || value[0] < low || value[0] > value[1] || value[1] > high) {
        fail(`needs params.${name} as [min, max] inside ${low}..${high}`);
    }
    return [(value as number[])[0], (value as number[])[1]];
};

export const parseMultGroupsParams = (params: Record<string, unknown>): MultGroupsParams => {
    const fail = (why: string): never => {
        throw new TypeError(`MULT_GROUPS ${why}`);
    };
    const { variant, max } = params;
    if (variant !== 'result' && variant !== 'expr') fail(`params.variant must be result or expr, got ${String(variant)}`);
    const groups = pairOf('groups', params.groups, 2, MAX_GROUPS, fail);
    const size = pairOf('size', params.size, 2, 10, fail);
    if (!isInt(max) || max > MAX_ICONS || max < groups[0] * size[0]) fail(`needs an integer params.max between ${groups[0] * size[0]} and ${MAX_ICONS}`);
    return { variant: variant as MultGroupsParams['variant'], groups, size, max: max as number };
};

const expression = (a: number, b: number): string => `${a} ${TIMES} ${b}`;

/** The right expression and two wrong ones, none with the product's value, shuffled. */
const exprChoices = (g: number, k: number, rng: Rng): string[] => {
    const product = g * k;
    const wrong = rng.shuffle([
        ...(g + k === product ? [] : [`${g} + ${k}`]),
        expression(g, k + 1),
        expression(g + 1, k),
        ...(k > 2 ? [expression(g, k - 1)] : []),
        ...(g > 2 ? [expression(g - 1, k)] : []),
    ]);
    // A sum tile comes first when there is one: it is the most common mistake (adding instead of multiplying).
    const sums = wrong.filter((w) => w.includes('+'));
    const rest = wrong.filter((w) => !w.includes('+') && w !== expression(k, g));
    return rng.shuffle([expression(g, k), ...[...sums, ...rest].slice(0, 2)]);
};

export const generateMultGroups: Generator = (skill, rng): Task => {
    const p = parseMultGroupsParams(skill.params);
    const pairs: [number, number][] = [];
    for (let g = p.groups[0]; g <= p.groups[1]; g += 1) {
        for (let k = p.size[0]; k <= p.size[1]; k += 1) if (g * k <= p.max) pairs.push([g, k]);
    }
    const [g, k] = rng.pick(pairs);
    const icon = rng.pick(PLATE_ICONS.filter((id) => ICONS.some((i) => i.id === id)));
    const noun = ICONS.find((i) => i.id === icon)?.noun ?? icon;
    const forms = nouns[noun];
    const visual = { kind: 'icons', icon, groups: Array<number>(g).fill(k), framed: true } as const;
    const equation = `${g} ${TIMES} ${k} = ${g * k}`;
    if (p.variant === 'result') {
        return {
            skillId: skill.id,
            prompt: pl.tasks.multGroupsResult(g, k, inflect(k, forms), forms[2]),
            visual,
            answer: g * k,
            tileRange: { min: 1, max: p.max },
            hint: [pl.tasks.multGroupsResultHint, equation],
        };
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.multGroupsExpr,
        visual,
        answer: expression(g, k),
        choices: exprChoices(g, k, rng),
        hint: [pl.tasks.multGroupsExprHint, pl.tasks.multGroupsCountsHint(g, k), equation, pl.tasks.multGroupsExprAnswerHint(expression(g, k))],
    };
};
