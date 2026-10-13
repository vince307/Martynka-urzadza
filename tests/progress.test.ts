// Origin: S-08 phase 5. Parent progress preview, typed from the plan (PRD FR-015 / US-03: "the current step of the
// stage and the 3 weakest skills"; plan decisions 4, 5, 13). Candidates = playable skills of the CURRENT stage with at
// least one first-try miss; order: mastery ascending, first-try misses descending, newer miss first, curriculum order.
// Histories are built by hand; expected values are written from that rule, not read from the implementation.
import { describe, expect, it } from 'vitest';
import { currentStep } from '../src/core/curriculum';
import { progressView, type ProgressRules } from '../src/core/progress';
import type { Adaptation, MistakeExample, StageDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';

const RULES: ProgressRules = { mastery: { max: 5 }, view: { weakestCount: 3, examplesPerSkill: 2 } };
const E3 = stages.E3 as StageDef;

// E3 playable skills in curriculum order (step: id): 1 word_20 / compare_diff_20, 2 add_sub_20_bridge / missing_20,
// 6 add_sub_30_nobridge, 7 even_odd_30 / number_words_30, 8 add_sub_30_bridge, 9 mult_30 / word_groups_30, ...
const W = 'E3.1.word_20';
const B = 'E3.2.add_sub_20_bridge';
const C = 'E3.6.add_sub_30_nobridge';
const D = 'E3.7.even_odd_30';
const E = 'E3.9.mult_30';
const OTHER_STAGE = 'E2.3.add_bridge_20';

type Entry = Adaptation['history'][number];
const miss = (skillId: string, at: number, example?: MistakeExample): Entry => ({ skillId, ok: false, firstTry: false, at, ...(example ? { example } : {}) });
const hit = (skillId: string, at: number): Entry => ({ skillId, ok: true, firstTry: true, at });
const second = (skillId: string, at: number): Entry => ({ skillId, ok: true, firstTry: false, at });
const learner = (history: Entry[], mastery: Record<string, number> = {}, unlocked = 11): Adaptation => ({
    unlockedStep: { E3: unlocked } as Adaptation['unlockedStep'],
    mastery,
    streak: {},
    history,
    weakStreak: 0,
    easedRounds: 0,
});
const ids = (a: Adaptation): string[] => progressView(E3, a, RULES).weakest.map((w) => w.skillId);

describe('currentStep and the step line', () => {
    it('counts only playable steps: E3 has 11, step 11 is the 11th', () => {
        expect(progressView(E3, learner([], {}, 11), RULES).step).toEqual({ index: 11, total: 11, title: E3.steps.find((s) => s.step === 11)?.title });
    });

    it('starts at 1 of 11 on the first playable step and takes the title from the step', () => {
        const view = progressView(E3, learner([], {}, 1), RULES);
        expect(view.step.index).toBe(1);
        expect(view.step.total).toBe(11);
        expect(view.step.title).toBe('Powtórka do 20, budowa zadania tekstowego, „o ile więcej / mniej”');
    });

    it('an unplayable unlocked step (E5 step 5) counts as the nearest lower playable one (4 = 4th of 10)', () => {
        const E5 = stages.E5 as StageDef;
        expect(currentStep(E5, 5)).toBe(4);
        const view = progressView(E5, { ...learner([], {}, 5), unlockedStep: { E5: 5 } as Adaptation['unlockedStep'] }, RULES);
        expect(view.step.index).toBe(4);
        expect(view.step.total).toBe(10);
    });

    it('below the first playable step it is the first', () => {
        expect(currentStep(E3, 0)).toBe(1);
    });
});

describe('progressView weakest', () => {
    it('is empty with no history', () => {
        expect(progressView(E3, learner([]), RULES).weakest).toEqual([]);
    });

    it('is empty when every answer was right on the first try, whatever the mastery', () => {
        expect(ids(learner([hit(W, 1), hit(W, 2)], { [W]: 0 }))).toEqual([]);
    });

    it('a second-try answer is a first-try miss and makes a candidate (ok is not the criterion)', () => {
        expect(ids(learner([second(W, 1)]))).toEqual([W]);
    });

    it('ignores history of another stage', () => {
        expect(ids(learner([miss(OTHER_STAGE, 1), miss('E4.1.nothing', 2)]))).toEqual([]);
        expect(ids(learner([miss(OTHER_STAGE, 1), miss(W, 2)]))).toEqual([W]);
    });

    it('ranks lower mastery first even with fewer misses', () => {
        expect(ids(learner([miss(W, 1), miss(W, 2), miss(W, 3), miss(B, 4)], { [W]: 2, [B]: 1 }))).toEqual([B, W]);
    });

    it('with equal mastery ranks more first-try misses first', () => {
        expect(ids(learner([miss(W, 1), miss(B, 2), miss(B, 3)], { [W]: 1, [B]: 1 }))).toEqual([B, W]);
    });

    it('with equal mastery and misses ranks the newer miss first', () => {
        expect(ids(learner([miss(W, 5), miss(B, 9)], {}))).toEqual([B, W]);
    });

    it('with everything equal keeps curriculum order', () => {
        expect(ids(learner([miss(E, 7), miss(C, 7), miss(W, 7)]))).toEqual([W, C, E]);
    });

    it('takes three of five candidates by the full rule', () => {
        const history = [miss(W, 1), miss(W, 2), miss(W, 3), miss(W, 4), miss(B, 5), miss(C, 6), miss(C, 7), miss(C, 8), miss(D, 9), miss(E, 9)];
        // mastery: W 1 (4 misses) ranks last despite most misses; B, C, D, E at 0: C (3 misses), then B(at 5) / D(at 9) / E(at 9)
        expect(ids(learner(history, { [W]: 1 }))).toEqual([C, D, E]);
    });

    it('a mastered skill with a first-try miss is still a candidate, after the weaker ones', () => {
        expect(ids(learner([miss(W, 1), miss(B, 2)], { [W]: 5, [B]: 0 }))).toEqual([B, W]);
    });

    it('lists mastery, the maximum and the step title of the skill', () => {
        const [first] = progressView(E3, learner([miss(C, 1)], { [C]: 3 }), RULES).weakest;
        expect(first).toMatchObject({ skillId: C, mastery: 3, max: 5, title: 'Liczby 21–30, + i − do 30 bez przekroczenia' });
    });

    it('uses weakestCount from the rules', () => {
        const history = [miss(W, 1), miss(B, 2), miss(C, 3)];
        expect(progressView(E3, learner(history), { ...RULES, view: { weakestCount: 2, examplesPerSkill: 2 } }).weakest).toHaveLength(2);
    });

    it('balance.parentSettings gives 3 weakest skills with up to 2 examples (FR-015)', () => {
        expect(balance.parentSettings.weakestCount).toBe(3);
        expect(balance.parentSettings.examplesPerSkill).toBe(2);
    });
});

describe('progressView examples', () => {
    const ex = (prompt: string, given: MistakeExample['given'], answer: MistakeExample['answer']): MistakeExample => ({ prompt, given, answer });
    const examplesOf = (history: Entry[], per = 2) =>
        progressView(E3, learner(history), { ...RULES, view: { weakestCount: 3, examplesPerSkill: per } }).weakest[0].examples;

    it('is empty for a skill whose misses carry no example', () => {
        expect(examplesOf([miss(W, 1)])).toEqual([]);
    });

    it('shows the 2 newest examples, newest first', () => {
        const history = [miss(W, 1, ex('1 + 1', 3, 2)), miss(W, 3, ex('3 + 3', 7, 6)), miss(W, 2, ex('2 + 2', 5, 4))];
        expect(examplesOf(history)).toEqual([
            { prompt: '3 + 3', given: '7', answer: '6' },
            { prompt: '2 + 2', given: '5', answer: '4' },
        ]);
    });

    it('formats numbers with a no-break space from 10 000 and keeps text as it is', () => {
        expect(examplesOf([miss(W, 1, ex('Ile?', 12345, 'dwanaście'))])).toEqual([{ prompt: 'Ile?', given: '12 345', answer: 'dwanaście' }]);
        expect(examplesOf([miss(W, 1, ex('Ile?', 'x', 1000))])[0].answer).toBe('1000');
    });

    it('joins a list of answers with a comma and a space', () => {
        expect(examplesOf([miss(W, 1, ex('Dopisz', 4, [3, 12345]))])[0].answer).toBe('3, 12 345');
    });

    it('turns line breaks in the prompt into spaces', () => {
        expect(examplesOf([miss(W, 1, ex('7 + __\n= 10', 2, 3))])[0].prompt).toBe('7 + __ = 10');
    });

    it('does not take examples from other skills', () => {
        const history = [miss(W, 1, ex('a', 1, 2)), miss(B, 2, ex('b', 3, 4))];
        const view = progressView(E3, learner(history), RULES);
        expect(view.weakest.find((w) => w.skillId === W)?.examples.map((e) => e.prompt)).toEqual(['a']);
    });
});
