// Origin: child-flow-guards phase 2 (TXT-01, TXT-04, TXT-05). The review step draws like any step (about 10 % of the
// previous stage, 30 % under easing), cannot unlock at once, a review-only stage fails with a named error, and the
// parent's progress preview also lists weak skills of the previous stage. Expected values come from the rules, not the code.
import { describe, expect, it } from 'vitest';
import { buildAdaptiveRound, currentStep, playableSteps, reviewWeights, skillBuckets, stepPlayable, unlockReady } from '../src/core/curriculum';
import { progressView, type ProgressRules } from '../src/core/progress';
import { createRng } from '../src/core/rng';
import { pickRoundSkills } from '../src/core/round/pick';
import type { Adaptation, SkillDef, StageDef, StepDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';

const E6 = stages.E6 as StageDef;
const E5 = stages.E5 as StageDef;
const RULES = { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 };
const adaptation = (step: number, mastery: Record<string, number> = {}, history: Adaptation['history'] = []): Adaptation => ({
    unlockedStep: { E1: 1, E2: 1, E3: 1, E4: 1, E5: 1, E6: step },
    mastery,
    streak: {},
    history,
    weakStreak: 0,
    easedRounds: 0,
});

describe('reviewWeights (TXT-01)', () => {
    it('folds earlier into current: normal 60/30/10 -> 90/0/10, easing 20/50/30 -> 70/0/30; sums are kept', () => {
        expect(reviewWeights({ current: 60, earlier: 30, previous: 10 })).toEqual({ current: 90, earlier: 0, previous: 10 });
        expect(reviewWeights({ current: 20, earlier: 50, previous: 30 })).toEqual({ current: 70, earlier: 0, previous: 30 });
    });

    it('a review round draws about 10 % of the previous stage, and about 30 % while easing', () => {
        const b = skillBuckets(E6, E5, 11);
        for (const [w, share] of [
            [RULES.weights, 0.1],
            [balance.easing.weights, 0.3],
        ] as const) {
            const picks = pickRoundSkills(b, reviewWeights(w), createRng(11), 20000);
            const prev = picks.filter((k) => k.id.startsWith('E5.')).length / picks.length;
            expect(prev).toBeGreaterThan(share - 0.02);
            expect(prev).toBeLessThan(share + 0.02);
        }
    });

    it('buildAdaptiveRound applies it on the review step only (same seed, E6.11 vs. an ordinary step)', () => {
        let prev = 0;
        let total = 0;
        for (let seed = 1; seed <= 400; seed++) {
            for (const t of buildAdaptiveRound(E6, E5, adaptation(11), RULES.weights, createRng(seed), { length: 5, uniqueRetries: 8 }, 4)) {
                total += 1;
                if (t.skillId.startsWith('E5.')) prev += 1;
            }
        }
        expect(prev / total).toBeGreaterThan(0.07);
        expect(prev / total).toBeLessThan(0.13);
    });
});

const skill = (step: number, n: number): SkillDef => ({ ...(E6.steps[0].skills[0]), id: `E6.${step}.s${n}`, step });
const stepOf = (step: number, extra: Partial<StepDef> = {}): StepDef => ({ ...(E6.steps[0]), step, skills: [skill(step, 1), skill(step, 2)], ...extra });
const review = (step: number): StepDef => stepOf(step, { review: true, skills: [] });
const stageOf = (steps: StepDef[]): StageDef => ({ ...E6, steps });

describe('review unlock and playability (TXT-04, TXT-05)', () => {
    const rules = { ...RULES, unlockAt: balance.mastery.unlockAt };
    it('unlockReady is null on a review step even when a later step exists', () => {
        const stage = stageOf([stepOf(1), review(2), stepOf(3)]);
        expect(currentStep(stage, 2)).toBe(2);
        expect(unlockReady(stage, adaptation(2), rules)).toBeNull();
        expect(unlockReady(stage, adaptation(1, { 'E6.1.s1': 5, 'E6.1.s2': 5 }), rules)).toBe(2);
    });

    it('a review step in a stage with no playable ordinary step is not playable', () => {
        const only = stageOf([review(1)]);
        expect(stepPlayable(only.steps[0], only)).toBe(false);
        expect(playableSteps(only)).toEqual([]);
        const mixed = stageOf([stepOf(1), review(2)]);
        expect(stepPlayable(mixed.steps[1], mixed)).toBe(true);
        expect(playableSteps(mixed)).toEqual([1, 2]);
    });

    it('buildAdaptiveRound on a stage without anything to draw names the stage and step', () => {
        const only = stageOf([review(1)]);
        const draw = (): unknown => buildAdaptiveRound(only, undefined, { ...adaptation(1) , unlockedStep: { E6: 1 } as Adaptation['unlockedStep'] }, RULES.weights, createRng(1), { length: 5, uniqueRetries: 8 }, 4);
        expect(draw).toThrow('No playable skills for stage E6 step 1');
    });

    it('every review step of the real data is the last step of its stage', () => {
        for (const stage of Object.values(stages)) {
            const steps = stage?.steps ?? [];
            steps.forEach((st, i) => {
                if (st.review === true) expect(i, `${stage?.id}.${st.step}`).toBe(steps.length - 1);
            });
        }
    });
});

describe('progress preview with the previous stage (gap 122)', () => {
    const PR: ProgressRules = { mastery: { max: 5 }, view: { weakestCount: 3, examplesPerSkill: 2 } };
    const e5 = E5.steps.flatMap((s) => s.skills).find((k) => playable5(k)) as SkillDef;
    function playable5(k: SkillDef): boolean {
        return k.id.startsWith('E5.');
    }
    const e6 = E6.steps[0].skills[0];
    const miss = (skillId: string, at: number): Adaptation['history'][number] => ({ skillId, ok: false, firstTry: false, at });
    const ids = (a: Adaptation, previous?: StageDef): string[] => progressView(E6, a, PR, previous).weakest.map((w) => w.skillId);

    it('without a previous stage the view is unchanged', () => {
        const a = adaptation(1, {}, [miss(e5.id, 5), miss(e6.id, 10)]);
        expect(ids(a)).toEqual([e6.id]);
    });

    it('lists a previous-stage skill missed since the current stage began, with its own step title', () => {
        const a = adaptation(1, {}, [miss(e6.id, 10), miss(e5.id, 12)]);
        expect(ids(a, E5)).toContain(e5.id);
        const entry = progressView(E6, a, PR, E5).weakest.find((w) => w.skillId === e5.id);
        expect(entry?.title).toBe(E5.steps.find((s) => s.step === e5.step)?.title);
    });

    it('ignores previous-stage misses dated before the earliest current-stage entry, and a stage with no entry yet', () => {
        expect(ids(adaptation(1, {}, [miss(e5.id, 3), miss(e6.id, 10)]), E5)).toEqual([e6.id]);
        expect(ids(adaptation(1, {}, [miss(e5.id, 3)]), E5)).toEqual([]);
    });

    it('ranks both stages together by the same rule and still caps at weakestCount', () => {
        const others = E6.steps.flatMap((s) => s.skills).slice(0, 4);
        const history = [...others.map((k, i) => miss(k.id, 10 + i)), miss(e5.id, 20)];
        const mastery = Object.fromEntries(others.map((k) => [k.id, 3]));
        const out = ids(adaptation(1, mastery, history), E5);
        expect(out).toHaveLength(3);
        expect(out[0]).toBe(e5.id); // mastery 0 ranks first
    });
});
