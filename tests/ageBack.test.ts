// When "Wróć" to the age choice is offered (playtest F-02 b, plan phase 5). Pure rule over saved v4 data.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ageBackOffered, needsPlacement, type SessionLearner } from '../src/core/placement';
import { decodeSave, encodeSave, freshSession, validateSave } from '../src/core/save';
import { houseOf } from './helpers';
import type { VariantState } from '../src/core/types';

const WARMUP = 6;
const fresh: VariantState = { roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] };
const entry = (i: number) => ({ skillId: 'E3.add.100', ok: true, firstTry: true, at: i });
const history = (n: number) => Array.from({ length: n }, (_, i) => entry(i));

const learner = (over: Partial<SessionLearner> = {}): SessionLearner => ({
    age: 8,
    stage: 'E3',
    stageOverriddenByParent: false,
    warmupPending: false,
    unlockedStep: { E1: 1, E2: 1, E3: 1, E4: 1, E5: 1, E6: 1 },
    mastery: {},
    streak: {},
    history: [],
    weakStreak: 0,
    easedRounds: 0,
    pendingUnlock: null,
    ...over,
});

describe('ageBackOffered', () => {
    it('is offered to a fresh child-placed learner', () => {
        expect(ageBackOffered(learner(), fresh, WARMUP)).toBe(true);
    });
    it('is not offered when a parent chose the stage', () => {
        expect(ageBackOffered(learner({ stageOverriddenByParent: true }), fresh, WARMUP)).toBe(false);
    });
    it('is not offered once an ordinary round was counted', () => {
        expect(ageBackOffered(learner(), { ...fresh, roundsSince: 1 }, WARMUP)).toBe(false);
    });
    it('is not offered after a variant (roundsSince reset to 0)', () => {
        expect(ageBackOffered(learner(), { ...fresh, lastMinigame: 'dice' }, WARMUP)).toBe(false);
        expect(ageBackOffered(learner(), { ...fresh, puzzleDay: '2026-10-14' }, WARMUP)).toBe(false);
        expect(ageBackOffered(learner(), { ...fresh, puzzlesDone: ['p1'] }, WARMUP)).toBe(false);
    });
    it('is offered with a warm-up only history (6) and not with 7', () => {
        expect(ageBackOffered(learner({ history: history(6) }), fresh, WARMUP)).toBe(true);
        expect(ageBackOffered(learner({ history: history(7) }), fresh, WARMUP)).toBe(false);
    });
    it('a v1 save lifted by decodeSave has 2 history entries and fresh variants, so it is offered (accepted edge, plan-review F1)', () => {
        const raw: unknown = JSON.parse(readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8'));
        const result = decodeSave(raw);
        if (result.kind !== 'ok' || result.session.learner === null) throw new Error('fixture must decode');
        const { learner: lifted, variants } = result.session;
        expect(variants).toEqual(fresh);
        expect(lifted.history).toHaveLength(2);
        expect(ageBackOffered(lifted, variants, WARMUP)).toBe(true);
        const extended = { ...lifted, history: [...lifted.history, ...history(5)] };
        expect(extended.history).toHaveLength(7);
        expect(ageBackOffered(extended, variants, WARMUP)).toBe(false);
    });
});

describe('a save without a learner after "Wróć"', () => {
    it('keeps stars and the bought salon task, and asks for placement again', () => {
        const base = freshSession(houseOf('living'), 7);
        const session = { ...base, rooms: { living: { tasksDone: 2, chosen: { sofa: 1 as const } } } };
        const raw: unknown = JSON.parse(JSON.stringify(encodeSave(session)));
        expect(validateSave(raw)).toBe(true);
        const result = decodeSave(raw);
        if (result.kind !== 'ok') throw new Error('must decode');
        expect(result.session.stars).toBe(7);
        expect(result.session.rooms).toEqual(session.rooms);
        expect(result.session.learner).toBeNull();
        expect(needsPlacement(result.session.learner)).toBe(true);
    });
});
