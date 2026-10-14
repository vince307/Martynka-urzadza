// "Hasło z wyników": a word whose letters are uncovered by finished tasks.
import type { Rng } from '../rng';
import { playable } from '../round/pick';
import { taskKey } from '../round/unique';
import { generateTask } from '../tasks/generateTask';
import type { Task } from '../tasks/types';
import type { Adaptation, SkillDef, StageDef } from '../types';

export interface WordRules {
    readonly tiles: number;
    readonly uniqueRetries: number;
    readonly words: readonly string[];
}

export interface WordRound {
    word: string;
    tasks: Task[];
}

const WORD_TYPES: ReadonlySet<string> = new Set(['ADD_SUB', 'MULT', 'DIV']);
const DRAW_TRIES = 12;

/** Arithmetic with a number answer, tapped or typed; the drawing is checked on the generated task. */
const eligible = (skill: SkillDef): boolean =>
    WORD_TYPES.has(skill.type) && (skill.answer === 'tiles' || skill.answer === 'keypad') && playable(skill);

const skillsOf = (stage: StageDef, take: (step: number) => boolean): SkillDef[] =>
    stage.steps.filter((st) => take(st.step)).flatMap((st) => st.skills.filter(eligible));

/** A task of the skill as three answer tiles; null when it comes with a drawing or no number answer. */
const drawTask = (skill: SkillDef, rng: Rng, tiles: number): Task | null => {
    const task = generateTask({ ...skill, answer: 'tiles' }, rng, { tileCount: tiles });
    return task.visual === undefined && typeof task.answer === 'number' && task.choices !== undefined ? task : null;
};

const drawRound = (pool: readonly SkillDef[], count: number, rng: Rng, rules: WordRules): Task[] | null => {
    const tasks: Task[] = [];
    const seen = new Set<string>();
    for (let n = 0; n < count; n += 1) {
        let chosen: Task | null = null;
        for (let attempt = 0; attempt < rules.uniqueRetries + DRAW_TRIES; attempt += 1) {
            const task = drawTask(rng.pick(pool), rng, rules.tiles);
            if (task === null) continue;
            chosen = task;
            if (!seen.has(taskKey(task))) break;
        }
        if (chosen === null) return null;
        seen.add(taskKey(chosen));
        tasks.push(chosen);
    }
    return tasks;
};

/**
 * The word and one task per letter. Skills come from the learner's unlocked steps of the stage; without any, from the
 * first step of the stage that has some, then from the previous stage. Null when no pool can make a round.
 */
export const buildWordRound = (
    stage: StageDef,
    previous: StageDef | undefined,
    adaptation: Adaptation,
    rng: Rng,
    rules: WordRules,
): WordRound | null => {
    if (rules.words.length === 0) return null;
    const unlocked = adaptation.unlockedStep[stage.id] ?? 1;
    const own = skillsOf(stage, (step) => step <= unlocked);
    const firstStep = stage.steps.find((st) => st.skills.some(eligible))?.step;
    const pools = [own, firstStep === undefined ? [] : skillsOf(stage, (step) => step === firstStep), previous ? skillsOf(previous, () => true) : []];
    const word = rng.pick(rules.words);
    const count = Array.from(word).length;
    for (const pool of pools) {
        if (pool.length === 0) continue;
        const tasks = drawRound(pool, count, rng, rules);
        if (tasks) return { word, tasks };
    }
    return null;
};

/** One entry per letter: the letter when uncovered, null while hidden. */
export const revealed = (word: string, completed: number): (string | null)[] =>
    Array.from(word).map((letter, i) => (i < completed ? letter : null));

/** Whether a word round can be built for the stage: the pools of `buildWordRound`, without drawing anything. */
export const wordAvailable = (stage: StageDef, previous: StageDef | undefined, adaptation: Adaptation, words: readonly string[]): boolean => {
    if (words.length === 0) return false;
    const unlocked = adaptation.unlockedStep[stage.id] ?? 1;
    return skillsOf(stage, (step) => step <= unlocked).length > 0
        || stage.steps.some((st) => st.skills.some(eligible))
        || (previous !== undefined && skillsOf(previous, () => true).length > 0);
};

/** How many letters are uncovered: one per finished task (a task settled by the solution and retyping counts too). */
export const lettersUncovered = (outcomes: readonly (string | null)[]): number => outcomes.filter((o) => o !== null).length;

/** Left edges of the `count` letter boxes, `width` wide and `gap` apart, centred on `centerX`. */
export const letterRow = (count: number, box: { width: number; gap: number }, centerX: number): number[] => {
    const total = count * box.width + Math.max(0, count - 1) * box.gap;
    const left = centerX - total / 2;
    return Array.from({ length: count }, (_, i) => left + i * (box.width + box.gap));
};
