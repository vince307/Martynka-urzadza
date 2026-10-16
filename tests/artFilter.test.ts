// Origin: change art-stand-in-and-load-signal, phase 1. Skills whose answer is only in a missing picture are skipped
// from the round pools, without blocking an unlock and without emptying a round. Oracles are typed here.
import { describe, expect, it } from 'vitest';
import { buildAdaptiveRound, skillBuckets, unlockThreshold } from '../src/core/curriculum';
import { createRng } from '../src/core/rng';
import { artBlocked, withoutArtBlocked } from '../src/core/round/artFilter';
import type { SkillBuckets } from '../src/core/round/pick';
import { visualArtIds } from '../src/core/tasks/visual';
import { buildWarmup } from '../src/core/round/warmup';
import type { Adaptation, SkillDef, StageDef, StageId } from '../src/core/types';
import { balance } from '../src/data/balance';
import { getStage } from '../src/data/curriculum';

const stage = (id: StageId): StageDef => getStage(id) as StageDef;
const skillById = (id: string): SkillDef => {
    for (const s of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'] as StageId[]) {
        const hit = stage(s).steps.flatMap((st) => st.skills).find((k) => k.id === id);
        if (hit) return hit;
    }
    throw new Error(`no skill ${id}`);
};
const NONE: ReadonlySet<string> = new Set();

describe('artBlocked', () => {
    it('blocks MONEY_COUNT when a coin it can draw is missing, not otherwise', () => {
        const s = skillById('E2.2.money_count_20');
        expect(artBlocked(s, new Set(['coin-2zl']))).toBe(true);
        expect(artBlocked(s, new Set(['coin-50gr']))).toBe(false);
        expect(artBlocked(s, NONE)).toBe(false);
    });

    it('blocks MASS on a missing weight and CAPACITY toLitres on a missing jug', () => {
        expect(artBlocked(skillById('E3.4.mass_kg_10'), new Set(['weight-5kg']))).toBe(true);
        expect(artBlocked(skillById('E5.5.capacity_quarter_l'), new Set(['container-half-l']))).toBe(true);
        expect(artBlocked(skillById('E2.2.capacity_litres'), new Set(['container-half-l']))).toBe(false);
    });

    it('never blocks a text MASS skill: E5.7 grams, E6.3 tare and E6.5 tonnes read without a picture', () => {
        const everything = new Set(['weight-1kg', 'weight-2kg', 'weight-5kg', 'weight-10dag', 'weight-20dag', 'weight-50dag']);
        for (const id of ['E5.7.mass_grams', 'E6.3.mass_tare_kg', 'E6.5.mass_tonne']) {
            const s = skillById(id);
            expect(s.params.variant, id).toBe('text');
            expect(artBlocked(s, everything), id).toBe(false);
        }
        expect(artBlocked(skillById('E3.4.mass_kg_10'), everything)).toBe(true);
    });

    it('never blocks a CAPACITY text skill: E5.5 glasses of ½ l and ¼ l need no jug picture', () => {
        const jugs = new Set(['container-1l', 'container-half-l', 'container-quarter-l']);
        const s = skillById('E5.5.capacity_half_l_e5');
        expect(s.params.variant).toBe('text');
        expect(artBlocked(s, jugs)).toBe(false);
        expect(artBlocked(skillById('E5.5.capacity_quarter_l'), jugs)).toBe(true);
    });

    it('never blocks MONEY_CHANGE or a CAPACITY howMany skill', () => {
        const everything = new Set(['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl', 'container-half-l', 'container-quarter-l', 'container-1l']);
        expect(artBlocked(skillById('E2.2.money_change_20'), everything)).toBe(false);
        const howMany = skillById('E4.7.capacity_litres_half');
        expect(howMany.params.variant).toBe('howMany');
        expect(artBlocked(howMany, everything)).toBe(false);
    });
});

