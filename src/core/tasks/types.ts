// Task model from docs/ZADANIA.md, section 7. A generator is a pure function
// of the skill definition and a seeded rng, so tests can replay any task.
import type { Rng } from '../rng';
import type { SkillDef } from '../types';
import type { AnswerMode, TaskVisual } from './visual';

/** One value, a set of numbers (EVEN_ODD) or a set of face codes (SHAPES "all"). */
export type TaskAnswer = number | string | number[] | string[];

export interface Task {
    skillId: string;
    prompt: string;                      // player-facing text (Polish) or a bare expression
    speak?: string;                      // text for the narrator, when it differs from prompt
    visual?: TaskVisual;                 // drawing description (clock, ruler, blocks, bars, money, scale, jugs, thermometer, icons)
    hintVisual?: TaskVisual;             // number line that explains the hint steps (S-14b); shown from the second mistake, never gives the answer away
    input?: AnswerMode;                  // how the child answers; stamped by generateTask from the skill
    answer: TaskAnswer;
    choices?: (number | string)[];       // for tile answers
    hint: string[];                      // successive hint steps shown after a mistake
    check?: (input: unknown) => boolean; // tasks with several correct answers
    tileRange?: { min: number; max: number }; // tile values the generator knows to be possible, narrower than the skill bound
}

export type Generator = (skill: SkillDef, rng: Rng) => Task;
