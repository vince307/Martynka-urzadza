// Skills whose answer exists only in a picture (coins, weights, jugs) must not be drawn while that picture is missing.
// The filter is optional and never empties a round: see `withoutArtBlocked`. Data comes in as arguments.
import { parseMassParams } from '../tasks/generators/mass';
import { parseMoneyCountParams } from '../tasks/generators/money';
import { parseCapacityParams } from '../tasks/generators/capacity';
import type { SkillDef } from '../types';
import type { SkillBuckets } from './pick';

/**
 * True when the skill's result can only be read from a picture that is missing: MONEY_COUNT (any coin or note it can
 * draw), MASS (any weight), CAPACITY `toLitres` (any jug). MONEY_CHANGE, MASS `text` and CAPACITY `howMany` carry the amounts in
 * the prompt, so they are never blocked.
 */
export const artBlocked = (skill: SkillDef, missingIds: ReadonlySet<string>): boolean => {
    if (missingIds.size === 0) return false;
    const any = (ids: readonly string[]): boolean => ids.some((id) => missingIds.has(id));
    switch (skill.type) {
        case 'MONEY_COUNT':
            return any(parseMoneyCountParams(skill.params).ids);
        case 'MASS': {
            // The text variant (brutto / netto / tara, conversions) has no picture, so it is never blocked.
            const p = parseMassParams(skill.params);
            return p.variant !== 'text' && any(p.weights);
        }
        case 'CAPACITY': {
            const p = parseCapacityParams(skill.params);
            return p.variant === 'toLitres' && any(p.jugs);
        }
        default:
            return false;
    }
};

/**
 * `earlier` and `previous` lose the blocked skills; `current` only when at least `minCurrent` skills (and one) remain,
 * so the step can still unlock. If all three would be empty the original buckets come back.
 */
export const withoutArtBlocked = (buckets: SkillBuckets, blocked: (s: SkillDef) => boolean, minCurrent: number): SkillBuckets => {
    const keep = (skills: readonly SkillDef[]): SkillDef[] => skills.filter((s) => !blocked(s));
    const current = keep(buckets.current);
    const earlier = keep(buckets.earlier);
    const previous = keep(buckets.previous);
    if (current.length + earlier.length + previous.length === 0) return buckets;
    return { current: current.length > 0 && current.length >= minCurrent ? current : buckets.current, earlier, previous };
};
