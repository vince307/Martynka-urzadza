// Origin: S-07 phase 3. Weighted skill choice by bucket (current step / earlier steps / previous stage) with
// renormalisation of empty buckets, and the prompt-uniqueness rule for adaptive rounds.
// Oracles are typed here: the 60/30/10 and eased 20/50/30 weights come from the plan (ZADANIA section 1), the
// bucket membership is restated from the real `stages` data with its own "playable" predicate.
// Statistical tolerance: 20 000 draws from a seeded rng, +-2 percentage points (sd of a share is at most 0.35 pp,
// so the bound is 5+ sigma and the test is stable for any fixed seed).
import { describe, expect, it } from 'vitest';
import { buildAdaptiveRound, calendarStart, playableSteps, skillBuckets, startLearning } from '../src/core/curriculum';
import { createRng } from '../src/core/rng';
import { pickRoundSkills, type Weights } from '../src/core/round/pick';
import { distinctTasks, taskKey } from '../src/core/round/unique';
import { getGenerator } from '../src/core/tasks/registry';
import type { Task } from '../src/core/tasks/types';
import type { SkillDef, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { placementData } from '../src/data/placement';

const ALL: StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const NORMAL: Weights = { current: 60, earlier: 30, previous: 10 };
const EASED: Weights = { current: 20, earlier: 50, previous: 30 };
const stage = (id: StageId): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(`no stage ${id}`);
    return s;
};
const previousOf = (id: StageId): StageDef | undefined => (id === 'E1' ? undefined : stage(ALL[ALL.indexOf(id) - 1]));

// Independent oracle of "playable" (what the task scene can answer and a generator exists for).
const isPlayable = (s: SkillDef): boolean => (s.answer === 'tiles' || s.answer === 'keypad' || s.answer === 'select') && getGenerator(s.type) !== undefined;
const playableOf = (st: StageDef, pred: (step: number) => boolean): SkillDef[] =>
    st.steps.filter((step) => pred(step.step)).flatMap((step) => step.skills.filter(isPlayable));
const ids = (skills: readonly SkillDef[]): string[] => skills.map((s) => s.id);
// The step whose skills are "current" for an unlocked step: the nearest playable step at or below it, else the first.
const currentStep = (st: StageDef, unlocked: number): number => {
    const steps = st.steps.filter((x) => x.skills.some(isPlayable)).map((x) => x.step);
    const below = steps.filter((n) => n <= unlocked);
    return below.length > 0 ? Math.max(...below) : steps[0];
};

describe('skillBuckets', () => {
    it('E3 step 6: current = step 6, earlier = playable steps 1-5, previous = all of E2', () => {
        const b = skillBuckets(stage('E3'), previousOf('E3'), 6);
        expect(new Set(b.current.map((s) => s.step))).toEqual(new Set([6]));
        expect(new Set(b.earlier.map((s) => s.step))).toEqual(new Set([1, 2, 3, 4, 5]));
        expect(ids(b.previous)).toEqual(ids(playableOf(stage('E2'), () => true)));
        expect(b.current.length).toBeGreaterThan(0);
    });

    it('an unplayable unlocked step falls back to the nearest lower playable step', () => {
        // E5 step 5 has no playable skill (capacity and mass wait for S-14): unlocked step 5 plays step 4.
        const b = skillBuckets(stage('E5'), previousOf('E5'), 5);
        expect(new Set(b.current.map((s) => s.step))).toEqual(new Set([4]));
        expect(new Set(b.earlier.map((s) => s.step))).toEqual(new Set([1, 2, 3]));
    });

    it('an unplayable step below every playable one falls back to the first playable step', () => {
        const first = playableSteps(stage('E1'))[0];
        expect(first).toBeGreaterThan(1); // E1 step 1 is not playable
        const b = skillBuckets(stage('E1'), undefined, 1);
        expect(new Set(b.current.map((s) => s.step))).toEqual(new Set([first]));
        expect(b.earlier).toEqual([]);
        expect(b.previous).toEqual([]);
    });

    it('matches the independent oracle for every stage and every unlocked step', () => {
        for (const id of ALL) {
            for (const unlocked of stage(id).steps.map((s) => s.step)) {
                const b = skillBuckets(stage(id), previousOf(id), unlocked);
                const cur = currentStep(stage(id), unlocked);
                expect(ids(b.current), `${id}@${unlocked} current`).toEqual(ids(playableOf(stage(id), (n) => n === cur)));
                expect(ids(b.earlier), `${id}@${unlocked} earlier`).toEqual(ids(playableOf(stage(id), (n) => n < cur)));
                const prev = previousOf(id);
                expect(ids(b.previous), `${id}@${unlocked} previous`).toEqual(prev ? ids(playableOf(prev, () => true)) : []);
            }
        }
    });
});

