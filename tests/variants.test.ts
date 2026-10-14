import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { afterRound, nextRoundKind, pickPuzzle, variantRules, variantTitle, type ScheduleContext } from '../src/core/variants';
import type { VariantState } from '../src/core/types';
import { balance } from '../src/data/balance';

const fresh = (): VariantState => ({ roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] });
const ctx = (over: Partial<ScheduleContext> = {}): ScheduleContext => ({
    stageId: 'E3',
    today: '2026-10-14',
    hasPool: (id) => id === 'E3' || id === 'E4',
    minigames: ['word', 'dice'],
    wordAvailable: true,
    rules: { everyRounds: 3 },
    ...over,
});
const due = (over: Partial<VariantState> = {}): VariantState => ({ ...fresh(), roundsSince: 3, ...over });

describe('nextRoundKind', () => {
    it('plays ordinary rounds until the counter reaches the interval, then a variant', () => {
        expect(nextRoundKind({ ...fresh(), roundsSince: 2 }, ctx())).toBe('round');
        expect(nextRoundKind(due(), ctx())).not.toBe('round');
    });
    it('offers the daily puzzle once per local day, for a later or an earlier day alike', () => {
        expect(nextRoundKind(due(), ctx())).toBe('puzzle');
        expect(nextRoundKind(due({ puzzleDay: '2026-10-14' }), ctx())).toBe('word');
        expect(nextRoundKind(due({ puzzleDay: '2026-10-15' }), ctx())).toBe('puzzle');
        expect(nextRoundKind(due({ puzzleDay: '2026-10-13' }), ctx())).toBe('puzzle');
    });
    it('alternates minigames and falls back when one is unavailable', () => {
        const s = due({ puzzleDay: '2026-10-14' });
        expect(nextRoundKind({ ...s, lastMinigame: 'word' }, ctx())).toBe('dice');
        expect(nextRoundKind({ ...s, lastMinigame: 'dice' }, ctx())).toBe('word');
        expect(nextRoundKind({ ...s, lastMinigame: 'dice' }, ctx({ wordAvailable: false }))).toBe('dice');
    });
    it('a stage without a pool gets a minigame; no candidate means an ordinary round', () => {
        expect(nextRoundKind(due(), ctx({ stageId: 'E1' }))).toBe('word');
        expect(nextRoundKind(due(), ctx({ stageId: 'E1', minigames: [] }))).toBe('round');
        expect(nextRoundKind(due({ puzzleDay: '2026-10-14', lastMinigame: 'word' }), ctx({ minigames: ['word'] }))).toBe('word');
    });
    it('the e2e seam: off keeps ordinary rounds, a forced kind ignores the counter but obeys the day rule', () => {
        expect(nextRoundKind(due(), ctx({ forced: 'off' }))).toBe('round');
        expect(nextRoundKind(fresh(), ctx({ forced: 'dice' }))).toBe('dice');
        expect(nextRoundKind(fresh(), ctx({ forced: 'puzzle' }))).toBe('puzzle');
        expect(nextRoundKind(fresh(), ctx({ forced: 'puzzle', stageId: 'E1' }))).not.toBe('puzzle');
        expect(nextRoundKind({ ...fresh(), puzzleDay: '2026-10-14' }, ctx({ forced: 'puzzle' }))).not.toBe('puzzle');
        expect(nextRoundKind(fresh(), ctx({ forced: 'word', wordAvailable: false }))).toBe('dice');
    });
    it('does not change the state it reads', () => {
        const s = due();
        nextRoundKind(s, ctx());
        expect(s.roundsSince).toBe(3);
    });
});

describe('afterRound', () => {
    it('an ordinary round counts, a finished variant resets the counter', () => {
        expect(afterRound(fresh(), 'round', '2026-10-14').roundsSince).toBe(1);
        expect(afterRound(due(), 'dice', '2026-10-14')).toMatchObject({ roundsSince: 0, lastMinigame: 'dice', puzzleDay: null });
    });
    it('a puzzle records the day and the id; a full cycle restarts with the last id', () => {
        const a = afterRound(due(), 'puzzle', '2026-10-14', { id: 'p1', poolIds: ['p1', 'p2'] });
        expect(a).toMatchObject({ roundsSince: 0, puzzleDay: '2026-10-14', puzzlesDone: ['p1'], lastMinigame: null });
        const b = afterRound(due({ puzzlesDone: ['p1'] }), 'puzzle', '2026-10-15', { id: 'p2', poolIds: ['p1', 'p2'] });
        expect(b.puzzlesDone).toEqual(['p2']);
    });
    it('keeps unknown ids and returns a new object', () => {
        const s = due({ puzzlesDone: ['old'] });
        const r = afterRound(s, 'puzzle', '2026-10-14', { id: 'p1', poolIds: ['p1', 'p2'] });
        expect(r.puzzlesDone).toEqual(['old', 'p1']);
        expect(r).not.toBe(s);
        expect(s.puzzlesDone).toEqual(['old']);
    });
});

describe('pickPuzzle', () => {
    const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    it('never repeats inside a cycle and restarts when all are done', () => {
        const done: string[] = [];
        for (let i = 0; i < 3; i += 1) {
            const p = pickPuzzle(pool, done, createRng(i + 1));
            expect(done).not.toContain(p.id);
            done.push(p.id);
        }
        expect(pool.map((p) => p.id)).toContain(pickPuzzle(pool, done, createRng(9)).id);
    });
    it('ignores unknown done ids', () => {
        expect(pickPuzzle(pool, ['zzz', 'a', 'b'], createRng(1)).id).toBe('c');
    });
});

describe('variantRules', () => {
    it('the daily puzzle: one task, double stars, no bonus', () => {
        expect(variantRules('puzzle', 1, balance)).toEqual({ length: 1, starPerTask: 2, cleanRoundBonus: 0 });
    });
    it('a minigame: n tasks, one star each, no bonus', () => {
        expect(variantRules('dice', 13, balance)).toEqual({ length: 13, starPerTask: 1, cleanRoundBonus: 0 });
    });
});

describe('variantTitle', () => {
    const words = { diceTitle: 'D', wordTitle: 'W', puzzleTitle: 'P', puzzleBadge: 'x2' };
    it('names each variant and badges only the doubled-stars puzzle', () => {
        expect(variantTitle('puzzle', words)).toEqual({ text: 'P', badge: 'x2' });
        expect(variantTitle('dice', words)).toEqual({ text: 'D', badge: null });
        expect(variantTitle('word', words)).toEqual({ text: 'W', badge: null });
    });
    it('has no title for an ordinary round', () => {
        expect(variantTitle('round', words)).toBeNull();
    });
});
