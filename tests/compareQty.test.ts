// COMPARE_QTY (S-14d): two groups of one icon; the child says where there are more (fewer) or that they are equal.
// The oracle reads the answer from the drawing's groups, never from the task's own answer.
import { describe, expect, it } from 'vitest';
import { generateCompareQty, parseCompareQtyParams } from '../src/core/tasks/generators/compareQty';
import { countNoun } from '../src/core/text/plural';
import type { SkillDef } from '../src/core/types';
import { ICONS } from '../src/data/measures';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E1', step: 1, type: 'COMPARE_QTY', params, answer: 'tiles' });
const Q5 = skill('E1.1.compare_qty_5', { max: 5, ask: ['more', 'less'], equalShare: 0.2 });
const Q10 = skill('E1.1.compare_qty_10', { max: 10, ask: ['more', 'less'], equalShare: 0.2 });
const TILES = ['Po lewej', 'Po prawej', 'Tyle samo'];

const expected = (ask: string, l: number, r: number): string => (l === r ? 'Tyle samo' : (ask === 'more') === l > r ? 'Po lewej' : 'Po prawej');

describe('parseCompareQtyParams', () => {
    it('accepts the E1 skills and rejects data nobody could solve', () => {
        expect(parseCompareQtyParams(Q5.params)).toEqual({ max: 5, ask: ['more', 'less'], equalShare: 0.2 });
        expect(() => parseCompareQtyParams({ max: 1, ask: ['more'], equalShare: 0.2 })).toThrow(TypeError);
        expect(() => parseCompareQtyParams({ max: 11, ask: ['more'], equalShare: 0.2 })).toThrow(TypeError);
        expect(() => parseCompareQtyParams({ max: 5, ask: [], equalShare: 0.2 })).toThrow(TypeError);
        expect(() => parseCompareQtyParams({ max: 5, ask: ['most'], equalShare: 0.2 })).toThrow(TypeError);
        expect(() => parseCompareQtyParams({ max: 5, ask: ['more'], equalShare: 0.9 })).toThrow(TypeError);
        expect(() => parseCompareQtyParams({ max: 5, ask: ['more'] })).toThrow(TypeError);
    });
});

describe('generateCompareQty', () => {
    for (const s of [Q5, Q10]) {
        const max = (s.params as { max: number }).max;
        it(`${s.id}: 1000 draws answer from the drawn groups, three fixed tiles`, () => {
            let equal = 0;
            let total = 0;
            const sides = { 'Po lewej': 0, 'Po prawej': 0 };
            const asks = new Set<string>();
            forEachDraw(generateCompareQty, s, {}, (task, where) => {
                total += 1;
                expect(task.visual?.kind, where).toBe('icons');
                if (task.visual?.kind !== 'icons') return;
                const [l, r] = task.visual.groups;
                expect(task.visual.groups, where).toHaveLength(2);
                expect(task.visual.framed, where).toBe(false);
                // Visual gate S-14d: the tiles say left and right, so the groups stand side by side (never one under the other).
                expect(task.visual.sides, where).toBe(true);
                expect(task.visual.motion, where).toBeUndefined();
                for (const g of [l, r]) {
                    expect(g, where).toBeGreaterThanOrEqual(1);
                    expect(g, where).toBeLessThanOrEqual(max);
                }
                const drawnIcon = task.visual.icon;
                const noun = ICONS.find((i) => i.id === drawnIcon)?.noun ?? '';
                const m = /^Gdzie jest (więcej|mniej) (.+)\?$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const ask = m![1] === 'więcej' ? 'more' : 'less';
                asks.add(ask);
                expect(m![2], where).toBe(nouns[noun][2]);
                expect(task.answer, where).toBe(expected(ask, l, r));
                expect([...(task.choices ?? [])].sort(), where).toEqual([...TILES].sort());
                if (l === r) equal += 1;
                else sides[task.answer as 'Po lewej' | 'Po prawej'] += 1;
                // Hints: the first one teaches counting, the second gives both counts, only the last names the tile.
                expect(task.hint, where).toHaveLength(3);
                expect(task.hint[0], where).not.toContain(String(task.answer));
                expect(task.hint[1], where).toContain(countNoun(l, nouns[noun]));
                expect(task.hint[1], where).toContain(countNoun(r, nouns[noun]));
                expect(task.hint[1], where).not.toContain(String(task.answer));
                expect(task.hint[2], where).toContain(String(task.answer));
            });
            expect(asks).toEqual(new Set(['more', 'less']));
            expect(equal / total).toBeGreaterThan(0.12);
            expect(equal / total).toBeLessThan(0.28);
            expect(sides['Po lewej'] / total).toBeGreaterThan(0.25);
            expect(sides['Po prawej'] / total).toBeGreaterThan(0.25);
        });
    }

    it('equalShare 0 never draws equal groups', () => {
        forEachDraw(generateCompareQty, skill('x', { max: 3, ask: ['more'], equalShare: 0 }), {}, (task, where) => {
            if (task.visual?.kind !== 'icons') throw new Error(where);
            expect(task.visual.groups[0], where).not.toBe(task.visual.groups[1]);
        });
    });
});
