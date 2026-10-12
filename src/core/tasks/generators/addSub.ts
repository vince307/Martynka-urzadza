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
    if (!Number.isInteger(max) || (max as number) < 1) {
        throw new TypeError(`ADD_SUB params.max must be a positive integer, got ${String(max)}`);
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every(isOp)) {
        throw new TypeError(`ADD_SUB params.ops must be a non-empty list of '+' / '-', got ${JSON.stringify(ops)}`);
    }
    if (!isBridge(bridge)) {
        throw new TypeError(`ADD_SUB params.bridge must be 'none' | 'ten' | 'any', got ${String(bridge)}`);
    }
    return { max: max as number, ops, bridge };
};

/** True when a + b (or a − b) crosses a multiple of ten. */
export const crossesTen = (a: number, b: number, op: AddSubOp): boolean =>
    op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;

const bridgeMatches = (a: number, b: number, op: AddSubOp, bridge: Bridge): boolean =>
    bridge === 'any' || crossesTen(a, b, op) === (bridge === 'ten');

const hintFor = (a: number, b: number, op: AddSubOp): string[] => {
    if (op === '+') {
        if (!crossesTen(a, b, op)) {
            return [`${a} + ${b} = ${a + b}`];
        }
        // 7 + 6 → 7 + 3 = 10, 10 + 3 = 13 (fill up to the next ten first).
        const toTen = 10 - (a % 10);
        const rest = b - toTen;
        return [`${a} + ${toTen} = ${a + toTen}`, `${a + toTen} + ${rest} = ${a + b}`];
    }
    if (!crossesTen(a, b, op)) {
        return [`${a} ${MINUS} ${b} = ${a - b}`];
    }
    // 13 − 6 → 13 − 3 = 10, 10 − 3 = 7 (go down to the ten first).
    const toTen = a % 10;
    const rest = b - toTen;
    return [`${a} ${MINUS} ${toTen} = ${a - toTen}`, `${a - toTen} ${MINUS} ${rest} = ${a - b}`];
};

const drawOperands = (p: AddSubParams, op: AddSubOp, rng: Rng): [number, number] => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        if (op === '+') {
            const a = rng.int(0, p.max);
            const b = rng.int(0, p.max - a);
            if (bridgeMatches(a, b, op, p.bridge)) {
                return [a, b];
            }
        } else {
            const a = rng.int(0, p.max);
            const b = rng.int(0, a);
            if (bridgeMatches(a, b, op, p.bridge)) {
                return [a, b];
            }
        }
    }
    throw new Error(`ADD_SUB: no operands for ${JSON.stringify({ ...p, op })} after ${MAX_ATTEMPTS} draws`);
};

export const generateAddSub: Generator = (skill, rng): Task => {
    const params = parseAddSubParams(skill.params);
    const op = rng.pick(params.ops);
    const [a, b] = drawOperands(params, op, rng);
    const answer = op === '+' ? a + b : a - b;
    return {
        skillId: skill.id,
        prompt: `${a} ${op === '+' ? '+' : MINUS} ${b}`,
        answer,
        hint: hintFor(a, b, op),
    };
};
