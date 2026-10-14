// Origin: S-07 phase 4. End-of-round rules, typed from the plan (docs/ZADANIA.md section 1, PRD FR-014):
// a step unlocks when at least ceil(0.5 * n) of its playable skills have mastery >= 4 (decision 3: 1 of 2, 1 of 3 no /
// 2 of 3 yes, 3 of 5); one step per round; two rounds in a row with < 3 first-try answers ease the next two rounds with
// weights 20/50/30; a warm-up only records mastery; unlocking still works during easing (decision 5).
import { describe, expect, it } from 'vitest';
import { endRound, roundWeights, type EasingRules, type RoundResult } from '../src/core/curriculum';
import type { MasteryRules } from '../src/core/mastery';
import { playable } from '../src/core/round/pick';
import type { Adaptation, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';

const CURRICULUM = { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 };
const MASTERY: MasteryRules = { max: 5, unlockAt: 4, streakForGain: 3, gain: 1, historyLength: 200 };
const EASING: EasingRules = { weakBelow: 3, weakRounds: 2, rounds: 2, weights: { current: 20, earlier: 50, previous: 30 } };
const RULES = { curriculum: CURRICULUM, mastery: MASTERY, easing: EASING };

const stage = (id: StageId): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(`no stage ${id}`);
    return s;
};
const skillIds = (id: StageId, step: number): string[] =>
    stage(id).steps.filter((s) => s.step === step).flatMap((s) => s.skills.filter(playable).map((k) => k.id));
const learner = (id: StageId, unlocked: number, mastery: Record<string, number> = {}): Adaptation => ({
    unlockedStep: { E1: 1, E2: 1, E3: 1, E4: 1, E5: 1, E6: 1, [id]: unlocked },
    mastery,
    streak: {},
    history: [],
    weakStreak: 0,
    easedRounds: 0,
});
const masteryOf = (ids: string[], values: number[]): Record<string, number> => Object.fromEntries(ids.map((k, i) => [k, values[i] ?? 0]));
// A round of five answers on skill `skillId` with `firsts` first-try answers and the rest on the second try.
const round = (skillId: string, firsts: number): RoundResult[] =>
    Array.from({ length: 5 }, (_, i) => ({ skillId, outcome: (i < firsts ? 'first' : 'second') }));
const threeFirsts = (skillId: string): RoundResult[] => Array.from({ length: 3 }, () => ({ skillId, outcome: 'first' }));
const end = (a: Adaptation, id: StageId, firsts: number, kind: 'round' | 'warmup' = 'round', skillId = 'none') =>
    endRound(a, stage(id), round(skillId, firsts), 1, kind, RULES);

describe('unlocking a step', () => {
    it('data pin: the step sizes the cases below rely on', () => {
        expect(skillIds('E3', 1)).toHaveLength(2);
        expect(skillIds('E3', 10)).toHaveLength(3);
        expect(skillIds('E4', 6)).toHaveLength(5);
        expect(skillIds('E2', 1)).toHaveLength(2);
        expect(skillIds('E5', 4)).toHaveLength(3);
    });

    it('step with 2 skills: 1 of 2 at mastery 4 unlocks the next playable step', () => {
        const ids = skillIds('E3', 1);
        const r = end(learner('E3', 1, masteryOf(ids, [4, 0])), 'E3', 5);
        expect(r.unlocked).toBe(2);
        expect(r.adaptation.unlockedStep.E3).toBe(2);
    });

    it('step with 2 skills: 0 of 2 does not unlock', () => {
        const ids = skillIds('E3', 1);
        const r = end(learner('E3', 1, masteryOf(ids, [3, 3])), 'E3', 5);
        expect(r.unlocked).toBeNull();
        expect(r.adaptation.unlockedStep.E3).toBe(1);
    });

    it('step with 1 skill: that skill at 4 unlocks', () => {
        const ids = skillIds('E2', 3);
        expect(ids).toHaveLength(1);
        expect(end(learner('E2', 3, masteryOf(ids, [4])), 'E2', 5).unlocked).toBe(4);
        expect(end(learner('E2', 3, masteryOf(ids, [3])), 'E2', 5).unlocked).toBeNull();
    });

    it('step with 3 skills: 1 of 3 does not unlock, 2 of 3 does', () => {
        const ids = skillIds('E3', 10);
        expect(end(learner('E3', 10, masteryOf(ids, [4, 0, 0])), 'E3', 5).unlocked).toBeNull();
        const two = end(learner('E3', 10, masteryOf(ids, [4, 5, 0])), 'E3', 5);
        expect(two.unlocked).toBe(11);
    });

    it('step with 5 skills: 2 of 5 does not unlock, 3 of 5 does (next playable step 7)', () => {
        const ids = skillIds('E4', 6);
        expect(end(learner('E4', 6, masteryOf(ids, [4, 4, 3, 0, 0])), 'E4', 5).unlocked).toBeNull();
        const three = end(learner('E4', 6, masteryOf(ids, [4, 4, 5, 0, 0])), 'E4', 5);
        expect(three.unlocked).toBe(7);
    });

    it('skips unplayable steps: E2 step 1 leads to step 2 now, E1 step 7 to step 8, and E1 step 1 is the only gap left at the start', () => {
        const e2 = skillIds('E2', 1);
        expect(end(learner('E2', 1, masteryOf(e2, [4, 4])), 'E2', 5).unlocked).toBe(2);
        const e1 = skillIds('E1', 7);
        expect(end(learner('E1', 7, masteryOf(e1, [4, 4, 4])), 'E1', 5).unlocked).toBe(8);
        const e6 = skillIds('E6', 1);
        expect(end(learner('E6', 1, masteryOf(e6, [4, 4, 4, 4])), 'E6', 5).unlocked).toBe(3); // E6 step 2 has no playable skill (E6.3 became playable in S-13b)
    });

    it('the last playable step has nothing to unlock', () => {
        const ids = skillIds('E3', 11);
        const r = end(learner('E3', 11, masteryOf(ids, [5, 5])), 'E3', 5);
        expect(r.unlocked).toBeNull();
        expect(r.adaptation.unlockedStep.E3).toBe(11);
    });

    it('uses the mastery after this round: 3 + a run of three right answers reaches 4', () => {
        const ids = skillIds('E2', 3);
        const a = { ...learner('E2', 3, masteryOf(ids, [3])), streak: { [ids[0]]: 0 } };
        const r = endRound(a, stage('E2'), threeFirsts(ids[0]), 1, 'round', RULES);
        expect(r.adaptation.mastery[ids[0]]).toBe(4);
        expect(r.unlocked).toBe(4);
    });

    it('unlocks one step per round even when the next one is also ready', () => {
        const a = learner('E3', 1, { ...masteryOf(skillIds('E3', 1), [5, 5]), ...masteryOf(skillIds('E3', 2), [5, 5]) });
        const r = end(a, 'E3', 5);
        expect(r.unlocked).toBe(2);
        expect(r.adaptation.unlockedStep.E3).toBe(2);
    });

    it('an unplayable unlocked step is judged by the nearest lower playable step', () => {
        // E6 step 2 has no playable skill: it is judged by step 1 (3 skills, 2 at mastery 4 are enough), and step 3 follows.
        const ids = skillIds('E6', 1);
        expect(ids.length).toBeGreaterThanOrEqual(2);
        const r = end(learner('E6', 2, masteryOf(ids, [4, 4, 4])), 'E6', 5);
        expect(r.unlocked).toBe(3);
    });
});

