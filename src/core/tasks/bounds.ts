// The numeric bound of a skill, read from its parameters the same way by the
// sample script and the content-invariant tests.
import type { SkillDef } from '../types';
import { NEGATIVE_TYPES } from './validate';

/** Types whose prompts legitimately carry numbers beyond their params (dates, hours, hundreds). */
export const UNBOUNDED_TYPES: readonly string[] = ['CALENDAR', 'ROMAN', 'NUMBER_WORDS', 'CLOCK', 'GRID'];

export const boundOf = (skill: Pick<SkillDef, 'params'>): number | undefined => {
    const raw = skill.params.max ?? skill.params.maxProduct ?? skill.params.maxDividend;
    if (typeof raw === 'number') {
        return raw;
    }
    const totals = skill.params.totals;
    return Array.isArray(totals) && totals.length > 0 ? Math.max(...(totals as number[])) : undefined;
};

const num = (x: unknown): number => (typeof x === 'number' ? x : Number.NaN);

/**
 * The largest number the child may see on screen for a skill (validation and content invariants). It differs from
 * `boundOf` (which also sizes number tiles) for the art types whose params are not on-screen units (impl-review S-14):
 * money keeps `max` in grosze, so whole-złoty answers are bounded by max / 100; CAPACITY counts jugs per litre times
 * `maxLitres`; TEMPERATURE reaches the widest of |low|, |high| and the difference high - low.
 */
export const screenBound = (skill: Pick<SkillDef, 'type' | 'params'>): number | undefined => {
    const p = skill.params;
    if (skill.type === 'MONEY_COUNT' || skill.type === 'MONEY_CHANGE') {
        return p.answer === 'number-zl' ? num(p.max) / 100 : num(p.max);
    }
    if (skill.type === 'CAPACITY') {
        const jugs = Array.isArray(p.jugs) ? (p.jugs as string[]) : [];
        const perLitre = jugs.includes('container-quarter-l') ? 4 : jugs.includes('container-half-l') ? 2 : 1;
        return perLitre * num(p.maxLitres);
    }
    if (skill.type === 'TEMPERATURE') {
        const [low, high] = [num(p.low), num(p.high)];
        return Math.max(Math.abs(low), Math.abs(high), high - low);
    }
    return boundOf(skill);
};

/** What `validateTask` needs to know about a skill from the programme (range and the negative exception). */
export const validationBounds = (skill: Pick<SkillDef, 'type' | 'params'>): { max: number | undefined; allowNegative: boolean } => ({
    max: screenBound(skill),
    allowNegative: NEGATIVE_TYPES.has(skill.type),
});
