// What the task scene draws for a round state: flags and text lines from the
// task data; fixed player-facing wording is mapped from `kind` by the scene.
import type { Outcome, RoundState } from '../round';
import type { Task } from '../tasks/types';
import type { AnswerMode, TaskVisual } from '../tasks/visual';
import { firstHint, solutionSteps } from './hints';

export interface RoundView {
    dots: { status: 'done' | 'current' | 'todo'; outcome: Outcome | null }[];
    input: AnswerMode;
    visual: TaskVisual | null;
    hintPicture: TaskVisual | null;
    choices: (number | string)[];
    bar:
        | { kind: 'none' }
        | { kind: 'hint'; line: string | null }       // null: just "try again"
        | { kind: 'solution'; lines: string[]; button: 'next' | 'gotIt' }
        | { kind: 'retype'; line: string }
        | { kind: 'correct'; stars: number };            // the stars this task paid (0 after a retype; 2 for the daily puzzle)
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
            return { kind: 'hint', line: state.notes[state.index] ?? firstHint(task) };
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
            return { kind: 'correct', stars: state.outcomes[state.index] === 'retype' ? 0 : state.rules.starPerTask };
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
        input: task.input ?? (task.choices ? 'tiles' : 'keypad'),   // the fallback serves hand-built tasks in tests
        visual: task.visual ?? null,
        hintPicture: ['second', 'solution', 'retype'].includes(state.phase) && !state.finished ? (task.hintVisual ?? null) : null,
        choices: task.choices ? [...task.choices] : [],
        bar: barOf(state, task, answerLine),
        inputActive: !state.finished && ['first', 'second', 'retype'].includes(state.phase),
        switchVisible: !state.finished && state.phase === 'done',
    };
};

/** Which input widgets an answer mode shows; the one place that maps a mode to its widgets (the switch is exhaustive). */
export const modeWidgets = (input: AnswerMode): { tiles: boolean; keypad: boolean; select: boolean } => {
    switch (input) {
        case 'tiles': return { tiles: true, keypad: false, select: false };
        case 'keypad': case 'digits': return { tiles: false, keypad: true, select: false };
        case 'select': return { tiles: false, keypad: false, select: true };
        case 'drag': return { tiles: false, keypad: false, select: false };
        default: { const unreachable: never = input; return unreachable; }
    }
};
