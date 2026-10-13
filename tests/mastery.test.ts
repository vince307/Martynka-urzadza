// Origin: S-07 phase 1. Rule from docs/ZADANIA.md section 1 and PRD FR-014: mastery 0..5 per skill, counted from the
// first try only; 3 correct first tries in a row = +1, a miss on the first try resets the streak and never lowers mastery (maintainer decision H-7, 2026-10-13). The numbers below are the rule,
// not read from the implementation; one test pins balance.mastery to the same rule.
import { describe, expect, it } from 'vitest';
import { balance } from '../src/data/balance';
import { recordRound, type MasteryRules, type SkillResult } from '../src/core/mastery';
import type { Adaptation } from '../src/core/types';
import type { Outcome } from '../src/core/round';
import { createRng } from '../src/core/rng';

const RULES: MasteryRules = { max: 5, unlockAt: 4, streakForGain: 3, gain: 1, historyLength: 200 };

const empty = (): Adaptation => ({ unlockedStep: {} as Adaptation['unlockedStep'], mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds: 0 });
const run = (a: Adaptation, outcomes: (Outcome | null)[], skillId = 'S', at = 1): Adaptation =>
    recordRound(a, outcomes.map((outcome): SkillResult => ({ skillId, outcome })), at, RULES);

describe('recordRound mastery', () => {
    it('raises mastery by one after three correct first tries in a row', () => {
        const a = run(empty(), ['first', 'first', 'first']);
        expect(a.mastery.S).toBe(1);
        expect(a.streak.S).toBe(0);
    });

    it('keeps a partial streak below three without a gain', () => {
        const a = run(empty(), ['first', 'first']);
        expect(a.mastery.S ?? 0).toBe(0);
        expect(a.streak.S).toBe(2);
    });

    it('keeps mastery and resets the streak after a second-try answer', () => {
        const start = { ...empty(), mastery: { S: 3 }, streak: { S: 2 } };
        const a = run(start, ['second']);
        expect(a.mastery.S).toBe(3);
        expect(a.streak.S).toBe(0);
    });

    it('keeps mastery and resets the streak after a retype as well', () => {
        const a = run({ ...empty(), mastery: { S: 2 }, streak: { S: 2 } }, ['retype']);
        expect(a.mastery.S).toBe(2);
        expect(a.streak.S).toBe(0);
    });

    it('never lowers mastery over random outcome sequences', () => {
        for (let seed = 1; seed <= 20; seed++) {
            const rng = createRng(seed);
            let a: Adaptation = { ...empty(), mastery: { S: rng.int(0, 5) } };
            for (let i = 0; i < 40; i++) {
                const before = a.mastery.S ?? 0;
                a = run(a, [rng.pick<Outcome>(['first', 'first', 'second', 'retype'])]);
                expect(a.mastery.S ?? 0, `seed ${seed} step ${i}`).toBeGreaterThanOrEqual(before);
            }
        }
    });

    it('never raises mastery on a second-try answer', () => {
        const a = run(empty(), ['second', 'second', 'second', 'second', 'second', 'second']);
        expect(a.mastery.S ?? 0).toBe(0);
    });

    it('does not go below 0 or above 5', () => {
        expect(run(empty(), ['second', 'retype']).mastery.S).toBe(0);
        expect(run({ ...empty(), mastery: { S: 5 } }, ['second']).mastery.S).toBe(5);
        const top = run({ ...empty(), mastery: { S: 5 } }, ['first', 'first', 'first']);
        expect(top.mastery.S).toBe(5);
    });

    it('needs the streak to start over after a gain: six in a row give +2, not +3', () => {
        expect(run(empty(), Array<Outcome>(6).fill('first')).mastery.S).toBe(2);
    });

    it('reaches 4 after twelve correct first tries from 0', () => {
        expect(run(empty(), Array<Outcome>(12).fill('first')).mastery.S).toBe(4);
    });

    it('skips unplayed tasks without touching mastery, streak or history', () => {
        const a = run(empty(), [null, null]);
        expect(a.mastery).toEqual({});
        expect(a.streak).toEqual({});
        expect(a.history).toEqual([]);
    });

    it('tracks each skill on its own', () => {
        const a = recordRound(empty(), [
            { skillId: 'A', outcome: 'first' }, { skillId: 'B', outcome: 'second' }, { skillId: 'A', outcome: 'first' }, { skillId: 'A', outcome: 'first' },
        ], 1, RULES);
        expect(a.mastery.A).toBe(1);
        expect(a.mastery.B ?? 0).toBe(0);
    });
});

