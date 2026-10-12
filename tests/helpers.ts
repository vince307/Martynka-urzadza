// Shared helpers for generator tests: a 1000-draw loop over seeds that
// replays failures by seed, with the mechanical validator on every task.
import { expect } from 'vitest';
import { createRng } from '../src/core/rng';
import type { Generator, Task } from '../src/core/tasks/types';
import { validateTask, type ValidationContext } from '../src/core/tasks/validate';
import type { SkillDef } from '../src/core/types';
import { nouns } from '../src/data/nouns';

export const SEEDS = 20;
export const DRAWS_PER_SEED = 50;

export const forEachDraw = (
    generate: Generator,
    skill: SkillDef,
    ctx: ValidationContext,
    check: (task: Task, where: string) => void,
): void => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
        const rng = createRng(20261012 + seed);
        for (let i = 0; i < DRAWS_PER_SEED; i += 1) {
            const task = generate(skill, rng);
            const where = `${skill.id} seed=${seed} draw=${i} prompt="${task.prompt}"`;
            expect(task.skillId, where).toBe(skill.id);
            expect(validateTask(task, { nouns, ...ctx }), where).toEqual([]);
            check(task, where);
        }
    }
};

export const skillsOfType = (stage: { steps: { skills: SkillDef[] }[] }, type: string): SkillDef[] =>
    stage.steps.flatMap((step) => step.skills).filter((s) => s.type === type);
