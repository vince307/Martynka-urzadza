// What the child sees after the first mistake and which steps the solution
// walks through. A hint line that already states the result must not be shown
// first ("Spróbuj jeszcze raz" is shown instead); the solution always ends
// with the result.
import type { Task } from '../tasks/types';
import { NUMBER_SOURCE, parseNumber } from '../text/formatNumber';

/** Task types whose first hint line is not the result even though it ends with a number equal to it (the interval "37 jest między 30 a 40"). */
export const FIRST_HINT_EXEMPT_TYPES: readonly string[] = ['ROUNDING'];

const NUMBER = new RegExp(NUMBER_SOURCE, 'g');

/** Task type from the skill id (`E4.4.rounding_ten` -> `ROUNDING`). */
const typeOfSkillId = (skillId: string): string => {
    const name = skillId.split('.').pop() ?? '';
    return FIRST_HINT_EXEMPT_TYPES.find((type) => name.toUpperCase().startsWith(`${type}_`)) ?? '';
};

const lastNumber = (line: string): number | undefined => {
    const all = line.match(NUMBER);
    return all && all.length > 0 ? parseNumber(all[all.length - 1]) : undefined;
};

/** An open expression ("18 − 9"): its last number is an operand, the result is not stated. */
const OPEN_EXPRESSION = new RegExp(`[+−·:] (?:${NUMBER_SOURCE})$`);

/** A clock answer as the school writes it ("15.00", "7.05"); only these text answers are judged as leaks. */
const TIME_TEXT = /^\d{1,2}\.\d{2}$/;

/** The time as a whole token: "1.00" is not found inside "11.00" or "1.005". */
const containsTime = (line: string, time: string): boolean => new RegExp(`(?<![\\d.])${time.replace('.', '\\.')}(?!\\d)`).test(line);

/**
 * A line gives the result away when its last number is the numeric answer.
 * String and set answers are never judged: a middle-of-line number equal to the
 * answer (an operand) is not a leak either, nor is the last operand of an
 * expression without "=" ("18 − 9" for 9 + □ = 18).
 */
const leaksAnswer = (task: Task, line: string): boolean =>
    typeof task.answer === 'number'
        ? lastNumber(line) === task.answer && !(!line.includes('=') && OPEN_EXPRESSION.test(line))
        : typeof task.answer === 'string' && TIME_TEXT.test(task.answer) && containsTime(line, task.answer);

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
