// Origin: S-15 phase 6. "Hasło z wyników": the word, one task per letter, tasks of the learner's stage without a
// drawing, three answer tiles, letters uncovered by finished tasks.
import { describe, expect, it } from 'vitest';
import { startLearning } from '../src/core/curriculum';
import { buildWordRound, letterRow, revealed } from '../src/core/minigames/word';
import { createRng } from '../src/core/rng';
import { taskKey } from '../src/core/round/unique';
import { validateTask } from '../src/core/tasks/validate';
import type { SkillDef, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { GAME_WIDTH, MINIGAME_LAYOUT, PLACEHOLDER_FRAME } from '../src/data/layout';
import { stages } from '../src/data/curriculum';
import { MINIGAME_WORDS } from '../src/data/minigames';
import { nouns } from '../src/data/nouns';
import { placementData } from '../src/data/placement';
import { pl } from '../src/data/pl';
import { SEEDS } from './helpers';

const ALL: StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const stage = (id: StageId): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(`no stage ${id}`);
    return s;
};
const previousOf = (id: StageId): StageDef | undefined => (id === 'E1' ? undefined : stage(ALL[ALL.indexOf(id) - 1]));
const rules = { tiles: balance.variants.word.tiles, uniqueRetries: balance.round.uniqueRetries, words: MINIGAME_WORDS };
const WORD_TYPES = new Set(['ADD_SUB', 'MULT', 'DIV']);
const skillsById = (): Map<string, SkillDef> =>
    new Map(ALL.flatMap((id) => stage(id).steps.flatMap((s) => s.skills)).map((s) => [s.id, s]));
const learning = (month = 9) => startLearning(stages, 8, month, placementData, balance.curriculum);

describe('word data', () => {
    it('uses furniture captions of the salon, upper case', () => {
        const captions = Object.values(pl.room.slots).map((c) => c.toUpperCase());
        for (const w of MINIGAME_WORDS) {
            expect(captions, w).toContain(w);
            expect(w).toBe(w.toUpperCase());
        }
        // Polish letters in a word are covered by the `revealed('PÓŁKA')` test below: the words are the salon's furniture, not the letters.
    });

    // Plan-review F6: OBRAZKI has 7 letters, one more than the old longest word, so a round has 7 tasks and 7 boxes.
    it('fits the longest word\'s letter row in the canvas, inside the margin of the kit', () => {
        const longest = Math.max(...MINIGAME_WORDS.map((w) => Array.from(w).length));
        expect(longest).toBe(7);
        const { width, gap } = MINIGAME_LAYOUT.letters;
        const lefts = letterRow(longest, { width, gap }, MINIGAME_LAYOUT.letters.centerX);
        expect(lefts[0]).toBeGreaterThanOrEqual(PLACEHOLDER_FRAME.margin);
        expect(lefts[lefts.length - 1] + width).toBeLessThanOrEqual(GAME_WIDTH - PLACEHOLDER_FRAME.margin);
    });

    it.each(ALL)('%s: builds a round of the longest word with a task for every letter', (id) => {
        const longest = [...MINIGAME_WORDS].sort((a, b) => Array.from(b).length - Array.from(a).length)[0];
        for (let seed = 1; seed <= SEEDS; seed += 1) {
            const round = buildWordRound(stage(id), previousOf(id), learning(), createRng(seed), { ...rules, words: [longest] });
            expect(round, `${id} seed=${seed}`).not.toBeNull();
            expect(round!.word).toBe(longest);
            expect(round!.tasks).toHaveLength(Array.from(longest).length);
        }
    });
});

