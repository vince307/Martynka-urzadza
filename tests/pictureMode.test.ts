// Origin: change e1-shapes-picture-mode, phase 5. Picture mode is a pure filter of the round draw (E1 only, age 6 in
// September-January or while easing): no save field. Oracles are typed here, not read from the code under test.
import { describe, expect, it } from 'vitest';
import { buildAdaptiveRound, unlockThreshold } from '../src/core/curriculum';
import { pictureMode } from '../src/core/pictureMode';
import type { SessionLearner } from '../src/core/placement';
import { createRng } from '../src/core/rng';
import { isFace } from '../src/core/tasks/faces';
import { generateTask } from '../src/core/tasks/generateTask';
import type { Adaptation, SkillDef, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { getStage } from '../src/data/curriculum';
import { hasPicture } from '../src/data/pictureSkills';

const stage = (id: StageId): StageDef => getStage(id) as StageDef;
const AUTUMN = [8, 9, 10, 11, 0]; // September-January, typed by hand
const learner = (st: StageId, age: number, easedRounds: number): SessionLearner => ({
    age, stage: st, stageOverriddenByParent: false, warmupPending: false, pendingUnlock: null,
    unlockedStep: { E1: 1, E2: 1, E3: 1, E4: 1, E5: 1, E6: 1, [st]: 1 }, mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds,
});
const adaptation = (step: number, eased = 0): Adaptation => ({ unlockedStep: { E1: step, E2: 1, E3: 1, E4: 1, E5: 1, E6: 1 }, mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds: eased });
const rules = { length: balance.round.length, uniqueRetries: balance.round.uniqueRetries };
const NORMAL = { current: 60, earlier: 30, previous: 10 };
const skillOf = (id: string): SkillDef => {
    const hit = (['E1', 'E2'] as const).flatMap((s) => stage(s).steps.flatMap((st) => st.skills)).find((k) => k.id === id);
    if (!hit) throw new Error(`no skill ${id}`);
    return hit;
};
const stepOf = (id: string): number => skillOf(id).step;

describe('pictureMode', () => {
    it('is on for E1 at age 6 in September-January, or while easing, and nowhere else', () => {
        for (const age of [6, 7, 8, 9, 10]) {
            for (let month = 0; month < 12; month += 1) {
                for (const eased of [0, 2]) {
                    const expected = eased > 0 || (age === 6 && AUTUMN.includes(month));
                    expect(pictureMode(learner('E1', age, eased), month), `E1 age=${age} month=${month} eased=${eased}`).toBe(expected);
                    expect(pictureMode(learner('E2', age, eased), month), `E2 age=${age} month=${month} eased=${eased}`).toBe(false);
                }
            }
        }
    });
});

describe('hasPicture', () => {
    it('agrees with what the generators draw, for every skill of E1 and E2 (oracle: the drawn tasks)', () => {
        for (const id of ['E1', 'E2'] as const) {
            for (const skill of stage(id).steps.flatMap((s) => s.skills)) {
                const rng = createRng(20261015);
                let drawn = 0;
                let shown = 0;
                for (let i = 0; i < 100; i += 1) {
                    const task = generateTask(skill, rng, { tileCount: balance.tiles.count });
                    drawn += 1;
                    if (task.visual !== undefined || (task.choices ?? []).some(isFace)) shown += 1;
                }
                expect(shown === 0 || shown === drawn, `${skill.id} is mixed: ${shown}/${drawn}`).toBe(true);
                expect(hasPicture(skill), skill.id).toBe(shown === drawn);
            }
        }
    });
});

describe('buildAdaptiveRound with picture mode', () => {
    const play = (step: number, picture: boolean, seeds = 200): string[] => {
        const out: string[] = [];
        for (let seed = 1; seed <= seeds; seed += 1) {
            const tasks = buildAdaptiveRound(stage('E1'), undefined, adaptation(step), NORMAL, createRng(seed), rules, balance.tiles.count, undefined, { picture });
            out.push(...tasks.map((t) => t.skillId));
        }
        return out;
    };

    it('takes the earlier steps only from skills with a picture (at least 90 percent, here all)', () => {
        const earlier = play(7, true).filter((id) => stepOf(id) < 7);
        expect(earlier.length).toBeGreaterThan(100);
        const share = earlier.filter((id) => hasPicture(skillOf(id))).length / earlier.length;
        expect(share).toBeGreaterThanOrEqual(0.9);
    });

    it('draws the earlier steps without a picture when the mode is off', () => {
        const earlier = play(7, false).filter((id) => stepOf(id) < 7);
        expect(earlier.some((id) => !hasPicture(skillOf(id)))).toBe(true);
    });

    it('filters the current step when enough picture skills remain to unlock it (E1.2: 2 of 3, threshold 2)', () => {
        const step2 = skillOf('E1.2.compare_num_5').step;
        expect(unlockThreshold(3, balance.curriculum.unlockShare)).toBe(2);
        const drawn = play(step2, true).filter((id) => stepOf(id) === step2);
        expect(drawn.length).toBeGreaterThan(100);
        expect(drawn.every((id) => id !== 'E1.2.compare_num_5')).toBe(true);
    });

    it('keeps the whole current step when the picture skills are below the unlock threshold (E1.3: 1 of 5, threshold 3)', () => {
        const drawn = new Set(play(3, true).filter((id) => stepOf(id) === 3));
        for (const skill of stage('E1').steps.find((s) => s.step === 3)?.skills ?? []) expect(drawn.has(skill.id), skill.id).toBe(true);
    });

    it('with the mode off the draw is exactly the draw without the option', () => {
        for (let seed = 1; seed <= 30; seed += 1) {
            const a = buildAdaptiveRound(stage('E1'), undefined, adaptation(7), NORMAL, createRng(seed), rules, balance.tiles.count);
            const b = buildAdaptiveRound(stage('E1'), undefined, adaptation(7), NORMAL, createRng(seed), rules, balance.tiles.count, undefined, { picture: false });
            expect(b.map((t) => t.prompt)).toEqual(a.map((t) => t.prompt));
        }
    });
});