describe('withoutArtBlocked', () => {
    const buckets = (id: StageId, step: number): SkillBuckets => skillBuckets(stage(id), undefined, step);

    it('keeps the current step whole when filtering would leave it under the unlock threshold (E2.2)', () => {
        const b = buckets('E2', 2);
        const missing = new Set(['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl', 'container-1l']);
        const out = withoutArtBlocked(b, (s) => artBlocked(s, missing), unlockThreshold(b.current.length, balance.curriculum.unlockShare));
        expect(out.current).toEqual(b.current);
    });

    it('E5.5 with the half litre jug missing: only the jug skill goes, the step keeps what it needs to unlock', () => {
        const b = buckets('E5', 5);
        const need = unlockThreshold(b.current.length, balance.curriculum.unlockShare);
        const out = withoutArtBlocked(b, (s) => artBlocked(s, new Set(['container-half-l'])), need);
        expect(out.current.map((s) => s.id)).not.toContain('E5.5.capacity_quarter_l');
        expect(out.current.length).toBeGreaterThanOrEqual(need);
    });

    const mk = (id: string): SkillDef => ({ id, stage: 'E2', step: 1, type: 'X', params: {}, answer: 'keypad' });
    const five = [1, 2, 3, 4, 5].map((n) => mk(`s${n}`));

    it('filters the current step when at least the threshold remains', () => {
        const b: SkillBuckets = { current: five, earlier: [mk('e1'), mk('e2')], previous: [mk('p1')] };
        const out = withoutArtBlocked(b, (s) => s.id === 's1' || s.id === 'e1' || s.id === 'p1', 3);
        expect(out.current.map((s) => s.id)).toEqual(['s2', 's3', 's4', 's5']);
        expect(out.earlier.map((s) => s.id)).toEqual(['e2']);
        expect(out.previous).toEqual([]);
    });

    it('does not filter the current step below the threshold', () => {
        const b: SkillBuckets = { current: five, earlier: [], previous: [] };
        const out = withoutArtBlocked(b, (s) => s.id !== 's5' && s.id !== 's4', 3);
        expect(out.current).toEqual(five);
    });

    it('returns the original buckets when every pool would be empty', () => {
        const b: SkillBuckets = { current: five, earlier: [mk('e1')], previous: [mk('p1')] };
        expect(withoutArtBlocked(b, () => true, 3)).toBe(b);
    });
});

describe('unlockThreshold', () => {
    it('is ceil(share * n)', () => {
        expect(unlockThreshold(5, 0.5)).toBe(3);
        expect(unlockThreshold(4, 0.5)).toBe(2);
        expect(unlockThreshold(1, 0.5)).toBe(1);
    });
});

describe('rounds with missing art', () => {
    const rules = { length: 5, uniqueRetries: balance.round.uniqueRetries };
    const NORMAL = balance.curriculum.weights;
    const learner = (step: number): Adaptation => ({
        unlockedStep: { E1: 1, E2: step, E3: 1, E4: step, E5: step, E6: 1 },
        mastery: {},
        streak: {},
        history: [],
        weakStreak: 0,
        easedRounds: 0,
    });

    it('gives the same tasks with no art argument and with an empty missing set (no extra rng use)', () => {
        for (const id of ['E2', 'E4', 'E5'] as StageId[]) {
            for (let seed = 1; seed <= 20; seed += 1) {
                const adaptation = learner(id === 'E2' ? 2 : 4);
                const plain = buildAdaptiveRound(stage(id), undefined, adaptation, NORMAL, createRng(seed), rules, balance.tiles.count);
                const empty = buildAdaptiveRound(stage(id), undefined, adaptation, NORMAL, createRng(seed), rules, balance.tiles.count, { missingIds: NONE, unlockShare: balance.curriculum.unlockShare });
                // JSON drops the `check` closures (MONEY_PAY tasks carry one; two closures are never equal).
                expect(JSON.parse(JSON.stringify(empty))).toEqual(JSON.parse(JSON.stringify(plain)));
            }
        }
    });

    it('draws no MONEY_COUNT from earlier or previous pools when coins are missing', () => {
        const coins = new Set(['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl', 'note-50zl', 'note-100zl', 'coin-1gr', 'coin-2gr', 'coin-5gr', 'coin-10gr', 'coin-20gr', 'coin-50gr']);
        const adaptation = learner(4);
        let moneyCount = 0;
        for (let seed = 1; seed <= 200; seed += 1) {
            const tasks = buildAdaptiveRound(stage('E4'), stage('E3'), adaptation, NORMAL, createRng(seed), rules, balance.tiles.count, { missingIds: coins, unlockShare: balance.curriculum.unlockShare });
            moneyCount += tasks.filter((t) => t.skillId.includes('money_count')).length;
        }
        expect(moneyCount).toBe(0);
    });

    it('warm-up with a blocked predicate avoids blocked skills; an empty blocked set keeps the draw', () => {
        const prev = stage('E3');
        const cur = stage('E4');
        const plain = buildWarmup(cur, prev, createRng(5), balance.warmup, balance.tiles.count, balance.round.uniqueRetries);
        const same = buildWarmup(cur, prev, createRng(5), balance.warmup, balance.tiles.count, balance.round.uniqueRetries, () => false);
        expect(same).toEqual(plain);
        for (let seed = 1; seed <= 100; seed += 1) {
            const tasks = buildWarmup(cur, prev, createRng(seed), balance.warmup, balance.tiles.count, balance.round.uniqueRetries, (s) => s.type === 'MONEY_COUNT');
            expect(tasks.filter((t) => t.skillId.includes('money_count'))).toEqual([]);
        }
    });
});

