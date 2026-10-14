// PUZZLE_GRID: fill the one empty cell so the sums agree (ZADANIA.md, section 4). Variants: `magic` (a 3x3 magic square,
// a rotated or mirrored Lo Shu moved up by a constant, all lines sum to at most `max`) and `pyramid` (3 + 2 + 1 bricks,
// each brick is the sum of the two under it, the top is at most `max`). Both answer on the keypad.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type PuzzleGridVariant = 'magic' | 'pyramid';

export interface PuzzleGridParams {
    variant: PuzzleGridVariant;
    max: number;
}

const VARIANTS: readonly PuzzleGridVariant[] = ['magic', 'pyramid'];
const MIN_MAX = 15;
const MAX_MAX = 30;

export const parsePuzzleGridParams = (params: Record<string, unknown>): PuzzleGridParams => {
    const { variant, max } = params;
    if (!VARIANTS.includes(variant as PuzzleGridVariant)) {
        throw new TypeError(`PUZZLE_GRID params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    }
    if (typeof max !== 'number' || !Number.isInteger(max) || max < MIN_MAX || max > MAX_MAX) {
        throw new TypeError(`PUZZLE_GRID params.max must be an integer in ${MIN_MAX}..${MAX_MAX}, got ${String(max)}`);
    }
    return { variant: variant as PuzzleGridVariant, max };
};

const LO_SHU = [2, 7, 6, 9, 5, 1, 4, 3, 8];
const LINES: readonly { kind: 'row' | 'column' | 'diagonal'; cells: readonly [number, number, number] }[] = [
    { kind: 'row', cells: [0, 1, 2] },
    { kind: 'row', cells: [3, 4, 5] },
    { kind: 'row', cells: [6, 7, 8] },
    { kind: 'column', cells: [0, 3, 6] },
    { kind: 'column', cells: [1, 4, 7] },
    { kind: 'column', cells: [2, 5, 8] },
    { kind: 'diagonal', cells: [0, 4, 8] },
    { kind: 'diagonal', cells: [2, 4, 6] },
];

const rotate = (g: readonly number[]): number[] => [6, 3, 0, 7, 4, 1, 8, 5, 2].map((i) => g[i]);
const mirror = (g: readonly number[]): number[] => [2, 1, 0, 5, 4, 3, 8, 7, 6].map((i) => g[i]);

const magic = (skill: { id: string }, p: PuzzleGridParams, rng: Rng): Task => {
    let grid = [...LO_SHU];
    for (let i = rng.int(0, 3); i > 0; i -= 1) grid = rotate(grid);
    if (rng.chance(0.5)) grid = mirror(grid);
    const shift = rng.int(0, Math.floor((p.max - 15) / 3));
    grid = grid.map((x) => x + shift);
    const total = 15 + 3 * shift;
    const empty = rng.int(0, 8);
    const answer = grid[empty];
    const full = rng.pick(LINES.filter((l) => !l.cells.includes(empty)));
    const through = rng.pick(LINES.filter((l) => l.cells.includes(empty)));
    const others = through.cells.filter((c) => c !== empty).map((c) => grid[c]);
    const [a, b] = others;
    return {
        skillId: skill.id,
        prompt: pl.tasks.puzzleMagicPrompt,
        speak: pl.tasks.puzzleMagicSpeak,
        visual: { kind: 'cells', layout: 'square3', values: grid.map((x, i) => (i === empty ? null : x)) },
        answer,
        hint: [
            pl.tasks.puzzleMagicHint,
            pl.tasks.puzzleMagicFullLine(full.kind, full.cells.map((c) => grid[c]).join(' + '), total),
            `${total} ${MINUS} ${a} = ${total - a}`,
            `${total - a} ${MINUS} ${b} = ${answer}`,
        ],
    };
};

// Pyramid cells: [top, middle left, middle right, base 0, base 1, base 2]; top = left + right, left = base0 + base1, right = base1 + base2.
const pyramid = (skill: { id: string }, p: PuzzleGridParams, rng: Rng): Task => {
    const cap = Math.min(9, Math.floor(p.max / 3));
    let b: [number, number, number];
    do {
        b = [rng.int(1, cap), rng.int(1, cap), rng.int(1, cap)];
    } while (b[0] + 2 * b[1] + b[2] > p.max);
    const full = [b[0] + 2 * b[1] + b[2], b[0] + b[1], b[1] + b[2], b[0], b[1], b[2]];
    const empty = rng.int(0, 5);
    const answer = full[empty];
    // [parent, partner] for the cells that are found by subtraction; the upper cells are sums.
    const SUBTRACT: Record<number, [number, number] | undefined> = { 3: [1, 4], 4: [1, 3], 5: [2, 4] };
    const SUM: Record<number, [number, number] | undefined> = { 0: [1, 2], 1: [3, 4], 2: [4, 5] };
    const sub = SUBTRACT[empty];
    const sum = SUM[empty];
    const hint: string[] = [pl.tasks.puzzlePyramidHint];
    if (sub) {
        hint.push(pl.tasks.puzzlePyramidBaseHint, `${full[sub[0]]} ${MINUS} ${full[sub[1]]} = ${answer}`);
    } else if (sum) {
        hint.push(`${full[sum[0]]} + ${full[sum[1]]} = ${answer}`);
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.puzzlePyramidPrompt,
        speak: pl.tasks.puzzlePyramidSpeak,
        visual: { kind: 'cells', layout: 'pyramid3', values: full.map((x, i) => (i === empty ? null : x)) },
        answer,
        hint,
    };
};

export const generatePuzzleGrid: Generator = (skill, rng): Task => {
    const p = parsePuzzleGridParams(skill.params);
    return p.variant === 'magic' ? magic(skill, p, rng) : pyramid(skill, p, rng);
};
