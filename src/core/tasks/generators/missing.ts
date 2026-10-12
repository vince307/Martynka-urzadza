// MISSING: an equation with one number hidden behind □ (ZADANIA.md, section 4):
// "□ + 5 = 12", "7 − □ = 4", "4 · □ = 16", "□ : 5 = 6". The hint is the
// inverse operation that reveals the hidden number.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import type { Generator, Task } from '../types';
import { crossesTen, MINUS, type Bridge } from './addSub';

export type MissingOp = '+' | '-' | '*' | '/';
export type Slot = 'left' | 'right' | 'result';

export interface MissingParams {
    max: number;                     // bound for every number in the equation
    ops: readonly MissingOp[];
    bridge: Bridge;                  // for + and −; ignored for · and :
    slots: readonly Slot[];
}

const MAX_ATTEMPTS = 1000;
const BOX = '□';
export const TIMES = '·';
export const DIVIDE = ':';

const isOp = (x: unknown): x is MissingOp => x === '+' || x === '-' || x === '*' || x === '/';
const isSlot = (x: unknown): x is Slot => x === 'left' || x === 'right' || x === 'result';
const isBridge = (x: unknown): x is Bridge => x === 'none' || x === 'ten' || x === 'any';

export const parseMissingParams = (params: Record<string, unknown>): MissingParams => {
    const { max, ops, bridge = 'any', slots = ['left', 'right', 'result'] } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`MISSING params.max must be an integer >= 2, got ${String(max)}`);
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every(isOp)) {
        throw new TypeError(`MISSING params.ops must be a non-empty list of + - * /, got ${JSON.stringify(ops)}`);
    }
    if (!isBridge(bridge)) {
        throw new TypeError(`MISSING params.bridge must be 'none' | 'ten' | 'any', got ${String(bridge)}`);
    }
    if (!Array.isArray(slots) || slots.length === 0 || !slots.every(isSlot)) {
        throw new TypeError(`MISSING params.slots must be a non-empty list of left/right/result, got ${JSON.stringify(slots)}`);
    }
    return { max: max as number, ops, bridge, slots };
};

const symbol = (op: MissingOp): string => ({ '+': '+', '-': MINUS, '*': TIMES, '/': DIVIDE })[op];

/** Draws a true equation a op b = c with every number in [0, max]. */
const drawEquation = (p: MissingParams, op: MissingOp, rng: Rng): [number, number, number] | undefined => {
    if (op === '+') {
        const a = rng.int(1, p.max - 1);
        const b = rng.int(1, p.max - a);
        return p.bridge === 'any' || crossesTen(a, b, '+') === (p.bridge === 'ten') ? [a, b, a + b] : undefined;
    }
    if (op === '-') {
        const a = rng.int(2, p.max);
        const b = rng.int(1, a - 1);
        return p.bridge === 'any' || crossesTen(a, b, '-') === (p.bridge === 'ten') ? [a, b, a - b] : undefined;
    }
    // Multiplication table only: both factors at most 10.
    const maxFactor = Math.min(10, Math.floor(p.max / 2));
    const a = rng.int(2, maxFactor);
    const b = rng.int(2, Math.min(10, Math.floor(p.max / a)));
    return op === '*' ? [a, b, a * b] : [a * b, a, b];
};

export const generateMissing: Generator = (skill, rng): Task => {
    const p = parseMissingParams(skill.params);
    const op = rng.pick(p.ops);
    const slot = rng.pick(p.slots);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const eq = drawEquation(p, op, rng);
        if (!eq) {
            continue;
        }
        const [a, b, c] = eq;
        const hidden = slot === 'left' ? a : slot === 'right' ? b : c;
        const show = (value: number, where: Slot): string => (where === slot ? BOX : String(value));
        const prompt = `${show(a, 'left')} ${symbol(op)} ${show(b, 'right')} = ${show(c, 'result')}`;
        const inverse = inverseLine(op, slot, a, b, c);
        return {
            skillId: skill.id,
            prompt,
            speak: `${pl.tasks.missing} ${prompt}`,
            answer: hidden,
            // A hidden result is just the operation; a hidden operand needs the inverse.
            hint: [slot === 'result' ? inverse : pl.tasks.missingHint(inverse)],
        };
    }
    throw new Error(`MISSING: no equation for ${op} with ${JSON.stringify({ max: p.max, bridge: p.bridge })} after ${MAX_ATTEMPTS} draws`);
};

/** The operation that computes the hidden number from the two shown ones. */
const inverseLine = (op: MissingOp, slot: Slot, a: number, b: number, c: number): string => {
    const line = (x: number, o: MissingOp, y: number, r: number): string => `${x} ${symbol(o)} ${y} = ${r}`;
    switch (op) {
        case '+':
            return slot === 'result' ? line(a, '+', b, c) : slot === 'left' ? line(c, '-', b, a) : line(c, '-', a, b);
        case '-':
            return slot === 'result' ? line(a, '-', b, c) : slot === 'left' ? line(c, '+', b, a) : line(a, '-', c, b);
        case '*':
            return slot === 'result' ? line(a, '*', b, c) : slot === 'left' ? line(c, '/', b, a) : line(c, '/', a, b);
        default:
            return slot === 'result' ? line(a, '/', b, c) : slot === 'left' ? line(c, '*', b, a) : line(a, '/', c, b);
    }
};
