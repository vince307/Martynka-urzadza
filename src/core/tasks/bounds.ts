// The numeric bound of a skill, read from its parameters the same way by the
// sample script and the content-invariant tests.
import type { SkillDef } from '../types';
import { NEGATIVE_TYPES } from './validate';

/** Types whose prompts legitimately carry numbers beyond their params (dates, hours, hundreds). */
export const UNBOUNDED_TYPES: readonly string[] = ['CALENDAR', 'ROMAN', 'NUMBER_WORDS', 'CLOCK'];

export const boundOf = (skill: Pick<SkillDef, 'params'>): number | undefined => {
    const raw = skill.params.max ?? skill.params.maxProduct ?? skill.params.maxDividend;
    if (typeof raw === 'number') {
        return raw;
    }
    const totals = skill.params.totals;
    return Array.isArray(totals) && totals.length > 0 ? Math.max(...(totals as number[])) : undefined;
};

/** What `validateTask` needs to know about a skill from the programme (range and the negative exception). */
export const validationBounds = (skill: Pick<SkillDef, 'type' | 'params'>): { max: number | undefined; allowNegative: boolean } => ({
    max: boundOf(skill),
    allowNegative: NEGATIVE_TYPES.has(skill.type),
});
