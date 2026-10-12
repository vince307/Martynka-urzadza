// What the task scene draws for a round state: flags and text lines from the
// task data; fixed player-facing wording is mapped from `kind` by the scene.
import type { Outcome, RoundState } from '../round';
import type { Task } from '../tasks/types';
import { firstHint, solutionSteps } from './hints';

export interface RoundView {
    dots: { status: 'done' | 'current' | 'todo'; outcome: Outcome | null }[];
    input: 'tiles' | 'keypad';
    choices: (number | string)[];
    bar:
        | { kind: 'none' }
        | { kind: 'hint'; line: string | null }       // null: just "try again"
        | { kind: 'solution'; lines: string[]; button: 'next' | 'gotIt' }
        | { kind: 'retype'; line: string }
        | { kind: 'correct'; star: boolean };
    inputActive: boolean;
    switchVisible: boolean;                           // between tasks only: solved, before "Dalej" (FR-011)
}

const barOf = (state: RoundState, task: Task, answerLine: (answer: string) => string): RoundView['bar'] => {
    if (state.finished) {
        return { kind: 'none' };   // the summary layer takes over (summaryView)
    }
    switch (state.phase) {
        case 'first':
            return { kind: 'none' };
        case 'second':
            return { kind: 'hint', line: firstHint(task) };
        case 'solution': {
            // DESIGN-GAP: the kit offers "Pokaż kroki" after the first mistake; the plan walks the steps after the second (docs/design-gaps.md row 2).
            const steps = solutionSteps(task, answerLine);
            return {
                kind: 'solution',
                lines: steps.slice(0, state.solutionStep + 1),
                button: state.solutionStep + 1 < steps.length ? 'next' : 'gotIt',
            };
        }
        case 'retype':
            return { kind: 'retype', line: solutionSteps(task, answerLine).at(-1) ?? '' };
        case 'done':
            return { kind: 'correct', star: state.outcomes[state.index] !== 'retype' };
    }
};

export const roundView = (state: RoundState, answerLine: (answer: string) => string): RoundView => {
    const task = state.tasks[Math.min(state.index, state.tasks.length - 1)];
    return {
        dots: state.tasks.map((_, i) => ({
            // A settled task is green at once, before "Dalej" (kit correct.png).
            status: state.finished || i < state.index || (i === state.index && state.phase === 'done') ? 'done' : i === state.index ? 'current' : 'todo',
            outcome: state.outcomes[i],
        })),
        input: task.choices ? 'tiles' : 'keypad',
        choices: task.choices ? [...task.choices] : [],
        bar: barOf(state, task, answerLine),
        inputActive: !state.finished && ['first', 'second', 'retype'].includes(state.phase),
        switchVisible: !state.finished && state.phase === 'done',
    };
};
