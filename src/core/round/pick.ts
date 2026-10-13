// Skill choice and round building for the task scene. Only skills the scene
// can answer ('tiles' or 'keypad') and that have a registered generator are
// played; 'select' and 'drag' wait for their own UI (S-13).
// DESIGN-GAP: the kit has no multi-select view (docs/design-gaps.md row 7).
import type { Rng } from '../rng';
import type { RoundRules } from '../round';
import { generateTask } from '../tasks/generateTask';
import { getGenerator } from '../tasks/registry';
import type { Task } from '../tasks/types';
import type { SkillDef, StageDef, StepDef } from '../types';

const playable = (skill: SkillDef): boolean =>
    (skill.answer === 'tiles' || skill.answer === 'keypad') && getGenerator(skill.type) !== undefined;

/** The first `n` steps that have at least one playable skill, in curriculum order. */
export const firstPlayableSteps = (stage: StageDef, n: number): StepDef[] =>
    stage.steps.filter((step) => step.skills.some(playable)).slice(0, n);

/** `count` skills drawn uniformly (with repeats) from the playable skills of the stage. */
export const pickSkills = (stage: StageDef, rng: Rng, count: number): SkillDef[] => {
    const pool = stage.steps.flatMap((step) => step.skills).filter(playable);
    if (pool.length === 0) {
        throw new RangeError(`Stage ${stage.id} has no playable skills`);
    }
    return Array.from({ length: count }, () => rng.pick(pool));
};

export const buildRound = (stage: StageDef, rng: Rng, rules: RoundRules, tileCount: number): Task[] =>
    pickSkills(stage, rng, rules.length).map((skill) => generateTask(skill, rng, { tileCount }));