describe('easing after weak rounds', () => {
    it('two weak rounds in a row set easedRounds to 2 and restart the weak counter', () => {
        const one = end(learner('E3', 1), 'E3', 2);
        expect(one.adaptation.weakStreak).toBe(1);
        expect(one.adaptation.easedRounds).toBe(0);
        const two = end(one.adaptation, 'E3', 0);
        expect(two.adaptation.easedRounds).toBe(2);
        expect(two.adaptation.weakStreak).toBe(0);
    });

    it('3 right on the first try is not weak; 2 is', () => {
        expect(end(learner('E3', 1), 'E3', 3).adaptation.weakStreak).toBe(0);
        expect(end(learner('E3', 1), 'E3', 2).adaptation.weakStreak).toBe(1);
    });

    it('weak, good, weak does not ease', () => {
        let a = end(learner('E3', 1), 'E3', 1).adaptation;
        a = end(a, 'E3', 5).adaptation;
        expect(a.weakStreak).toBe(0);
        a = end(a, 'E3', 1).adaptation;
        expect(a.weakStreak).toBe(1);
        expect(a.easedRounds).toBe(0);
    });

    it('the two eased rounds count down to 0 and then the normal weights return', () => {
        let a = { ...learner('E3', 1), easedRounds: 2 };
        expect(roundWeights(a, RULES)).toEqual({ current: 20, earlier: 50, previous: 30 });
        a = end(a, 'E3', 5).adaptation;
        expect(a.easedRounds).toBe(1);
        expect(roundWeights(a, RULES)).toEqual({ current: 20, earlier: 50, previous: 30 });
        a = end(a, 'E3', 5).adaptation;
        expect(a.easedRounds).toBe(0);
        expect(roundWeights(a, RULES)).toEqual({ current: 60, earlier: 30, previous: 10 });
    });

    it('a warm-up records mastery only: no weak streak, easing or unlocking', () => {
        const ids = skillIds('E3', 1);
        const a = { ...learner('E3', 1, masteryOf(ids, [4, 4])), weakStreak: 1, easedRounds: 1 };
        const r = endRound(a, stage('E3'), [{ skillId: ids[0], outcome: 'second' }], 1, 'warmup', RULES);
        expect(r.unlocked).toBeNull();
        expect(r.adaptation.unlockedStep.E3).toBe(1);
        expect(r.adaptation.weakStreak).toBe(1);
        expect(r.adaptation.easedRounds).toBe(1);
        expect(r.adaptation.mastery[ids[0]]).toBe(4); // a miss never lowers mastery
        expect(r.adaptation.streak[ids[0]]).toBe(0); // the warm-up result was recorded
        expect(r.adaptation.history.at(-1)).toMatchObject({ skillId: ids[0], firstTry: false });
    });

    it('a step can unlock during easing, and the easing counter still goes down', () => {
        const ids = skillIds('E3', 1);
        const a = { ...learner('E3', 1, masteryOf(ids, [4, 0])), easedRounds: 2 };
        const r = end(a, 'E3', 5);
        expect(r.unlocked).toBe(2);
        expect(r.adaptation.easedRounds).toBe(1);
    });
});

describe('balance pins the plan numbers', () => {
    it('easing and curriculum data equal the rule', () => {
        expect(balance.easing).toEqual(EASING);
        expect(balance.curriculum).toEqual(CURRICULUM);
        expect(balance.mastery.unlockAt).toBe(4);
    });
});
