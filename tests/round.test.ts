// Round state machine against the PRD star rules (FR-006, FR-007, FR-008):
// 1 star per task solved on the first or second try, +2 for a round with no
// mistake, 0 for a retyped result, stars never decrease. Expected values come
// from the PRD, not from the implementation.
import { describe, expect, it } from 'vitest';
import { answer, next, nextSolutionStep, roundResults, startRound, type RoundRules, type RoundState } from '../src/core/round';
import { createRng } from '../src/core/rng';
import { generateTask } from '../src/core/tasks/generateTask';
import type { Task } from '../src/core/tasks/types';
import { balance } from '../src/data/balance';
import { E1 } from '../src/data/curriculum/E1';
import { E3 } from '../src/data/curriculum/E3';
import { generateInequality } from '../src/core/tasks/generators/inequality';

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
        expect(balance.round).toEqual({ length: 5, starPerTask: 1, cleanRoundBonus: 2, uniqueRetries: 20, artRetries: 8 });
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

describe('first wrong try (S-08, parent preview)', () => {
    const real = (): Task[] => {
        const skill = E3.steps.flatMap((st) => st.skills)[0];
        const rng = createRng(7);
        return Array.from({ length: 5 }, () => generateTask(skill, rng, { tileCount: 4 }));
    };

    it('starts with nothing captured', () => {
        expect(startRound(tasks(), RULES).firstWrong).toEqual([null, null, null, null, null]);
    });

    it('keeps a wrong number from the first try', () => {
        const s = answer(startRound(tasks(), RULES), 99);
        expect(s.phase).toBe('second');
        expect(s.firstWrong[0]).toBe(99);
        expect(s.firstWrong.slice(1)).toEqual([null, null, null, null]);
    });

    it('keeps a wrong tile text from the first try', () => {
        const s = answer(startRound([task(0, { answer: '<', choices: ['<', '>', '='] })], RULES), '>');
        expect(s.firstWrong[0]).toBe('>');
    });

    it('a second wrong answer does not overwrite the first', () => {
        const s = answer(answer(startRound(tasks(), RULES), 99), 77);
        expect(s.phase).toBe('solution');
        expect(s.firstWrong[0]).toBe(99);
    });

    it('a correct first try captures nothing', () => {
        const s = answer(startRound(tasks(), RULES), 1);
        expect(s.firstWrong[0]).toBeNull();
    });

    it('ignores input that is neither a number nor a text', () => {
        const s = answer(startRound(tasks(), RULES), [1, 2]);
        expect(s.phase).toBe('second');
        expect(s.firstWrong[0]).toBeNull();
    });

    it('is tracked per task', () => {
        let s = answer(startRound(tasks(), RULES), 98);
        s = next(answer(s, s.tasks[0].answer));
        s = next(answer(s, 97));
        expect(s.firstWrong).toEqual([98, 97, null, null, null]);
    });

    it('roundResults gives an example for a second-try solve, with the first wrong value', () => {
        const ts = real();
        let s = startRound(ts, RULES);
        s = answer(s, WRONG);
        s = next(answer(s, ts[0].answer));
        const r = roundResults(s);
        expect(r).toHaveLength(5);
        expect(r[0]).toEqual({ skillId: ts[0].skillId, outcome: 'second', example: { prompt: ts[0].prompt, given: WRONG, answer: ts[0].answer } });
    });

    it('roundResults gives an example for a retyped task', () => {
        const ts = real();
        const r = roundResults(failTask(startRound(ts, RULES)));
        expect(r[0].outcome).toBe('retype');
        expect(r[0].example).toEqual({ prompt: ts[0].prompt, given: WRONG, answer: ts[0].answer });
    });

    it('roundResults tells the parent a face in words, never as a code (S-14d)', () => {
        const tri = 'shape:triangle:red:big';
        const sq = 'shape:square:blue:small';
        const pick: Task = { skillId: 'E1.1.shapes_pick', prompt: 'Dotknij trójkąta.', answer: tri, choices: [tri, sq], hint: ['Trójkąt ma 3 boki i 3 rogi.'] };
        let s = startRound([pick], RULES);
        s = answer(s, sq);
        s = next(answer(s, tri));
        expect(roundResults(s)[0].example).toEqual({ prompt: 'Dotknij trójkąta.', given: 'mały niebieski kwadrat', answer: 'duży czerwony trójkąt' });
    });

    // PIC-04 / S13-06: a list answer (wallet, select) leaves an example in the existing `given` string.
    it('roundResults reads a wrong wallet as money, largest first, and the model wallet as money too (PIC-04)', () => {
        const wallet: Task = {
            skillId: 'E1.11.money_pay_10',
            prompt: 'Zapłać 5 zł.',
            input: 'drag',
            visual: { kind: 'money', items: [], pay: { tray: ['coin-1zl', 'coin-2zl', 'coin-5zl'], fewest: false } },
            answer: [500],
            hint: ['5 zł to jedna moneta.'],
        };
        let s = startRound([wallet], RULES);
        s = answer(s, [100, 200, 200]);
        expect(s.firstWrong[0]).toBe('2 zł, 2 zł, 1 zł');
        s = next(answer(s, [500]));
        expect(roundResults(s)[0].example).toEqual({ prompt: 'Zapłać 5 zł.', given: '2 zł, 2 zł, 1 zł', answer: '5 zł' });
    });

    it('roundResults reads a wrong select answer as the faces words in choices order (S13-06)', () => {
        const tri = 'shape:triangle:red:big';
        const sq = 'shape:square:blue:small';
        const cir = 'shape:circle:green:big';
        const pickAll: Task = { skillId: 'E1.1.shapes_all', prompt: 'Zaznacz trójkąty.', input: 'select', answer: [tri], choices: [tri, sq, cir], hint: ['Trójkąt ma 3 rogi.'] };
        let s = startRound([pickAll], RULES);
        s = answer(s, [cir, sq]);
        s = next(answer(s, [tri]));
        expect(roundResults(s)[0].example).toEqual({
            prompt: 'Zaznacz trójkąty.',
            given: 'mały niebieski kwadrat, duże zielone koło',
            answer: 'duży czerwony trójkąt',
        });
    });

    it('roundResults has no example for a first-try solve or an unplayed task', () => {
        const s = solveFirst(startRound(tasks(), RULES));
        const r = roundResults(s);
        expect(r[0]).toEqual({ skillId: 'T.0', outcome: 'first' });
        expect(r[1]).toEqual({ skillId: 'T.1', outcome: null });
    });
});

