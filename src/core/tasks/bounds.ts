// The numeric bound of a skill, read from its parameters the same way by the
// sample script and the content-invariant tests.
import type { SkillDef } from '../types';

/** Types whose prompts legitimately carry numbers beyond their params (dates, hours, hundreds). */
export const UNBOUNDED_TYPES: readonly string[] = ['CALENDAR', 'ROMAN', 'NUMBER_WORDS'];

export const boundOf = (skill: Pick<SkillDef, 'params'>): number | undefined => {
    const raw = skill.params.max ?? skill.params.maxProduct ?? skill.params.maxDividend;
    return typeof raw === 'number' ? raw : undefined;
};