describe('buildWordRound', () => {
    it.each(ALL)('%s: one valid, drawing-free task per letter with 3 tiles', (id) => {
        const skills = skillsById();
        for (let seed = 1; seed <= SEEDS; seed += 1) {
            for (let i = 0; i < 5; i += 1) {
                const round = buildWordRound(stage(id), previousOf(id), learning(), createRng(seed * 100 + i), rules);
                const where = `${id} seed=${seed}/${i}`;
                expect(round, where).not.toBeNull();
                expect(MINIGAME_WORDS, where).toContain(round!.word);
                expect(round!.tasks, where).toHaveLength(Array.from(round!.word).length);
                for (const task of round!.tasks) {
                    const skill = skills.get(task.skillId);
                    expect(skill && WORD_TYPES.has(skill.type), `${where} ${task.skillId}`).toBe(true);
                    expect(task.visual, where).toBeUndefined();
                    expect(typeof task.answer, where).toBe('number');
                    expect(task.input, where).toBe('tiles');
                    expect(task.choices, where).toHaveLength(rules.tiles);
                    expect(task.choices, where).toContain(task.answer);
                    expect(validateTask(task, { nouns }), where).toEqual([]);
                }
            }
        }
    });

    it('stays in the learner\'s unlocked steps of the stage (or the previous stage on fallback)', () => {
        const skills = skillsById();
        const adaptation = learning();
        for (const id of ['E3', 'E4', 'E5'] as const) {
            const unlocked = adaptation.unlockedStep[id];
            for (let seed = 1; seed <= SEEDS; seed += 1) {
                const round = buildWordRound(stage(id), previousOf(id), adaptation, createRng(seed), rules)!;
                for (const task of round.tasks) {
                    const skill = skills.get(task.skillId)!;
                    const ok = (skill.stage === id && skill.step <= unlocked) || skill.stage !== id;
                    expect(ok, `${id} ${task.skillId} unlocked ${unlocked}`).toBe(true);
                }
            }
        }
    });

    it('draws different prompts inside a round', () => {
        for (let seed = 1; seed <= SEEDS; seed += 1) {
            const round = buildWordRound(stage('E4'), previousOf('E4'), learning(), createRng(seed), rules)!;
            const keys = round.tasks.map(taskKey);
            expect(new Set(keys).size, `seed ${seed}`).toBe(keys.length);
        }
    });

    it('is null when no word-capable skill exists in the stage or the one before', () => {
        const bare: StageDef = { id: 'E3', steps: [{ ...stage('E3').steps[0], skills: [] }] };
        expect(buildWordRound(bare, undefined, learning(), createRng(1), rules)).toBeNull();
    });

    it('never takes a task with a drawing: a stage of ruler skills only gives no round', () => {
        const clocks = ALL.flatMap((id) => stage(id).steps.flatMap((st) => st.skills)).filter((k) => k.type === 'LENGTH' && k.answer !== 'drag');
        expect(clocks.length).toBeGreaterThan(0);
        const drawn: StageDef = { id: 'E3', steps: [{ ...stage('E3').steps[0], step: 1, skills: clocks }] };
        expect(buildWordRound(drawn, undefined, { ...learning(), unlockedStep: { ...learning().unlockedStep, E3: 1 } }, createRng(3), rules)).toBeNull();
    });

    it('falls back to the first playable step of the stage with a word-capable type, then the previous stage', () => {
        const e3 = stage('E3');
        const noArith = (s: StageDef): StageDef => ({
            ...s,
            steps: s.steps.map((st) => ({ ...st, skills: st.skills.filter((k) => !WORD_TYPES.has(k.type)) })),
        });
        const lateOnly: StageDef = {
            ...e3,
            steps: e3.steps.map((st, i) => (i === 0 ? { ...st, skills: st.skills.filter((k) => !WORD_TYPES.has(k.type)) } : st)),
        };
        const adaptation = { ...learning(), unlockedStep: { ...learning().unlockedStep, E3: 1 } };
        const r1 = buildWordRound(lateOnly, previousOf('E3'), adaptation, createRng(5), rules);
        expect(r1).not.toBeNull();
        const skills = skillsById();
        expect(r1!.tasks.every((t) => WORD_TYPES.has(skills.get(t.skillId)!.type))).toBe(true);
        const r2 = buildWordRound(noArith(e3), previousOf('E3'), adaptation, createRng(5), rules);
        expect(r2).not.toBeNull();
        expect(r2!.tasks.every((t) => skills.get(t.skillId)!.stage === 'E2')).toBe(true);
    });
});

describe('revealed', () => {
    it('shows one more letter per finished task and keeps Polish letters whole', () => {
        expect(revealed('PÓŁKA', 0)).toEqual([null, null, null, null, null]);
        expect(revealed('PÓŁKA', 2)).toEqual(['P', 'Ó', null, null, null]);
        expect(revealed('PÓŁKA', 5)).toEqual(['P', 'Ó', 'Ł', 'K', 'A']);
        expect(revealed('PÓŁKA', 9)).toEqual(['P', 'Ó', 'Ł', 'K', 'A']);
    });
});
