// Prompt uniqueness inside one round or warm-up (S-07, follow-ups of S-05 and S-06).
import type { Rng } from '../rng';
import type { Task } from '../tasks/types';
import type { SkillDef } from '../types';
import { visualKey } from '../tasks/visual';

/**
 * One task per skill, in order. A task whose `prompt` and drawing already appeared is redrawn from the same skill up to
 * `retries` times; after that the duplicate stays, so the round always has `skills.length` tasks and never hangs.
 * The skill choice (and so the weights) is untouched. `generate` closes over the rng, so a redraw is a new draw; the
 * `_rng` parameter only keeps the signature the plan names.
 */
export const distinctTasks = (
    skills: readonly SkillDef[],
    _rng: Rng,
    generate: (skill: SkillDef) => Task,
    retries: number,
): Task[] => {
    const seen = new Set<string>();
    const keyOf = (task: Task): string => `${task.prompt}|${visualKey(task.visual)}`;
    return skills.map((skill) => {
        let task = generate(skill);
        for (let attempt = 0; attempt < retries && seen.has(keyOf(task)); attempt += 1) {
            task = generate(skill);
        }
        seen.add(keyOf(task));
        return task;
    });
};
