import { describe, expect, it } from 'vitest';
import { firstHint } from '../src/core/round/hints';
import { generateGrid, parseGridParams } from '../src/core/tasks/generators/grid';
import { generators, parsers } from '../src/core/tasks/registry';
import type { SkillDef } from '../src/core/types';
import { GRID_ITEMS } from '../src/data/gridItems';
import { forEachDraw } from './helpers';

const skill = (id: string, variant: string): SkillDef => ({ id, stage: 'E3', step: 7, type: 'GRID', params: { variant }, answer: 'tiles' });
const WHERE = skill('E3.7.grid_where', 'where');
const WHAT = skill('E3.7.grid_what', 'what');

type Grid = { kind: string; columns: number; rows: number; items: { item: string; col: number; row: number }[] };
const gridOf = (task: { visual?: { kind: string } }, where: string): Grid => {
    const v = task.visual as Grid | undefined;
    if (v?.kind !== 'grid') throw new Error(`no grid drawing ${where}`);
    return v;
};
const nounOf = (id: string): string => GRID_ITEMS.find((g) => g.id === id)?.noun ?? id;
const labelOf = (col: number, row: number): string => `${String.fromCharCode(65 + col)}${row + 1}`;
// Reads a tile "C2" back to a cell, or null when the tile is not a valid cell label (for example "2C").
const cellOf = (tile: string, g: Grid): [number, number] | null => {
    const m = /^([A-Z])(\d)$/.exec(tile);
    if (!m) return null;
    const col = m[1].charCodeAt(0) - 65;
    const row = Number(m[2]) - 1;
    return col < g.columns && row < g.rows ? [col, row] : null;
};

describe('generateGrid', () => {
    it('where: the answer is the label of the cell of the asked item and no other tile points at it', () => {
        const items = new Set<number>();
        forEachDraw(generateGrid, WHERE, {}, (task, where) => {
            const g = gridOf(task, where);
            expect(task.input ?? 'tiles', where).toBe('tiles');
            expect([g.columns, g.rows], where).toEqual([5, 4]);
            expect(g.items.length, where).toBeGreaterThanOrEqual(3);
            expect(g.items.length, where).toBeLessThanOrEqual(4);
            expect(new Set(g.items.map((i) => i.item)).size, `${where} distinct items`).toBe(g.items.length);
            const asked = g.items.filter((i) => task.prompt.includes(nounOf(i.item)));
            expect(asked, `${where} one item asked`).toHaveLength(1);
            items.add(g.items.indexOf(asked[0]));
            const right = labelOf(asked[0].col, asked[0].row);
            expect(task.answer, where).toBe(right);
            const tiles = task.choices as string[];
            expect(tiles.length, where).toBeGreaterThanOrEqual(3);
            expect(tiles.length, where).toBeLessThanOrEqual(4);
            for (const t of tiles) {
                if (t === right) continue;
                const cell = cellOf(t, g);
                const holder = cell ? g.items.find((i) => i.col === cell[0] && i.row === cell[1]) : undefined;
                expect(holder?.item, `${where} distractor ${t} holds the asked item`).not.toBe(asked[0].item);
                expect(t, `${where} distractor ${t}`).not.toBe(right);
            }
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(right);
            expect(firstHint(task), where).not.toBeNull();
        });
        expect(items.size, 'asked item varies').toBeGreaterThan(2);
    });

    it('what: the answer is the noun of the item on the asked cell, taken from the grid', () => {
        forEachDraw(generateGrid, WHAT, {}, (task, where) => {
            const g = gridOf(task, where);
            const m = /([A-E])([1-4])/.exec(task.prompt);
            expect(m, `${where} prompt names a cell`).not.toBeNull();
            const holder = g.items.find((i) => i.col === (m?.[1] ?? 'A').charCodeAt(0) - 65 && i.row === Number(m?.[2]) - 1);
            expect(holder, `${where} an item lies on the asked cell`).toBeDefined();
            expect(task.answer, where).toBe(nounOf(holder?.item ?? ''));
            const tiles = task.choices as string[];
            expect(tiles.length, where).toBe(g.items.length);
            expect([...tiles].sort(), where).toEqual(g.items.map((i) => nounOf(i.item)).sort());
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('rejects an unknown variant and is registered under GRID', () => {
        expect(() => parseGridParams({ variant: 'both' })).toThrow(/variant/);
        expect(() => parseGridParams({})).toThrow(/variant/);
        expect(parseGridParams({ variant: 'what' })).toEqual({ variant: 'what' });
        expect(generators.GRID).toBe(generateGrid);
        expect(parsers.GRID).toBe(parseGridParams);
    });
});
