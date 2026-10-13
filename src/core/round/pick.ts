// Skill choice for the task scene (the warm-up draws uniformly, rounds by bucket weights). Only skills the scene
// can answer ('tiles' or 'keypad') and that have a registered generator are
// played; 'select' and 'drag' wait for their own UI (S-13).
// DESIGN-GAP: the kit has no multi-select view (docs/design-gaps.md row 7).
import type { Rng } from '../rng';
import { getGenerator } from '../tasks/registry';
import type { SkillDef, StageDef, StepDef } from '../types';

export const playable = (skill: SkillDef): boolean =>
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

export interface Weights {
    readonly current: number;
    readonly earlier: number;
    readonly previous: number;
}

export interface SkillBuckets {
    readonly current: readonly SkillDef[];
    readonly earlier: readonly SkillDef[];
    readonly previous: readonly SkillDef[];
}

/**
 * `count` skills: each draw picks a bucket in proportion to its weight among the non-empty buckets (so an empty
 * bucket's share is spread over the others), then a skill uniformly inside it.
 */
export const pickRoundSkills = (buckets: SkillBuckets, weights: Weights, rng: Rng, count: number): SkillDef[] => {
    const live = (['current', 'earlier', 'previous'] as const).filter((key) => buckets[key].length > 0 && weights[key] > 0);
    const fallback = (['current', 'earlier', 'previous'] as const).filter((key) => buckets[key].length > 0);
    const usable = live.length > 0 ? live : fallback;
    if (usable.length === 0) {
        throw new RangeError('No playable skills in any bucket');
    }
    const total = usable.reduce((sum, key) => sum + (live.length > 0 ? weights[key] : 1), 0);
    return Array.from({ length: count }, () => {
        let roll = rng.next() * total;
        let chosen = usable[usable.length - 1];
        for (const key of usable) {
            roll -= live.length > 0 ? weights[key] : 1;
            if (roll < 0) {
                chosen = key;
                break;
            }
        }
        return rng.pick(buckets[chosen]);
    });
};
