// Origin: playtest-fixes-f01-f03 phase 1 (F-03). A round draws at most 2 tasks of one type and never puts two of
// a type side by side while avoidable. Oracles come from the rule (counts, neighbours), not from the implementation;
// the replay oracle re-rolls the bucket with its own rng copy.
import { describe, expect, it } from 'vitest';
import { buildAdaptiveRound, playableSteps, skillBuckets, startLearning } from '../src/core/curriculum';
import { createRng } from '../src/core/rng';
import { pickRoundSkills, type SkillBuckets, type Weights } from '../src/core/round/pick';
import { pickVariedSkills, spreadTypes, variedRound } from '../src/core/round/variety';
import type { SkillDef, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { placementData } from '../src/data/placement';

const ALL: StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const W: Weights = balance.curriculum.weights;
const RULES = { maxPerType: 2 };
const stage = (id: StageId): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(`no stage ${id}`);
    return s;
};
const previousOf = (id: StageId): StageDef | undefined => (id === 'E1' ? undefined : stage(ALL[ALL.indexOf(id) - 1]));
const mk = (id: string, type: string): SkillDef => ({ id, stage: 'E3', step: 1, type, params: {}, answer: 'keypad' });
const counts = (skills: readonly SkillDef[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const s of skills) m.set(s.type, (m.get(s.type) ?? 0) + 1);
    return m;
};
const neighbours = (skills: readonly SkillDef[]): number => skills.filter((s, i) => i > 0 && skills[i - 1].type === s.type).length;
const empty: SkillBuckets = { current: [], earlier: [], previous: [] };

describe('variety rule on synthetic buckets', () => {
    it('two types of three skills: both appear twice, the fifth task makes 3/2 and the types alternate', () => {
        const buckets: SkillBuckets = { ...empty, current: [mk('A1', 'A'), mk('A2', 'A'), mk('B1', 'B')] };
        for (let seed = 1; seed <= 100; seed += 1) {
            const drawn = pickVariedSkills(buckets, W, createRng(seed), 5, RULES);
            expect([...counts(drawn).values()].sort(), `seed ${seed}`).toEqual([2, 3]);
            const round = variedRound(buckets, W, createRng(seed), 5, RULES);
            expect(neighbours(round), `seed ${seed} ${round.map((s) => s.type).join('')}`).toBe(0);
        }
    });

    it('one type only: the rule relaxes, five of that type, order untouched', () => {
        const buckets: SkillBuckets = { ...empty, current: [mk('A1', 'A'), mk('A2', 'A'), mk('A3', 'A')] };
        const drawn = pickVariedSkills(buckets, W, createRng(7), 5, RULES);
        expect(drawn.map((s) => s.type)).toEqual(['A', 'A', 'A', 'A', 'A']);
        expect(spreadTypes(drawn).map((s) => s.id)).toEqual(drawn.map((s) => s.id));
    });

    it('three types: none above 2 and no neighbours', () => {
        const buckets: SkillBuckets = { ...empty, current: [mk('A1', 'A'), mk('A2', 'A'), mk('B1', 'B'), mk('C1', 'C')] };
        for (let seed = 1; seed <= 100; seed += 1) {
            const round = variedRound(buckets, W, createRng(seed), 5, RULES);
            expect(Math.max(...counts(round).values()), `seed ${seed}`).toBeLessThanOrEqual(2);
            expect(neighbours(round), `seed ${seed}`).toBe(0);
        }
    });

    it('an empty set of buckets throws like pickRoundSkills', () => {
        expect(() => pickVariedSkills(empty, W, createRng(1), 5, RULES)).toThrow(RangeError);
    });
});

