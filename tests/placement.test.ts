// Placement by age x month (S-06 phase 1). The oracle is the table of docs/ZADANIA.md section 1
// ("Wybor poziomu na starcie"), typed out below row by row; it is never read from src/data/placement.ts.
import { describe, expect, it } from 'vitest';
import {
    changeStageByParent,
    initialSettings,
    needsPlacement,
    placeByChild,
    placeByParent,
    previousStage,
    proposeStage,
    type PlacedLearner,
    type SessionLearner,
} from '../src/core/placement';
import { placementData } from '../src/data/placement';
import type { StageId } from '../src/core/types';

type Row = readonly [age: number, autumn: StageId, spring: StageId, summer: StageId];
// docs/ZADANIA.md section 1, columns: Wrzesien-styczen | Luty-czerwiec | Lipiec-sierpien
const ZADANIA_TABLE: readonly Row[] = [
    [6, 'E1', 'E1', 'E1'], //  "6 lat"
    [7, 'E1', 'E2', 'E2'], //  "7 lat"
    [8, 'E3', 'E4', 'E4'], //  "8 lat"
    [9, 'E5', 'E6', 'E6'], //  "9 lat"
    [10, 'E6', 'E6', 'E6'], // "10+"
];
// getMonth() values: 0 = January ... 11 = December
const AUTUMN = [8, 9, 10, 11, 0]; // September-January
const SPRING = [1, 2, 3, 4, 5]; //   February-June
const SUMMER = [6, 7]; //            July-August

const cases: { age: number; month: number; expected: StageId }[] = [];
for (const [age, autumn, spring, summer] of ZADANIA_TABLE) {
    for (const m of AUTUMN) cases.push({ age, month: m, expected: autumn });
    for (const m of SPRING) cases.push({ age, month: m, expected: spring });
    for (const m of SUMMER) cases.push({ age, month: m, expected: summer });
}

describe('proposeStage against ZADANIA.md section 1', () => {
    it('covers 5 ages x 12 months', () => {
        expect(cases).toHaveLength(60);
    });

    it.each(cases)('age $age, month $month -> $expected', ({ age, month, expected }) => {
        expect(proposeStage(age, month, placementData)).toBe(expected);
    });

    it('band boundaries: January vs February, June vs July, August vs September (age 8)', () => {
        expect(proposeStage(8, 0, placementData)).toBe('E3'); //  January
        expect(proposeStage(8, 1, placementData)).toBe('E4'); //  February
        expect(proposeStage(8, 5, placementData)).toBe('E4'); //  June
        expect(proposeStage(8, 6, placementData)).toBe('E4'); //  July
        expect(proposeStage(8, 7, placementData)).toBe('E4'); //  August
        expect(proposeStage(8, 8, placementData)).toBe('E3'); //  September
    });

    it('rejects an age outside the buttons and a month outside 0-11', () => {
        expect(() => proposeStage(5, 9, placementData)).toThrow(RangeError);
        expect(() => proposeStage(11, 9, placementData)).toThrow(RangeError);
        expect(() => proposeStage(7.5, 9, placementData)).toThrow(RangeError);
        expect(() => proposeStage(8, -1, placementData)).toThrow(RangeError);
        expect(() => proposeStage(8, 12, placementData)).toThrow(RangeError);
        expect(() => proposeStage(8, 1.5, placementData)).toThrow(RangeError);
    });
});

describe('previousStage', () => {
    it('is the stage one below, null for E1', () => {
        expect(previousStage('E1')).toBeNull();
        expect(previousStage('E2')).toBe('E1');
        expect(previousStage('E3')).toBe('E2');
        expect(previousStage('E6')).toBe('E5');
    });
});

describe('placeByChild', () => {
    it('takes the proposal, no parent override, warm-up when a stage below exists', () => {
        expect(placeByChild(8, 9, placementData)).toEqual({
            age: 8,
            stage: 'E3',
            stageOverriddenByParent: false,
            warmupPending: true,
        });
    });

    it('E1 has no warm-up (nothing below it)', () => {
        expect(placeByChild(7, 9, placementData)).toEqual({
            age: 7,
            stage: 'E1',
            stageOverriddenByParent: false,
            warmupPending: false,
        });
        expect(placeByChild(6, 3, placementData).warmupPending).toBe(false);
    });
});

