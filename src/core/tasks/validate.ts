// Mechanical checks shared by the 1000-draw tests and scripts/sample.ts
// (PRD FR-005): result range, negative numbers, tile choices, hints and Polish
// numeral agreement for nouns from a dictionary.
import { NUMBER_SOURCE, parseNumber } from '../text/formatNumber';
import { inflect, type PluralForms } from '../text/plural';
import { dragMode } from './dragMode';
import type { Task } from './types';
import { validateVisual } from './visual';

export type ViolationRule = 'range' | 'negative' | 'choices' | 'inflection' | 'hint' | 'visual' | 'mode';

export interface Violation {
    skillId: string;
    rule: ViolationRule;
    detail: string;
}

export interface ValidationContext {
    /** Upper bound for a numeric answer (typically params.max). */
    max?: number;
    /** Negative numbers are the content (a temperature below zero): the answer, tile choices and texts may carry a minus. */
    allowNegative?: boolean;
    /** Nouns whose agreement with a preceding number is checked. */
    nouns?: Readonly<Record<string, PluralForms>>;
}

/**
 * A negative number where a result or a list item would be: a minus (hyphen
 * or U+2212) followed by a digit at the start of a text or after "=", "(",
 * "," or ":". Binary operators ("10 − 4"), placeholders ("□ − 7") and prose
 * mentions of temperatures are left to the answer check.
 */
const NEGATIVE_NUMBER = /(?:^|[=(,:;])\s*[-−]\s?\d/;
const NUMBER_WORD = new RegExp(`(${NUMBER_SOURCE})\\s+(\\p{L}+)`, 'gu');
/**
 * "ma 1 cyfra": the object of these verbs (and of "o … więcej") takes the
 * accusative, which differs from the nominative for feminine nouns in -a
 * ("1 cyfrę", "1 naklejkę", "za 1 godzinę"). Masculine and neuter singular objects look the same.
 */
const ACCUSATIVE_ONE = /(?:^|\s)(ma|mają|miał|miała|kupił|kupiła|oddał|oddała|dostał|dostała|zabrano|dołożono|o|za) 1 (\p{L}+)/gu;

/** Task types whose answers and texts may be negative. */
export const NEGATIVE_TYPES: ReadonlySet<string> = new Set(['TEMPERATURE']);

const texts = (task: Task): string[] => [task.prompt, ...(task.speak ? [task.speak] : []), ...task.hint];

export const validateTask = (task: Task, ctx: ValidationContext = {}): Violation[] => {
    const out: Violation[] = [];
    const add = (rule: ViolationRule, detail: string): void => {
        out.push({ skillId: task.skillId, rule, detail });
    };

    if (typeof task.answer === 'number') {
        if (task.answer < 0 && !ctx.allowNegative) {
            add('negative', `answer ${task.answer}`);
        }
        if (ctx.max !== undefined && ((task.answer < 0 && !ctx.allowNegative) || task.answer > ctx.max)) {
            add('range', `answer ${task.answer} outside ${ctx.allowNegative ? '…' : '0'}..${ctx.max}`);
        }
    }

    for (const text of texts(task)) {
        if (!ctx.allowNegative && NEGATIVE_NUMBER.test(text)) {
            add('negative', `"${text}"`);
        }
    }
    if (!ctx.allowNegative && task.choices?.some((c) => typeof c === 'number' && c < 0)) {
        add('negative', `choices ${JSON.stringify(task.choices)}`);
    }

    if (task.choices) {
        if (new Set(task.choices).size !== task.choices.length) {
            add('choices', `duplicates in ${JSON.stringify(task.choices)}`);
        }
        const answers: readonly (number | string)[] = Array.isArray(task.answer) ? task.answer : [task.answer];
        for (const a of answers) {
            if (!task.choices.includes(a)) {
                add('choices', `answer ${String(a)} not among ${JSON.stringify(task.choices)}`);
            }
        }
    }

    if (task.visual) {
        for (const problem of validateVisual(task.visual)) {
            add('visual', problem);
        }
    }

    if (task.input === 'digits') {
        // Phase 2 adds the `column` drawing and relaxes this to "digits needs a column drawing"; until then no digits task is valid.
        add('mode', 'digits needs a column drawing');
    }

    if (task.input === 'drag') {
        try {
            dragMode(task);
        } catch (e) {
            add('mode', e instanceof Error ? e.message : String(e));
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
                const n = parseNumber(match[1] ?? '');
                const entry = formIndex.get(match[2]);
                if (!entry) {
                    continue;
                }
                const expected = inflect(n, entry.forms);
                if (expected !== match[2]) {
                    add('inflection', `"${match[0]}" should be "${n} ${expected}"`);
                }
            }
            for (const match of text.matchAll(ACCUSATIVE_ONE)) {
                const entry = formIndex.get(match[2]);
                if (entry && match[2] === entry.forms[0] && match[2].endsWith('a')) {
                    add('inflection', `"${match[0].trim()}" needs the accusative after "${match[1]}"`);
                }
            }
        }
    }

    return out;
};
