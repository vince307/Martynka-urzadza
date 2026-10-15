// Picture mode as a pool filter (S-14d), modelled on `withoutArtBlocked`: `earlier` and `previous` keep only skills
// with a picture; `current` only when at least `minCurrent` (and one) remain, so the step can still unlock. A bucket
// that would empty comes back whole, so a round never fails for the mode.
import type { SkillDef } from '../types';
import type { SkillBuckets } from './pick';

export const withPictures = (buckets: SkillBuckets, hasPicture: (s: SkillDef) => boolean, minCurrent: number): SkillBuckets => {
    const keep = (skills: readonly SkillDef[]): readonly SkillDef[] => {
        const kept = skills.filter(hasPicture);
        return kept.length > 0 ? kept : skills;
    };
    const current = buckets.current.filter(hasPicture);
    const useCurrent = current.length > 0 && current.length >= minCurrent;
    const result = { current: useCurrent ? current : buckets.current, earlier: keep(buckets.earlier), previous: keep(buckets.previous) };
    if (!buckets.currentGroups) return result;
    return { ...result, currentGroups: useCurrent ? buckets.currentGroups.map((g) => g.filter(hasPicture)).filter((g) => g.length > 0) : buckets.currentGroups };
};
