// The single entry point from a skill to a playable task: runs the registered
// generator, then gives every 'tiles' skill whose generator did not supply
// choices a set of number tiles. Tiles are added after the generator ran, from
// the same rng, so existing seeds still produce the same tasks.
import type { Rng } from '../rng';
import type { SkillDef } from '../types';
import { boundOf } from './bounds';
import { numberChoices } from './distractors';
import { getGenerator } from './registry';
import type { Task } from './types';
import { assertDrawable } from './visual';

export interface GenerateTaskOptions {
    tileCount: number;   // wanted number of tiles including the answer
}

/** A failure while drawing a task: the cause's name, the message with the skill id, and `skillId` for `errorCode`. */
const skillFailure = (skill: SkillDef, cause: unknown): Error & { skillId: string } => {
    const why = cause instanceof Error ? cause.message : String(cause);
    const name = cause instanceof Error && cause.name !== '' ? cause.name : 'Error';
    return Object.assign(new Error(`Skill ${skill.id}: ${why}`), { cause, name, skillId: skill.id });
};

export const generateTask = (skill: SkillDef, rng: Rng, opts: GenerateTaskOptions): Task => {
    const generate = getGenerator(skill.type);
    if (!generate) {
        throw Object.assign(new Error(`No generator for task type ${skill.type} (skill ${skill.id})`), { skillId: skill.id });
    }
    try {
        const generated = generate(skill, rng);
        assertDrawable(generated);
        const task: Task = { ...generated, input: skill.answer };
        if (skill.answer !== 'tiles' || task.choices !== undefined || typeof task.answer !== 'number') {
            return task;
        }
        const range = task.tileRange ?? { min: 0, max: boundOf(skill) ?? task.answer + opts.tileCount };
        // A narrow range (BONDS with sum 2: 0..2) cannot hold more distinct tiles than it has values.
        const count = Math.min(opts.tileCount, range.max - range.min + 1);
        return { ...task, choices: numberChoices(task.answer, rng, { count, min: range.min, max: range.max }) };
    } catch (cause) {
        throw skillFailure(skill, cause);
    }
};
