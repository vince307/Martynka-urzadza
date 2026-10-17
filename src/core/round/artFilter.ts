// Skills whose answer exists only in a picture (coins, weights, jugs) must not be drawn while that picture is missing.
// The filter is optional and never empties a round: see `withoutArtBlocked`. Data comes in as arguments.
import { parseMassParams } from '../tasks/generators/mass';
import { parseMoneyCountParams } from '../tasks/generators/money';
import { parseMoneyPayParams } from '../tasks/generators/moneyPay';
import { ICONS } from '../../data/measures';
import { parseOrdinalParams } from '../tasks/generators/ordinal';
import { parseCapacityParams } from '../tasks/generators/capacity';
import type { SkillDef } from '../types';
import type { SkillBuckets } from './pick';

/**
 * True when the skill's result can only be read from a picture that is missing: MONEY_COUNT (any coin or note it can
 * draw), MONEY_PAY (any nominal of its tray: a coin the child cannot see cannot be picked), MASS (any weight), CAPACITY `toLitres` (any jug), ORDINAL (fewer icons loaded than its row needs). MONEY_CHANGE, MASS `text` and CAPACITY `howMany` / `text` carry the amounts in
 * the prompt, so they are never blocked.
 */
export const artBlocked = (skill: SkillDef, missingIds: ReadonlySet<string>): boolean => {
    if (missingIds.size === 0) return false;
    const any = (ids: readonly string[]): boolean => ids.some((id) => missingIds.has(id));
    switch (skill.type) {
        case 'MONEY_COUNT':
            return any(parseMoneyCountParams(skill.params).ids);
        case 'MONEY_PAY':
            return any(parseMoneyPayParams(skill.params).tray);
        case 'MASS': {
            // The text variant (brutto / netto / tara, conversions) has no picture, so it is never blocked.
            const p = parseMassParams(skill.params);
            return p.variant !== 'text' && any(p.weights);
        }
        case 'CAPACITY': {
            const p = parseCapacityParams(skill.params);
            return p.variant === 'toLitres' && any(p.jugs);
        }
        case 'ORDINAL':
            // The row is drawn from the loaded icons: blocked when fewer remain than the longest row needs.
            return ICONS.filter((icon) => !missingIds.has(icon.id)).length < parseOrdinalParams(skill.params).max;
        default:
            return false;
    }
};

/**
 * `earlier` and `previous` lose the blocked skills; `current` only when at least `minCurrent` skills (and one) remain,
 * so the step can still unlock. If all three would be empty the original buckets come back.
 */
/** What the filter did instead of filtering (ASL-04): `current` kept whole under the unlock threshold, `all` gave every original bucket back. */
export type ArtFallback = 'none' | 'current' | 'all';

export const withoutArtBlocked = (buckets: SkillBuckets, blocked: (s: SkillDef) => boolean, minCurrent: number): SkillBuckets & { fallback: ArtFallback } => {
    const keep = (skills: readonly SkillDef[]): SkillDef[] => skills.filter((s) => !blocked(s));
    const current = keep(buckets.current);
    const earlier = keep(buckets.earlier);
    const previous = keep(buckets.previous);
    if (current.length + earlier.length + previous.length === 0) return { ...buckets, fallback: 'all' };
    const useCurrent = current.length > 0 && current.length >= minCurrent;
    // `current` is a fallback only when the filter would have removed something and the step was kept whole instead (ASL-03: `minCurrent` guards a removal, it never pads a short step).
    const fallback: ArtFallback = !useCurrent && current.length < buckets.current.length ? 'current' : 'none';
    const result = { current: useCurrent ? current : buckets.current, earlier, previous, fallback };
    if (!buckets.currentGroups) return result;
    // Review step: the groups follow `current` (filtered groups, empty ones dropped, or the whole unfiltered set).
    return { ...result, currentGroups: useCurrent ? buckets.currentGroups.map(keep).filter((g) => g.length > 0) : buckets.currentGroups };
};
