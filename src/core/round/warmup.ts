// Placement warm-up: a short round before the normal ones. Part of it comes
// from the previous stage, part from the first steps of the current one; if
// too few are right on the first try the stage drops by one (never up).
import { previousStage } from '../placement';
import type { Rng } from '../rng';
import type { Outcome } from '../round';
import { generateTask } from '../tasks/generateTask';
import type { Task } from '../tasks/types';
import type { SkillDef, StageDef, StageId } from '../types';
import { balance } from '../../data/balance';
import { firstPlayableSteps } from './pick';
import { distinctTasks } from './unique';
import { pickVariedFromStage, spreadTypes, type VarietyRules } from './variety';

export type WarmupRules = { length: number; previousCount: number; currentSteps: number };

/** `previousCount` tasks of the previous stage first, then the rest from the first playable steps of `stage`. */
export const buildWarmup = (stage: StageDef, previous: StageDef, rng: Rng, opts: WarmupRules, tileCount: number, retries: number, blocked?: (s: SkillDef) => boolean, variety: VarietyRules = balance.round.variety): Task[] => {
    const early: StageDef = { ...stage, steps: firstPlayableSteps(stage, opts.currentSteps) };
    // One tally for both halves: the cap holds over the whole warm-up.
    const tally = new Map<string, number>();
    const first = spreadTypes(pickVariedFromStage(previous, rng, opts.previousCount, tally, variety, blocked));
    const second = pickVariedFromStage(early, rng, opts.length - opts.previousCount, tally, variety, blocked);
    // The second half starts with another type than the first one ended with, unless that makes a neighbour inside it.
    const seeded = spreadTypes(second, undefined, first[first.length - 1]?.type);
    const joined = seeded.some((skill, i) => i > 0 && seeded[i - 1].type === skill.type) ? spreadTypes(second) : seeded;
    const skills = [...first, ...joined];
    return distinctTasks(skills, rng, (skill) => generateTask(skill, rng, { tileCount }), retries);
};

/** One stage down when fewer than `minFirstTry` tasks were right on the first try, else unchanged. */
export const warmupResult = (stage: StageId, outcomes: readonly (Outcome | null)[], minFirstTry: number): StageId => {
    const firstTry = outcomes.filter((outcome) => outcome === 'first').length;
    return firstTry < minFirstTry ? (previousStage(stage) ?? stage) : stage;
};
