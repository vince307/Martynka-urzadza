// Skill choice and round building for the task scene. Only skills the scene
// can answer ('tiles' or 'keypad') and that have a registered generator are
// played; 'select' and 'drag' wait for their own UI (S-13).
import type { Rng } from '../rng';
import type { RoundRules } from '../round';
import { generateTask } from '../tasks/generateTask';
import { getGenerator } from '../tasks/registry';
import type { Task } from '../tasks/types';
import type { SkillDef, StageDef } from '../types';

const playable = (skill: SkillDef): boolean =>
    (skill.answer === 'tiles' || skill.answer === 'keypad') && getGenerator(skill.type) !== undefined;

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
