// Placement warm-up: a short round before the normal ones. Part of it comes
// from the previous stage, part from the first steps of the current one; if
// too few are right on the first try the stage drops by one (never up).
import { previousStage } from '../placement';
import type { Rng } from '../rng';
import type { Outcome } from '../round';
import { generateTask } from '../tasks/generateTask';
import type { Task } from '../tasks/types';
import type { StageDef, StageId } from '../types';
import { firstPlayableSteps, pickSkills } from './pick';
import { distinctTasks } from './unique';

export type WarmupRules = { length: number; previousCount: number; currentSteps: number };

/** `previousCount` tasks of the previous stage first, then the rest from the first playable steps of `stage`. */
export const buildWarmup = (stage: StageDef, previous: StageDef, rng: Rng, opts: WarmupRules, tileCount: number, retries: number): Task[] => {
    const early: StageDef = { ...stage, steps: firstPlayableSteps(stage, opts.currentSteps) };
    const skills = [
        ...pickSkills(previous, rng, opts.previousCount),
        ...pickSkills(early, rng, opts.length - opts.previousCount),
    ];
    return distinctTasks(skills, rng, (skill) => generateTask(skill, rng, { tileCount }), retries);
};

/** One stage down when fewer than `minFirstTry` tasks were right on the first try, else unchanged. */
export const warmupResult = (stage: StageId, outcomes: readonly (Outcome | null)[], minFirstTry: number): StageId => {
    const firstTry = outcomes.filter((outcome) => outcome === 'first').length;
    return firstTry < minFirstTry ? (previousStage(stage) ?? stage) : stage;
};
