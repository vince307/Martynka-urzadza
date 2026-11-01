// FR-050: the building the child chose changes nothing in what she practises. Rounds, warm-ups, the variant schedule and word
// rounds built from the same learner, variants and stars after either start are deep-equal, and the minigame words are one list.
import { describe, expect, it } from 'vitest';
import { buildingStart } from '../src/core/house';
import { buildAdaptiveRound } from '../src/core/curriculum';
import { createRng } from '../src/core/rng';
import { buildWordRound } from '../src/core/minigames/word';
import { buildWarmup } from '../src/core/round/warmup';
import { freshSession } from '../src/core/save';
import { nextRoundKind } from '../src/core/variants';
import type { Adaptation, StageDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { BUILDING_CHOICES, HOUSES } from '../src/data/houses';
import { MINIGAME_WORDS } from '../src/data/minigames';

const stage = (id: 'E1' | 'E2' | 'E3'): StageDef => {
    const s = stages[id];
    if (!s) throw new Error(id);
    return s;
};
const adaptation: Adaptation = { unlockedStep: { E1: 1, E2: 3, E3: 1, E4: 1, E5: 1, E6: 1 }, mastery: {}, streak: {}, history: [], weakStreak: 0, easedRounds: 0 };

describe('the chosen building does not reach the practice (FR-050)', () => {
    const sessionIn = (choice: 'house' | 'space') => {
        const start = buildingStart(choice, BUILDING_CHOICES, HOUSES);
        return { ...freshSession(start.house, 7), ...start };
    };

    it('the two starts differ in the building only', () => {
        const a = sessionIn('house');
        const b = sessionIn('space');
        expect(a.house.id).not.toBe(b.house.id);
        expect({ ...a, house: null, rooms: null, currentRoom: null }).toEqual({ ...b, house: null, rooms: null, currentRoom: null });
    });

    it.each(Array.from({ length: 20 }, (_, i) => i + 1))('seed %i: rounds, warm-up, kind and word round are deep-equal', (seed) => {
        const build = (choice: 'house' | 'space') => {
            const s = sessionIn(choice);
            const round = buildAdaptiveRound(stage('E2'), stage('E1'), adaptation, balance.curriculum.weights, createRng(seed), { length: 5, uniqueRetries: balance.round.uniqueRetries }, 4);
            const warm = buildWarmup(stage('E2'), stage('E1'), createRng(seed), { length: 6, previousCount: 3, currentSteps: 2 }, 4, balance.round.uniqueRetries);
            const kind = nextRoundKind(s.variants, { stageId: 'E2', today: '2026-11-01', hasPool: () => true, minigames: ['word', 'dice'], wordAvailable: true, rules: { everyRounds: 0 } });
            const word = buildWordRound(stage('E2'), stage('E1'), adaptation, createRng(seed), { tiles: balance.variants.word.tiles, uniqueRetries: balance.round.uniqueRetries, words: MINIGAME_WORDS });
            return { round, warm, kind, word, stars: s.stars, learner: s.learner, variants: s.variants };
        };
        // Tasks may hold closures (a check), which toEqual cannot tell apart: compare their JSON, which drops functions.
        const json = (choice: 'house' | 'space'): string => JSON.stringify(build(choice));
        expect(json('space')).toBe(json('house'));
    });

    it('the minigame words are one list', () => {
        expect(MINIGAME_WORDS.length).toBeGreaterThan(0);
        expect(new Set(MINIGAME_WORDS).size).toBe(MINIGAME_WORDS.length);
    });
});