// S-14c: a task with several right tiles (INEQUALITY, `Task.check`). A right tile that is not the model answer must pay
// like the model answer in every phase: a child never sees a right tap counted as wrong.
describe('round with several right tiles (Task.check)', () => {
    const inequality = (): Task => {
        const skill = E1.steps.flatMap((st) => st.skills).find((sk) => sk.id === 'E1.9.inequality_10');
        if (!skill) throw new Error('E1.9.inequality_10 is missing');
        return generateInequality(skill, createRng(7));
    };
    /** A right tile other than the model answer, and a wrong one, read from the prompt by an independent oracle. */
    const tiles = (t: Task): { otherRight: number; wrong: number } => {
        const m = /(\d+|□) ([+−]) (\d+|□) ([<>]) (\d+)$/.exec(t.prompt);
        if (!m) throw new Error(`unparsable prompt "${t.prompt}"`);
        const holds = (x: number): boolean => {
            const [l, r] = [m[1] === '□' ? x : Number(m[1]), m[3] === '□' ? x : Number(m[3])];
            const v = m[2] === '+' ? l + r : l - r;
            return m[4] === '<' ? v < Number(m[5]) : v > Number(m[5]);
        };
        const choices = (t.choices ?? []) as number[];
        const otherRight = choices.find((c) => c !== t.answer && holds(c));
        const wrong = choices.find((c) => !holds(c));
        if (otherRight === undefined || wrong === undefined) throw new Error('expected a second right tile and a wrong one');
        return { otherRight, wrong };
    };

    it('pays a star on the first try for a right tile that is not the model answer', () => {
        const t = inequality();
        const s = answer(startRound([t], RULES), tiles(t).otherRight);
        expect(s.phase).toBe('done');
        expect(s.outcomes[0]).toBe('first');
        expect(s.starsEarned).toBe(RULES.starPerTask);
    });

    it('pays on the second try and settles the retype with the other right tile', () => {
        const t = inequality();
        const { otherRight, wrong } = tiles(t);
        const second = answer(answer(startRound([t], RULES), wrong), otherRight);
        expect(second.outcomes[0]).toBe('second');
        let r = answer(answer(startRound([t], RULES), wrong), wrong);
        for (let i = 0; i < 10 && r.phase === 'solution'; i += 1) r = nextSolutionStep(r);
        expect(r.phase).toBe('retype');
        expect(answer(r, otherRight).phase).toBe('done');
    });
});