describe('variety rule on the real curriculum', () => {
    const cases: { id: StageId; step: number }[] = ALL.flatMap((id) => playableSteps(stage(id)).map((step) => ({ id, step })));
    const bucketOf = (b: SkillBuckets, skill: SkillDef): string =>
        (['current', 'earlier', 'previous'] as const).find((k) => b[k].some((s) => s.id === skill.id)) ?? 'none';

    it('every playable step of E1-E6 x 200 seeds: shares, cap replay, spread, permutation, review groups', () => {
        for (const { id, step } of cases) {
            const b = skillBuckets(stage(id), previousOf(id), step);
            const weights = b.currentGroups ? { current: W.current + W.earlier, earlier: 0, previous: W.previous } : W;
            for (let seed = 1; seed <= 200; seed += 1) {
                const where = `${id}.${step} seed ${seed}`;
                const drawn = pickVariedSkills(b, weights, createRng(seed), 5, RULES);
                const plain = pickRoundSkills(b, weights, createRng(seed), 5);
                // (a) the bucket of each draw is the one pickRoundSkills rolls for the same seed
                expect(drawn.map((s) => bucketOf(b, s)), where).toEqual(plain.map((s) => bucketOf(b, s)));
                // (b) replay: a draw at a type already seen twice means every skill of the rolled pool was at 2
                const sim = createRng(seed);
                const usable = (['current', 'earlier', 'previous'] as const).filter((k) => b[k].length > 0 && weights[k] > 0);
                const total = usable.reduce((sum, k) => sum + weights[k], 0);
                const seen = new Map<string, number>();
                drawn.forEach((skill, i) => {
                    let roll = sim.next() * total;
                    let chosen = usable[usable.length - 1];
                    for (const k of usable) {
                        roll -= weights[k];
                        if (roll < 0) {
                            chosen = k;
                            break;
                        }
                    }
                    const groups = chosen === 'current' ? b.currentGroups : undefined;
                    const pool = groups && groups.length > 0 ? sim.pick(groups) : b[chosen];
                    sim.pick(pool);
                    if ((seen.get(skill.type) ?? 0) >= 2) {
                        expect(pool.every((s) => (seen.get(s.type) ?? 0) >= 2), `${where} draw ${i}`).toBe(true);
                    }
                    // (e) review step: the skill stays inside the rolled group
                    expect(pool.some((s) => s.id === skill.id), `${where} draw ${i} pool`).toBe(true);
                    seen.set(skill.type, (seen.get(skill.type) ?? 0) + 1);
                });
                const round = variedRound(b, weights, createRng(seed), 5, RULES);
                // (d) a permutation
                expect(round.map((s) => s.id).sort(), where).toEqual(drawn.map((s) => s.id).sort());
                // (c) neighbours only when one type is above 3 of 5
                if (Math.max(...counts(round).values()) <= 3) expect(neighbours(round), `${where} ${round.map((s) => s.type).join()}`).toBe(0);
            }
        }
    });

    // F3 (post-run-polish phase 4): the cap holds over the whole round whenever the rolled pools allow it. The pools are
    // recorded by replaying the rng with its own copy; existence is brute force over them, never the repair.
    const rolledPools = (b: SkillBuckets, weights: Weights, seed: number, count: number): SkillDef[][] => {
        const sim = createRng(seed);
        const usable = (['current', 'earlier', 'previous'] as const).filter((k) => b[k].length > 0 && weights[k] > 0);
        const total = usable.reduce((sum, k) => sum + weights[k], 0);
        const pools: SkillDef[][] = [];
        for (let i = 0; i < count; i += 1) {
            let roll = sim.next() * total;
            let chosen = usable[usable.length - 1];
            for (const k of usable) {
                roll -= weights[k];
                if (roll < 0) {
                    chosen = k;
                    break;
                }
            }
            const groups = chosen === 'current' ? b.currentGroups : undefined;
            const pool = groups && groups.length > 0 ? sim.pick(groups) : b[chosen];
            sim.pick(pool);
            pools.push([...pool]);
        }
        return pools;
    };
    const withinCapPossible = (pools: readonly SkillDef[][], cap: number): boolean => {
        const walk = (i: number, used: Map<string, number>): boolean => {
            if (i === pools.length) return true;
            for (const type of new Set(pools[i].map((s) => s.type))) {
                if ((used.get(type) ?? 0) >= cap) continue;
                used.set(type, (used.get(type) ?? 0) + 1);
                const ok = walk(i + 1, used);
                used.set(type, (used.get(type) ?? 0) - 1);
                if (ok) return true;
            }
            return false;
        };
        return walk(0, new Map());
    };
    const stepBuckets = (id: StageId, step: number): { b: SkillBuckets; weights: Weights } => {
        const b = skillBuckets(stage(id), previousOf(id), step);
        return { b, weights: b.currentGroups ? { current: W.current + W.earlier, earlier: 0, previous: W.previous } : W };
    };

    it.each([
        ['E2', 1, 1],
        ['E2', 1, 21],
        ['E1', 10, 107],
    ] as [StageId, number, number][])('seeded repro %s.%i seed %i: no type above 2', (id, step, seed) => {
        const { b, weights } = stepBuckets(id, step);
        expect(withinCapPossible(rolledPools(b, weights, seed, 5), 2)).toBe(true);
        const drawn = pickVariedSkills(b, weights, createRng(seed), 5, RULES);
        expect(Math.max(...counts(drawn).values()), drawn.map((s) => s.type).join()).toBeLessThanOrEqual(2);
    });

    it('every playable step x 200 seeds: cap holds whenever the rolled pools allow it, rng use equals pickRoundSkills', () => {
        for (const { id, step } of cases) {
            const { b, weights } = stepBuckets(id, step);
            for (let seed = 1; seed <= 200; seed += 1) {
                const where = `${id}.${step} seed ${seed}`;
                const rngA = createRng(seed);
                const drawn = pickVariedSkills(b, weights, rngA, 5, RULES);
                const rngB = createRng(seed);
                pickRoundSkills(b, weights, rngB, 5);
                expect(rngA.next(), `${where} rng state`).toBe(rngB.next());
                const pools = rolledPools(b, weights, seed, 5);
                drawn.forEach((skill, i) => expect(pools[i].some((s) => s.id === skill.id), `${where} draw ${i} in pool`).toBe(true));
                if (withinCapPossible(pools, 2)) {
                    expect(Math.max(...counts(drawn).values()), `${where} ${drawn.map((s) => s.type).join()}`).toBeLessThanOrEqual(2);
                }
            }
        }
    });

    it('buildAdaptiveRound returns tasks whose skills satisfy the spread', () => {
        for (const id of ALL) {
            const adaptation = startLearning(stages, ({ E1: 6, E2: 7, E3: 8, E4: 9, E5: 10, E6: 10 })[id], 8, placementData, balance.curriculum);
            for (let seed = 1; seed <= 100; seed += 1) {
                const tasks = buildAdaptiveRound(stage(id), previousOf(id), adaptation, W, createRng(seed), { length: 5, uniqueRetries: balance.round.uniqueRetries }, balance.tiles.count);
                const types = tasks.map((t) => {
                    const skill = stage(id).steps.flatMap((s) => s.skills).concat(previousOf(id)?.steps.flatMap((s) => s.skills) ?? []).find((s) => s.id === t.skillId);
                    return skill?.type ?? '?';
                });
                const top = Math.max(...counts(types.map((t) => mk('x', t))).values());
                if (top <= 3) expect(types.filter((t, i) => i > 0 && types[i - 1] === t).length, `${id} seed ${seed} ${types.join()}`).toBe(0);
            }
        }
    });
});

