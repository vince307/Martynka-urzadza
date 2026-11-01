// Origin: first-building-choice phase 1 (S-28, FR-043). "Wróć" to the building choice: pure rule over saved data, literal oracles.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasPurchase, needsPlacement, themeBackOffered, type SessionLearner } from '../src/core/placement';
import { decodeSave, encodeSave, freshSession, validateSave } from '../src/core/save';
import { houseOf } from './helpers';
import type { VariantState } from '../src/core/types';

const WARMUP = 6;
const fresh: VariantState = { roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] };
const history = (n: number): SessionLearner['history'] => Array.from({ length: n }, (_, i) => ({ skillId: 'E3.add.100', ok: true, firstTry: true, at: i }));
const room = (tasksDone: number) => ({ tasksDone, chosen: {} });

describe('hasPurchase', () => {
    it('is false without rooms or with only zeros', () => {
        expect(hasPurchase({})).toBe(false);
        expect(hasPurchase({ salon: room(0) })).toBe(false);
    });
    it('is true when any room has a task done', () => {
        expect(hasPurchase({ salon: room(0), kitchen: room(1) })).toBe(true);
    });
});

describe('themeBackOffered', () => {
    it('is offered to a learner with an empty history, with no stage-override term', () => {
        expect(themeBackOffered({ history: [] }, fresh, WARMUP, { salon: room(0) })).toBe(true);
    });
    it('is offered during the warm-up and with no rooms at all', () => {
        expect(themeBackOffered({ history: history(WARMUP) }, fresh, WARMUP, {})).toBe(true);
    });
    it('is gone once more answers than the warm-up are recorded', () => {
        expect(themeBackOffered({ history: history(WARMUP + 1) }, fresh, WARMUP, { salon: room(0) })).toBe(false);
    });
    it('is gone after a counted round', () => {
        expect(themeBackOffered({ history: [] }, { ...fresh, roundsSince: 1 }, WARMUP, {})).toBe(false);
    });
    it('is gone for a room with a purchase', () => {
        expect(themeBackOffered({ history: [] }, fresh, WARMUP, { salon: room(1) })).toBe(false);
    });
    it('is offered for a room map with only zeros', () => {
        expect(themeBackOffered({ history: [] }, fresh, WARMUP, { salon: room(0), kitchen: room(0) })).toBe(true);
    });
});

describe('a v1 save lifted by decodeSave', () => {
    it('has 2 history entries and fresh variants, so the way back is offered (accepted edge, plan-review F1); 7 entries end it', () => {
        const raw: unknown = JSON.parse(readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8'));
        const result = decodeSave(raw);
        if (result.kind !== 'ok' || result.session.learner === null) throw new Error('fixture must decode');
        const { learner: lifted, variants, rooms } = result.session;
        expect(variants).toEqual(fresh);
        expect(lifted.history).toHaveLength(2);
        expect(themeBackOffered(lifted, variants, WARMUP, {})).toBe(true);
        const extended = { ...lifted, history: [...lifted.history, ...history(5)] };
        expect(themeBackOffered(extended, variants, WARMUP, rooms)).toBe(false);
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
