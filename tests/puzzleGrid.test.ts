import { describe, expect, it } from 'vitest';
import { firstHint } from '../src/core/round/hints';
import { generatePuzzleGrid, parsePuzzleGridParams } from '../src/core/tasks/generators/puzzleGrid';
import { generators, parsers } from '../src/core/tasks/registry';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E3', step: 5, type: 'PUZZLE_GRID', params, answer: 'keypad' });
const MAGIC_30 = skill('E3.5.magic_square_30', { variant: 'magic', max: 30 });
const MAGIC_15 = skill('E3.5.magic_square_15', { variant: 'magic', max: 15 });
const PYRAMID_30 = skill('E3.5.pyramid_30', { variant: 'pyramid', max: 30 });
const PYRAMID_15 = skill('E3.5.pyramid_15', { variant: 'pyramid', max: 15 });

type Cells = { layout: string; values: (number | null)[] };
// The oracle works from the drawing: the answer is whatever makes the lines (bricks) agree.
const cellsOf = (task: { visual?: { kind: string } }, where: string): Cells => {
    const v = task.visual as ({ kind: string } & Cells) | undefined;
    if (v?.kind !== 'cells') throw new Error(`no cells drawing ${where}`);
    return v;
};
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const BRICKS: [number, number, number][] = [[0, 1, 2], [1, 3, 4], [2, 4, 5]]; // top = sum of the two below it

describe('generatePuzzleGrid', () => {
    for (const s of [MAGIC_30, MAGIC_15]) {
        it(`${s.id}: 1000 draws complete a magic square whose rows, columns and diagonals are equal`, () => {
            const max = s.params.max as number;
            const empties = new Set<number>();
            const sums = new Set<number>();
            forEachDraw(generatePuzzleGrid, s, { max }, (task, where) => {
                const c = cellsOf(task, where);
                expect(c.layout, where).toBe('square3');
                expect(task.input ?? 'keypad', where).toBe('keypad');
                expect(c.values.filter((x) => x === null), where).toHaveLength(1);
                const at = c.values.indexOf(null);
                empties.add(at);
                const filled = c.values.map((x, i) => (i === at ? (task.answer as number) : x)) as number[];
                expect(new Set(filled).size, `${where} cells differ`).toBe(9);
                const sum = (line: number[]): number => line.reduce((a, i) => a + filled[i], 0);
                const total = sum(LINES[0]);
                sums.add(total);
                expect(total, where).toBeLessThanOrEqual(max);
                for (const line of LINES) expect(sum(line), `${where} line ${line.join('')}`).toBe(total);
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                expect(firstHint(task), where).not.toBeNull();
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
                // Teacher read (impl review): the numbers subtracted come from the line that holds the gap, so a
                // hint must name that line and its two numbers before the subtractions use them.
                const gapLine = task.hint.findIndex((h) => /z pustym polem/.test(h));
                expect(gapLine, `${where} names the line with the gap`).toBeGreaterThan(0);
                const subtracted = task.hint.slice(gapLine + 1).map((h) => /− (\d+) =/.exec(h)?.[1]).filter((x) => x !== undefined);
                expect(subtracted, where).toHaveLength(2);
                for (const n of subtracted) expect(task.hint[gapLine], where).toMatch(new RegExp(`\\b${n}\\b`));
            });
            expect(empties.size, 'empty cell varies').toBe(9);
            if (max >= 30) expect(sums.size, 'totals vary').toBeGreaterThan(2);
        });
    }

    for (const s of [PYRAMID_30, PYRAMID_15]) {
        it(`${s.id}: 1000 draws complete a pyramid where each brick is the sum of the two under it`, () => {
            const max = s.params.max as number;
            const empties = new Set<number>();
            forEachDraw(generatePuzzleGrid, s, { max }, (task, where) => {
                const c = cellsOf(task, where);
                expect(c.layout, where).toBe('pyramid3');
                expect(c.values.filter((x) => x === null), where).toHaveLength(1);
                const at = c.values.indexOf(null);
                empties.add(at);
                const filled = c.values.map((x, i) => (i === at ? (task.answer as number) : x)) as number[];
                for (const [top, a, b] of BRICKS) expect(filled[top], `${where} brick ${top}`).toBe(filled[a] + filled[b]);
                expect(Math.max(...filled), where).toBeLessThanOrEqual(max);
                expect(Math.min(...filled), where).toBeGreaterThanOrEqual(1);
                expect(task.answer as number, where).toBeGreaterThan(0);
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
                expect(firstHint(task), where).not.toBeNull();
            });
            expect(empties.size, 'empty brick varies').toBe(6);
        });
    }

    it('rejects a max outside 15..30 and an unknown variant', () => {
        expect(() => parsePuzzleGridParams({ variant: 'magic', max: 14 })).toThrow(/max/);
        expect(() => parsePuzzleGridParams({ variant: 'magic', max: 31 })).toThrow(/max/);
        expect(() => parsePuzzleGridParams({ variant: 'magic', max: 20.5 })).toThrow(/max/);
        expect(() => parsePuzzleGridParams({ variant: 'triangle', max: 20 })).toThrow(/variant/);
        expect(parsePuzzleGridParams({ variant: 'pyramid', max: 15 })).toEqual({ variant: 'pyramid', max: 15 });
    });

    it('is registered with its parser under PUZZLE_GRID', () => {
        expect(generators.PUZZLE_GRID).toBe(generatePuzzleGrid);
        expect(parsers.PUZZLE_GRID).toBe(parsePuzzleGridParams);
    });
});
