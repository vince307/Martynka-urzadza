// PERIMETER: the length of the way round a figure (ZADANIA.md, section 4, E4.7, E5.12, E6.3). Variants: `rect` (a
// rectangle or a square with labelled sides), `triangle`, `sideSquare` (a side from the perimeter of a square),
// `sideRect` (the other side of a rectangle) and `composite` (an L, U or staircase figure on a lattice, 1 cell = 1 cm).
// All answer on the keypad; `max` bounds the perimeter shown or asked for.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { DIVIDE, MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type PerimeterVariant = 'rect' | 'triangle' | 'sideSquare' | 'sideRect' | 'composite';

export interface PerimeterParams {
    variant: PerimeterVariant;
    max: number;
}

const VARIANTS: readonly PerimeterVariant[] = ['rect', 'triangle', 'sideSquare', 'sideRect', 'composite'];
const MIN_MAX = 12;
const MAX_MAX = 100;
const SIDE = { min: 2, max: 20 } as const;
const SQUARE_MAX = 40;

export const parsePerimeterParams = (params: Record<string, unknown>): PerimeterParams => {
    const { variant, max } = params;
    if (!VARIANTS.includes(variant as PerimeterVariant)) {
        throw new TypeError(`PERIMETER params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    }
    if (typeof max !== 'number' || !Number.isInteger(max) || max < MIN_MAX || max > MAX_MAX) {
        throw new TypeError(`PERIMETER params.max must be an integer in ${MIN_MAX}..${MAX_MAX}, got ${String(max)}`);
    }
    return { variant: variant as PerimeterVariant, max };
};

type Vertex = readonly [number, number];
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const plus = (xs: readonly number[]): string => xs.join(' + ');

/** A rectangle drawn with a ratio of at most 2:1 whatever the labels say (the drawing is not to scale). */
const rectangle = (a: number, b: number): Vertex[] => {
    const r = Math.min(2, Math.max(0.5, a / b));
    const w = Math.round(r * 40) / 10;
    return [[0, 0], [w, 0], [w, 4], [0, 4]];
};

const rect = (skill: { id: string }, p: PerimeterParams, rng: Rng): Task => {
    const half = Math.floor(p.max / 2);
    const square = rng.chance(0.3);
    const a = rng.int(SIDE.min, Math.min(SIDE.max, square ? Math.floor(half / 2) : half - SIDE.min));
    const b = square ? a : rng.int(SIDE.min, Math.min(SIDE.max, half - a));
    const total = 2 * (a + b);
    return {
        skillId: skill.id,
        prompt: a === b ? pl.tasks.perimeterSquarePrompt : pl.tasks.perimeterRectPrompt,
        visual: { kind: 'figure', lattice: false, vertices: rectangle(a, b), sides: [a, b, a, b] },
        answer: total,
        hint: [pl.tasks.perimeterHint, `${plus([a, b, a, b])} = ${total}`],
    };
};

const triangle = (skill: { id: string }, p: PerimeterParams, rng: Rng): Task => {
    const top = Math.min(SIDE.max, p.max - 2 * SIDE.min);
    let s: [number, number, number];
    do {
        s = [rng.int(SIDE.min, top), rng.int(SIDE.min, top), rng.int(SIDE.min, top)];
    } while (sum(s) > p.max || s[0] + s[1] <= s[2] || s[0] + s[2] <= s[1] || s[1] + s[2] <= s[0]);
    const total = sum(s);
    return {
        skillId: skill.id,
        prompt: pl.tasks.perimeterTrianglePrompt,
        visual: { kind: 'figure', lattice: false, vertices: [[0, 0], [6, 0], [rng.int(1, 5), 4]], sides: s },
        answer: total,
        hint: [pl.tasks.perimeterHint, `${plus(s)} = ${total}`],
    };
};

const sideSquare = (skill: { id: string }, p: PerimeterParams, rng: Rng): Task => {
    const side = rng.int(SIDE.min, Math.floor(Math.min(p.max, SQUARE_MAX) / 4));
    const total = 4 * side;
    return {
        skillId: skill.id,
        prompt: pl.tasks.perimeterSideSquarePrompt(total),
        visual: { kind: 'figure', lattice: false, vertices: rectangle(1, 1), sides: [null, null, null, null] },
        answer: side,
        hint: [pl.tasks.perimeterSquareHint, `${total} ${DIVIDE} 4 = ${side}`],
    };
};

const sideRect = (skill: { id: string }, p: PerimeterParams, rng: Rng): Task => {
    const half = Math.floor(p.max / 2);
    let given: number;
    let other: number;
    do {
        given = rng.int(SIDE.min, Math.min(SIDE.max, half - SIDE.min));
        other = rng.int(SIDE.min, Math.min(SIDE.max, half - given));
    } while (given === other);
    const halfTotal = given + other;
    return {
        skillId: skill.id,
        prompt: pl.tasks.perimeterSideRectPrompt(2 * halfTotal, given),
        visual: { kind: 'figure', lattice: false, vertices: rectangle(given, other), sides: [given, null, null, null] },
        answer: other,
        hint: [pl.tasks.perimeterSideRectHint, `${2 * halfTotal} ${DIVIDE} 2 = ${halfTotal}`, `${halfTotal} ${MINUS} ${given} = ${other}`],
    };
};

type Shape = 'L' | 'U' | 'stairs';

const shapeVertices = (shape: Shape, rng: Rng): Vertex[] => {
    if (shape === 'L') {
        const w = rng.int(3, 8);
        const h = rng.int(3, 7);
        const cw = rng.int(1, w - 1);
        const ch = rng.int(1, h - 1);
        return [[0, 0], [w, 0], [w, ch], [cw, ch], [cw, h], [0, h]];
    }
    if (shape === 'U') {
        const w = rng.int(3, 8);
        const h = rng.int(2, 7);
        const d = rng.int(1, h - 1);
        const t1 = rng.int(1, w - 2);
        const t2 = rng.int(1, w - 1 - t1);
        return [[0, 0], [w, 0], [w, h], [w - t2, h], [w - t2, d], [t1, d], [t1, h], [0, h]];
    }
    const x = [rng.int(1, 3), 0, 0];
    x[1] = x[0] + rng.int(1, 3);
    x[2] = x[1] + rng.int(1, 3);
    const y = [rng.int(1, 3), 0, 0];
    y[1] = y[0] + rng.int(1, 2);
    y[2] = y[1] + rng.int(1, 2);
    return [[0, 0], [x[2], 0], [x[2], y[0]], [x[1], y[0]], [x[1], y[1]], [x[0], y[1]], [x[0], y[2]], [0, y[2]]];
};

const edges = (vs: readonly Vertex[]): number[] =>
    vs.map(([x, y], i) => {
        const [nx, ny] = vs[(i + 1) % vs.length];
        return Math.abs(nx - x) + Math.abs(ny - y);
    });

const composite = (skill: { id: string }, p: PerimeterParams, rng: Rng): Task => {
    let vs: Vertex[];
    do {
        vs = shapeVertices(rng.pick<Shape>(['L', 'U', 'stairs']), rng);
    } while (sum(edges(vs)) > p.max);
    const maxX = Math.max(...vs.map((v) => v[0]));
    const maxY = Math.max(...vs.map((v) => v[1]));
    const flipX = rng.chance(0.5);
    const flipY = rng.chance(0.5);
    const placed = vs.map(([x, y]): Vertex => [flipX ? maxX - x : x, flipY ? maxY - y : y]);
    const lengths = edges(placed);
    const total = sum(lengths);
    return {
        skillId: skill.id,
        prompt: pl.tasks.perimeterCompositePrompt,
        visual: { kind: 'figure', lattice: true, vertices: placed, sides: placed.map(() => null) },
        answer: total,
        hint: [pl.tasks.perimeterCompositeHint, `${plus(lengths)} = ${total}`],
    };
};

export const generatePerimeter: Generator = (skill, rng): Task => {
    const p = parsePerimeterParams(skill.params);
    switch (p.variant) {
        case 'rect':
            return rect(skill, p, rng);
        case 'triangle':
            return triangle(skill, p, rng);
        case 'sideSquare':
            return sideSquare(skill, p, rng);
        case 'sideRect':
            return sideRect(skill, p, rng);
        case 'composite':
            return composite(skill, p, rng);
    }
};
