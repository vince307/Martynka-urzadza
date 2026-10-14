import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { visualKey } from '../src/core/tasks/visual';
import { firstHint } from '../src/core/round/hints';
import { generateMoneyChange, generateMoneyCount, parseMoneyChangeParams, parseMoneyCountParams } from '../src/core/tasks/generators/money';
import type { Task } from '../src/core/tasks/types';
import { formatMoney } from '../src/core/text/measure';
import type { SkillDef } from '../src/core/types';
import { MONEY, type MoneyId } from '../src/data/measures';
import { people } from '../src/data/wordTemplates';
import { forEachDraw } from './helpers';

const skill = (id: string, type: 'MONEY_COUNT' | 'MONEY_CHANGE', params: Record<string, unknown>, answer: SkillDef['answer'] = 'tiles'): SkillDef => ({
    id,
    stage: 'E1',
    step: 11,
    type,
    params,
    answer,
});

const ZL_10: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl'];
const ZL_100: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl', 'note-50zl', 'note-100zl'];
const GR: MoneyId[] = ['coin-01gr', 'coin-02gr', 'coin-05gr', 'coin-10gr', 'coin-20gr', 'coin-50gr'];
const MIXED: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'coin-10gr', 'coin-20gr', 'coin-50gr'];

const COUNT_ZL_10 = skill('E1.11.money_count_10', 'MONEY_COUNT', { variant: 'count', ids: ZL_10, max: 1000, maxItems: 4, answer: 'number-zl' });
const COUNT_ZL_100 = skill('E4.1.money_count_100', 'MONEY_COUNT', { variant: 'count', ids: ZL_100, max: 10000, maxItems: 6, answer: 'number-zl' }, 'keypad');
const COUNT_GR = skill('E2.8.money_count_gr', 'MONEY_COUNT', { variant: 'count', ids: GR, max: 100, maxItems: 6, answer: 'number-gr' }, 'keypad');
const COUNT_TEXT = skill('E4.1.money_count_zl_gr', 'MONEY_COUNT', { variant: 'count', ids: MIXED, max: 2000, maxItems: 6, answer: 'text' });
const CHANGE_ZL_10 = skill('E1.11.money_change_10', 'MONEY_CHANGE', { variant: 'change', ids: ZL_10, max: 1000, maxItems: 4, answer: 'number-zl' });
const CHANGE_ZL_100 = skill('E4.1.money_change_100', 'MONEY_CHANGE', { variant: 'change', ids: ZL_100, max: 10000, maxItems: 6, answer: 'number-zl' }, 'keypad');
const CHANGE_GR = skill('E2.8.money_change_gr', 'MONEY_CHANGE', { variant: 'change', ids: GR, max: 100, maxItems: 4, answer: 'number-gr' }, 'keypad');
const CHANGE_TEXT = skill('E4.1.money_change_zl_gr', 'MONEY_CHANGE', { variant: 'change', ids: MIXED, max: 2000, maxItems: 6, answer: 'text' });

const value = (id: string): number => MONEY.find((m) => m.id === id)?.grosze ?? Number.NaN;

/** The oracle reads the drawing, never the task's own answer. */
const drawn = (task: Task, where: string): { items: readonly MoneyId[]; total: number } => {
    expect(task.visual?.kind, where).toBe('money');
    if (task.visual?.kind !== 'money') throw new Error(`no money drawing ${where}`);
    return { items: task.visual.items, total: task.visual.items.reduce((sum, id) => sum + value(id), 0) };
};

const answerFor = (total: number, mode: string): number | string => (mode === 'number-zl' ? total / 100 : mode === 'number-gr' ? total : formatMoney(total));

