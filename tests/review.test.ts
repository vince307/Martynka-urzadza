// Origin: S-14c phase 8. The review step (E6.11): playable without own skills, never a calendar start or warm-up step,
// draws a round from the stage's other steps (step first, then skill), still unlocks like any other step.
import { describe, expect, it } from 'vitest';
import { buildAdaptiveRound, calendarStart, currentStep, endRound, playableSteps, skillBuckets, stepPlayable, unlockReady, unlockThreshold } from '../src/core/curriculum';
import { createRng } from '../src/core/rng';
import { firstPlayableSteps, pickRoundSkills } from '../src/core/round/pick';
import { withoutArtBlocked } from '../src/core/round/artFilter';
import type { Adaptation, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { artBlocked } from '../src/core/round/artFilter';
import { COIN_IDS, NOTE_IDS } from '../src/data/measures';
import { stages } from '../src/data/curriculum';
import { placementData } from '../src/data/placement';

const stage = (id: StageId): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(`no stage ${id}`);
    return s;
};
const E6 = stage('E6');
const E5 = stage('E5');
const RULES = { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 };
const adaptation = (step: number, mastery: Record<string, number> = {}): Adaptation => ({
    unlockedStep: { E1: 1, E2: 1, E3: 1, E4: 1, E5: 1, E6: step },
    mastery,
    streak: {},
    history: [],
    weakStreak: 0,
    easedRounds: 0,
});
const stepOf = (id: string): number => Number(id.split('.')[1]);

