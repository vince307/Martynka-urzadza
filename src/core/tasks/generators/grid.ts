// GRID: read a square grid with lettered columns and numbered rows (ZADANIA.md, section 4, E3.7). Variants: `where`
// ("Na którym polu leży serce?", tiles such as "C2") and `what` ("Co leży na polu B3?", tiles with the item names).
import { GRID_ITEMS, type GridItemId } from '../../../data/gridItems';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import type { Generator, Task } from '../types';

export type GridVariant = 'where' | 'what';

export interface GridParams {
    variant: GridVariant;
}

const VARIANTS: readonly GridVariant[] = ['where', 'what'];
const COLUMNS = 5;
const ROWS = 4;

export const parseGridParams = (params: Record<string, unknown>): GridParams => {
    const { variant } = params;
    if (!VARIANTS.includes(variant as GridVariant)) {
        throw new TypeError(`GRID params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    }
    return { variant: variant as GridVariant };
};

const label = (col: number, row: number): string => `${String.fromCharCode(65 + col)}${row + 1}`;
const nounOf = (id: GridItemId): string => GRID_ITEMS.find((g) => g.id === id)?.noun ?? id;

export const generateGrid: Generator = (skill, rng: Rng): Task => {
    const p = parseGridParams(skill.params);
    const count = rng.int(3, 4);
    const ids = rng.shuffle(GRID_ITEMS.map((g) => g.id)).slice(0, count);
    const cells = rng.shuffle(Array.from({ length: COLUMNS * ROWS }, (_, i) => i)).slice(0, count);
    const items = ids.map((item, i) => ({ item, col: cells[i] % COLUMNS, row: Math.floor(cells[i] / COLUMNS) }));
    const visual = { kind: 'grid' as const, columns: COLUMNS, rows: ROWS, items };
    const asked = rng.pick(items);
    const name = nounOf(asked.item);
    const right = label(asked.col, asked.row);

    if (p.variant === 'what') {
        return {
            skillId: skill.id,
            prompt: pl.tasks.gridWhatPrompt(right),
            visual,
            answer: name,
            choices: rng.shuffle(items.map((i) => nounOf(i.item))),
            hint: [pl.tasks.gridHint, pl.tasks.gridCellHint(right, asked.col, asked.row), pl.tasks.gridWhatAnswerHint(right, name)],
        };
    }
    const near: string[] = [];
    if (asked.col > 0) near.push(label(asked.col - 1, asked.row));
    if (asked.col < COLUMNS - 1) near.push(label(asked.col + 1, asked.row));
    if (asked.row > 0) near.push(label(asked.col, asked.row - 1));
    if (asked.row < ROWS - 1) near.push(label(asked.col, asked.row + 1));
    near.push(`${asked.row + 1}${String.fromCharCode(65 + asked.col)}`); // the digit before the letter
    const wrong = rng.shuffle(near).slice(0, rng.int(2, 3));
    return {
        skillId: skill.id,
        prompt: pl.tasks.gridWherePrompt(name),
        visual,
        answer: right,
        choices: rng.shuffle([right, ...wrong]),
        hint: [pl.tasks.gridHint, pl.tasks.gridCellHint(right, asked.col, asked.row), pl.tasks.gridWhereAnswerHint(right)],
    };
};