describe('pickRoundSkills', () => {
    const share = (weights: Weights, unlocked: number, draws = 20000): Record<'current' | 'earlier' | 'previous', number> => {
        const b = skillBuckets(stage('E3'), previousOf('E3'), unlocked);
        const where = new Map<string, keyof typeof counts>();
        const counts = { current: 0, earlier: 0, previous: 0 };
        for (const key of ['current', 'earlier', 'previous'] as const) for (const s of b[key]) where.set(s.id, key);
        const picked = pickRoundSkills(b, weights, createRng(7), draws);
        expect(picked).toHaveLength(draws);
        for (const s of picked) counts[where.get(s.id) as keyof typeof counts] += 1;
        return { current: counts.current / draws, earlier: counts.earlier / draws, previous: counts.previous / draws };
    };

    it('E3 step 6: shares are 60/30/10 within 2 percentage points', () => {
        const s = share(NORMAL, 6);
        expect(Math.abs(s.current - 0.6)).toBeLessThan(0.02);
        expect(Math.abs(s.earlier - 0.3)).toBeLessThan(0.02);
        expect(Math.abs(s.previous - 0.1)).toBeLessThan(0.02);
    });

    it('eased weights give 20/50/30 within 2 percentage points', () => {
        const s = share(EASED, 6);
        expect(Math.abs(s.current - 0.2)).toBeLessThan(0.02);
        expect(Math.abs(s.earlier - 0.5)).toBeLessThan(0.02);
        expect(Math.abs(s.previous - 0.3)).toBeLessThan(0.02);
    });

    it('E3 at its first playable step has no earlier steps: 60/10 renormalise to 6/7 and 1/7', () => {
        const s = share(NORMAL, 1);
        expect(s.earlier).toBe(0);
        expect(Math.abs(s.current - 60 / 70)).toBeLessThan(0.02);
        expect(Math.abs(s.previous - 10 / 70)).toBeLessThan(0.02);
    });

    it('E1 at its first playable step has only the current bucket: 100%', () => {
        const b = skillBuckets(stage('E1'), undefined, 1);
        const cur = new Set(ids(b.current));
        const picked = pickRoundSkills(b, NORMAL, createRng(3), 2000);
        expect(picked.every((s) => cur.has(s.id))).toBe(true);
    });

    it('every skill of the current bucket gets drawn (uniform pick inside a bucket)', () => {
        const b = skillBuckets(stage('E3'), previousOf('E3'), 6);
        const seen = new Set(pickRoundSkills(b, NORMAL, createRng(11), 5000).map((s) => s.id));
        for (const s of b.current) expect(seen.has(s.id), s.id).toBe(true);
    });

    it('throws a RangeError when every bucket is empty', () => {
        expect(() => pickRoundSkills({ current: [], earlier: [], previous: [] }, NORMAL, createRng(1), 1)).toThrow(RangeError);
    });
});

