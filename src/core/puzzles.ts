// LOGIC puzzles (docs/ZADANIA.md section 4): hand-written data turned into a Task
// that the round reducer runs unchanged.
import { STAGE_ORDER } from './placement';
import type { Task } from './tasks/types';
import type { StageId } from './types';

export type PuzzleKind = 'floors' | 'train' | 'number' | 'scale' | 'water';

export interface PuzzleDef {
    id: string;
    kind: PuzzleKind;
    stage: StageId;
    prompt: string;
    answer: number;
    choices?: readonly number[];
    hint: readonly [string, string];
}

export const puzzleTask = (def: PuzzleDef): Task => ({
    skillId: `PUZZLE.${def.id}`,
    prompt: def.prompt,
    answer: def.answer,
    ...(def.choices ? { choices: [...def.choices] } : {}),
    input: def.choices ? 'tiles' : 'keypad',
    hint: [...def.hint],
});

/** Puzzles a learner of `stageId` may get: those of its own and earlier stages, among the stages that have puzzles at all. */
export const puzzlePool = (stageId: StageId, puzzles: readonly PuzzleDef[], allowed: readonly StageId[]): PuzzleDef[] =>
    puzzles.filter((p) => allowed.includes(p.stage) && STAGE_ORDER.indexOf(p.stage) <= STAGE_ORDER.indexOf(stageId));
