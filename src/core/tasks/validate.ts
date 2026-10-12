// Mechanical checks shared by the 1000-draw tests and scripts/sample.ts
// (PRD FR-005): result range, negative numbers, tile choices, hints and Polish
// numeral agreement for nouns from a dictionary.
import { inflect, type PluralForms } from '../text/plural';
import type { Task } from './types';

export type ViolationRule = 'range' | 'negative' | 'choices' | 'inflection' | 'hint';

export interface Violation {
    skillId: string;
    rule: ViolationRule;
    detail: string;
}

export interface ValidationContext {
    /** Upper bound for a numeric answer (typically params.max). */
    max?: number;
    /** Nouns whose agreement with a preceding number is checked. */
    nouns?: Readonly<Record<string, PluralForms>>;
}

/**
 * A minus (hyphen or U+2212) that is not a binary operator: nothing but
 * whitespace, or a non-digit, before it, and a digit after it. "5 − 7" is
 * fine; "-3", "= -2" and "(−3" are flagged.
 */
const NEGATIVE_NUMBER = /(?:^|[^\d\s])\s*[-−]\s?\d/;
const NUMBER_WORD = /(\d+)\s+(\p{L}+)/gu;

const texts = (task: Task): string[] => [task.prompt, ...(task.speak ? [task.speak] : []), ...task.hint];

export const validateTask = (task: Task, ctx: ValidationContext = {}): Violation[] => {
    const out: Violation[] = [];
    const add = (rule: ViolationRule, detail: string): void => {
        out.push({ skillId: task.skillId, rule, detail });
    };

    if (typeof task.answer === 'number') {
        if (task.answer < 0) {
            add('negative', `answer ${task.answer}`);
        }
        if (ctx.max !== undefined && (task.answer < 0 || task.answer > ctx.max)) {
            add('range', `answer ${task.answer} outside 0..${ctx.max}`);
        }
    }

    for (const text of texts(task)) {
        if (NEGATIVE_NUMBER.test(text)) {
            add('negative', `"${text}"`);
        }
    }
    if (task.choices?.some((c) => typeof c === 'number' && c < 0)) {
        add('negative', `choices ${JSON.stringify(task.choices)}`);
    }

    if (task.choices) {
        if (new Set(task.choices).size !== task.choices.length) {
            add('choices', `duplicates in ${JSON.stringify(task.choices)}`);
        }
        if (!Array.isArray(task.answer) && !task.choices.includes(task.answer)) {
            add('choices', `answer ${String(task.answer)} not among ${JSON.stringify(task.choices)}`);
        }
    }

    if (task.hint.length === 0) {
        add('hint', 'empty hint');
    }

    if (ctx.nouns) {
        const formIndex = new Map<string, { key: string; forms: PluralForms }>();
        for (const [key, forms] of Object.entries(ctx.nouns)) {
            for (const form of forms) {
                formIndex.set(form, { key, forms });
            }
        }
        for (const text of texts(task)) {
            for (const match of text.matchAll(NUMBER_WORD)) {
                const n = Number(match[1]);
                const entry = formIndex.get(match[2]);
                if (!entry) {
                    continue;
                }
                const expected = inflect(n, entry.forms);
                if (expected !== match[2]) {
                    add('inflection', `"${match[0]}" should be "${n} ${expected}"`);
                }
            }
        }
    }

    return out;
};
