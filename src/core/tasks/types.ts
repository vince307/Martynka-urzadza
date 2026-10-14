// Task model from docs/ZADANIA.md, section 7. A generator is a pure function
// of the skill definition and a seeded rng, so tests can replay any task.
import type { Rng } from '../rng';
import type { SkillDef } from '../types';
import type { AnswerMode, TaskVisual } from './visual';

export interface Task {
    skillId: string;
    prompt: string;                      // player-facing text (Polish) or a bare expression
    speak?: string;                      // text for the narrator, when it differs from prompt
    visual?: TaskVisual;                 // drawing description (clock, ruler, blocks, bars, money, scale, jugs, thermometer, icons)
    input?: AnswerMode;                  // how the child answers; stamped by generateTask from the skill
    answer: number | string | number[];
    choices?: (number | string)[];       // for tile answers
    hint: string[];                      // successive hint steps shown after a mistake
    check?: (input: unknown) => boolean; // tasks with several correct answers
    tileRange?: { min: number; max: number }; // tile values the generator knows to be possible, narrower than the skill bound
}

export type Generator = (skill: SkillDef, rng: Rng) => Task;
