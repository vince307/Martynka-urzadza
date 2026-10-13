// Round state machine against the PRD star rules (FR-006, FR-007, FR-008):
// 1 star per task solved on the first or second try, +2 for a round with no
// mistake, 0 for a retyped result, stars never decrease. Expected values come
// from the PRD, not from the implementation.
import { describe, expect, it } from 'vitest';
import { answer, next, nextSolutionStep, startRound, type RoundRules, type RoundState } from '../src/core/round';
import { createRng } from '../src/core/rng';
import { generateTask } from '../src/core/tasks/generateTask';
import type { Task } from '../src/core/tasks/types';
import { balance } from '../src/data/balance';
import { E3 } from '../src/data/curriculum/E3';

const RULES: RoundRules = balance.round;

const task = (i: number, extra: Partial<Task> = {}): Task => ({
    skillId: `T.${i}`,
    prompt: `${i} + 1`,
    answer: i + 1,
    hint: [`${i} + 1 = ${i + 1}`],
    ...extra,
});
const tasks = (n = 5): Task[] => Array.from({ length: n }, (_, i) => task(i));
const WRONG = -1;

const deepFreeze = <T>(value: T): T => {
    if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const v of Object.values(value)) {
            deepFreeze(v);
        }
    }
    return value;
};

/** Solve the current task right away and move on. */
const solveFirst = (s: RoundState): RoundState => next(answer(s, s.tasks[s.index].answer));
/** Two wrong answers, walk through the solution, retype, move on. */
const failTask = (s: RoundState): RoundState => {
    let r = answer(answer(s, WRONG), WRONG);
    for (let i = 0; i < 10 && r.phase === 'solution'; i += 1) {
        r = nextSolutionStep(r);
    }
    return next(answer(r, r.tasks[r.index].answer));
};

describe('balance', () => {
    it('keeps the PRD numbers as data', () => {
        expect(balance.round).toEqual({ length: 5, starPerTask: 1, cleanRoundBonus: 2, uniqueRetries: 20 });
    });
});

describe('round stars (FR-007)', () => {
    it('a clean round pays 5 + 2', () => {
        let s = startRound(tasks(), RULES);
        for (let i = 0; i < 5; i += 1) {
            s = solveFirst(s);
        }
        expect(s.finished).toBe(true);
        expect(s.starsEarned).toBe(7);
        expect(s.bonusEarned).toBe(2);
        expect(s.outcomes).toEqual(['first', 'first', 'first', 'first', 'first']);
    });

    it('a second-try answer pays 1 star but costs the bonus', () => {
        let s = startRound(tasks(), RULES);
        s = answer(s, WRONG);
        expect(s.phase).toBe('second');
        expect(s.starsEarned).toBe(0);
        s = next(answer(s, s.tasks[0].answer));
        expect(s.starsEarned).toBe(1);
        expect(s.outcomes[0]).toBe('second');
        for (let i = 1; i < 5; i += 1) {
            s = solveFirst(s);
        }
        expect(s.finished).toBe(true);
        expect(s.starsEarned).toBe(5);
        expect(s.bonusEarned).toBe(0);
    });

    it('two mistakes, the solution steps and the retype pay nothing', () => {
        let s = startRound(tasks(), RULES);
        s = answer(answer(s, WRONG), WRONG);
        expect(s.phase).toBe('solution');
        expect(s.solutionStep).toBe(0);
        for (let i = 0; i < 10 && s.phase === 'solution'; i += 1) {
            s = nextSolutionStep(s);
        }
        expect(s.phase).toBe('retype');
        expect(s.starsEarned).toBe(0);
        s = answer(s, WRONG);
        expect(s.phase).toBe('retype');
        expect(s.starsEarned).toBe(0);
        s = next(answer(s, s.tasks[0].answer));
        expect(s.outcomes[0]).toBe('retype');
        expect(s.starsEarned).toBe(0);
        expect(s.index).toBe(1);
        expect(s.phase).toBe('first');
        for (let i = 1; i < 5; i += 1) {
            s = solveFirst(s);
        }
        expect(s.starsEarned).toBe(4);
        expect(s.bonusEarned).toBe(0);
    });

    it('a round of only failed tasks ends with 0 stars', () => {
        let s = startRound(tasks(), RULES);
        for (let i = 0; i < 5; i += 1) {
            s = failTask(s);
        }
        expect(s.finished).toBe(true);
        expect(s.starsEarned).toBe(0);
    });

    it('a wrong retype never takes a star away', () => {
        let s = startRound(tasks(), RULES);
        s = solveFirst(s);
        const before = s.starsEarned;
        s = answer(answer(s, WRONG), WRONG);
        for (let i = 0; i < 10 && s.phase === 'solution'; i += 1) {
            s = nextSolutionStep(s);
        }
        s = answer(s, WRONG);
        expect(s.starsEarned).toBe(before);
    });

    it('the round length is data', () => {
        let s = startRound(tasks(3), { length: 3, starPerTask: 1, cleanRoundBonus: 2 });
        for (let i = 0; i < 3; i += 1) {
            s = solveFirst(s);
        }
        expect(s.finished).toBe(true);
        expect(s.starsEarned).toBe(5);
    });
});

