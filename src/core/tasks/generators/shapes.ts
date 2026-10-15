// SHAPES (E1.1): touch the named figure, mark every figure of one kind, or find the one that does not fit.
// The tiles are faces (S-14d): the child looks, the texts only name the figure and never contain a code.
import { pl } from '../../../data/pl';
import { COLOURS, COLOUR_IDS, FIGURES, NAMED_FIGURE_IDS, SHAPES_LIMITS, SIZES, SIZE_IDS, type FigureId } from '../../../data/shapes';
import type { Rng } from '../../rng';
import { faceKey, type Face } from '../faces';
import type { Generator, Task } from '../types';

export type ShapesVariant = 'name' | 'odd' | 'all';

export interface ShapesParams {
    variants: ShapesVariant[];
    figures: FigureId[];
}

const VARIANTS: readonly ShapesVariant[] = ['name', 'odd', 'all'];
const MIN_FIGURES = 3;
const MAX_ATTEMPTS = 1000;

export const parseShapesParams = (params: Record<string, unknown>): ShapesParams => {
    const { variants, figures } = params;
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every((v): v is ShapesVariant => VARIANTS.includes(v as ShapesVariant))) {
        throw new TypeError(`SHAPES params.variants must be a non-empty list of ${VARIANTS.join(', ')}, got ${JSON.stringify(variants)}`);
    }
    const named: readonly string[] = NAMED_FIGURE_IDS;
    if (!Array.isArray(figures) || !figures.every((f): f is FigureId => typeof f === 'string' && named.includes(f))) {
        throw new TypeError(`SHAPES params.figures must list figures from ${named.join(', ')}, got ${JSON.stringify(figures)}`);
    }
    if (new Set(figures).size !== figures.length || figures.length < MIN_FIGURES) {
        throw new TypeError(`SHAPES params.figures needs ${MIN_FIGURES} or more different figures, got ${JSON.stringify(figures)}`);
    }
    return { variants, figures };
};

const figureDef = (id: FigureId) => {
    const def = FIGURES.find((f) => f.id === id);
    if (!def) {
        throw new TypeError(`unknown figure ${id}`);
    }
    return def;
};

const randomFace = (figure: FigureId, rng: Rng): Face => ({ figure, colour: rng.pick(COLOUR_IDS), size: rng.pick(SIZE_IDS) });

/** A square is a rectangle: the two never share a task, or a child who taps the square would be marked wrong. */
const clash = (a: string, b: string): boolean => (a === 'square' && b === 'rectangle') || (a === 'rectangle' && b === 'square');

const range = ([min, max]: readonly [number, number]): readonly [number, number] => [min, max];

/** "Dotknij trójkąta.": 3–4 tiles of different figures, one of the named kind. */
const name = (skillId: string, figures: readonly FigureId[], rng: Rng): Task => {
    const target = rng.pick(figures);
    const pool = figures.filter((f) => f !== target && !clash(f, target));
    const count = Math.min(rng.int(...range(SHAPES_LIMITS.nameTiles)), pool.length + 1);
    const others = rng.shuffle(pool).slice(0, count - 1);
    const faces = rng.shuffle([target, ...others].map((figure) => randomFace(figure, rng)));
    const def = figureDef(target);
    return {
        skillId,
        prompt: pl.tasks.shapesName(def.genitive),
        answer: faceKey(faces.find((f) => f.figure === target) as Face),
        choices: faces.map(faceKey),
        hint: [def.fact, pl.tasks.shapesLookEach, pl.tasks.shapesLookName(def.look)],
    };
};

type Feature = 'figure' | 'colour' | 'size';

/** "Który nie pasuje?": three tiles agree in one feature (and differ in a second), the fourth has another value of it; the third feature is the same on all. */
const odd = (skillId: string, figures: readonly FigureId[], rng: Rng): Task => {
    const pool: Record<Feature, readonly string[]> = { figure: figures, colour: COLOUR_IDS, size: SIZE_IDS };
    const different = rng.pick(['figure', 'colour', 'size'] as const);
    const varying = rng.pick((['figure', 'colour'] as const).filter((f) => f !== different));
    const constant = (['figure', 'colour', 'size'] as const).find((f) => f !== different && f !== varying) as Feature;
    const shared = rng.pick(pool[different]);
    const alone = rng.pick(pool[different].filter((v) => v !== shared && !(different === 'figure' && clash(v, shared))));
    const fixed = rng.pick(pool[constant]);
    const three = rng.shuffle(pool[varying]).slice(0, 3);
    const oddVarying = rng.pick(pool[varying]);
    const build = (differentValue: string, varyingValue: string): Face =>
        ({ [different]: differentValue, [varying]: varyingValue, [constant]: fixed }) as unknown as Face;
    const majority = three.map((v) => build(shared, v));
    const intruder = build(alone, oddVarying);
    const faces = rng.shuffle([...majority, intruder]);
    const last =
        different === 'figure'
            ? pl.tasks.shapesOddFigure(figureDef(intruder.figure).nominative)
            : pl.tasks.shapesOddFeature(different === 'colour' ? COLOURS[intruder.colour].f : SIZES[intruder.size].f);
    return {
        skillId,
        prompt: pl.tasks.shapesOdd,
        answer: faceKey(intruder),
        choices: faces.map(faceKey),
        hint: [pl.tasks.shapesOddLook, pl.tasks.shapesOddThree, last],
    };
};

const sameSet = (a: readonly unknown[], b: readonly unknown[]): boolean =>
    a.length === b.length && a.every((x) => b.includes(x)) && b.every((x) => a.includes(x));

/** "Dotknij wszystkich kół.": 5–6 tiles, 2–3 of the named kind, every one to be marked. */
const all = (skillId: string, figures: readonly FigureId[], rng: Rng): Task => {
    const target = rng.pick(figures);
    const targetCount = rng.int(...range(SHAPES_LIMITS.allTargets));
    const total = rng.int(...range(SHAPES_LIMITS.allTiles));
    const others = figures.filter((f) => f !== target && !clash(f, target));
    const combos = COLOUR_IDS.flatMap((colour) => SIZE_IDS.map((size) => ({ colour, size })));
    const right: Face[] = rng.shuffle(combos).slice(0, targetCount).map((c) => ({ figure: target, ...c }));
    const wrong: Face[] = [];
    for (let attempt = 0; wrong.length < total - targetCount && attempt < MAX_ATTEMPTS; attempt += 1) {
        const face = randomFace(rng.pick(others), rng);
        if (!wrong.some((w) => faceKey(w) === faceKey(face))) {
            wrong.push(face);
        }
    }
    const choices = rng.shuffle([...right, ...wrong]).map(faceKey);
    const rightKeys = right.map(faceKey);
    const answer = choices.filter((c) => rightKeys.includes(c));
    const def = figureDef(target);
    return {
        skillId,
        prompt: pl.tasks.shapesAll(def.genitivePlural),
        answer,
        choices,
        hint: [def.fact, pl.tasks.shapesLookEach, pl.tasks.shapesLookAll(def.look)],
        check: (input) => Array.isArray(input) && input.every((x): x is string => typeof x === 'string') && sameSet(input, answer),
    };
};

export const generateShapes: Generator = (skill, rng): Task => {
    const p = parseShapesParams(skill.params);
    switch (rng.pick(p.variants)) {
        case 'name':
            return name(skill.id, p.figures, rng);
        case 'odd':
            return odd(skill.id, p.figures, rng);
        case 'all':
            return all(skill.id, p.figures, rng);
    }
};