describe('generateMoneyCount', () => {
    for (const s of [COUNT_ZL_10, COUNT_ZL_100, COUNT_GR, COUNT_TEXT]) {
        const p = parseMoneyCountParams(s.params);
        it(`${s.id}: 1000 draws sum the drawn coins and notes (2..${p.maxItems} items, within ${formatMoney(p.max)})`, () => {
            const sizes = new Set<number>();
            forEachDraw(generateMoneyCount, s, {}, (task, where) => {
                const { items, total } = drawn(task, where);
                sizes.add(items.length);
                expect(items.length, where).toBeGreaterThanOrEqual(2);
                expect(items.length, where).toBeLessThanOrEqual(p.maxItems);
                for (const id of items) expect(p.ids, where).toContain(id);
                expect(total, where).toBeLessThanOrEqual(p.max);
                // The picture lists the largest first, the way the table is laid out.
                expect([...items].sort((a, b) => value(b) - value(a)), where).toEqual(items);
                expect(task.answer, where).toBe(answerFor(total, p.answer));
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
                // The first hint teaches the method; it never states the result.
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.prompt, where).not.toMatch(/\d/);
            });
            expect(sizes.size, 'variety of how many items lie on the table').toBeGreaterThanOrEqual(Math.min(3, p.maxItems - 1));
        });
    }

    it('number answers ask for the unit they are given in', () => {
        forEachDraw(generateMoneyCount, COUNT_ZL_10, {}, (task, where) => expect(task.prompt, where).toBe('Ile złotych leży na stole?'));
        forEachDraw(generateMoneyCount, COUNT_GR, {}, (task, where) => expect(task.prompt, where).toBe('Ile groszy leży na stole?'));
        forEachDraw(generateMoneyCount, COUNT_TEXT, {}, (task, where) => expect(task.prompt, where).toBe('Ile pieniędzy leży na stole?'));
    });

    it('whole-złoty sums end with the running sum as an addition', () => {
        let checked = 0;
        forEachDraw(generateMoneyCount, COUNT_ZL_100, {}, (task, where) => {
            const { items, total } = drawn(task, where);
            const line = task.hint.find((h) => /^\d+( \+ \d+)+ = \d+$/.test(h));
            expect(line, where).toBe(`${items.map((id) => value(id) / 100).join(' + ')} = ${total / 100}`);
            checked += 1;
        });
        expect(checked).toBe(1000);
    });

    it('text answers are 3 distinct tiles with mixed złoty and groszy and the swapped-units mistake when it fits', () => {
        let mixed = 0;
        let swapOffered = 0;
        forEachDraw(generateMoneyCount, COUNT_TEXT, {}, (task, where) => {
            const { total } = drawn(task, where);
            expect(task.choices, where).toHaveLength(3);
            expect(new Set(task.choices).size, where).toBe(3);
            expect(task.choices, where).toContain(formatMoney(total));
            for (const c of task.choices ?? []) expect(String(c), where).toMatch(/^(\d+ zł( \d+ gr)?|\d+ gr)$/);
            if (total % 100 !== 0 && total >= 100) mixed += 1;
            if (total % 100 < 100 && Math.floor(total / 100) < 100 && task.choices?.includes(formatMoney((total % 100) * 100 + Math.floor(total / 100)))) swapOffered += 1;
        });
        expect(mixed, 'sums with złoty and groszy').toBeGreaterThan(950);
        expect(swapOffered, 'swapped zł and gr offered').toBeGreaterThan(150);
    });

    it('speaks the amount question for the narrator', () => {
        forEachDraw(generateMoneyCount, COUNT_ZL_10, {}, (task, where) => expect(task.speak, where).toBe('Popatrz na pieniądze. Ile złotych leży na stole?'));
    });

    it('number tiles start at 1 (no zero tile for a table that is never empty)', () => {
        forEachDraw(generateMoneyCount, COUNT_ZL_10, {}, (task, where) => expect(task.tileRange?.min, where).toBe(1));
    });
});

describe('generateMoneyChange', () => {
    for (const s of [CHANGE_ZL_10, CHANGE_ZL_100, CHANGE_GR, CHANGE_TEXT]) {
        const p = parseMoneyChangeParams(s.params);
        it(`${s.id}: 1000 draws leave a positive change, from what the picture shows`, () => {
            const re = /^(\p{L}+) (miał|miała) (.+?)\. (Kupił|Kupiła) (\p{L}+) za (.+?)\. Ile (.+) zostało\?$/u;
            const names = new Set<string>();
            forEachDraw(generateMoneyChange, s, {}, (task, where) => {
                const { items, total } = drawn(task, where);
                expect(items.length, where).toBeGreaterThanOrEqual(2);
                expect(items.length, where).toBeLessThanOrEqual(p.maxItems);
                expect(total, where).toBeLessThanOrEqual(p.max);
                const m = re.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const [, name, had, hadText, buys, , priceText, unit] = m ?? [];
                names.add(name);
                const person = people.find((x) => x.name === name);
                expect(person, where).toBeDefined();
                expect(had, where).toBe(person?.gender === 'f' ? 'miała' : 'miał');
                expect(buys, where).toBe(person?.gender === 'f' ? 'Kupiła' : 'Kupił');
                expect(hadText, where).toBe(formatMoney(total));
                expect(unit, where).toBe(p.answer === 'number-zl' ? 'złotych' : p.answer === 'number-gr' ? 'groszy' : 'pieniędzy');
                // The price is spelled the same way as the amount, and is a positive part of it.
                const priceGrosze = p.answer === 'number-zl' ? Number.parseInt(priceText, 10) * 100 : p.answer === 'number-gr' ? Number.parseInt(priceText, 10) : parseText(priceText);
                expect(priceGrosze, where).toBeGreaterThan(0);
                expect(priceGrosze, where).toBeLessThan(total);
                expect(task.answer, where).toBe(answerFor(total - priceGrosze, p.answer));
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint[0], where).not.toMatch(/\d/);
            });
            expect(names.size, 'names used').toBeGreaterThanOrEqual(5);
        });
    }

    it('whole-złoty change teaches "amount − price = change"', () => {
        forEachDraw(generateMoneyChange, CHANGE_ZL_10, {}, (task, where) => {
            const { total } = drawn(task, where);
            const price = Number(/za (\d+) zł/.exec(task.prompt)?.[1]);
            expect(task.hint, where).toContain(`${total / 100} − ${price} = ${total / 100 - price}`);
        });
    });

    it('the purchase is a single thing in the accusative (no numeral to agree with)', () => {
        forEachDraw(generateMoneyChange, CHANGE_ZL_10, {}, (task, where) => {
            expect(task.prompt, where).toMatch(/Kupił(a)? [\p{L}]+ za /u);
            expect(task.prompt, where).not.toMatch(/\d (złoty|złote|złotych)/);
        });
    });

    it('speaks the amounts in words', () => {
        forEachDraw(generateMoneyChange, CHANGE_ZL_10, {}, (task, where) => {
            expect(task.speak, where).toMatch(/^\p{L}+ miał(a)? .*(złot|złotych|złote)/u);
            expect(task.speak, where).not.toMatch(/\d/);
        });
    });

    it('text change uses a grosze line that borrows no digit from the answer', () => {
        forEachDraw(generateMoneyChange, CHANGE_TEXT, {}, (task, where) => {
            expect(task.hint.some((h) => /^Zamień na grosze: \d+ − \d+ = \d+\.$/.test(h)), where).toBe(true);
        });
    });
});

