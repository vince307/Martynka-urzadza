// Where learning starts (S-07, rule D): the first unlocked step of a stage is a floor taken from the school calendar,
// so a child is neither dropped at step 1 of a stage the class is half through nor handed the whole stage with nothing
// left to unlock. Pure: the month is an argument, there is no Date here.
// For a loaded save the same call gives the floor, and the session takes max(saved step, calendarStart) per stage (floorToCalendar, S-11).
import { proposeStage, STAGE_ORDER, type PlacementData, type SessionLearner } from './placement';
import type { Rng } from './rng';
import { artBlocked, withoutArtBlocked } from './round/artFilter';
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
    const behind = STAGE_ORDER.indexOf(stage.id) < STAGE_ORDER.indexOf(calendarStage);
    const position = (month + 4) % 12; // September 0 ... June 9, July 10, August 11
    const semesterStart = STAGE_ORDER.indexOf(stage.id) % 2 === 0 ? 0 : SEMESTER_MONTHS;
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
    for (const id of STAGE_ORDER) {
        const stage = stages[id];
        if (stage) unlockedStep[id] = calendarStart(stage, age, month, data, rules);
    }
    return { unlockedStep, mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds: 0 };
};

/** Raises every stage of a loaded learner to the school-calendar start (max of saved and calendar). */
export const floorToCalendar = (
    learner: SessionLearner,
    stages: Readonly<Partial<Record<StageId, StageDef>>>,
    month: number,
    data: PlacementData,
    rules: CurriculumRules,
): SessionLearner => {
    const unlockedStep = { ...learner.unlockedStep };
    let changed = false;
    for (const id of STAGE_ORDER) {
        const stage = stages[id];
        if (!stage) continue;
        const floor = calendarStart(stage, learner.age, month, data, rules);
        const saved = (learner.unlockedStep as Partial<Record<StageId, number>>)[id];
        if (saved === undefined || saved < floor) {
            unlockedStep[id] = floor;
            changed = true;
        }
    }
    return changed ? { ...learner, unlockedStep } : learner;
};

/** The playable step at `unlockedStep`, or the nearest lower one; below the first playable step, the first. */
export const currentStep = (stage: StageDef, unlockedStep: number): number => {
    const steps = playableSteps(stage);
    if (steps.length === 0) throw new RangeError(`Stage ${stage.id} has no playable steps`);
    const below = steps.filter((n) => n <= unlockedStep);
    return below.length > 0 ? below[below.length - 1] : steps[0];
};

/**
 * The three pools a round draws from. `current` is the playable step at `unlockedStep` (an unplayable step falls to the
 * nearest lower playable one, and below the first playable step to the first), `earlier` the playable steps before it,
 * `previous` all playable skills of the previous stage (empty for E1).
 */
export const skillBuckets = (stage: StageDef, previous: StageDef | undefined, unlockedStep: number): SkillBuckets => {
    const current = currentStep(stage, unlockedStep);
    const skillsOf = (pick: (step: number) => boolean): SkillDef[] =>
        stage.steps.filter((s) => pick(s.step)).flatMap((s) => s.skills.filter(playable));
    return {
        current: skillsOf((n) => n === current),
        earlier: skillsOf((n) => n < current),
        previous: previous ? previous.steps.flatMap((s) => s.skills.filter(playable)) : [],
    };
};

/**
 * A round of `rules.length` tasks drawn by weight from the buckets of the learner's unlocked step, prompts distinct.
 * `art` (pictures that failed to load) drops skills whose answer is only in a missing picture, see `withoutArtBlocked`.
 */
export const buildAdaptiveRound = (
    stage: StageDef,
    previous: StageDef | undefined,
    adaptation: Adaptation,
    weights: Weights,
    rng: Rng,
    rules: { readonly length: number; readonly uniqueRetries: number },
    tileCount: number,
    art?: { readonly missingIds: ReadonlySet<string>; readonly unlockShare: number },
): Task[] => {
    const unlocked = adaptation.unlockedStep[stage.id] ?? 1;
    const buckets = skillBuckets(stage, previous, unlocked);
    const missing = art?.missingIds;
    // Nothing missing: the buckets and the rng use stay exactly as without the argument.
    const pools =
        art && missing && missing.size > 0
            ? withoutArtBlocked(buckets, (skill) => artBlocked(skill, missing), unlockThreshold(buckets.current.length, art.unlockShare))
            : buckets;
    const skills = pickRoundSkills(pools, weights, rng, rules.length);
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
    const current = currentStep(stage, adaptation.unlockedStep[stage.id] ?? 1);
    const next = steps.find((n) => n > current);
    if (next === undefined) return null;
    const skills = stage.steps.filter((s) => s.step === current).flatMap((s) => s.skills.filter(playable));
    const mastered = skills.filter((k) => (adaptation.mastery[k.id] ?? 0) >= rules.unlockAt).length;
    return mastered >= unlockThreshold(skills.length, rules.unlockShare) ? next : null;
};

/** How many playable skills of a step must reach the unlock mastery: ceil(share * n). */
export const unlockThreshold = (n: number, share: number): number => {
    return Math.ceil(share * n);
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
