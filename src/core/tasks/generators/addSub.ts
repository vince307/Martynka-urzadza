// ADD_SUB: one addition or subtraction with a numeric answer (ZADANIA.md,
// section 4). Prompts are bare expressions ("7 + 6"); operands come either
// from free draws in [1, max] or from number shapes ("DU+U", params.shapes).
import type { Rng } from '../../rng';
import { drawToken, formatShape, parseShape, tokenValues, type Shape } from '../shapes';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type AddSubOp = '+' | '-';
export type Bridge = 'none' | 'ten' | 'any';

export interface AddSubParams {
    max: number;                  // upper bound for operands and the result
    ops: readonly AddSubOp[];
    bridge: Bridge;               // crossing a ten: never / always / unconstrained
    shapes?: readonly Shape[];    // number shapes from the catalogue ("DU+U"); ops follow from them
}

const MAX_ATTEMPTS = 1000;
export { MINUS };

const isOp = (value: unknown): value is AddSubOp => value === '+' || value === '-';
const isBridge = (value: unknown): value is Bridge => value === 'none' || value === 'ten' || value === 'any';

export const parseAddSubParams = (params: Record<string, unknown>): AddSubParams => {
    const { max, ops, bridge, shapes } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`ADD_SUB params.max must be an integer >= 2, got ${String(max)}`);
    }
    if (!isBridge(bridge)) {
        throw new TypeError(`ADD_SUB params.bridge must be 'none' | 'ten' | 'any', got ${String(bridge)}`);
    }
    if (bridge === 'ten' && (max as number) < 11) {
        throw new TypeError(`ADD_SUB bridge 'ten' needs max >= 11, got ${String(max)}`);
    }
    if (shapes !== undefined) {
        if (!Array.isArray(shapes) || shapes.length === 0 || !shapes.every((x): x is string => typeof x === 'string')) {
            throw new TypeError(`ADD_SUB params.shapes must be a non-empty list of strings, got ${JSON.stringify(shapes)}`);
        }
        const parsed = shapes.map(parseShape);
        for (const shape of parsed) {
            if (!shapeFeasible(shape, max as number, bridge)) {
                throw new TypeError(`ADD_SUB shape ${formatShape(shape)} has no solutions with max ${String(max)} and bridge ${bridge}`);
            }
        }
        const shapeOps = [...new Set(parsed.map((x) => x.op))];
        if (ops !== undefined && (!Array.isArray(ops) || !ops.every(isOp) || ops.some((o) => !shapeOps.includes(o)))) {
            throw new TypeError(`ADD_SUB params.ops ${JSON.stringify(ops)} must match the ops of shapes ${JSON.stringify(shapes)}`);
        }
        return { max: max as number, ops: shapeOps, bridge, shapes: parsed };
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every(isOp)) {
        throw new TypeError(`ADD_SUB params.ops must be a non-empty list of '+' / '-', got ${JSON.stringify(ops)}`);
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

/**
 * True when the operation crosses a ten in the units (see crossesTen) or
 * carries / borrows at any higher digit: 193 + 70 and 553 − 60 do, 47 + 3,
 * 50 − 3, 224 + 60 and 35 + 34 do not. This is what "bez przekroczenia"
 * means for two-digit and three-digit numbers in the catalogue.
 */
export const hasCarry = (a: number, b: number, op: AddSubOp): boolean => {
    if (crossesTen(a, b, op)) {
        return true;
    }
    let x = Math.floor(a / 10);
    let y = Math.floor(b / 10);
    let carry = op === '+' ? ((a % 10) + (b % 10) >= 10 ? 1 : 0) : (a % 10 < b % 10 ? 1 : 0);
    while (x > 0 || y > 0) {
        const dx = x % 10;
        const dy = y % 10;
        if (op === '+') {
            const sum = dx + dy + carry;
            if (sum >= 10 && (x >= 10 || y >= 10 || sum > 10 || dx > 0)) {
                // A carry out of this digit crosses a ten here; a sum of
                // exactly 10 at the highest position (e.g. 40 + 60 = 100) is
                // reaching a hundred, allowed like 8 + 2 reaching ten.
                if (!(sum === 10 && x < 10 && y < 10)) {
                    return true;
                }
            }
            carry = sum >= 10 ? 1 : 0;
        } else {
            if (dx - carry < dy) {
                return true;
            }
            carry = 0;
        }
        x = Math.floor(x / 10);
        y = Math.floor(y / 10);
    }
    return false;
};

/** 'none' forbids carrying at every digit (also tens into hundreds); 'ten' asks for a units carry. */
const bridgeMatches = (a: number, b: number, op: AddSubOp, bridge: Bridge): boolean =>
    bridge === 'any' ? true : bridge === 'ten' ? crossesTen(a, b, op) : !hasCarry(a, b, op);

/** At least one operand pair of the shape satisfies max and bridge (at most ~8100 pairs). */
export const shapeFeasible = (shape: Shape, max: number, bridge: Bridge): boolean => {
    const rights = tokenValues(shape.right, max);
    return tokenValues(shape.left, max).some((a) =>
        rights.some((b) => {
            const result = apply(a, b, shape.op);
            return result >= 0 && result <= max && bridgeMatches(a, b, shape.op, bridge);
        }),
    );
};

const apply = (a: number, b: number, op: AddSubOp): number => (op === '+' ? a + b : a - b);
const sign = (op: AddSubOp): string => (op === '+' ? '+' : MINUS);
const line = (a: number, b: number, op: AddSubOp): string => `${a} ${sign(op)} ${b} = ${apply(a, b, op)}`;

/**
 * Hint steps in the order taught at school: whole tens of b first, then the
 * units; when the units cross a ten, go to the ten first (7 + 6 → 7 + 3 = 10,
 * 10 + 3 = 13; 13 − 6 → 13 − 3 = 10, 10 − 3 = 7). Never produces a "+ 0" step.
 */
export const addSubHint = (a: number, b: number, op: AddSubOp): string[] => {
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
const drawFree = (p: AddSubParams, op: AddSubOp, rng: Rng): [number, number] | undefined => {
    const a = op === '+' ? rng.int(1, p.max - 1) : rng.int(1, p.max);
    const b = op === '+' ? rng.int(1, p.max - a) : rng.int(1, a);
    return bridgeMatches(a, b, op, p.bridge) ? [a, b] : undefined;
};

/** Operands of the given shape; for "−" the left token must not be the smaller one. */
const drawShaped = (p: AddSubParams, shape: Shape, rng: Rng): [number, number] | undefined => {
    const a = drawToken(shape.left, rng, p.max);
    const b = drawToken(shape.right, rng, p.max);
    const result = apply(a, b, shape.op);
    if (result < 0 || result > p.max || !bridgeMatches(a, b, shape.op, p.bridge)) {
        return undefined;
    }
    return [a, b];
};

const drawOperands = (p: AddSubParams, rng: Rng): [number, number, AddSubOp] => {
    const shape = p.shapes ? rng.pick(p.shapes) : undefined;
    const op = shape ? shape.op : rng.pick(p.ops);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const drawn = shape ? drawShaped(p, shape, rng) : drawFree(p, op, rng);
        if (drawn) {
            return [drawn[0], drawn[1], op];
        }
    }
    const what = shape ? formatShape(shape) : op;
    throw new Error(`ADD_SUB: no operands for ${what} with ${JSON.stringify({ max: p.max, bridge: p.bridge })} after ${MAX_ATTEMPTS} draws`);
};

export const generateAddSub: Generator = (skill, rng): Task => {
    const params = parseAddSubParams(skill.params);
    const [a, b, op] = drawOperands(params, rng);
    return {
        skillId: skill.id,
        prompt: `${a} ${sign(op)} ${b}`,
        answer: apply(a, b, op),
        hint: addSubHint(a, b, op),
    };
};
