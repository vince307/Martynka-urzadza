// Where learning starts (S-07, rule D): the first unlocked step of a stage is a floor taken from the school calendar,
// so a child is neither dropped at step 1 of a stage the class is half through nor handed the whole stage with nothing
// left to unlock. Pure: the month is an argument, there is no Date here.
// After S-11 (persistence) the same call gives the floor as max(saved step, calendarStart).
import { proposeStage, type PlacementData } from './placement';
import { playable } from './round/pick';
import type { Adaptation, StageDef, StageId } from './types';

/** Numbers of the curriculum rules; they come from data/balance.ts as arguments. */
export interface CurriculumRules {
    readonly weights: { readonly current: number; readonly earlier: number; readonly previous: number };
    readonly minStartSteps: number;
    readonly unlockShare: number;
}

const ORDER: readonly StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const SEMESTER_MONTHS = 5; // September-January, February-June

/** Step numbers that have at least one playable skill, in curriculum order. */
export const playableSteps = (stage: StageDef): number[] =>
    stage.steps.filter((step) => step.skills.some(playable)).map((step) => step.step);

/**
 * First unlocked step of `stage` for a child of `age` in `month` (getMonth(), 0-11).
 * A stage behind the calendar stage starts at its last playable step; otherwise progress through the stage's
 * semester sets the share of playable steps, never fewer than `minStartSteps`.
 */
export const calendarStart = (stage: StageDef, age: number, month: number, data: PlacementData, rules: CurriculumRules): number => {
    const steps = playableSteps(stage);
    if (steps.length === 0) throw new RangeError(`Stage ${stage.id} has no playable steps`);
    const calendarStage = proposeStage(age, month, data);
    const behind = ORDER.indexOf(stage.id) < ORDER.indexOf(calendarStage);
    const position = (month + 4) % 12; // September 0 ... June 9, July 10, August 11
    const semesterStart = ORDER.indexOf(stage.id) % 2 === 0 ? 0 : SEMESTER_MONTHS;
    const progress = behind ? 1 : Math.min(1, Math.max(0, (position - semesterStart + 0.5) / SEMESTER_MONTHS));
    const k = Math.min(steps.length, Math.max(1, Math.max(rules.minStartSteps, Math.ceil(progress * steps.length))));
    return steps[k - 1];
};

/** Adaptation state of a freshly placed learner: every stage opens at its calendar start, counters empty. */
export const startLearning = (
    stages: Readonly<Partial<Record<StageId, StageDef>>>,
    age: number,
    month: number,
    data: PlacementData,
    rules: CurriculumRules,
): Adaptation => {
    const unlockedStep = {} as Adaptation['unlockedStep'];
    for (const id of ORDER) {
        const stage = stages[id];
        if (stage) unlockedStep[id] = calendarStart(stage, age, month, data, rules);
    }
    return { unlockedStep, mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds: 0 };
};