describe('recordRound history', () => {
    it('records ok and firstTry per outcome with the given time', () => {
        const a = recordRound(empty(), [
            { skillId: 'S', outcome: 'first' }, { skillId: 'S', outcome: 'second' }, { skillId: 'S', outcome: 'retype' },
        ], 42, RULES);
        expect(a.history).toEqual([
            { skillId: 'S', ok: true, firstTry: true, at: 42 },
            { skillId: 'S', ok: true, firstTry: false, at: 42 },
            { skillId: 'S', ok: false, firstTry: false, at: 42 },
        ]);
    });

    it('keeps only the last 200 entries, dropping the oldest', () => {
        let a = empty();
        for (let i = 0; i < 45; i++) a = run(a, Array<Outcome>(5).fill('first'), 'S', i);
        expect(a.history).toHaveLength(200);
        expect(a.history[0].at).toBe(5);
        expect(a.history[199].at).toBe(44);
    });
});

describe('recordRound mistake examples', () => {
    const example = { prompt: '7 + 5', given: 11, answer: 12 };

    it('stores the example of a second-try or retyped miss in the entry', () => {
        const a = recordRound(empty(), [
            { skillId: 'S', outcome: 'second', example }, { skillId: 'S', outcome: 'retype', example },
        ], 3, RULES);
        expect(a.history).toEqual([
            { skillId: 'S', ok: true, firstTry: false, at: 3, example },
            { skillId: 'S', ok: false, firstTry: false, at: 3, example },
        ]);
    });

    it('never stores an example on a first-try entry', () => {
        const a = recordRound(empty(), [{ skillId: 'S', outcome: 'first', example }], 3, RULES);
        expect(a.history).toEqual([{ skillId: 'S', ok: true, firstTry: true, at: 3 }]);
        expect('example' in a.history[0]).toBe(false);
    });

    it('trimming the history drops the example with its entry and keeps 200', () => {
        let a = recordRound(empty(), [{ skillId: 'S', outcome: 'second', example }], 0, RULES);
        for (let i = 1; i <= 40; i++) a = run(a, Array<Outcome>(5).fill('first'), 'S', i);
        expect(a.history).toHaveLength(200);
        expect(a.history.some((h) => h.example !== undefined)).toBe(false);
    });

    it('keeps mastery and streak the same with or without an example', () => {
        const plain = recordRound(empty(), [{ skillId: 'S', outcome: 'second' }], 1, RULES);
        const withExample = recordRound(empty(), [{ skillId: 'S', outcome: 'second', example }], 1, RULES);
        expect(withExample.mastery).toEqual(plain.mastery);
        expect(withExample.streak).toEqual(plain.streak);
    });
});

describe('recordRound purity', () => {
    it('does not mutate a frozen input', () => {
        const frozen: Adaptation = Object.freeze({
            unlockedStep: Object.freeze({}) as Adaptation['unlockedStep'], mastery: Object.freeze({ S: 1 }), streak: Object.freeze({ S: 2 }),
            history: Object.freeze([]) as unknown as Adaptation['history'], weakStreak: 0, easedRounds: 0,
        });
        const a = run(frozen, ['first']);
        expect(a.mastery.S).toBe(2);
        expect(frozen.mastery.S).toBe(1);
        expect(frozen.streak.S).toBe(2);
    });
});

describe('balance.mastery', () => {
    it('holds the rule values of the PRD', () => {
        expect(balance.mastery).toEqual(RULES);
    });
});
