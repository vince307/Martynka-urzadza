// ARROW_TABLE (S-14b): an arrow graph or a rule table with exactly one empty field. `graphOut` hides the result of the rule,
// `graphIn` the starting number (the inverse operation, linked to "checking a subtraction"), `table` one output of a rule table.
import { balance } from '../../../data/balance';
import { pl } from '../../../data/pl';
import { arithLine } from '../arith';
import type { Generator, Task } from '../types';
import type { TaskVisual } from '../visual';

export type ArrowVariant = 'graphOut' | 'graphIn' | 'table';
const VARIANTS: readonly ArrowVariant[] = ['graphOut', 'graphIn', 'table'];

export interface ArrowTableParams {
    variants: ArrowVariant[];
    max: number;
    n: [number, number];
}

export const parseArrowTableParams = (params: Record<string, unknown>): ArrowTableParams => {
    const { variants, max, n } = params;
    const fail = (why: string): never => {
        throw new TypeError(`ARROW_TABLE ${why}`);
    };
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every((v): v is ArrowVariant => VARIANTS.includes(v as ArrowVariant))) {
        fail(`params.variants must be a non-empty list of ${VARIANTS.join(' / ')}, got ${JSON.stringify(variants)}`);
    }
    if (!Number.isInteger(max) || (max as number) < 1 || (max as number) > balance.arrows.maxValue) {
        fail(`params.max must be an integer 1..${balance.arrows.maxValue}, got ${String(max)}`);
    }
    if (!Array.isArray(n) || n.length !== 2 || !Number.isInteger(n[0]) || !Number.isInteger(n[1]) || n[0] < 1 || n[0] > n[1]) {
        fail(`params.n must be [min, max] with 1 <= min <= max, got ${JSON.stringify(n)}`);
    }
    const [low, high] = n as [number, number];
    if (low + balance.arrows.tableMin - 1 > (max as number)) fail(`params.max ${String(max)} is too small for the step ${low}`);
    return { variants: variants as ArrowVariant[], max: max as number, n: [low, Math.min(high, max as number)] };
};

export const generateArrowTable: Generator = (skill, rng): Task => {
    const p = parseArrowTableParams(skill.params);
    const variant = rng.pick(p.variants);
    const plus = rng.chance(0.5);
    const op = plus ? '+' : '−';
    const lineOp = plus ? '+' : '-';
    // A table needs three different inputs, so its step leaves room for them.
    const n = rng.int(p.n[0], variant === 'table' ? Math.min(p.n[1], p.max - (balance.arrows.tableMin - 1)) : p.n[1]);
    // Inputs that stay in range: x + n <= max, or x >= n for subtraction.
    const lo = plus ? 0 : n;
    const hi = plus ? p.max - n : p.max;
    const go = (x: number): number => (plus ? x + n : x - n);
    const rule = pl.tasks.arrowRule(plus, n);
    if (variant === 'table') {
        const count = rng.int(balance.arrows.tableMin, balance.arrows.tableMax);
        const pool: number[] = [];
        for (let x = lo; x <= hi; x += 1) pool.push(x);
        const inputs = rng.shuffle(pool).slice(0, Math.min(count, pool.length));
        const empty = rng.int(0, inputs.length - 1);
        const visual: TaskVisual = { kind: 'arrows', layout: 'table', op, n, inputs, outputs: inputs.map((x, i) => (i === empty ? null : go(x))) };
        return { skillId: skill.id, prompt: pl.tasks.arrowTable, visual, answer: go(inputs[empty]), hint: [rule, arithLine(inputs[empty], n, lineOp)] };
    }
    const start = rng.int(lo, hi);
    if (variant === 'graphOut') {
        const visual: TaskVisual = { kind: 'arrows', layout: 'graph', op, n, input: start, output: null };
        return { skillId: skill.id, prompt: pl.tasks.arrowGraph, visual, answer: go(start), hint: [rule, arithLine(start, n, lineOp)] };
    }
    const visual: TaskVisual = { kind: 'arrows', layout: 'graph', op, n, input: null, output: go(start) };
    return {
        skillId: skill.id, prompt: pl.tasks.arrowGraph, visual, answer: start,
        hint: [pl.tasks.arrowRuleBack(plus, n), arithLine(go(start), n, plus ? '-' : '+')],
    };
};
