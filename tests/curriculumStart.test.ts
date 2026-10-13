// Origin: S-07 phase 2. Rule D (plan, Critical Implementation Details): the school-calendar floor of the first
// unlocked step. The table below is the plan's stage x month oracle, computed independently of the implementation
// (36 cells verified in the plan review); it is typed here, never read from the code under test.
import { describe, expect, it } from 'vitest';
import { balance } from '../src/data/balance';
import { placementData } from '../src/data/placement';
import { stages } from '../src/data/curriculum';
import { calendarStart, floorToCalendar, playableSteps, startLearning, type CurriculumRules } from '../src/core/curriculum';
import { proposeStage, type SessionLearner } from '../src/core/placement';
import type { StageDef, StageId } from '../src/core/types';

const RULES: CurriculumRules = { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 };
const ALL: StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const stage = (id: StageId): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(`no stage ${id}`);
    return s;
};

// Months are getMonth() values: autumn semester Sep(8) Oct(9) Nov(10) Dec(11) Jan(0); spring Feb(1)..Jun(5).
// The sixth column is "after the semester": the first month past it (Feb, or Jul for the spring stages). For E3 and
// E5 that month belongs to a later calendar stage, so it also exercises the `behind` branch.
const AUTUMN = [8, 9, 10, 11, 0];
const SPRING = [1, 2, 3, 4, 5];
const ORACLE: { id: StageId; age: number; months: number[]; after: number; expected: number[] }[] = [
    { id: 'E1', age: 6, months: AUTUMN, after: 1, expected: [3, 4, 5, 7, 11, 11] },
    { id: 'E2', age: 7, months: SPRING, after: 6, expected: [3, 4, 5, 7, 10, 10] },
    { id: 'E3', age: 8, months: AUTUMN, after: 1, expected: [2, 6, 7, 9, 11, 11] },
    { id: 'E4', age: 8, months: SPRING, after: 6, expected: [2, 2, 4, 6, 8, 8] },
    { id: 'E5', age: 9, months: AUTUMN, after: 1, expected: [2, 3, 6, 8, 10, 11] },
    { id: 'E6', age: 10, months: SPRING, after: 6, expected: [4, 5, 6, 8, 10, 10] },
];

describe('playableSteps', () => {
    it('lists the steps with at least one playable skill, in order, for every real stage', () => {
        expect(playableSteps(stage('E1'))).toEqual([2, 3, 4, 5, 6, 7, 9, 11]);
        expect(playableSteps(stage('E2'))).toEqual([1, 3, 4, 5, 6, 7, 9, 10]);
        expect(playableSteps(stage('E3'))).toEqual([1, 2, 6, 7, 8, 9, 10, 11]);
        expect(playableSteps(stage('E4'))).toEqual([1, 2, 4, 5, 6, 8]);
        expect(playableSteps(stage('E5'))).toEqual([1, 2, 3, 4, 6, 7, 8, 9, 10, 11]);
        expect(playableSteps(stage('E6'))).toEqual([1, 4, 5, 6, 7, 8, 9, 10]);
    });
});

describe('calendarStart (rule D)', () => {
    for (const row of ORACLE) {
        const months = [...row.months, row.after];
        it(`${row.id}: the five months of the semester and the month after it`, () => {
            const got = months.map((m) => calendarStart(stage(row.id), row.age, m, placementData, RULES));
            expect(got).toEqual(row.expected);
        });
    }

    it('uses the calendar stage for the five semester months of every row (oracle sanity)', () => {
        for (const row of ORACLE) {
            for (const m of row.months) expect(proposeStage(row.age, m, placementData)).toBe(row.id);
        }
    });

    it('gives a stage behind the calendar its last playable step', () => {
        expect(calendarStart(stage('E2'), 8, 9, placementData, RULES)).toBe(10); // age 8 in October is E3
        expect(calendarStart(stage('E3'), 10, 9, placementData, RULES)).toBe(11); // age 10 in October is E6
    });

    it('does not start a stage ahead of its semester before minStartSteps playable steps', () => {
        // E4 for age 8 in September: the calendar stage is E3, E4 has no progress yet, the floor is the 2nd playable step.
        expect(calendarStart(stage('E4'), 8, 8, placementData, RULES)).toBe(2);
        expect(calendarStart(stage('E4'), 8, 8, placementData, { ...RULES, minStartSteps: 3 })).toBe(4);
    });

    it('rejects an age or month outside the placement table', () => {
        expect(() => calendarStart(stage('E3'), 5, 9, placementData, RULES)).toThrow(RangeError);
        expect(() => calendarStart(stage('E3'), 8, 12, placementData, RULES)).toThrow(RangeError);
    });
});

describe('startLearning', () => {
    it('opens every stage at its calendar start with empty counters', () => {
        const a = startLearning(stages, 8, 9, placementData, RULES);
        expect(Object.keys(a.unlockedStep).sort()).toEqual(ALL);
        for (const id of ALL) expect(a.unlockedStep[id]).toBe(calendarStart(stage(id), 8, 9, placementData, RULES));
        expect(a.unlockedStep.E3).toBe(6); // October, the oracle row
        expect(a.unlockedStep.E2).toBe(10); // behind
        expect(a.mastery).toEqual({});
        expect(a.streak).toEqual({});
        expect(a.history).toEqual([]);
        expect(a.weakStreak).toBe(0);
        expect(a.easedRounds).toBe(0);
    });
});

describe('balance.save', () => {
    it('pins the autosave debounce to the PRD short delay', () => {
        expect(balance.save.debounceMs).toBe(500);
    });
});

describe('balance.curriculum', () => {
    it('pins the weights, the start floor and the unlock share to the PRD rule', () => {
        expect(balance.curriculum).toEqual(RULES);
    });
});

describe('floorToCalendar (loaded learner, S-11)', () => {
    const base = (unlockedStep: SessionLearner['unlockedStep']): SessionLearner => ({
        age: 8,
        stage: 'E3',
        stageOverriddenByParent: false,
        warmupPending: false,
        ...startLearning(stages, 8, 9, placementData, RULES),
        unlockedStep,
        pendingUnlock: null,
    });
    const calendar = startLearning(stages, 8, 9, placementData, RULES).unlockedStep;

    it('raises a stage saved below the calendar start and leaves higher ones alone', () => {
        const saved = { ...calendar, E3: 1, E4: 11 };
        const out = floorToCalendar(base(saved), stages, 9, placementData, RULES);
        expect(out.unlockedStep.E3).toBe(calendar.E3);
        expect(out.unlockedStep.E4).toBe(11);
        expect(out.unlockedStep.E2).toBe(calendar.E2);
    });

    it('fills a missing stage with the calendar start', () => {
        const rest: Partial<SessionLearner['unlockedStep']> = { ...calendar };
        delete rest.E5;
        const out = floorToCalendar(base(rest as SessionLearner['unlockedStep']), stages, 9, placementData, RULES);
        expect(out.unlockedStep.E5).toBe(calendar.E5);
    });

    it('returns the same object when nothing changes', () => {
        const learner = base({ ...calendar });
        expect(floorToCalendar(learner, stages, 9, placementData, RULES)).toBe(learner);
    });
});