const parseText = (text: string): number => {
    const zl = /(\d+) zł/.exec(text);
    const gr = /(\d+) gr/.exec(text);
    return Number(zl?.[1] ?? 0) * 100 + Number(gr?.[1] ?? 0);
};

describe('money params parsers', () => {
    it('accept the planned parameter sets', () => {
        for (const s of [COUNT_ZL_10, COUNT_ZL_100, COUNT_GR, COUNT_TEXT]) expect(() => parseMoneyCountParams(s.params), s.id).not.toThrow();
        for (const s of [CHANGE_ZL_10, CHANGE_ZL_100, CHANGE_GR, CHANGE_TEXT]) expect(() => parseMoneyChangeParams(s.params), s.id).not.toThrow();
    });

    const ok = { variant: 'count', ids: ZL_10, max: 1000, maxItems: 4, answer: 'number-zl' };
    it.each([
        ['an unknown coin', { ...ok, ids: ['coin-3zl'] }],
        ['an empty list', { ...ok, ids: [] }],
        ['a duplicated id', { ...ok, ids: ['coin-1zl', 'coin-1zl'] }],
        ['more than 10 items', { ...ok, maxItems: 11 }],
        ['a single item', { ...ok, maxItems: 1 }],
        ['a max the smallest coins cannot reach in two items', { ...ok, ids: ['note-10zl', 'note-20zl'], max: 1500 }],
        ['whole złoty with a grosz coin', { ...ok, ids: ['coin-1zl', 'coin-50gr'] }],
        ['groszy with a złoty coin', { ...ok, ids: ['coin-50gr', 'coin-1zl'], answer: 'number-gr', max: 100 }],
        ['an unknown answer mode', { ...ok, answer: 'words' }],
        ['a non-integer max', { ...ok, max: 10.5 }],
        ['the wrong variant for the type', { ...ok, variant: 'change' }],
    ])('MONEY_COUNT rejects %s', (_name, params) => {
        expect(() => parseMoneyCountParams(params)).toThrow(TypeError);
    });

    it('MONEY_CHANGE rejects the count variant and an unknown coin', () => {
        expect(() => parseMoneyChangeParams({ ...ok, variant: 'count' })).toThrow(TypeError);
        expect(() => parseMoneyChangeParams({ ...ok, variant: 'change', ids: ['note-7zl'] })).toThrow(TypeError);
        expect(() => parseMoneyChangeParams({ ...ok, variant: 'change', maxItems: 1 })).toThrow(TypeError);
    });
});

// The thresholds of tests/contentInvariants.test.ts (>= 12 different tasks, the most frequent <= 15 %), measured here for the
// parameter sets the curriculum phases will use, so a task space that is too small fails in this phase and not in the data phase.
describe('task space of the planned skills', () => {
    const ZL_20: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl'];
    const planned: [string, SkillDef, typeof generateMoneyCount][] = [
        ['E1.11 count', COUNT_ZL_10, generateMoneyCount],
        ['E1.11 change', CHANGE_ZL_10, generateMoneyChange],
        ['E2.2 count', skill('E2.2.money_count_20', 'MONEY_COUNT', { variant: 'count', ids: ZL_20, max: 2000, maxItems: 5, answer: 'number-zl' }, 'keypad'), generateMoneyCount],
        ['E2.2 change', skill('E2.2.money_change_20', 'MONEY_CHANGE', { variant: 'change', ids: ZL_20, max: 2000, maxItems: 5, answer: 'number-zl' }, 'keypad'), generateMoneyChange],
        ['E2.8 count', COUNT_GR, generateMoneyCount],
        ['E4.1 count', COUNT_ZL_100, generateMoneyCount],
        ['E4.1 count zl+gr', COUNT_TEXT, generateMoneyCount],
        ['E4.1 change', CHANGE_ZL_100, generateMoneyChange],
    ];
    it.each(planned)('%s: at least 12 different tasks, none above 15 %%', (_name, s, generate) => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generate(s, createRng(910_000 + i));
            const key = `${task.prompt}|${visualKey(task.visual)}|${(task.choices ?? []).join('/')}`;
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});
