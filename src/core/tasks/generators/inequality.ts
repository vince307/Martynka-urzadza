// INEQUALITY: "5 + □ < 8" with four tiles of which two fit (ZADANIA.md, E1.9). The task carries `check`, so any
// right tile is accepted; the wrong tiles sit at the boundary (the value of the equality and the one beyond it).
// The tile builder is the generator's own: `numberChoices` would pick one answer and distractors around it.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { BOX, MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type InequalityShape = 'add<' | 'add>' | 'box+<' | 'sub>';

export interface InequalityParams {
    max: number;                        // bound for every number shown and every tile
    shapes: readonly InequalityShape[];
}

const MAX_ATTEMPTS = 1000;
const TILES_RIGHT = 2;

/** Smallest `max` at which the shape still has two right and two wrong tiles (see `draw`). */
const MIN_MAX: Readonly<Record<InequalityShape, number>> = { 'add<': 5, 'add>': 5, 'box+<': 5, 'sub>': 4 };

const isShape = (x: unknown): x is InequalityShape => x === 'add<' || x === 'add>' || x === 'box+<' || x === 'sub>';

export const parseInequalityParams = (params: Record<string, unknown>): InequalityParams => {
    const { max, shapes } = params;
    if (!Number.isInteger(max)) {
        throw new TypeError(`INEQUALITY params.max must be an integer, got ${String(max)}`);
    }
    if (!Array.isArray(shapes) || shapes.length === 0 || !shapes.every(isShape)) {
        throw new TypeError(`INEQUALITY params.shapes must be a non-empty list of add< add> box+< sub>, got ${JSON.stringify(shapes)}`);
    }
    for (const shape of shapes) {
        if ((max as number) < MIN_MAX[shape]) {
            throw new TypeError(`INEQUALITY shape ${shape} needs params.max >= ${MIN_MAX[shape]}, got ${String(max)}`);
        }
    }
    return { max: max as number, shapes };
};

interface Drawn {
    expr: string;
    equation: string;
    fact: string;                       // the equality at the boundary, solved
    relation: 'less' | 'more';
    boundary: number;
    right: number[];                    // every right tile candidate
    wrong: number[];                    // the two wrong tiles
    example: (x: number) => { fact: string; check: string }; // the shown example for the canonical tile
    holds: (x: number) => boolean;
    tail: number;                       // the last number of the first hint line
}

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

const draw = (shape: InequalityShape, max: number, rng: Rng): Drawn | undefined => {
    const a = rng.int(1, max);
    const c = rng.int(1, max);
    if (shape === 'sub>') {
        // a − □ > c: right when □ < a − c; the wrong tiles a − c and a − c + 1 must stay <= a, so c >= 1.
        const b = a - c;
        if (b < 3) {
            return undefined;
        }
        return {
            expr: `${a} ${MINUS} ${BOX} > ${c}`,
            equation: `${c} = ${a} ${MINUS} ${BOX}`,
            fact: `${a} ${MINUS} ${b} = ${c}`,
            relation: 'less',
            boundary: b,
            right: range(1, b - 1),
            wrong: [b, b + 1],
            example: (x) => ({ fact: `${a} ${MINUS} ${x} = ${a - x}`, check: `${a - x} > ${c}` }),
            holds: (v) => a - v > c,
            tail: a,
        };
    }
    const b = c - a;
    if (shape === 'add>') {
        // a + □ > c: right when □ > c − a, and a + □ <= max; the wrong tiles are the boundary and the value below it.
        if (b < 2 || c > max - TILES_RIGHT || a > b) {
            return undefined; // a > b would make the number ending the first hint line a right tile
        }
        const right = range(b + 1, max - a);
        return {
            expr: `${a} + ${BOX} > ${c}`,
            equation: `${c} = ${a} + ${BOX}`,
            fact: `${a} + ${b} = ${c}`,
            relation: 'more',
            boundary: b,
            right,
            wrong: [b - 1, b],
            example: (x) => ({ fact: `${a} + ${x} = ${a + x}`, check: `${a + x} > ${c}` }),
            holds: (v) => a + v > c,
            tail: a,
        };
    }
    // a + □ < c and □ + a < c: right when □ < c − a; every tile, wrong ones included, keeps the sum <= max.
    if (b < 3 || c + 1 > max) {
        return undefined;
    }
    const boxFirst = shape === 'box+<';
    const sum = (n: number): string => (boxFirst ? `${n} + ${a}` : `${a} + ${n}`);
    return {
        expr: boxFirst ? `${BOX} + ${a} < ${c}` : `${a} + ${BOX} < ${c}`,
        equation: boxFirst ? `${BOX} + ${a} = ${c}` : `${a} + ${BOX} = ${c}`,
        fact: `${sum(b)} = ${c}`,
        relation: 'less',
        boundary: b,
        right: range(1, b - 1),
        wrong: [b, b + 1],
        example: (x) => ({ fact: `${sum(x)} = ${a + x}`, check: `${a + x} < ${c}` }),
        holds: (v) => a + v < c,
        tail: c,
    };
};

export const generateInequality: Generator = (skill, rng): Task => {
    const p = parseInequalityParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const d = draw(rng.pick(p.shapes), p.max, rng);
        if (!d || d.holds(d.tail) || d.right.length < TILES_RIGHT) {
            continue;
        }
        const right = rng.shuffle([...d.right]).slice(0, TILES_RIGHT);
        const answer = right[0];
        const example = d.example(answer);
        return {
            skillId: skill.id,
            prompt: pl.tasks.inequality(d.expr),
            answer,
            choices: [...right, ...d.wrong].sort((x, y) => x - y),
            hint: [
                pl.tasks.inequalityEquality(d.equation),
                pl.tasks.inequalityBoundary(d.fact, d.relation, d.boundary),
                pl.tasks.inequalityExample(example.fact, example.check, answer),
            ],
            check: (input) => typeof input === 'number' && d.holds(input),
        };
    }
    throw new Error(`INEQUALITY: no task after ${MAX_ATTEMPTS} attempts (params ${JSON.stringify(skill.params)})`);
};
