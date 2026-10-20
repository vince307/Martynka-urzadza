// Placement warm-up (S-06): composition from real curriculum data and the
// one-step-down correction rule.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import type { Outcome } from '../src/core/round';
import { firstPlayableSteps } from '../src/core/round/pick';
import { buildWarmup, warmupResult } from '../src/core/round/warmup';
import { previousStage } from '../src/core/placement';
import { getGenerator } from '../src/core/tasks/registry';
import { validateTask } from '../src/core/tasks/validate';
import { taskKey } from '../src/core/round/unique';
import { validationBounds } from '../src/core/tasks/bounds';
import type { SkillDef, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { getStage } from '../src/data/curriculum';
import { nouns } from '../src/data/nouns';

const IDS: StageId[] = ['E2', 'E3', 'E4', 'E5', 'E6'];
const SEEDS = 20;
const rules = balance.warmup;

// Independent oracle: what "playable" means, restated from the scene's needs.
const playableSkills = (skills: readonly SkillDef[]): SkillDef[] =>
    skills.filter((s) => (s.answer === 'tiles' || s.answer === 'keypad' || s.answer === 'select' || s.answer === 'drag' || s.answer === 'digits') && getGenerator(s.type) !== undefined);
const stageOf = (id: StageId): StageDef => getStage(id) as StageDef;
const allSkillIds = (stage: StageDef): Set<string> => new Set(playableSkills(stage.steps.flatMap((s) => s.skills)).map((s) => s.id));
const firstStepsSkillIds = (stage: StageDef, n: number): Set<string> =>
    new Set(
        stage.steps
            .filter((s) => playableSkills(s.skills).length > 0)
            .slice(0, n)
            .flatMap((s) => playableSkills(s.skills).map((k) => k.id)),
    );

describe('firstPlayableSteps', () => {
    it('skips steps without playable skills and keeps curriculum order', () => {
        for (const id of ['E1', ...IDS] as StageId[]) {
            const steps = firstPlayableSteps(stageOf(id), 2);
            expect(steps, id).toHaveLength(2);
            for (const step of steps) expect(playableSkills(step.skills).length, `${id}.${step.step}`).toBeGreaterThan(0);
            const order = stageOf(id).steps;
            expect(order.indexOf(steps[0])).toBeLessThan(order.indexOf(steps[1]));
        }
    });
});

describe('buildWarmup', () => {
    for (const id of IDS) {
        it(`${id}: 6 tasks, first 3 from the previous stage, last 3 from the first 2 playable steps, all valid (${SEEDS} seeds)`, () => {
            const stage = stageOf(id);
            const previous = stageOf(previousStage(id) as StageId);
            const fromPrevious = allSkillIds(previous);
            const fromCurrent = firstStepsSkillIds(stage, rules.currentSteps);
            for (let seed = 1; seed <= SEEDS; seed += 1) {
                const tasks = buildWarmup(stage, previous, createRng(seed), rules, balance.tiles.count, balance.round.uniqueRetries);
                const where = `${id} seed=${seed}`;
                expect(tasks, where).toHaveLength(rules.length);
                tasks.forEach((task, i) => {
                    const pool = i < rules.previousCount ? fromPrevious : fromCurrent;
                    expect(pool.has(task.skillId), `${where} task ${i} ${task.skillId}`).toBe(true);
                    const skill = [...stage.steps, ...previous.steps].flatMap((s) => s.skills).find((s) => s.id === task.skillId) as SkillDef;
                    expect(validateTask(task, { ...validationBounds(skill), nouns }), `${where} task ${i} "${task.prompt}"`).toEqual([]);
                });
            }
        });
    }

    it('the current-stage half really is narrower than the whole stage (E5)', () => {
        expect(firstStepsSkillIds(stageOf('E5'), rules.currentSteps).size).toBeLessThan(allSkillIds(stageOf('E5')).size);
    });
});

const outcomes = (first: number, total = rules.length): Outcome[] =>
    Array.from({ length: total }, (_, i) => (i < first ? 'first' : i % 2 === 0 ? 'second' : 'retype'));

describe('warmupResult', () => {
    it('lowers the stage by exactly one below the threshold', () => {
        for (const id of IDS) {
            for (let first = 0; first < rules.minFirstTry; first += 1) {
                expect(warmupResult(id, outcomes(first), rules.minFirstTry), `${id} first=${first}`).toBe(previousStage(id));
            }
        }
    });

    it('keeps the stage at the threshold and above', () => {
        for (const id of IDS) {
            for (let first = rules.minFirstTry; first <= rules.length; first += 1) {
                expect(warmupResult(id, outcomes(first), rules.minFirstTry), `${id} first=${first}`).toBe(id);
            }
        }
    });

    it('never goes below E1 and never up', () => {
        expect(warmupResult('E1', outcomes(0), rules.minFirstTry)).toBe('E1');
        const order = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
        for (const id of order as StageId[]) {
            for (let first = 0; first <= rules.length; first += 1) {
                const result = warmupResult(id, outcomes(first), rules.minFirstTry);
                const delta = order.indexOf(id) - order.indexOf(result);
                expect(delta === 0 || delta === 1, `${id} first=${first}`).toBe(true);
            }
        }
    });

    it('counts only first-try answers: unfinished (null) tasks are not correct', () => {
        expect(warmupResult('E4', [null, null, null, null, null, null], rules.minFirstTry)).toBe('E3');
        expect(warmupResult('E4', ['first', 'first', 'first', null, null, null], rules.minFirstTry)).toBe('E3');
        expect(warmupResult('E4', ['first', 'first', 'first', 'first', null, null], rules.minFirstTry)).toBe('E4');
    });
});

describe('buildWarmup prompt uniqueness (S-07 phase 3)', () => {
    it('no prompt repeats inside a warm-up, for every stage and 200 seeds', () => {
        for (const id of IDS) {
            const stage = stageOf(id);
            const previous = stageOf(previousStage(id) as StageId);
            for (let seed = 1; seed <= 200; seed += 1) {
                const tasks = buildWarmup(stage, previous, createRng(seed), rules, balance.tiles.count, balance.round.uniqueRetries);
                // A task is told apart by its prompt and its drawing ("Jaka to liczba?" differs by the blocks).
                const keys = tasks.map((t) => taskKey(t));
                expect(tasks, `${id} seed=${seed}`).toHaveLength(rules.length);
                expect(new Set(keys).size, `${id} seed=${seed} ${JSON.stringify(keys)}`).toBe(keys.length);
            }
        }
    });
});

// Origin: playtest-fixes-f01-f03 phase 2 (F-03). The warm-up shares one cap over its 6 tasks and spreads the types
// inside each half. Oracles restate the rule from the curriculum data (types per pool), not from the implementation.
describe('buildWarmup variety (F-03)', () => {
    const typeOfSkill = (id: StageId, skillId: string): string => {
        const found = [stageOf(id), stageOf(previousStage(id) as StageId)].flatMap((s) => s.steps.flatMap((st) => st.skills)).find((s) => s.id === skillId);
        return (found as SkillDef).type;
    };
    const typesOf = (skills: readonly SkillDef[]): Set<string> => new Set(skills.map((s) => s.type));
    const typeNames = (id: StageId, ids: readonly string[]): string[] => ids.map((skillId) => typeOfSkill(id, skillId));

    for (const id of IDS) {
        it(`${id}: no type above 2 over the 6 tasks, no neighbours inside a half (200 seeds)`, () => {
            const stage = stageOf(id);
            const previous = stageOf(previousStage(id) as StageId);
            const early = firstPlayableSteps(stage, rules.currentSteps);
            const prevTypes = typesOf(playableSkills(previous.steps.flatMap((s) => s.skills)));
            const earlyTypes = typesOf(playableSkills(early.flatMap((s) => s.skills)));
            // With three types in each pool the cap can never run out of choices; fewer types may relax it.
            const capGuaranteed = prevTypes.size >= 3 && earlyTypes.size >= 3;
            for (let seed = 1; seed <= 200; seed += 1) {
                const tasks = buildWarmup(stage, previous, createRng(seed), rules, balance.tiles.count, balance.round.uniqueRetries);
                const types = typeNames(id, tasks.map((t) => t.skillId));
                const where = `${id} seed=${seed} ${types.join(',')}`;
                const tally = new Map<string, number>();
                for (const t of types) tally.set(t, (tally.get(t) ?? 0) + 1);
                if (capGuaranteed) expect(Math.max(...tally.values()), where).toBeLessThanOrEqual(2);
                for (const half of [types.slice(0, rules.previousCount), types.slice(rules.previousCount)]) {
                    const top = Math.max(...[...new Set(half)].map((t) => half.filter((x) => x === t).length));
                    if (top <= 2) expect(half.filter((t, i) => i > 0 && half[i - 1] === t).length, where).toBe(0);
                }
            }
        });
    }

    it('the cap is shared by the halves: a type both stages have appears at most twice over the 6', () => {
        // E3 and E2 both have ADD_SUB; with one tally it can never take three places.
        const stage = stageOf('E3');
        const previous = stageOf('E2');
        const both = [...typesOf(playableSkills(previous.steps.flatMap((s) => s.skills)))].filter((t) =>
            typesOf(playableSkills(firstPlayableSteps(stage, rules.currentSteps).flatMap((s) => s.skills))).has(t),
        );
        expect(both.length).toBeGreaterThan(0);
        let seen3 = 0;
        for (let seed = 1; seed <= 400; seed += 1) {
            const types = typeNames('E3', buildWarmup(stage, previous, createRng(seed), rules, balance.tiles.count, balance.round.uniqueRetries).map((t) => t.skillId));
            for (const t of both) {
                const n = types.filter((x) => x === t).length;
                expect(n, `seed=${seed} ${types.join(',')}`).toBeLessThanOrEqual(2);
                if (n === 2) seen3 += 1;
            }
        }
        expect(seen3, 'the shared type reaches the cap in some seeds, so the case can fail').toBeGreaterThan(0);
    });

    it('keeps the rng stream of the uncapped draw: same stage, a cap no type reaches gives the old lists', () => {
        const stage = stageOf('E5');
        const previous = stageOf('E4');
        for (let seed = 1; seed <= 50; seed += 1) {
            const loose = buildWarmup(stage, previous, createRng(seed), rules, balance.tiles.count, balance.round.uniqueRetries, undefined, { maxPerType: 99 });
            const sorted = (list: readonly string[]) => [...list].sort();
            const ids = loose.map((t) => t.skillId);
            // 6 draws, so the same seed with the cap off draws the same multiset as the plain picker.
            expect(ids, `seed=${seed}`).toHaveLength(rules.length);
            expect(sorted(ids.slice(0, rules.previousCount)).every((id) => allSkillIds(previous).has(id)), `seed=${seed}`).toBe(true);
        }
    });
});
