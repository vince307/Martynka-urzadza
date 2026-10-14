// "Zakrywanka": 13 throws of two dice, one per result 0..12, each target covered once.
import type { Rng } from '../rng';
import type { Task } from '../tasks/types';

export interface DiceRules {
    readonly throws: number;
    readonly max: number;
}

export interface DiceText {
    addHint: string;
    subHint: string;
    addStepHint: (a: number, b: number) => string;
    subStepHint: (a: number, b: number) => string;
}

export interface DiceThrow {
    a: number;
    b: number;
    op: '+' | '-';
    target: number;
    task: Task;
}

const FACES = 6;
const MINUS = '−';

const makeThrow = (target: number, rng: Rng, text: DiceText): DiceThrow => {
    // 2..5 can be a sum or a difference, 0 and 1 only a difference, 6..12 only a sum.
    const subtract = target <= 1 || (target <= FACES - 1 && rng.chance(0.5));
    let a: number;
    let b: number;
    if (subtract) {
        b = rng.int(1, FACES - target);
        a = b + target;
    } else {
        a = rng.int(Math.max(1, target - FACES), Math.min(FACES, target - 1));
        b = target - a;
    }
    const task: Task = {
        skillId: 'DICE',
        prompt: `${a} ${subtract ? MINUS : '+'} ${b}`,
        answer: target,
        hint: subtract ? [text.subHint, text.subStepHint(a, b)] : [text.addHint, text.addStepHint(a, b)],
    };
    return { a, b, op: subtract ? '-' : '+', target, task };
};

/** One throw per result 0..`rules.max`, in a random order of targets (`rules.throws` equals the number of results). */
export const diceBoard = (rng: Rng, rules: DiceRules, text: DiceText): DiceThrow[] => {
    const targets = rng.shuffle(Array.from({ length: Math.min(rules.throws, rules.max + 1) }, (_, i) => i));
    return targets.map((target) => makeThrow(target, rng, text));
};

/** Fields covered after the first `completed` throws were finished (solved or shown), sorted. */
export const coveredAfter = (board: readonly DiceThrow[], completed: number): number[] =>
    board.slice(0, Math.max(0, completed)).map((t) => t.target).sort((x, y) => x - y);