describe('round transitions', () => {
    it('ignores actions that are not allowed in the phase', () => {
        const s = deepFreeze(startRound(tasks(), RULES));
        expect(next(s)).toEqual(s);
        expect(nextSolutionStep(s)).toEqual(s);
        const done = deepFreeze(answer(s, s.tasks[0].answer));
        expect(done.phase).toBe('done');
        expect(answer(done, WRONG)).toEqual(done);
        expect(answer(done, done.tasks[0].answer)).toEqual(done);
        expect(nextSolutionStep(done)).toEqual(done);
    });

    it('does not change the state it was given', () => {
        const s = deepFreeze(startRound(tasks(), RULES));
        expect(() => next(answer(answer(answer(s, WRONG), WRONG), WRONG))).not.toThrow();
    });

    it('the solution has one step per hint line and then asks to retype', () => {
        const hinted = [task(0, { hint: ['a = 1', 'b = 2', 'c = 1'] }), ...tasks(4).slice(1)];
        let s = answer(answer(startRound(hinted, RULES), WRONG), WRONG);
        const seen: number[] = [s.solutionStep];
        while (s.phase === 'solution') {
            s = nextSolutionStep(s);
            if (s.phase === 'solution') {
                seen.push(s.solutionStep);
            }
        }
        expect(seen).toEqual([0, 1, 2]);
        expect(s.phase).toBe('retype');
    });

    it('accepts a string answer and a set answer through check', () => {
        const text = task(0, { answer: '<', choices: ['<', '>', '='] });
        const set = task(1, { answer: [2, 4], check: (input) => Array.isArray(input) && input.length === 2 && input.includes(2) && input.includes(4) });
        let s = startRound([text, set], { length: 2, starPerTask: 1, cleanRoundBonus: 2 });
        s = next(answer(s, '<'));
        expect(s.outcomes[0]).toBe('first');
        s = answer(s, [2]);
        expect(s.phase).toBe('second');
        s = answer(s, [4, 2]);
        expect(s.outcomes[1]).toBe('second');
    });

    it('works on real generated tasks', () => {
        const skills = E3.steps.flatMap((step) => step.skills);
        const rng = createRng(77);
        const real = Array.from({ length: 5 }, () => generateTask(skills[rng.int(0, skills.length - 1)], rng, { tileCount: 4 }));
        let s = startRound(real, RULES);
        for (let i = 0; i < 5; i += 1) {
            s = solveFirst(s);
        }
        expect(s.starsEarned).toBe(7);
    });
});

describe('round properties (random action sequences)', () => {
    type Action = 'right' | 'wrong' | 'step' | 'next';
    const ACTIONS: Action[] = ['right', 'wrong', 'step', 'next'];

    it('stars never decrease, a round pays 0..7 and every task pays at most once', () => {
        for (let seed = 1; seed <= 200; seed += 1) {
            const rng = createRng(4000 + seed);
            let s = deepFreeze(startRound(tasks(), RULES));
            let previous = 0;
            for (let step = 0; step < 300 && !s.finished; step += 1) {
                const action = rng.pick(ACTIONS);
                const t = s.tasks[s.index];
                s =
                    action === 'right' ? answer(s, t.answer) : action === 'wrong' ? answer(s, WRONG) : action === 'step' ? nextSolutionStep(s) : next(s);
                s = deepFreeze(s);
                const where = `seed ${seed} step ${step} ${action}`;
                expect(s.starsEarned, where).toBeGreaterThanOrEqual(previous);
                expect(s.starsEarned, where).toBeLessThanOrEqual(7);
                previous = s.starsEarned;
                const paid = s.outcomes.filter((o) => o === 'first' || o === 'second').length;
                expect(s.starsEarned, where).toBe(paid + s.bonusEarned);
                expect(s.bonusEarned === 0 || s.bonusEarned === 2, where).toBe(true);
                if (s.bonusEarned > 0) {
                    expect(s.finished, where).toBe(true);
                    expect(s.outcomes.every((o) => o === 'first'), where).toBe(true);
                }
            }
        }
    });
});