describe('review step E6.11', () => {
    it('is flagged in the data, and only a step listing MIX is', () => {
        for (const st of E6.steps) expect(st.review === true, `E6.${st.step}`).toBe(st.types.includes('MIX'));
        expect(E6.steps.find((s) => s.step === 11)?.review).toBe(true);
        expect(E6.steps.find((s) => s.step === 11)?.childName).toBeTruthy();
    });

    it('is playable although it has no skills; an ordinary empty step is not', () => {
        const review = E6.steps[10];
        expect(review.skills).toEqual([]);
        expect(stepPlayable(review)).toBe(true);
        expect(stepPlayable({ ...review, review: undefined })).toBe(false);
        expect(playableSteps(E6)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it('is never a calendar start (the E6 oracle stays 2, 3, 5, 7, 9, 10) nor a warm-up step', () => {
        const starts = [1, 2, 3, 4, 5, 6].map((m) => calendarStart(E6, 10, m, placementData, RULES));
        expect(starts).toEqual([2, 3, 5, 7, 9, 10].slice(0, 5).concat(10));
        expect(firstPlayableSteps(E6, 2).map((s) => s.step)).toEqual([1, 2]);
        expect(firstPlayableSteps(E6, 20).map((s) => s.step)).not.toContain(11);
    });

    it('unlocks after E6.10 (mastery on its skills) and has no step after it', () => {
        const e610 = E6.steps.find((s) => s.step === 10)?.skills ?? [];
        const mastery = Object.fromEntries(e610.map((k) => [k.id, 4]));
        const rules = { ...RULES, unlockAt: balance.mastery.unlockAt };
        expect(unlockReady(E6, adaptation(10, mastery), rules)).toBe(11);
        const all = Object.fromEntries(E6.steps.flatMap((s) => s.skills).map((k) => [k.id, 5]));
        expect(unlockReady(E6, adaptation(11, all), rules)).toBeNull();
        expect(currentStep(E6, 11)).toBe(11);
    });

    it('buckets: current = every playable E6.1-E6.10 skill, split in 10 groups, earlier empty, previous = E5', () => {
        const b = skillBuckets(E6, E5, 11);
        const ids = b.current.map((k) => k.id).sort();
        expect(ids.every((id) => id.startsWith('E6.') && stepOf(id) <= 10)).toBe(true);
        expect(new Set(b.current.map((k) => k.step))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
        expect(b.currentGroups).toHaveLength(10);
        for (const g of b.currentGroups ?? []) expect(new Set(g.map((k) => k.step)).size).toBe(1);
        expect(b.currentGroups?.flat().map((k) => k.id).sort()).toEqual(ids);
        expect(b.earlier).toEqual([]);
        expect(b.previous.length).toBeGreaterThan(0);
        expect(b.previous.every((k) => k.id.startsWith('E5.'))).toBe(true);
    });

    it('ordinary steps carry no groups', () => {
        expect(skillBuckets(E6, E5, 5).currentGroups).toBeUndefined();
    });

    it('a review round draws each E6 step about equally (step first), about 14 % E5, nothing else', () => {
        const b = skillBuckets(E6, E5, 11);
        const picks = pickRoundSkills(b, RULES.weights, createRng(7), 20000);
        const e6 = picks.filter((k) => k.id.startsWith('E6.'));
        expect(picks.every((k) => k.id.startsWith('E6.') || k.id.startsWith('E5.'))).toBe(true);
        expect(picks.length - e6.length).toBeGreaterThan(20000 * 0.12);
        expect(picks.length - e6.length).toBeLessThan(20000 * 0.16);
        for (let n = 1; n <= 10; n++) {
            const share = e6.filter((k) => stepOf(k.id) === n).length / e6.length;
            expect(share, `E6.${n}`).toBeGreaterThan(0.085);
            expect(share, `E6.${n}`).toBeLessThan(0.115);
        }
    });

    it('art filter: minCurrent 1 keeps the filtered groups; if too few remain the unfiltered groups come back', () => {
        const b = skillBuckets(E6, E5, 11);
        const blockedStep = (k: { id: string }): boolean => stepOf(k.id) === 3;
        const f = withoutArtBlocked(b, blockedStep, 1);
        expect(f.current.some(blockedStep)).toBe(false);
        expect(f.currentGroups?.flat().some(blockedStep)).toBe(false);
        expect(f.currentGroups).toHaveLength(9);
        const all = withoutArtBlocked(b, (k) => k.id.startsWith('E6.'), 1000);
        expect(all.currentGroups).toEqual(b.currentGroups);
    });

    it('buildAdaptiveRound on E6.11 filters with minCurrent 1, not half of the skills', () => {
        const missing = new Set<string>([...COIN_IDS, ...NOTE_IDS]);
        const blocked = Object.values(stages).flatMap((sg) => sg?.steps.flatMap((st) => st.skills) ?? []).find((k) => artBlocked(k, missing));
        if (!blocked) throw new Error('no art-blocked skill to build the stage from');
        // E6 whose steps 2-10 all hold only picture-dependent skills: one step's skills survive the filter.
        const stageB: StageDef = {
            ...E6,
            steps: E6.steps.map((st) =>
                st.step >= 2 && st.step <= 10
                    ? { ...st, skills: [1, 2, 3].map((i) => ({ ...blocked, id: `E6.${st.step}.b${i}`, step: st.step })) }
                    : st,
            ),
        };
        const current = skillBuckets(stageB, E5, 11).current;
        const left = current.filter((k) => !artBlocked(k, missing));
        expect(left.length).toBeGreaterThanOrEqual(1);
        expect(left.length).toBeLessThan(unlockThreshold(current.length, 0.5)); // a half-of-all minimum would undo the filter
        for (let seed = 1; seed <= 20; seed++) {
            const tasks = buildAdaptiveRound(stageB, E5, adaptation(11), RULES.weights, createRng(seed), { length: 5, uniqueRetries: 8 }, 4, { missingIds: missing, unlockShare: 0.5 });
            for (const t of tasks) {
                const skill = [...stageB.steps, ...E5.steps].flatMap((st) => st.skills).find((k) => k.id === t.skillId);
                expect(skill && artBlocked(skill, missing), t.skillId).toBe(false);
            }
        }
    });

    it('a round on E6.11 draws from many steps and a saved learner never moves back', () => {
        const seen = new Set<number>();
        for (let seed = 1; seed <= 40; seed++) {
            for (const t of buildAdaptiveRound(E6, E5, adaptation(11), RULES.weights, createRng(seed), { length: 5, uniqueRetries: 8 }, 4)) seen.add(stepOf(t.skillId));
        }
        expect(seen.size).toBeGreaterThanOrEqual(8);
        const done = endRound(adaptation(11), E6, [], 1, 'round', { curriculum: RULES, mastery: balance.mastery, easing: balance.easing });
        expect(done.adaptation.unlockedStep.E6).toBe(11);
        expect(done.unlocked).toBeNull();
    });
});
