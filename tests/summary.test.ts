// The round-summary view model (PRD FR-007 stars and bonus, FR-010 highlight).
import { describe, expect, it } from 'vitest';
import { answer, next, nextSolutionStep, startRound, type RoundState } from '../src/core/round';
import { summaryView } from '../src/core/round/summary';
import type { Task } from '../src/core/tasks/types';

// Oracle values come from the PRD, not from the code: 1 star per task solved
// on the first or second try, +2 for a round without a mistake (FR-007).
const rules = { length: 5, starPerTask: 1, cleanRoundBonus: 2 };
const task: Task = { skillId: 'T.1', prompt: '2 + 3', answer: 5, choices: [4, 5, 6, 7], hint: ['2 + 3', '2 + 3 = 5'] };
const tasks = Array.from({ length: 5 }, (_, i) => ({ ...task, skillId: `T.${i}` }));
const ctx = { starsTotal: 0, nextRoomTaskCost: null };

/** Plays the round through the reducer; `plan[i]` is the number of wrong answers before the right one (3 = full walk-through and retype). */
const play = (plan: readonly number[]): RoundState => {
    let s = startRound(tasks, rules);
    for (const wrongs of plan) {
        for (let k = 0; k < Math.min(wrongs, 2); k += 1) {
            s = answer(s, -1);
        }
        while (wrongs >= 3 && s.phase === 'solution') {
            s = nextSolutionStep(s);
        }
        s = next(answer(s, 5));
    }
    return s;
};

describe('summaryView', () => {
    it('a clean round: five stars, earned 5 + 2, bonus 2', () => {
        const v = summaryView(play([0, 0, 0, 0, 0]), ctx);
        expect(v).toMatchObject({ earned: 7, bonus: 2, stars: [true, true, true, true, true] });
    });

    it('a second try keeps the star but drops the bonus', () => {
        const v = summaryView(play([0, 1, 0, 0, 0]), ctx);
        expect(v).toMatchObject({ earned: 5, bonus: 0, stars: [true, true, true, true, true] });
    });

    it('a retyped task gives no star and no bonus', () => {
        const v = summaryView(play([0, 3, 0, 0, 0]), ctx);
        expect(v).toMatchObject({ earned: 4, bonus: 0, stars: [true, false, true, true, true] });
    });

    it('is null while the round is not finished', () => {
        expect(summaryView(startRound(tasks, rules), ctx)).toBeNull();
        expect(summaryView(answer(startRound(tasks, rules), 5), ctx)).toBeNull();
    });

    it('highlights "Do pokoju" only when the stars cover the cost', () => {
        const s = play([0, 0, 0, 0, 0]);
        expect(summaryView(s, { starsTotal: 100, nextRoomTaskCost: null })?.roomHighlighted).toBe(false);
        expect(summaryView(s, { starsTotal: 9, nextRoomTaskCost: 10 })?.roomHighlighted).toBe(false);
        expect(summaryView(s, { starsTotal: 10, nextRoomTaskCost: 10 })?.roomHighlighted).toBe(true);
        expect(summaryView(s, { starsTotal: 11, nextRoomTaskCost: 10 })?.roomHighlighted).toBe(true);
    });
});
