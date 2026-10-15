// MONEY_PAY (S-14d phase 7): "Zapłać 7 zł." Oracle: an exhaustive search over wallets written here (every multiset of tray
// coins up to the wallet limit), independent of `fewestCoins` and of the generator's own answer.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { canonicalInput } from '../src/core/round/canonicalInput';
import { artBlocked } from '../src/core/round/artFilter';
import { answer, startRound } from '../src/core/round';
import { dragMode } from '../src/core/tasks/dragMode';
import { generateMoneyPay, parseMoneyPayParams } from '../src/core/tasks/generators/moneyPay';
import { solutionSteps } from '../src/core/round/hints';
import { generators, parsers } from '../src/core/tasks/registry';
import type { Task } from '../src/core/tasks/types';
import { validateTask } from '../src/core/tasks/validate';
import type { SkillDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { MONEY, type MoneyId } from '../src/data/measures';
import { forEachDraw } from './helpers';

const grosze = (id: MoneyId): number => MONEY.find((m) => m.id === id)?.grosze ?? 0;
const E1_TRAY: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl'];
const E2_TRAY: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl'];

const skill = (tray: MoneyId[], min: number, max: number, variants: string[]): SkillDef => ({
    id: 'T.1.money_pay', stage: 'E1', step: 11, type: 'MONEY_PAY', params: { tray, min, max, variants }, answer: 'drag',
});

/** Every wallet (sorted multiset of grosze) from `values` with at most `limit` coins that adds up to `target`. */
const wallets = (values: number[], target: number, limit: number): number[][] => {
    const out: number[][] = [];
    const walk = (from: number, left: number, picked: number[]): void => {
        if (left === 0) { out.push([...picked]); return; }
        if (picked.length === limit) return;
        for (let i = from; i < values.length; i += 1) {
            if (values[i] <= left) walk(i, left - values[i], [...picked, values[i]]);
        }
    };
    walk(0, target, []);
    return out;
};

const targetOf = (t: Task): number => (t.answer as number[]).reduce((a, b) => a + b, 0);

describe('parseMoneyPayParams', () => {
    it('takes a tray of 1..4 known kinds, a range in whole złoty and the variants', () => {
        expect(parseMoneyPayParams({ tray: E1_TRAY, min: 2, max: 10, variants: ['pay', 'fewest'] })).toEqual({ tray: E1_TRAY, min: 2, max: 10, variants: ['pay', 'fewest'] });
    });
    it('rejects bad data', () => {
        const ok = { tray: E1_TRAY, min: 2, max: 10, variants: ['pay'] };
        expect(() => parseMoneyPayParams({ ...ok, tray: [] })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, tray: ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl'] })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, tray: ['coin-1zl', 'coin-1zl'] })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, tray: ['coin-7zl'] })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, min: 0 })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, min: 11 })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, variants: [] })).toThrow(TypeError);
        expect(() => parseMoneyPayParams({ ...ok, variants: ['cheap'] })).toThrow(TypeError);
    });
    it('rejects a target the tray cannot reach (2 zł and 5 zł cannot make 1 zł or 3 zł)', () => {
        expect(() => parseMoneyPayParams({ tray: ['coin-2zl', 'coin-5zl'], min: 2, max: 10, variants: ['pay'] })).toThrow(TypeError);
    });
    it('rejects a target that needs more coins than the wallet holds', () => {
        expect(() => parseMoneyPayParams({ tray: ['coin-1zl'], min: 2, max: 11, variants: ['pay'] })).toThrow(TypeError);
    });
    it('is registered next to its generator', () => {
        expect(Object.keys(generators).sort()).toEqual(Object.keys(parsers).sort());
        expect(generators.MONEY_PAY).toBe(generateMoneyPay);
        expect(parsers.MONEY_PAY).toBe(parseMoneyPayParams);
    });
});

describe('generateMoneyPay', () => {
    for (const [name, tray, min, max] of [['E1', E1_TRAY, 2, 10], ['E2', E2_TRAY, 3, 20]] as const) {
        it(`${name}: 1000 draws, target in range, drawing is an empty table and the tray, answer is a fewest wallet`, () => {
            const targets = new Set<number>();
            const seen = { pay: 0, fewest: 0 };
            forEachDraw(generateMoneyPay, skill([...tray], min, max, ['pay', 'fewest']), {}, (task, where) => {
                expect(task.input ?? 'drag', where).toBe('drag');
                expect(task.visual, where).toEqual({ kind: 'money', items: [], pay: { tray, fewest: task.visual?.kind === 'money' && task.visual.pay?.fewest === true } });
                const fewest = task.visual?.kind === 'money' && task.visual.pay?.fewest === true;
                seen[fewest ? 'fewest' : 'pay'] += 1;
                const target = targetOf(task);
                expect(target % 100, where).toBe(0);
                expect(target / 100, where).toBeGreaterThanOrEqual(min);
                expect(target / 100, where).toBeLessThanOrEqual(max);
                targets.add(target / 100);
                const all = wallets(tray.map(grosze).sort((a, b) => b - a), target, balance.coinDrag.maxTotal);
                const shortest = Math.min(...all.map((w) => w.length));
                expect((task.answer as number[]).length, where).toBe(shortest);
                expect(task.prompt, where).toBe(fewest ? `Zapłać ${target / 100} zł. Użyj jak najmniej monet.` : `Zapłać ${target / 100} zł.`);
            });
            expect(seen.pay, 'pay variant drawn').toBeGreaterThan(200);
            expect(seen.fewest, 'fewest variant drawn').toBeGreaterThan(200);
            expect(targets.size, 'every target of the range is drawn').toBe(max - min + 1);
        });
    }

    it('check accepts every wallet with the right sum in "pay" and only the shortest ones in "fewest"', () => {
        for (const fewest of [false, true]) {
            const sk = skill(E2_TRAY, 2, 14, [fewest ? 'fewest' : 'pay']);
            forEachDraw(generateMoneyPay, sk, {}, (task, where) => {
                const target = targetOf(task);
                const values = E2_TRAY.map(grosze).sort((a, b) => b - a);
                const shortest = Math.min(...wallets(values, target, balance.coinDrag.maxTotal).map((w) => w.length));
                for (const w of wallets(values, target, balance.coinDrag.maxTotal)) {
                    // Any order of the placed coins is the same wallet.
                    expect(task.check?.([...w].reverse()), `${where} wallet ${w.join(",")}`).toBe(!fewest || w.length === shortest);
                }
                expect(task.check?.([...(task.answer as number[]), 100]), where).toBe(false);
                expect(task.check?.([]), where).toBe(false);
                expect(task.check?.(target / 100), where).toBe(false);
                expect(task.check?.('7'), where).toBe(false);
            });
        }
    }, 30_000); // wallet enumeration: ~1.5 s locally, over 5 s on a loaded CI runner

    it('[200, 200, 100] pays 5 zł in the plain task and is refused when the fewest coins are asked', () => {
        const draw = (fewest: boolean): Task => generateMoneyPay(skill(E1_TRAY, 5, 5, [fewest ? 'fewest' : 'pay']), createRng(1));
        expect(draw(false).check?.([200, 200, 100])).toBe(true);
        expect(draw(true).check?.([200, 200, 100])).toBe(false);
        expect(draw(true).check?.([500])).toBe(true);
    });

    it('the last hint states the amount in words of the coins, because the answer list has no result line (plan-review F5)', () => {
        forEachDraw(generateMoneyPay, skill(E1_TRAY, 2, 10, ['pay', 'fewest']), {}, (task, where) => {
            const target = targetOf(task) / 100;
            const steps = solutionSteps(task, (a) => `Wynik: ${a}`);
            expect(steps, where).toEqual(task.hint);
            expect(task.hint.at(-1), where).toContain(`${target} zł`);
            expect(task.hint[0], where).not.toMatch(/\d/);
            // The first step does not name the coins that make the amount.
            expect(task.hint[0], where).not.toContain('zł');
            expect(task.speak, where).toMatch(/^Zapłać .*złot/);
        });
    });

    it('a one-piece payment names a note as a note, never as a coin (teacher read, impl-review)', () => {
        const ten = generateMoneyPay(skill(E2_TRAY, 10, 10, ['pay']), createRng(1));
        expect(ten.answer).toEqual([1000]);
        expect(ten.hint.at(-1)).toBe('Wystarczy jeden banknot: 10 zł.');
        const five = generateMoneyPay(skill(E2_TRAY, 5, 5, ['pay']), createRng(1));
        expect(five.hint.at(-1)).toBe('Wystarczy jedna moneta: 5 zł.');
    });

    it('a 6-year-old can solve it: the right wallet reaches done at the first try through the round', () => {
        forEachDraw(generateMoneyPay, skill(E2_TRAY, 3, 20, ['pay', 'fewest']), {}, (task, where) => {
            const s = answer(startRound([task], balance.round), canonicalInput(task));
            expect(s.phase, where).toBe('done');
            expect(s.outcomes[0], where).toBe('first');
        });
    });
});

describe('the coins branch of drag', () => {
    const base: Task = { skillId: 'T.1', prompt: 'p', answer: [500], hint: ['h'] };
    const mode = (t: Task): string => { try { return dragMode(t); } catch { return 'throws'; } };
    it('is picked from a money drawing with a tray', () => {
        expect(mode({ ...base, visual: { kind: 'money', items: [], pay: { tray: E1_TRAY, fewest: false } } })).toBe('coins');
    });
    it('a money drawing without a tray (MONEY_COUNT) still has no drag branch', () => {
        expect(mode({ ...base, visual: { kind: 'money', items: ['coin-1zl', 'coin-2zl'] } })).toBe('throws');
    });
    it('canonicalInput of a coins task is the answer wallet, refused when the check refuses it', () => {
        const t: Task = { ...base, input: 'drag', answer: [500, 200], visual: { kind: 'money', items: [], pay: { tray: E1_TRAY, fewest: true } }, check: () => false };
        expect(() => canonicalInput(t)).toThrow(/rejected by check/);
        expect(canonicalInput({ ...t, check: () => true })).toEqual([500, 200]);
    });
});

describe('validateTask on a coins task', () => {
    const rules = (t: Task): string[] => validateTask(t).map((v) => v.rule);
    const draw = (): Task => {
        let found: Task | undefined;
        forEachDraw(generateMoneyPay, skill(E1_TRAY, 7, 7, ['fewest']), {}, (t) => { found ??= t; });
        return found as Task;
    };
    it('accepts what the generator makes', () => {
        expect(rules(draw())).toEqual([]);
    });
    it('refuses a table with items beside the tray, and an empty table without a tray', () => {
        const t = draw();
        expect(rules({ ...t, visual: { kind: 'money', items: ['coin-1zl'], pay: { tray: E1_TRAY, fewest: true } } })).toContain('visual');
        expect(rules({ ...t, visual: { kind: 'money', items: [] } })).toContain('visual');
    });
    it('refuses a tray of 5 kinds, an unknown nominal and an empty tray', () => {
        const t = draw();
        const tray = (ids: MoneyId[]): Task => ({ ...t, visual: { kind: 'money', items: [], pay: { tray: ids, fewest: true } } });
        expect(rules(tray(['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl']))).toContain('visual');
        expect(rules(tray(['coin-9zl' as MoneyId]))).toContain('visual');
        expect(rules(tray([]))).toContain('visual');
    });
    it('refuses a task whose check is missing, refuses its own answer, or accepts everything', () => {
        const t = draw();
        expect(rules({ ...t, check: undefined })).toContain('check-answer');
        expect(rules({ ...t, check: () => false })).toContain('check-answer');
        expect(rules({ ...t, check: () => true })).toContain('check-no-wrong');
    });
    it('refuses a target the wallet cannot hold (more coins than the limit)', () => {
        const t = draw();
        const many = Array.from({ length: balance.coinDrag.maxTotal + 1 }, () => 100);
        expect(rules({ ...t, answer: many, check: (i) => Array.isArray(i) && i.length === many.length })).toContain('coins');
    });
    it('refuses a coins task that is not a drag task', () => {
        expect(rules({ ...draw(), input: 'tiles' })).toContain('mode');
    });
});

describe('artBlocked for the tray', () => {
    const sk = skill(E2_TRAY, 3, 20, ['pay']);
    it('blocks the skill when any coin or note of its tray has no picture', () => {
        expect(artBlocked(sk, new Set(['note-10zl']))).toBe(true);
        expect(artBlocked(sk, new Set(['coin-1zl']))).toBe(true);
        expect(artBlocked(sk, new Set(['note-20zl']))).toBe(false);
        expect(artBlocked(sk, new Set())).toBe(false);
    });
});

describe('MONEY_PAY in the programme (phase 8)', () => {
    const all = Object.values(stages).flatMap((st) => st.steps.flatMap((step) => step.skills));
    const pay = all.filter((s) => s.type === 'MONEY_PAY');
    it('holds exactly E1.11 (coins to 10 zł) and E2.2 (a 10 zł note too), both answered by drag', () => {
        expect(pay.map((s) => s.id)).toEqual(['E1.11.money_pay_10', 'E2.2.money_pay_20']);
        expect(pay.every((s) => s.answer === 'drag')).toBe(true);
        expect(parseMoneyPayParams(pay[0].params).tray).toEqual(E1_TRAY);
        expect(parseMoneyPayParams(pay[1].params).tray).toEqual(E2_TRAY);
    });
    it('every programme draw is a coins task a wallet of tray coins can answer', () => {
        for (const sk of pay) {
            forEachDraw(generateMoneyPay, sk, {}, (task, where) => {
                expect(dragMode(task), where).toBe('coins');
                expect(canonicalInput(task), where).toEqual(task.answer);
            });
        }
    }, 30_000);
});
