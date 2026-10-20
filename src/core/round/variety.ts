// Variety of a round (playtest F-03): at most `maxPerType` tasks of one type (generator) in a round, and the same
// type never twice in a row while avoidable. The rule relaxes when the pool has too few types. The draw consumes
// exactly the rng calls of `pickRoundSkills` (one `next()` and one `pick` per draw, one more `pick` on a review
// step), so the 60/30/10 bucket shares of the same seed stay what they were; the reorder uses no rng.
import type { Rng } from '../rng';
import type { SkillDef } from '../types';
import type { SkillBuckets, Weights } from './pick';

export interface VarietyRules {
    /** Most tasks of one type in a round; a pool that has nothing else left is played whole. */
    readonly maxPerType: number;
}

type TypeOf = (skill: SkillDef) => string;
const byType: TypeOf = (skill) => skill.type;

/** Like `pickRoundSkills`, but inside the rolled pool the skills of a type already at the cap are left out (when any other is left). */
export const pickVariedSkills = (buckets: SkillBuckets, weights: Weights, rng: Rng, count: number, rules: VarietyRules, typeOf: TypeOf = byType): SkillDef[] => {
    const live = (['current', 'earlier', 'previous'] as const).filter((key) => buckets[key].length > 0 && weights[key] > 0);
    const fallback = (['current', 'earlier', 'previous'] as const).filter((key) => buckets[key].length > 0);
    const usable = live.length > 0 ? live : fallback;
    if (usable.length === 0) {
        throw new RangeError('No playable skills in any bucket');
    }
    const total = usable.reduce((sum, key) => sum + (live.length > 0 ? weights[key] : 1), 0);
    const seen = new Map<string, number>();
    const drawn: SkillDef[] = [];
    for (let i = 0; i < count; i += 1) {
        let roll = rng.next() * total;
        let chosen = usable[usable.length - 1];
        for (const key of usable) {
            roll -= live.length > 0 ? weights[key] : 1;
            if (roll < 0) {
                chosen = key;
                break;
            }
        }
        const groups = chosen === 'current' ? buckets.currentGroups : undefined;
        const pool = groups && groups.length > 0 ? rng.pick(groups) : buckets[chosen];
        const open = pool.filter((skill) => (seen.get(typeOf(skill)) ?? 0) < rules.maxPerType);
        const skill = rng.pick(open.length > 0 ? open : pool);
        seen.set(typeOf(skill), (seen.get(typeOf(skill)) ?? 0) + 1);
        drawn.push(skill);
    }
    return drawn;
};

/**
 * Reorders without rng: at each place the type with the most skills left that differs from the previous place
 * (ties: the type met first in draw order; inside a type, draw order). When only the previous type is left it is
 * taken anyway. Gives no neighbours of one type whenever the most frequent type has at most ceil(n / 2) skills.
 */
export const spreadTypes = (skills: readonly SkillDef[], typeOf: TypeOf = byType, previousType?: string): SkillDef[] => {
    const rest = [...skills];
    const out: SkillDef[] = [];
    let previous = previousType;
    while (rest.length > 0) {
        const left = new Map<string, number>();
        for (const skill of rest) left.set(typeOf(skill), (left.get(typeOf(skill)) ?? 0) + 1);
        let best: string | undefined;
        for (const [type, n] of left) {
            if (type === previous) continue;
            if (best === undefined || n > (left.get(best) ?? 0)) best = type;
        }
        const type = best ?? previous;
        const at = rest.findIndex((skill) => typeOf(skill) === type);
        out.push(rest.splice(at, 1)[0]);
        previous = typeOf(out[out.length - 1]);
    }
    return out;
};

export const variedRound = (buckets: SkillBuckets, weights: Weights, rng: Rng, count: number, rules: VarietyRules, typeOf: TypeOf = byType): SkillDef[] =>
    spreadTypes(pickVariedSkills(buckets, weights, rng, count, rules, typeOf), typeOf);
