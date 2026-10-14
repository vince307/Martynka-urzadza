import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generateMultGroups, parseMultGroupsParams } from '../src/core/tasks/generators/multGroups';
import type { Task } from '../src/core/tasks/types';
import { visualKey } from '../src/core/tasks/visual';
import { inflect } from '../src/core/text/plural';
import type { SkillDef } from '../src/core/types';
import { ICONS, PLATE_ICONS } from '../src/data/measures';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E3', step: 9, type: 'MULT_GROUPS', params, answer: 'tiles' });

const RESULT = skill('E3.9.mult_groups_result', { variant: 'result', groups: [2, 5], size: [2, 6], max: 30 });
const EXPR = skill('E3.9.mult_groups_expr', { variant: 'expr', groups: [2, 5], size: [2, 6], max: 30 });

const drawn = (task: Task, where: string): { icon: string; g: number; k: number } => {
    expect(task.visual?.kind, where).toBe('icons');
    if (task.visual?.kind !== 'icons') throw new Error(`no icons ${where}`);
    const { groups } = task.visual;
    expect(task.visual.framed, where).toBe(true);
    expect(new Set(groups).size, `${where} equal groups`).toBe(1);
    expect(PLATE_ICONS, `${where} fits on a plate`).toContain(task.visual.icon);
    return { icon: task.visual.icon, g: groups.length, k: groups[0] };
};

const TERM = /^(\d+) · (\d+)$/;

describe('generateMultGroups result', () => {
    const p = parseMultGroupsParams(RESULT.params);
    it(`${RESULT.id}: 1000 draws multiply the framed groups of the drawing`, () => {
        const pairs = new Set<string>();
        forEachDraw(generateMultGroups, RESULT, {}, (task, where) => {
            const { icon, g, k } = drawn(task, where);
            pairs.add(`${g}x${k}`);
            expect(g, where).toBeGreaterThanOrEqual(p.groups[0]);
            expect(g, where).toBeLessThanOrEqual(p.groups[1]);
            expect(k, where).toBeGreaterThanOrEqual(p.size[0]);
            expect(k, where).toBeLessThanOrEqual(p.size[1]);
            expect(g * k, where).toBeLessThanOrEqual(p.max);
            // The oracle is the drawing, not the answer.
            expect(task.answer, where).toBe(g * k);
            const noun = ICONS.find((i) => i.id === icon)?.noun ?? '';
            const forms = nouns[noun];
            expect(task.prompt, where).toBe(`Na ${g} talerzykach leży po ${k} ${inflect(k, forms)}. Ile ${forms[2]} jest razem?`);
            expect(task.choices, where).toBeUndefined();
            expect(task.tileRange, where).toEqual({ min: 1, max: p.max });
            expect(firstHint(task), where).toBe(task.hint[0]);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint, where).toContain(`${g} · ${k} = ${g * k}`);
        });
        expect(pairs.size, 'different drawings').toBeGreaterThanOrEqual(12);
    });
});

describe('generateMultGroups expr', () => {
    const p = parseMultGroupsParams(EXPR.params);
    it(`${EXPR.id}: the right product among sums and wrong products, never the swapped one`, () => {
        forEachDraw(generateMultGroups, EXPR, {}, (task, where) => {
            const { g, k } = drawn(task, where);
            expect(g * k, where).toBeLessThanOrEqual(p.max);
            expect(task.answer, where).toBe(`${g} · ${k}`);
            expect(task.prompt, where).toMatch(/^Które działanie pokazuje obrazek\?$/);
            const choices = (task.choices ?? []).map(String);
            expect(choices, where).toHaveLength(3);
            expect(choices, where).toContain(`${g} · ${k}`);
            // Every other tile is wrong in value, so no tile is a second correct answer: the swapped factors "k · g" are never offered.
            for (const c of choices) {
                if (c === `${g} · ${k}`) continue;
                expect(c, where).not.toBe(`${k} · ${g}`);
                const product = TERM.exec(c);
                const sum = /^(\d+) \+ (\d+)$/.exec(c);
                const value = product ? Number(product[1]) * Number(product[2]) : sum ? Number(sum[1]) + Number(sum[2]) : Number.NaN;
                expect(value, `${where} tile "${c}"`).not.toBe(g * k);
            }
            expect(choices.some((c) => /^\d+ \+ \d+$/.test(c)), `${where} a sum among the tiles`).toBe(g + k !== g * k);
            expect(firstHint(task), where).toBe(task.hint[0]);
            expect(task.hint, where).toContain(`${g} · ${k} = ${g * k}`);
            expect(task.hint[task.hint.length - 1], where).toBe(`Pasuje ${g} · ${k}.`);
        });
    });

    it('a sum that equals the product (2 + 2 = 2 · 2) is not offered as a wrong tile', () => {
        const fixed = skill('E3.9.fixed', { variant: 'expr', groups: [2, 2], size: [2, 2], max: 30 });
        forEachDraw(generateMultGroups, fixed, {}, (task, where) => {
            expect(task.answer, where).toBe('2 · 2');
            expect(task.choices, where).not.toContain('2 + 2');
        });
    });
});

describe('parseMultGroupsParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [RESULT, EXPR]) expect(() => parseMultGroupsParams(s.params), s.id).not.toThrow();
    });

    const ok = { variant: 'result', groups: [2, 5], size: [2, 6], max: 30 };
    it.each([
        ['an unknown variant', { ...ok, variant: 'sum' }],
        ['groups below 2', { ...ok, groups: [1, 5] }],
        ['groups reversed', { ...ok, groups: [5, 2] }],
        ['size below 2', { ...ok, size: [1, 6] }],
        ['size not a pair', { ...ok, size: [2] }],
        ['a max below the smallest product', { ...ok, max: 3 }],
        ['a max above 30 icons', { ...ok, max: 31 }],
        ['more than 8 groups', { ...ok, groups: [2, 9] }],
        ['a non-integer max', { ...ok, max: 12.5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseMultGroupsParams(params)).toThrow(TypeError);
    });
});

describe('task space of the planned skills', () => {
    it.each([['E3.9 result', RESULT], ['E3.9 expr', EXPR]] as [string, SkillDef][])('%s: at least 12 different tasks, none above 15 %%', (_name, s) => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateMultGroups(s, createRng(910_000 + i));
            const key = `${task.prompt}|${visualKey(task.visual)}|${(task.choices ?? []).join('/')}`;
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});