describe('buildAdaptiveRound', () => {
    // The calendar starts: every stage, three months of its school year, 200 seeds each.
    const AGE: Record<StageId, number> = { E1: 6, E2: 7, E3: 8, E4: 8, E5: 9, E6: 10 };
    const MONTHS: Record<StageId, number[]> = {
        E1: [8, 10, 0], E2: [1, 3, 5], E3: [8, 10, 0], E4: [1, 3, 5], E5: [8, 10, 0], E6: [1, 3, 5],
    };
    const rules = { length: balance.round.length, uniqueRetries: balance.round.uniqueRetries };
    const rulesCurriculum = balance.curriculum;

    it('every skill is playable, at or below the unlocked step, or from the previous stage; no duplicated prompt', () => {
        for (const id of ALL) {
            for (const month of MONTHS[id]) {
                const start = calendarStart(stage(id), AGE[id], month, placementData, rulesCurriculum);
                const adaptation = startLearning(stages, AGE[id], month, placementData, rulesCurriculum);
                expect(adaptation.unlockedStep[id]).toBe(start);
                const cur = currentStep(stage(id), start);
                const allowed = new Set([
                    ...ids(playableOf(stage(id), (n) => n <= cur)),
                    ...ids(previousOf(id) ? playableOf(previousOf(id) as StageDef, () => true) : []),
                ]);
                for (let seed = 1; seed <= 200; seed += 1) {
                    const tasks = buildAdaptiveRound(stage(id), previousOf(id), adaptation, NORMAL, createRng(seed), rules, balance.tiles.count);
                    const where = `${id} month=${month} seed=${seed}`;
                    expect(tasks, where).toHaveLength(rules.length);
                    for (const t of tasks) expect(allowed.has(t.skillId), `${where} ${t.skillId}`).toBe(true);
                    // A task is told apart by its prompt and its drawing ("Jaka to liczba?" differs by the blocks).
                    const keys = tasks.map((t) => taskKey(t));
                    expect(new Set(keys).size, `${where} ${JSON.stringify(keys)}`).toBe(keys.length);
                }
            }
        }
    });
});

describe('distinctTasks', () => {
    const skill: SkillDef = { id: 'X.1.fake', stage: 'E1', step: 1, type: 'FAKE', params: {}, answer: 'tiles' };
    const task = (prompt: string): Task => ({ skillId: skill.id, prompt, answer: 1, hint: [] });

    it('redraws a task whose prompt already appeared and keeps the round length', () => {
        const rng = createRng(5);
        let calls = 0;
        // Prompts cycle 1,1,1,2,2,2,3,... : the first draw of a position repeats until the cycle moves on.
        const out = distinctTasks([skill, skill, skill], rng, () => task(`p${Math.floor(calls++ / 3)}`), 20);
        expect(out).toHaveLength(3);
        expect(new Set(out.map((t) => t.prompt)).size).toBe(3);
    });

    it('does not treat the same prompt with another drawing as a repeat, but does with an identical drawing', () => {
        const withClock = (minute: number): Task => ({ ...task('Która godzina?'), visual: { kind: 'clock', hour: 3, minute } });
        let calls = 0;
        const other = distinctTasks([skill, skill], createRng(3), () => withClock(calls++ < 1 ? 0 : 30), 20);
        expect(other.map((t) => t.visual)).toEqual([{ kind: 'clock', hour: 3, minute: 0 }, { kind: 'clock', hour: 3, minute: 30 }]);
        expect(calls).toBe(2);   // no redraw: the drawings differ

        calls = 0;
        const same = distinctTasks([skill, skill], createRng(3), () => { calls += 1; return withClock(calls <= 5 ? 0 : 45); }, 20);
        expect(same.map((t) => (t.visual as { minute: number }).minute)).toEqual([0, 45]);   // identical drawing redrawn
    });

    it('a constant generator ends in duplicates after the retry limit, without hanging', () => {
        let calls = 0;
        const out = distinctTasks([skill, skill, skill, skill, skill], createRng(1), () => {
            calls += 1;
            return task('same');
        }, 20);
        expect(out).toHaveLength(5);
        expect(out.every((t) => t.prompt === 'same')).toBe(true);
        expect(calls).toBeLessThanOrEqual((20 + 1) * 5);
        expect(calls).toBeGreaterThan(5); // it did retry
    });

    it('with retries 0 the first draw is kept', () => {
        let calls = 0;
        const out = distinctTasks([skill, skill], createRng(1), () => { calls += 1; return task('same'); }, 0);
        expect(out).toHaveLength(2);
        expect(calls).toBe(2);
    });
});