describe('ORDINAL in the art filter and the redraw (child-flow-guards p1)', () => {
    const ordinal = skillById('E1.2.ordinal_5');
    const allIcons = ['cup', 'croissant', 'flower', 'cushion', 'book', 'lamp', 'apple', 'pear', 'teapot', 'pencil', 'key', 'yarn', 'plate', 'box', 'sticker'];
    const rules = { length: balance.round.length, uniqueRetries: balance.round.uniqueRetries };
    const adapt = (step: number): Adaptation => ({ unlockedStep: { E1: step, E2: 1, E3: 1, E4: 1, E5: 1, E6: 1 }, mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds: 0 });
    const NORMAL = { current: 60, earlier: 30, previous: 10 };

    it('blocks ORDINAL when fewer icons are loaded than its row needs, not with one missing', () => {
        expect(artBlocked(ordinal, new Set(allIcons.slice(0, 11)))).toBe(true); // 4 loaded < max 5
        expect(artBlocked(ordinal, new Set(allIcons.slice(0, 10)))).toBe(false); // 5 loaded
        expect(artBlocked(ordinal, new Set(['key']))).toBe(false);
    });

    it('E1.11 with coins, notes and weights missing and picture mode on: the step still shows enough skills to unlock (threshold of the step)', () => {
        const missingIds = new Set(['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'weight-1kg', 'weight-2kg', 'weight-5kg']);
        const threshold = unlockThreshold(stage('E1').steps.find((s) => s.step === 11)?.skills.length ?? 0, balance.curriculum.unlockShare);
        const drawn = new Set<string>();
        for (let seed = 1; seed <= 200; seed += 1) {
            const tasks = buildAdaptiveRound(stage('E1'), undefined, adapt(11), NORMAL, createRng(seed), rules, balance.tiles.count, { missingIds, unlockShare: balance.curriculum.unlockShare }, { picture: true });
            for (const t of tasks) if (t.skillId.startsWith('E1.11.')) drawn.add(t.skillId);
        }
        expect(drawn.size).toBeGreaterThanOrEqual(threshold);
    });

    it('E1 step 2 with the key missing: no drawn task (or hint drawing) names the key', () => {
        const missingIds = new Set(['key']);
        for (let seed = 1; seed <= 100; seed += 1) {
            const tasks = buildAdaptiveRound(stage('E1'), undefined, adapt(2), NORMAL, createRng(seed), rules, balance.tiles.count, { missingIds, unlockShare: balance.curriculum.unlockShare });
            for (const t of tasks) {
                expect(t.visual ? visualArtIds(t.visual) : [], `seed ${seed} ${t.skillId}`).not.toContain('key');
                expect(t.hintVisual ? visualArtIds(t.hintVisual) : [], `seed ${seed} ${t.skillId}`).not.toContain('key');
            }
        }
    });

    it('a round with nothing missing equals the round without the art argument', () => {
        for (let seed = 1; seed <= 30; seed += 1) {
            const a = buildAdaptiveRound(stage('E1'), undefined, adapt(2), NORMAL, createRng(seed), rules, balance.tiles.count);
            const b = buildAdaptiveRound(stage('E1'), undefined, adapt(2), NORMAL, createRng(seed), rules, balance.tiles.count, { missingIds: new Set(), unlockShare: 0.5 });
            expect(b.map((t) => t.prompt)).toEqual(a.map((t) => t.prompt));
        }
    });
});
