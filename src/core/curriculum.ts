// Where learning starts (S-07, rule D): the first unlocked step of a stage is a floor taken from the school calendar,
// so a child is neither dropped at step 1 of a stage the class is half through nor handed the whole stage with nothing
// left to unlock. Pure: the month is an argument, there is no Date here.
// After S-11 (persistence) the same call gives the floor as max(saved step, calendarStart).
import { proposeStage, type PlacementData } from './placement';
import type { Rng } from './rng';
import { pickRoundSkills, playable, type SkillBuckets, type Weights } from './round/pick';
import { recordRound, type MasteryRules, type SkillResult } from './mastery';
import { distinctTasks } from './round/unique';
import { generateTask } from './tasks/generateTask';
import type { Task } from './tasks/types';
import type { Adaptation, SkillDef, StageDef, StageId } from './types';

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

/**
 * The three pools a round draws from. `current` is the playable step at `unlockedStep` (an unplayable step falls to the
 * nearest lower playable one, and below the first playable step to the first), `earlier` the playable steps before it,
 * `previous` all playable skills of the previous stage (empty for E1).
 */
export const skillBuckets = (stage: StageDef, previous: StageDef | undefined, unlockedStep: number): SkillBuckets => {
    const steps = playableSteps(stage);
    if (steps.length === 0) throw new RangeError(`Stage ${stage.id} has no playable steps`);
    const below = steps.filter((n) => n <= unlockedStep);
    const currentStep = below.length > 0 ? below[below.length - 1] : steps[0];
    const skillsOf = (pick: (step: number) => boolean): SkillDef[] =>
        stage.steps.filter((s) => pick(s.step)).flatMap((s) => s.skills.filter(playable));
    return {
        current: skillsOf((n) => n === currentStep),
        earlier: skillsOf((n) => n < currentStep),
        previous: previous ? previous.steps.flatMap((s) => s.skills.filter(playable)) : [],
    };
};

/** A round of `rules.length` tasks drawn by weight from the buckets of the learner's unlocked step, prompts distinct. */
export const buildAdaptiveRound = (
    stage: StageDef,
    previous: StageDef | undefined,
    adaptation: Adaptation,
    weights: Weights,
    rng: Rng,
    rules: { readonly length: number; readonly uniqueRetries: number },
    tileCount: number,
): Task[] => {
    const unlocked = adaptation.unlockedStep[stage.id] ?? 1;
    const skills = pickRoundSkills(skillBuckets(stage, previous, unlocked), weights, rng, rules.length);
    return distinctTasks(skills, rng, (skill) => generateTask(skill, rng, { tileCount }), rules.uniqueRetries);
};

/** Numbers of the easing rule; they come from data/balance.ts as arguments. */
export interface EasingRules {
    readonly weakBelow: number;
    readonly weakRounds: number;
    readonly rounds: number;
    readonly weights: Weights;
}

export type RoundResult = SkillResult;

/**
 * The playable step to unlock next, or null. The current step is the nearest playable one at or below
 * `unlockedStep` (as in `skillBuckets`); it is ready when at least ceil(unlockShare * n) of its n playable skills
 * have mastery >= unlockAt. There must be a later playable step.
 */
export const unlockReady = (stage: StageDef, adaptation: Adaptation, rules: CurriculumRules & Pick<MasteryRules, 'unlockAt'>): number | null => {
    const steps = playableSteps(stage);
    if (steps.length === 0) return null;
    const unlocked = adaptation.unlockedStep[stage.id] ?? 1;
    const below = steps.filter((n) => n <= unlocked);
    const current = below.length > 0 ? below[below.length - 1] : steps[0];
    const next = steps.find((n) => n > current);
    if (next === undefined) return null;
    const skills = stage.steps.filter((s) => s.step === current).flatMap((s) => s.skills.filter(playable));
    const mastered = skills.filter((k) => (adaptation.mastery[k.id] ?? 0) >= rules.unlockAt).length;
    return mastered >= Math.ceil(rules.unlockShare * skills.length) ? next : null;
};

/**
 * Everything that happens when a round ends: mastery from the first tries, then (normal rounds only) at most one
 * unlocked step and the easing counters. A warm-up only records mastery.
 */
export const endRound = (
    adaptation: Adaptation,
    stage: StageDef,
    results: readonly RoundResult[],
    at: number,
    kind: 'round' | 'warmup',
    rules: { curriculum: CurriculumRules; mastery: MasteryRules; easing: EasingRules },
): { adaptation: Adaptation; unlocked: number | null } => {
    let next = recordRound(adaptation, results, at, rules.mastery);
    if (kind === 'warmup') return { adaptation: next, unlocked: null };
    const unlocked = unlockReady(stage, next, { ...rules.curriculum, unlockAt: rules.mastery.unlockAt });
    if (unlocked !== null) next = { ...next, unlockedStep: { ...next.unlockedStep, [stage.id]: unlocked } };
    let eased = next.easedRounds > 0 ? next.easedRounds - 1 : 0;
    const firstTries = results.filter((r) => r.outcome === 'first').length;
    let weak = firstTries < rules.easing.weakBelow ? next.weakStreak + 1 : 0;
    if (weak === rules.easing.weakRounds) {
        eased = rules.easing.rounds;
        weak = 0;
    }
    return { adaptation: { ...next, weakStreak: weak, easedRounds: eased }, unlocked };
};

/** Bucket weights for the next round: the easing weights while easing rounds remain, else the normal ones. */
export const roundWeights = (adaptation: Adaptation, rules: { curriculum: CurriculumRules; easing: EasingRules }): Weights =>
    adaptation.easedRounds > 0 ? rules.easing.weights : rules.curriculum.weights;
