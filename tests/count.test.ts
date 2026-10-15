import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generateCount, parseCountParams } from '../src/core/tasks/generators/count';
import type { Task } from '../src/core/tasks/types';
import { visualKey } from '../src/core/tasks/visual';
import { countNoun } from '../src/core/text/plural';
import type { SkillDef } from '../src/core/types';
import { ICONS } from '../src/data/measures';
import { nouns } from '../src/data/nouns';
import { E1 } from '../src/data/curriculum/E1';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E1', step: 2, type: 'COUNT', params, answer: 'tiles' });

const COUNT_5 = skill('E1.2.count_5', { min: 2, max: 5, tens: false });
const COUNT_7 = skill('E1.4.count_7', { min: 4, max: 7, tens: false });
const COUNT_12 = skill('E1.10.count_12', { min: 11, max: 12, tens: true });

const drawn = (task: Task, where: string): { icon: string; groups: readonly number[]; n: number } => {
    expect(task.visual?.kind, where).toBe('icons');
    if (task.visual?.kind !== 'icons') throw new Error(`no icons ${where}`);
    return { icon: task.visual.icon, groups: task.visual.groups, n: task.visual.groups.reduce((a, b) => a + b, 0) };
};

describe('generateCount', () => {
    for (const s of [COUNT_5, COUNT_7, COUNT_12]) {
        const p = parseCountParams(s.params);
        it(`${s.id}: 1000 draws count the drawn icons (${p.min}..${p.max}${p.tens ? ', a ten and the rest' : ''}), three tiles`, () => {
            const icons = new Set<string>();
            const values = new Set<number>();
            forEachDraw(generateCount, s, {}, (task, where) => {
                const { icon, groups, n } = drawn(task, where);
                icons.add(icon);
                values.add(n);
                expect(n, where).toBeGreaterThanOrEqual(p.min);
                expect(n, where).toBeLessThanOrEqual(p.max);
                expect(task.answer, where).toBe(n);
                expect(groups, where).toEqual(p.tens ? [10, n - 10] : [n]);
                const noun = ICONS.find((i) => i.id === icon)?.noun ?? '';
                expect(task.prompt, where).toBe(`Ile jest ${nouns[noun][2]}?`);
                // Exactly three tiles: the answer and its neighbours, never below 1 or above the largest count.
                expect(task.choices, where).toHaveLength(3);
                expect(task.choices, where).toContain(n);
                for (const c of task.choices ?? []) {
                    expect(Math.abs(Number(c) - n), where).toBeLessThanOrEqual(2);
                    expect(Number(c), where).toBeGreaterThanOrEqual(1);
                    expect(Number(c), where).toBeLessThanOrEqual(p.max);
                }
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint[task.hint.length - 1], where).toBe(`Na obrazku: ${countNoun(n, nouns[noun])}.`);
                if (p.tens) expect(task.hint, where).toContain(`10 + ${n - 10} = ${n}`);
            });
            expect(icons.size, 'different icons').toBeGreaterThanOrEqual(8);
            expect(values.size, 'different counts').toBe(p.max - p.min + 1);
        });
    }

    it('the tiles of the largest and smallest counts stay inside 1..max', () => {
        const ends = new Set<string>();
        forEachDraw(generateCount, skill('x.count_1_5', { min: 1, max: 5, tens: false }), {}, (task, where) => {
            const { n } = drawn(task, where);
            if (n === 1) expect([...(task.choices ?? [])].sort(), where).toEqual([1, 2, 3]);
            if (n === 5) expect([...(task.choices ?? [])].sort(), where).toEqual([3, 4, 5]);
            if (n === 1 || n === 5) ends.add(String(n));
        });
        expect([...ends].sort()).toEqual(['1', '5']);
    });

    it('uses "kredek" for the pencil icon, not "ołówków"', () => {
        let pencils = 0;
        forEachDraw(generateCount, COUNT_7, {}, (task, where) => {
            if (drawn(task, where).icon !== 'pencil') return;
            pencils += 1;
            expect(task.prompt, where).toBe('Ile jest kredek?');
        });
        expect(pencils).toBeGreaterThan(0);
    });
});

describe('E1.2.count_5 (S-14d O4)', () => {
    it('never draws a single icon: the data skill has min 2 and every drawing has at least 2 icons', () => {
        const data = E1.steps.flatMap((st) => st.skills).find((s) => s.id === 'E1.2.count_5');
        expect(data?.params.min).toBe(2);
        forEachDraw(generateCount, data!, {}, (task, where) => {
            expect(drawn(task, where).n, where).toBeGreaterThanOrEqual(2);
        });
    });
});

describe('parseCountParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [COUNT_5, COUNT_7, COUNT_12]) expect(() => parseCountParams(s.params), s.id).not.toThrow();
    });

    const ok = { min: 1, max: 5, tens: false };
    it.each([
        ['min 0', { ...ok, min: 0 }],
        ['min above max', { ...ok, min: 6 }],
        ['more than 20 icons', { ...ok, max: 21 }],
        ['a ten and the rest below 11', { ...ok, tens: true }],
        ['a non-integer max', { ...ok, max: 5.5 }],
        ['a non-boolean tens', { ...ok, tens: 'yes' }],
        ['a single count (nothing to choose between)', { ...ok, min: 5, max: 5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseCountParams(params)).toThrow(TypeError);
    });
});

describe('task space of the planned skills', () => {
    it.each([['E1.2', COUNT_5], ['E1.4', COUNT_7], ['E1.10', COUNT_12]] as [string, SkillDef][])('%s: at least 12 different tasks, none above 15 %%', (_name, s) => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateCount(s, createRng(910_000 + i));
            const key = `${task.prompt}|${visualKey(task.visual)}|${(task.choices ?? []).join('/')}`;
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});
