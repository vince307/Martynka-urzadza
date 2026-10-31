// Origin: first-building-choice phase 1 (S-28, FR-043). "Wróć" to the building choice: pure rule over saved data, literal oracles.
import { describe, expect, it } from 'vitest';
import { hasPurchase, themeBackOffered, type SessionLearner } from '../src/core/placement';
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
