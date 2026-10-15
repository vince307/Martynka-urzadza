// ADD_SUB: one addition or subtraction with a numeric answer (ZADANIA.md,
// section 4). Prompts are bare expressions ("7 + 6"); operands come either
// from free draws in [1, max] or from number shapes ("DU+U", params.shapes).
import type { Rng } from '../../rng';
import { drawToken, formatShape, parseShape, tokenValues, type Shape } from '../shapes';
import { applyOp as apply, arithLine as line, opSign as sign, SAME_SHARE } from '../arith';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';
import type { TaskVisual } from '../visual';

export type AddSubOp = '+' | '-';
export type Bridge = 'none' | 'ten' | 'any';

export interface AddSubParams {
    max: number;                  // upper bound for operands and the result
    ops: readonly AddSubOp[];
    bridge: Bridge;               // crossing a ten: never / always / unconstrained
    line?: true;                  // a number line explains the hint (S-14b); needs max <= 30
    shapes?: readonly Shape[];    // number shapes from the catalogue ("DU+U"); ops follow from them
}

const MAX_ATTEMPTS = 1000;
const MAX_LINE = 30;   // the hint line spans at most 30 units (balance.numberLine.maxTicks - 1)
export { MINUS };

const isOp = (value: unknown): value is AddSubOp => value === '+' || value === '-';
const isBridge = (value: unknown): value is Bridge => value === 'none' || value === 'ten' || value === 'any';

export const parseAddSubParams = (params: Record<string, unknown>): AddSubParams => {
    const { max, ops, bridge, shapes, line: withLine } = params;
    if (withLine !== undefined && (withLine !== true || (max as number) > MAX_LINE)) {
        throw new TypeError(`ADD_SUB params.line must be true and needs max <= ${MAX_LINE}, got line ${JSON.stringify(withLine)} max ${String(max)}`);
    }
    const lineOpt = withLine === true ? { line: true as const } : {};
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
        return { max: max as number, ops: shapeOps, bridge, shapes: parsed, ...lineOpt };
    }
    if (!Array.isArray(ops) || ops.length === 0 || !ops.every(isOp)) {
        throw new TypeError(`ADD_SUB params.ops must be a non-empty list of '+' / '-', got ${JSON.stringify(ops)}`);
    }
    return { max: max as number, ops, bridge, ...lineOpt };
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

/**
 * Hint steps in the order taught at school: whole tens of b first, then the
 * units; when the units cross a ten, go to the ten first (7 + 6 → 7 + 3 = 10,
 * 10 + 3 = 13; 13 − 6 → 13 − 3 = 10, 10 − 3 = 7). Never produces a "+ 0" step.
 */
export interface Jump { from: number; to: number }

/**
 * The jumps of the school method on a number line: whole tens of b first, then the units; when the units cross a ten the
 * first jump lands on it (7 + 6 → 7→10, 10→13). One source for the hint lines and the hint drawing.
 */
export const addSubJumps = (a: number, op: AddSubOp, b: number): Jump[] => {
    const jumps: Jump[] = [];
    const tens = b - (b % 10);
    const units = b % 10;
    const move = (from: number, by: number): number => (op === '+' ? from + by : from - by);
    let current = a;
    const jump = (by: number): void => {
        const to = move(current, by);
        jumps.push({ from: current, to });
        current = to;
    };
    if (tens > 0) jump(tens);
    if (units > 0) {
        if (crossesTen(current, units, op)) {
            const toTen = op === '+' ? 10 - (current % 10) : current % 10;
            jump(toTen);
            jump(units - toTen);
        } else {
            jump(units);
        }
    }
    return jumps.length > 0 ? jumps : [{ from: a, to: move(a, b) }];
};

const hintOfJumps = (jumps: readonly Jump[], op: AddSubOp): string[] =>
    jumps.map((j) => line(j.from, Math.abs(j.to - j.from), op));

/**
 * Hint steps in the order taught at school (see addSubJumps). Never produces a "+ 0" step.
 */
export const addSubHint = (a: number, b: number, op: AddSubOp): string[] => {
    if (op === '-' && a >= 20 && a % 10 === 0 && b >= 1 && b <= 9) {
        // DT − U (70 − 9 = 60 + (10 − 9)): break one ten, subtract from it, add the
        // other tens; "20 − 7" by analogy with "10 − 7" (impl-review S-03).
        return [line(10, b, '-'), line(a - 10, 10 - b, '+')];
    }
    return hintOfJumps(addSubJumps(a, op, b), op);
};

const isFive = (n: number): boolean => n % 5 === 0;

/**
 * The hint drawing: a line from the full ten under the lower end to the full ten over the higher one, a tick per unit.
 * Labels: the start, the landings between, every multiple of five; never the result, which gets the box. On a line of more than one ten
 * a multiple of five on the tick next to the start, a landing or the box is left out: the two numbers (or the box) ran into each other (visual gate S-14b).
 */
export const hintLine = (jumps: readonly Jump[], result: number): TaskVisual => {
    const points = jumps.flatMap((j) => [j.from, j.to]);
    const from = Math.floor(Math.min(...points) / 10) * 10;
    const to = Math.ceil(Math.max(...points) / 10) * 10;
    const labels = new Set<number>([jumps[0].from, ...jumps.slice(0, -1).map((j) => j.to)]);
    const marked = [...labels, result];
    const dense = to - from > 10;   // two or three tens: the ticks stand close; one ten has room for every label
    for (let n = from; n <= to; n += 1) {
        if (isFive(n) && !(dense && marked.some((m) => Math.abs(m - n) === 1))) labels.add(n);
    }
    labels.delete(result);
    return { kind: 'numberLine', from, to, tick: 1, labels: [...labels].sort((x, y) => x - y), box: result, jumps: jumps.map((j) => ({ ...j })) };
};

/**
 * Operands are at least 1 and pairs are drawn uniformly, so no single task
 * dominates a small range; a − a stays possible but rare, 30 + 0 does not.
 */
const drawFree = (p: AddSubParams, op: AddSubOp, rng: Rng): [number, number] | undefined => {
    const a = rng.int(1, p.max);
    const b = rng.int(1, p.max);
    if (op === '+' ? a + b > p.max : b > a || (b === a && !rng.chance(SAME_SHARE))) {
        return undefined;
    }
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
    if (shape.op === '-' && a === b && !rng.chance(SAME_SHARE)) {
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
    const answer = apply(a, b, op);
    if (params.line) {
        // The hint lines and the drawing share one list of jumps (no special case of "20 − 7" here: the drawing must match the lines).
        const jumps = addSubJumps(a, op, b);
        return { skillId: skill.id, prompt: `${a} ${sign(op)} ${b}`, answer, hint: hintOfJumps(jumps, op), hintVisual: hintLine(jumps, answer) };
    }
    return {
        skillId: skill.id,
        prompt: `${a} ${sign(op)} ${b}`,
        answer,
        hint: addSubHint(a, b, op),
    };
};
