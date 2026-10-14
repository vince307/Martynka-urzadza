// Origin: S-15 phase 8. The letter row, the uncovered count and the done card geometry of "Hasło z wyników".
import { describe, expect, it } from 'vitest';
import { startLearning } from '../src/core/curriculum';
import { letterRow, lettersUncovered, wordAvailable } from '../src/core/minigames/word';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { MINIGAME_LAYOUT, TASK_LAYOUT } from '../src/data/layout';
import { MINIGAME_WORDS } from '../src/data/minigames';
import { placementData } from '../src/data/placement';

const { letters, card, buttons } = MINIGAME_LAYOUT;
const box = { width: letters.width, gap: letters.gap };
const notebookRight = TASK_LAYOUT.notebook.left + TASK_LAYOUT.notebook.width;

describe('letterRow', () => {
    it.each([5, 6])('puts %i letters side by side, a gap apart, centred inside the notebook', (n) => {
        const lefts = letterRow(n, box, letters.centerX);
        expect(lefts).toHaveLength(n);
        lefts.slice(1).forEach((left, i) => expect(left - lefts[i], `box ${i + 1}`).toBe(letters.width + letters.gap));
        expect(lefts[0]).toBeGreaterThanOrEqual(TASK_LAYOUT.notebook.left);
        expect(lefts[n - 1] + letters.width).toBeLessThanOrEqual(notebookRight);
        expect((lefts[0] + lefts[n - 1] + letters.width) / 2).toBe(letters.centerX);
    });

    it('fits the longest word of the list inside the notebook', () => {
        const longest = Math.max(...MINIGAME_WORDS.map((w) => Array.from(w).length));
        const lefts = letterRow(longest, box, letters.centerX);
        expect(lefts[0]).toBeGreaterThanOrEqual(TASK_LAYOUT.notebook.left);
        expect(lefts[longest - 1] + letters.width).toBeLessThanOrEqual(notebookRight);
    });

    it('keeps the letters above the expression and the expression above the answer tiles', () => {
        expect(letters.top + letters.height).toBeLessThan(MINIGAME_LAYOUT.expressionY);
        expect(MINIGAME_LAYOUT.promptY).toBeGreaterThan(letters.top + letters.height);
        expect(MINIGAME_LAYOUT.expressionY).toBeLessThan(TASK_LAYOUT.tiles.top);
    });
});

describe('lettersUncovered', () => {
    it('counts every finished task, whatever way it was settled', () => {
        expect(lettersUncovered([null, null, null])).toBe(0);
        expect(lettersUncovered(['first', 'retype', null, null])).toBe(2);
    });
});

describe('wordAvailable', () => {
    it('is on for every stage with the list, off without words', () => {
        const learner = startLearning(stages, 8, 9, placementData, balance.curriculum);
        for (const stage of Object.values(stages)) {
            expect(wordAvailable(stage, undefined, learner, MINIGAME_WORDS), stage.id).toBe(true);
            expect(wordAvailable(stage, undefined, learner, []), stage.id).toBe(false);
        }
    });
});

describe('done card', () => {
    it('keeps both buttons inside the card, a gap apart, at touch size', () => {
        expect(buttons.left).toBeGreaterThanOrEqual(card.left);
        expect(buttons.left + 2 * buttons.width + buttons.gap).toBeLessThanOrEqual(card.left + card.width);
        expect(buttons.top + buttons.height).toBeLessThanOrEqual(card.top + card.height);
        expect(buttons.height).toBeGreaterThanOrEqual(96);
    });
});