describe('placeByParent', () => {
    it('confirming the proposal behaves like the child path (warm-up, not overridden)', () => {
        expect(placeByParent(8, 'E3', 9, placementData)).toEqual({
            age: 8,
            stage: 'E3',
            stageOverriddenByParent: false,
            warmupPending: true,
        });
    });

    it('a different stage is an override and skips the warm-up (PRD Open Question 1)', () => {
        expect(placeByParent(8, 'E4', 9, placementData)).toEqual({
            age: 8,
            stage: 'E4',
            stageOverriddenByParent: true,
            warmupPending: false,
        });
        expect(placeByParent(10, 'E3', 9, placementData).stageOverriddenByParent).toBe(true);
    });

    it('confirming a proposed E1 has no warm-up and is not an override', () => {
        expect(placeByParent(7, 'E1', 9, placementData)).toEqual({
            age: 7,
            stage: 'E1',
            stageOverriddenByParent: false,
            warmupPending: false,
        });
    });

    it('rejects an age or month outside the table', () => {
        expect(() => placeByParent(4, 'E3', 9, placementData)).toThrow(RangeError);
        expect(() => placeByParent(8, 'E3', 12, placementData)).toThrow(RangeError);
    });
});

describe('needsPlacement', () => {
    it('is true without a learner and false with one', () => {
        const learner: PlacedLearner = { age: 8, stage: 'E3', stageOverriddenByParent: false, warmupPending: false };
        expect(needsPlacement(null)).toBe(true);
        expect(needsPlacement(learner)).toBe(false);
    });
});

describe('initialSettings', () => {
    it('has no parent choice for auto-read yet', () => {
        expect(initialSettings()).toEqual({ autoRead: null });
    });
});

describe('changeStageByParent', () => {
    const history = [{ skillId: 'E3.s1.a', ok: false, firstTry: false, at: 7 }];
    const unlockedStep = { E1: 0, E2: 0, E3: 3, E4: 0, E5: 0, E6: 0 };
    const mastery = { 'E3.s1.a': 2 };
    const streak = { 'E3.s1.a': 1 };
    const learner: SessionLearner = {
        age: 8,
        stage: 'E3',
        stageOverriddenByParent: false,
        warmupPending: true,
        pendingUnlock: 4,
        weakStreak: 1,
        easedRounds: 2,
        unlockedStep,
        mastery,
        streak,
        history,
    };

    it('moves to the new stage, marks the parent override and drops transient adaptation state', () => {
        const next = changeStageByParent(learner, 'E4');
        expect(next.stage).toBe('E4');
        expect(next.stageOverriddenByParent).toBe(true);
        expect(next.warmupPending).toBe(false);
        expect(next.pendingUnlock).toBeNull();
        expect(next.weakStreak).toBe(0);
        expect(next.easedRounds).toBe(0);
    });

    it('keeps age, unlocks, mastery, streak and history', () => {
        const next = changeStageByParent(learner, 'E4');
        expect(next.age).toBe(8);
        expect(next.unlockedStep).toBe(unlockedStep);
        expect(next.mastery).toBe(mastery);
        expect(next.streak).toBe(streak);
        expect(next.history).toBe(history);
    });

    it('works for a move down as well and always marks the override', () => {
        const next = changeStageByParent(learner, 'E1');
        expect(next.stage).toBe('E1');
        expect(next.stageOverriddenByParent).toBe(true);
    });

    it('returns the same object for the same stage, so the scene does not interrupt the round', () => {
        expect(changeStageByParent(learner, 'E3')).toBe(learner);
    });

    it('does not mutate a frozen input', () => {
        const frozen = Object.freeze({ ...learner });
        expect(() => changeStageByParent(frozen, 'E5')).not.toThrow();
        expect(frozen.stage).toBe('E3');
        expect(frozen.pendingUnlock).toBe(4);
    });
});
