// Origin: S-15 phase 6. "Zakrywanka" board: 13 throws, results 0..12 once each, subtraction never negative,
// the whole board runs through the real round reducer.
import { describe, expect, it } from 'vitest';
import { coverBoardCells, coveredAfter, diceBoard } from '../src/core/minigames/dice';
import { createRng } from '../src/core/rng';
import { answer, next, startRound } from '../src/core/round';
import { firstHint } from '../src/core/round/hints';
import { validateTask } from '../src/core/tasks/validate';
import { balance } from '../src/data/balance';
import { nouns } from '../src/data/nouns';
import { MINIGAME_LAYOUT, TASK_LAYOUT } from '../src/data/layout';
import { pl } from '../src/data/pl';
import { SEEDS } from './helpers';

const rules = balance.variants.dice;
const text = {
    addHint: pl.minigames.diceAddHint,
    subHint: pl.minigames.diceSubHint,
    addStepHint: pl.minigames.diceAddStepHint,
    subStepHint: pl.minigames.diceSubStepHint,
};
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const boards = (): { seed: number; board: ReturnType<typeof diceBoard> }[] =>
    Array.from({ length: SEEDS * 50 }, (_, i) => ({ seed: i, board: diceBoard(createRng(7000 + i), rules, text) }));

describe('diceBoard', () => {
    it('covers every result 0..12 exactly once, in a random order', () => {
        const orders = new Set<string>();
        for (const { seed, board } of boards()) {
            expect(board.length, `seed ${seed}`).toBe(13);
            expect(board.map((t) => t.target).sort((a, b) => a - b), `seed ${seed}`).toEqual(range(13));
            orders.add(board.map((t) => t.target).join(','));
        }
        expect(orders.size).toBeGreaterThan(100);
    });

    it('builds throws of two dice: sums of 1..6 and never-negative differences', () => {
        for (const { seed, board } of boards()) {
            for (const t of board) {
                const where = `seed ${seed} target ${t.target}`;
                expect(t.a, where).toBeGreaterThanOrEqual(1);
                expect(t.a, where).toBeLessThanOrEqual(6);
                expect(t.b, where).toBeGreaterThanOrEqual(1);
                expect(t.b, where).toBeLessThanOrEqual(6);
                if (t.op === '+') {
                    expect(t.a + t.b, where).toBe(t.target);
                    expect(t.target, where).toBeGreaterThanOrEqual(2);
                } else {
                    expect(t.a - t.b, where).toBe(t.target);
                    expect(t.b, where).toBeLessThanOrEqual(t.a);
                    expect(t.target, where).toBeLessThanOrEqual(5);
                }
                if (t.target <= 1) expect(t.op, where).toBe('-');
                if (t.target >= 6) expect(t.op, where).toBe('+');
            }
        }
    });

    it('makes valid tasks without a drawing, with a teaching first hint', () => {
        for (const { seed, board } of boards()) {
            for (const t of board) {
                const where = `seed ${seed} ${t.task.prompt}`;
                expect(validateTask(t.task, { max: rules.max, nouns }), where).toEqual([]);
                expect(t.task.answer, where).toBe(t.target);
                expect(t.task.visual, where).toBeUndefined();
                expect(t.task.prompt, where).toBe(`${t.a} ${t.op === '+' ? '+' : '−'} ${t.b}`);
                expect(t.task.hint, where).toHaveLength(2);
                expect(t.task.hint[0], where).toBe(t.op === '+' ? text.addHint : text.subHint);
                expect(firstHint(t.task), where).not.toBeNull();
            }
        }
    });

    it('walks the whole board through the round reducer and covers each field as its task finishes', () => {
        const board = diceBoard(createRng(11), rules, text);
        let state = startRound(board.map((t) => t.task), { ...balance.round, length: board.length, cleanRoundBonus: 0 });
        expect(coveredAfter(board, 0)).toEqual([]);
        for (let done = 1; done <= board.length; done += 1) {
            state = next(answer(state, state.tasks[state.index].answer));
            expect(coveredAfter(board, done)).toEqual(board.slice(0, done).map((t) => t.target).sort((a, b) => a - b));
        }
        expect(state.finished).toBe(true);
        expect(state.starsEarned).toBe(13);
        expect(coveredAfter(board, 13)).toEqual(range(13));
    });
});

describe('coverBoardCells', () => {
    const cells = coverBoardCells(MINIGAME_LAYOUT.board, 13);
    const overlap = (a: (typeof cells)[number], b: (typeof cells)[number]): boolean =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

    it('has 13 fields 0..12 in two rows: seven, then six starting at the second column', () => {
        expect(cells.map((c) => c.value)).toEqual(range(13));
        const firstRow = cells.filter((c) => c.y === cells[0].y);
        expect(firstRow).toHaveLength(7);
        const second = cells.filter((c) => c.y !== cells[0].y);
        expect(second).toHaveLength(6);
        expect(second[0].x).toBe(cells[1].x);
        expect(second[5].x).toBe(cells[6].x);
    });

    it('keeps the fields apart, so a tap in the middle of one hits only that field', () => {
        for (const a of cells) {
            for (const b of cells.filter((c) => c.value > a.value)) {
                expect(overlap(a, b), `${a.value} and ${b.value}`).toBe(false);
            }
        }
    });

    // Visual gate S-15: the second row and its shadow touched the hint bar and "Już wiem" under the board.
    it('ends the board, shadow included, a gap above the bar zone', () => {
        const { board } = MINIGAME_LAYOUT;
        const lowest = Math.max(...cells.map((c) => c.y + c.height)) + board.shadow;
        expect(lowest).toBeLessThanOrEqual(TASK_LAYOUT.bar.bottom - TASK_LAYOUT.bar.height - TASK_LAYOUT.solution.bottomGap);
    });

    it('offers every board throw the tile mode with the 13 fields as its choices', () => {
        const board = diceBoard(createRng(3), rules, text);
        for (const t of board) {
            expect(t.task.input).toBe('tiles');
            expect(t.task.choices).toEqual(range(13));
        }
    });
});
