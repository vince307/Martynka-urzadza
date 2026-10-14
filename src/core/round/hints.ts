// What the child sees after the first mistake and which steps the solution
// walks through. A hint line that already states the result must not be shown
// first ("Spróbuj jeszcze raz" is shown instead); the solution always ends
// with the result.
import type { Task } from '../tasks/types';
import { NUMBER_SOURCE, parseNumber } from '../text/formatNumber';

/** Task types whose first hint line is not the result even though it ends with a number equal to it (the interval "37 jest między 30 a 40"). */
export const FIRST_HINT_EXEMPT_TYPES: readonly string[] = ['ROUNDING'];

/** Task type from the skill id (`E4.4.rounding_ten` -> `ROUNDING`). */
const typeOfSkillId = (skillId: string): string => {
    const name = skillId.split('.').pop() ?? '';
    return FIRST_HINT_EXEMPT_TYPES.find((type) => name.toUpperCase().startsWith(`${type}_`)) ?? '';
};

/** A number with an attached minus sign ("−5" is negative, "10 − 4" has two positive operands). */
const SIGNED_NUMBER = new RegExp(`(?<![\\p{L}\\p{N}])[-\u2212]?(?:${NUMBER_SOURCE})`, 'gu');

const lastNumber = (line: string): number | undefined => {
    const all = line.match(SIGNED_NUMBER);
    if (!all || all.length === 0) {
        return undefined;
    }
    const last = all[all.length - 1];
    return /^[-\u2212]/.test(last) ? -parseNumber(last.slice(1)) : parseNumber(last);
};

/** An open expression ("18 − 9"): its last number is an operand, the result is not stated. */
const OPEN_EXPRESSION = new RegExp(`[+−·:] (?:${NUMBER_SOURCE})$`);

/** A text answer made of letters or digits ("15.00", "3 zł 40 gr"); a bare sign ("<") is shown by the tiles and never judged. */
const WORDLIKE_TEXT = /[\p{L}\p{N}]/u;

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The answer as a whole token: "1.00" is not found inside "11.00" or "1.005", "3 zł" not inside "13 zł". */
const containsToken = (line: string, text: string): boolean =>
    new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(text)}(?![\\p{L}\\p{N}])`, 'u').test(line);

/**
 * A line gives the result away when its last number is the numeric answer, or when it states a text answer (a time, an amount)
 * as a whole token. Sign and set answers are never judged: a middle-of-line number equal to the
 * answer (an operand) is not a leak either, nor is the last operand of an
 * expression without "=" ("18 − 9" for 9 + □ = 18).
 */
const leaksAnswer = (task: Task, line: string): boolean =>
    typeof task.answer === 'number'
        ? lastNumber(line) === task.answer && !(!line.includes('=') && OPEN_EXPRESSION.test(line))
        : typeof task.answer === 'string' && WORDLIKE_TEXT.test(task.answer) && containsToken(line, task.answer);

/** Hint for the first wrong answer, or null when the child should just try again. */
export const firstHint = (task: Task): string | null => {
    if (task.hint.length < 2) {
        return null;
    }
    const first = task.hint[0];
    if (typeOfSkillId(task.skillId) !== '' || !leaksAnswer(task, first)) {
        return first;
    }
    return null;
};

/** Every hint line, closed by an answer line when the last one does not state the result. */
export const solutionSteps = (task: Task, answerLine: (answer: string) => string): string[] => {
    const steps = [...task.hint];
    const last = steps[steps.length - 1] ?? '';
    const answer = task.answer;
    const closed =
        typeof answer === 'number'
            ? lastNumber(last) === answer
            : typeof answer === 'string'
              ? last.includes(answer)
              : true;
    if (!closed) {
        steps.push(answerLine(Array.isArray(answer) ? answer.join(', ') : String(answer)));
    }
    return steps;
};
