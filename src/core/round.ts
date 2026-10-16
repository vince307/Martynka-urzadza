// Round state machine: one pure reducer per player action, no Phaser. Phases
// per task: first try -> second try -> solution steps -> retype (no star) ->
// done. Stars follow PRD FR-007: 1 per task solved on the first or second try,
// a bonus for a round without a mistake, and they never decrease.
import { solutionSteps } from './round/hints';
import type { SkillResult } from './mastery';
import { faceText } from './tasks/faces';
import { formatMoney } from './text/measure';
import type { Task } from './tasks/types';

export type RoundPhase = 'first' | 'second' | 'solution' | 'retype' | 'done';
export type Outcome = 'first' | 'second' | 'retype';

/** Numbers of a round; they come from data/balance.ts as arguments. */
export interface RoundRules {
    length: number;
    starPerTask: number;
    cleanRoundBonus: number;
}

export interface RoundState {
    readonly tasks: readonly Task[];
    readonly rules: RoundRules;
    readonly index: number;
    readonly phase: RoundPhase;
    readonly solutionStep: number;
    readonly outcomes: readonly (Outcome | null)[];
    /** The first wrong value per task (number or tile text), kept for the parent's mistake examples; null when none. */
    readonly firstWrong: readonly (number | string | null)[];
    readonly starsEarned: number;
    readonly bonusEarned: number;
    readonly finished: boolean;
}

export const startRound = (tasks: readonly Task[], rules: RoundRules): RoundState => {
    const played = tasks.slice(0, rules.length);
    return {
        tasks: played,
        rules,
        index: 0,
        phase: 'first',
        solutionStep: 0,
        outcomes: played.map(() => null),
        firstWrong: played.map(() => null),
        starsEarned: 0,
        bonusEarned: 0,
        finished: played.length === 0,
    };
};

const sameSet = (a: readonly unknown[], b: readonly unknown[]): boolean =>
    a.length === b.length && a.every((x) => b.includes(x)) && b.every((x) => a.includes(x));

/** `check` wins; two lists are the same set in any order (a `select` answer), everything else is strict equality. */
const isCorrect = (task: Task, input: unknown): boolean => {
    if (task.check) return task.check(input);
    if (Array.isArray(task.answer) && Array.isArray(input)) return sameSet(task.answer, input);
    return input === task.answer;
};

const settle = (state: RoundState, outcome: Outcome): RoundState => {
    const outcomes = state.outcomes.map((o, i) => (i === state.index ? outcome : o));
    const paid = outcome === 'retype' ? 0 : state.rules.starPerTask;
    return { ...state, phase: 'done', outcomes, starsEarned: state.starsEarned + paid };
};

const isWallet = (task: Task): boolean => task.visual?.kind === 'money' && task.visual.pay !== undefined;

/** A wallet as text: each coin as money, largest first ("2 zł, 2 zł, 1 zł"). */
const walletText = (coins: readonly number[]): string =>
    [...coins].sort((a, b) => b - a).map(formatMoney).join(', ');

/**
 * What the parent's example keeps of a wrong try: a number or a text stays as it is, a wallet becomes money, a select
 * answer becomes the words of its tiles in the order of `task.choices`; anything else leaves no example (null).
 * The saved field stays a number or a string (save format v4).
 * DESIGN-GAP 123: the kit's progress preview shows no list answer, so it is one line of text.
 */
export const exampleValue = (task: Task, value: unknown): number | string | null => {
    if (typeof value === 'number' || typeof value === 'string') return value;
    if (!Array.isArray(value) || value.length === 0) return null;
    if (isWallet(task) && value.every((c) => typeof c === 'number')) return walletText(value);
    if (task.input === 'select' && value.every((v) => typeof v === 'number' || typeof v === 'string')) {
        const chosen = task.choices ? task.choices.filter((c) => value.includes(c)) : (value);
        return chosen.map((c) => String(faceText(c))).join(', ');
    }
    return null;
};

const captureFirstWrong = (state: RoundState, input: unknown): RoundState['firstWrong'] => {
    const value = exampleValue(state.tasks[state.index], input);
    return value === null ? state.firstWrong : state.firstWrong.map((w, i) => (i === state.index ? value : w));
};

/** A child's answer: in `first`, `second` and `retype` only; any other phase returns the same state. */
export const answer = (state: RoundState, input: unknown): RoundState => {
    if (state.finished) {
        return state;
    }
    const correct = isCorrect(state.tasks[state.index], input);
    switch (state.phase) {
        case 'first':
            return correct ? settle(state, 'first') : { ...state, phase: 'second', firstWrong: captureFirstWrong(state, input) };
        case 'second':
            return correct ? settle(state, 'second') : { ...state, phase: 'solution', solutionStep: 0 };
        case 'retype':
            return correct ? settle(state, 'retype') : state;
        default:
            return state;
    }
};

/** Advances the solution walk-through; after the last step the child retypes the result. */
export const nextSolutionStep = (state: RoundState): RoundState => {
    if (state.phase !== 'solution' || state.finished) {
        return state;
    }
    const steps = solutionSteps(state.tasks[state.index], String).length;
    return state.solutionStep + 1 < steps
        ? { ...state, solutionStep: state.solutionStep + 1 }
        : { ...state, phase: 'retype' };
};

/** "Dalej": next task, or the end of the round with the clean-round bonus. */
export const next = (state: RoundState): RoundState => {
    if (state.phase !== 'done' || state.finished) {
        return state;
    }
    if (state.index + 1 < state.tasks.length) {
        return { ...state, index: state.index + 1, phase: 'first', solutionStep: 0 };
    }
    const clean = state.outcomes.every((o) => o === 'first');
    const bonus = clean ? state.rules.cleanRoundBonus : 0;
    return { ...state, finished: true, bonusEarned: bonus, starsEarned: state.starsEarned + bonus };
};

/** The parent reads the answer in words: faces become their description, a list of faces one line (the saved shape stays v2). */
const exampleAnswer = (task: Task): number | string | number[] => {
    const answer = task.answer;
    if (isWallet(task) && Array.isArray(answer)) return walletText(answer as number[]);
    return Array.isArray(answer) && answer.some((a) => typeof a === 'string') ? answer.map((a) => String(faceText(a))).join(', ') : typeof answer === 'string' ? String(faceText(answer)) : (answer as number | number[]);
};

/** Per-task results of a round for `recordRound`; a miss carries its first wrong try as the parent's example. */
export const roundResults = (state: RoundState): SkillResult[] =>
    state.tasks.map((task, i): SkillResult => {
        const outcome = state.outcomes[i];
        const given = state.firstWrong[i];
        return outcome !== null && outcome !== 'first' && given !== null
            ? { skillId: task.skillId, outcome, example: { prompt: task.prompt, given: faceText(given), answer: exampleAnswer(task) } }
            : { skillId: task.skillId, outcome };
    });
