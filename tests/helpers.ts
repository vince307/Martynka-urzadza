// Shared helpers for generator tests: a 1000-draw loop over seeds that
// replays failures by seed, with the mechanical validator on every task.
import { expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { validationBounds } from '../src/core/tasks/bounds';
import type { Generator, Task } from '../src/core/tasks/types';
import { validateTask, type ValidationContext } from '../src/core/tasks/validate';
import type { HouseState, SkillDef } from '../src/core/types';
import { nouns } from '../src/data/nouns';

/** A one-room house for save tests that name their own first room. */
export const houseOf = (room: string): HouseState => ({ id: 'test-house', rooms: [{ room, floor: 0, place: 0 }] });

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
            expect(validateTask(task, { nouns, allowNegative: validationBounds(skill).allowNegative, ...ctx }), where).toEqual([]);
            check(task, where);
        }
    }
};

export const skillsOfType = (stage: { steps: { skills: SkillDef[] }[] }, type: string): SkillDef[] =>
    stage.steps.flatMap((step) => step.skills).filter((s) => s.type === type);

/** The store methods of the backup record that most test stores do not care about (a store must have all of them). */
export const backupExtras = {
    readBackups: () => Promise.resolve([] as { from: number; raw: unknown }[]),
    backupRecord: () => Promise.resolve(null),
    noteBackup: () => Promise.resolve(),
};
