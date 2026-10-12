// ADD_SUB: one addition or subtraction with a numeric answer (ZADANIA.md,
// section 4). Prompts are bare expressions ("7 + 6"); worded prompts and the
// `shape` parameter arrive with the curriculum content (roadmap S-02).
import type { Rng } from '../../rng';
import type { Generator, Task } from '../types';

export type AddSubOp = '+' | '-';
export type Bridge = 'none' | 'ten' | 'any';

export interface AddSubParams {
    max: number;                  // upper bound for operands and the result
    ops: readonly AddSubOp[];
    bridge: Bridge;               // crossing a ten: never / always / unconstrained
}

const MAX_ATTEMPTS = 1000;
/** Minus sign used in player-facing text (U+2212), distinct from a hyphen. */
export const MINUS = '−';

const isOp = (value: unknown): value is AddSubOp => value === '+' || value === '-';
const isBridge = (value: unknown): value is Bridge => value === 'none' || value === 'ten' || value === 'any';

export const parseAddSubParams = (params: Record<string, unknown>): AddSubParams => {
    const { max, ops, bridge } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`ADD_SUB params.max must be an integer >= 2, got ${String(max)}`);
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every(isOp)) {
        throw new TypeError(`ADD_SUB params.ops must be a non-empty list of '+' / '-', got ${JSON.stringify(ops)}`);
    }
    if (!isBridge(bridge)) {
        throw new TypeError(`ADD_SUB params.bridge must be 'none' | 'ten' | 'any', got ${String(bridge)}`);
    }
    if (bridge === 'ten' && (max as number) < 11) {
        throw new TypeError(`ADD_SUB bridge 'ten' needs max >= 11, got ${String(max)}`);
    }
    return { max: max as number, ops, bridge };
};

/**
 * True when a + b (or a − b) crosses a multiple of ten in the units: 7 + 6
 * and 13 − 6 do, 8 + 2 (reaches 10) and 20 − 7 (starts on a ten) do not.
 * Only the units matter, so adding or removing whole tens first keeps the
 * answer the same.
 */
export const crossesTen = (a: number, b: number, op: AddSubOp): boolean =>
    op === '+' ? (a % 10) + (b % 10) > 10 : a % 10 > 0 && a % 10 < b % 10;

const bridgeMatches = (a: number, b: number, op: AddSubOp, bridge: Bridge): boolean =>
    bridge === 'any' || crossesTen(a, b, op) === (bridge === 'ten');

const apply = (a: number, b: number, op: AddSubOp): number => (op === '+' ? a + b : a - b);
const sign = (op: AddSubOp): string => (op === '+' ? '+' : MINUS);
const line = (a: number, b: number, op: AddSubOp): string => `${a} ${sign(op)} ${b} = ${apply(a, b, op)}`;

/**
 * Hint steps in the order taught at school: whole tens of b first, then the
 * units; when the units cross a ten, go to the ten first (7 + 6 → 7 + 3 = 10,
 * 10 + 3 = 13; 13 − 6 → 13 − 3 = 10, 10 − 3 = 7). Never produces a "+ 0" step.
 */
const hintFor = (a: number, b: number, op: AddSubOp): string[] => {
    const steps: string[] = [];
    const tens = b - (b % 10);
    const units = b % 10;
    let current = a;
    if (tens > 0) {
        steps.push(line(current, tens, op));
        current = apply(current, tens, op);
    }
    if (units > 0) {
        if (crossesTen(current, units, op)) {
            const toTen = op === '+' ? 10 - (current % 10) : current % 10;
            const rest = units - toTen;
            steps.push(line(current, toTen, op));
            current = apply(current, toTen, op);
            steps.push(line(current, rest, op));
        } else {
            steps.push(line(current, units, op));
        }
    }
    return steps.length > 0 ? steps : [line(a, b, op)];
};

/** Operands are at least 1; a − a = 0 stays possible, 30 + 0 does not. */
const drawOperands = (p: AddSubParams, op: AddSubOp, rng: Rng): [number, number] => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const a = op === '+' ? rng.int(1, p.max - 1) : rng.int(1, p.max);
        const b = op === '+' ? rng.int(1, p.max - a) : rng.int(1, a);
        if (bridgeMatches(a, b, op, p.bridge)) {
            return [a, b];
        }
    }
    throw new Error(`ADD_SUB: no operands for ${JSON.stringify({ ...p, op })} after ${MAX_ATTEMPTS} draws`);
};

export const generateAddSub: Generator = (skill, rng): Task => {
    const params = parseAddSubParams(skill.params);
    const op = rng.pick(params.ops);
    const [a, b] = drawOperands(params, op, rng);
    return {
        skillId: skill.id,
        prompt: `${a} ${sign(op)} ${b}`,
        answer: apply(a, b, op),
        hint: hintFor(a, b, op),
    };
};
