// ORDER_OPS: multiplication and division before addition and subtraction, no brackets
// (ZADANIA.md, section 4, E5). Where the high-precedence operation stands second, left-to-right
// evaluation gives a different number, so the task really needs the rule. Every number shown stays within `max`; products and
// quotients come from the multiplication table.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { DIVIDE, MINUS, TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export type OrderOpsForm = 'a+b*c' | 'a-b:c' | 'a*b+c' | 'a:b-c';

export interface OrderOpsParams {
    max: number;
    forms: readonly OrderOpsForm[];
}

const FORMS: readonly OrderOpsForm[] = ['a+b*c', 'a-b:c', 'a*b+c', 'a:b-c'];
const MAX_ATTEMPTS = 1000;
const FACTOR_MAX = 10;
/** Smallest `max` that leaves room for a product 2 · 2 and one more number. */
const MIN_MAX = 12;

const isForm = (x: unknown): x is OrderOpsForm => FORMS.includes(x as OrderOpsForm);

export const parseOrderOpsParams = (params: Record<string, unknown>): OrderOpsParams => {
    const { max, forms } = params;
    if (!Number.isInteger(max) || (max as number) < MIN_MAX) {
        throw new TypeError(`ORDER_OPS params.max must be an integer >= ${MIN_MAX}, got ${String(max)}`);
    }
    if (!Array.isArray(forms) || forms.length === 0 || !forms.every(isForm)) {
        throw new TypeError(`ORDER_OPS params.forms must be a non-empty list of ${FORMS.join(' ')}, got ${JSON.stringify(forms)}`);
    }
    return { max: max as number, forms };
};

interface Drawn {
    expr: string;
    leftToRight: number;
    ruleMatters: boolean; // the high-precedence operation stands second, so left-to-right gives another number
    answer: number;
    first: string;      // the step done first, "6 · 8"
    firstKind: 'mult' | 'div';
    mid: number;        // its result
    last: string;       // the closing line
    lastOperand: number; // the last number of the first hint line
}

const draw = (form: OrderOpsForm, max: number, rng: Rng): Drawn | undefined => {
    const pair = (): [number, number] => [rng.int(2, FACTOR_MAX), rng.int(2, FACTOR_MAX)];
    if (form === 'a+b*c' || form === 'a*b+c') {
        const [x, y] = pair();
        const p = x * y;
        if (p >= max) {
            return undefined;
        }
        const rest = rng.int(1, max - p);
        const first = `${x} ${TIMES} ${y}`;
        if (form === 'a+b*c') {
            return { expr: `${rest} + ${first}`, leftToRight: (rest + x) * y, ruleMatters: true, answer: rest + p, first, firstKind: 'mult', mid: p, last: `${rest} + ${p} = ${rest + p}`, lastOperand: y };
        }
        return { expr: `${first} + ${rest}`, leftToRight: p + rest, ruleMatters: false, answer: p + rest, first, firstKind: 'mult', mid: p, last: `${p} + ${rest} = ${p + rest}`, lastOperand: y };
    }
    const q = rng.int(2, FACTOR_MAX);
    const d = rng.int(2, FACTOR_MAX);
    const dividend = q * d;
    const first = `${dividend} ${DIVIDE} ${d}`;
    if (form === 'a-b:c') {
        // rest − dividend : d
        const rest = rng.int(q + 1, max);
        return { expr: `${rest} ${MINUS} ${first}`, leftToRight: (rest - dividend) / d, ruleMatters: true, answer: rest - q, first, firstKind: 'div', mid: q, last: `${rest} ${MINUS} ${q} = ${rest - q}`, lastOperand: d };
    }
    // dividend : d − sub, sub < q
    const sub = rng.int(1, q - 1);
    return { expr: `${first} ${MINUS} ${sub}`, leftToRight: dividend / (d - sub), ruleMatters: false, answer: q - sub, first, firstKind: 'div', mid: q, last: `${q} ${MINUS} ${sub} = ${q - sub}`, lastOperand: d };
};

export const generateOrderOps: Generator = (skill, rng): Task => {
    const p = parseOrderOpsParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const d = draw(rng.pick(p.forms), p.max, rng);
        // The task needs the rule (left-to-right differs); no number may be larger than max or equal the answer (the hint would give it away).
        if (!d || d.answer < 1 || (d.ruleMatters && d.leftToRight === d.answer) || d.lastOperand === d.answer || d.mid > p.max) {
            continue;
        }
        const numbers = d.expr.match(/\d+/g)?.map(Number) ?? [];
        if (numbers.some((n) => n > p.max)) {
            continue;
        }
        return {
            skillId: skill.id,
            prompt: d.expr,
            answer: d.answer,
            hint: [pl.tasks.orderOpsFirst(d.firstKind, d.first), `${d.first} = ${d.mid}`, d.last],
        };
    }
    throw new Error(`ORDER_OPS: no task after ${MAX_ATTEMPTS} attempts (params ${JSON.stringify(skill.params)})`);
};
