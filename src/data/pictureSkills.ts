// Which skills always show a picture (a drawing or shape tiles), for picture mode (S-14d). A static table by task type;
// tests/pictureMode.test.ts keeps it true against what the generators draw for every skill of E1 and E2.
import type { SkillDef } from '../core/types';

const ALWAYS: ReadonlySet<string> = new Set([
    'SHAPES', 'PATTERN', 'COMPARE_QTY', 'ORDINAL', 'COUNT', 'CLOCK', 'MONEY_COUNT', 'MONEY_PAY', 'MONEY_CHANGE', 'CAPACITY',
    'PLACE_VALUE', 'ARROW_TABLE', 'SEQUENCE', 'DATA', 'TEMPERATURE', 'MULT_GROUPS',
]);

export const hasPicture = (skill: SkillDef): boolean => {
    if (ALWAYS.has(skill.type)) return true;
    const params = skill.params as { variant?: unknown; kinds?: unknown };
    switch (skill.type) {
        case 'CHOOSE_OP':
            // Only the picture kind draws; the word kinds are stories.
            return Array.isArray(params.kinds) && params.kinds.length > 0 && params.kinds.every((k) => k === 'picture');
        case 'LENGTH':
            return params.variant === 'ruler';
        case 'MASS':
            return params.variant !== 'text';
        default:
            return false;
    }
};
