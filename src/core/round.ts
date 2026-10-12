// Round state machine: one pure reducer per player action, no Phaser. Phases
// per task: first try -> second try -> solution steps -> retype (no star) ->
// done. Stars follow PRD FR-007: 1 per task solved on the first or second try,
// a bonus for a round without a mistake, and they never decrease.
import { solutionSteps } from './round/hints';
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
        starsEarned: 0,
        bonusEarned: 0,
        finished: played.length === 0,
    };
};

const isCorrect = (task: Task, input: unknown): boolean => (task.check ? task.check(input) : input === task.answer);

const settle = (state: RoundState, outcome: Outcome): RoundState => {
    const outcomes = state.outcomes.map((o, i) => (i === state.index ? outcome : o));
    const paid = outcome === 'retype' ? 0 : state.rules.starPerTask;
    return { ...state, phase: 'done', outcomes, starsEarned: state.starsEarned + paid };
};

/** A child's answer: in `first`, `second` and `retype` only; any other phase returns the same state. */
export const answer = (state: RoundState, input: unknown): RoundState => {
    if (state.finished) {
        return state;
    }
    const correct = isCorrect(state.tasks[state.index], input);
    switch (state.phase) {
        case 'first':
            return correct ? settle(state, 'first') : { ...state, phase: 'second' };
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
