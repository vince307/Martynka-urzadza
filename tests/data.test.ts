import { describe, expect, it } from 'vitest';
import { firstHint } from '../src/core/round/hints';
import { generateData, parseDataParams } from '../src/core/tasks/generators/data';
import type { SkillDef } from '../src/core/types';
import { chartThemes } from '../src/data/charts';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>, answer: SkillDef['answer']): SkillDef => ({ id, stage: 'E3', step: 4, type: 'DATA', params, answer });

const MOST = skill('E3.4.data_most_10', { variant: 'most', maxValue: 10, bars: 4 }, 'tiles');
const LEAST = skill('E3.4.data_least_10', { variant: 'least', maxValue: 10, bars: 4 }, 'tiles');
const HOW_MANY = skill('E3.4.data_howmany_10', { variant: 'howMany', maxValue: 10, bars: 3 }, 'keypad');
const DIFF = skill('E3.4.data_diff_10', { variant: 'diff', maxValue: 10, bars: 3 }, 'keypad');

type Bars = { label: string; value: number }[];
const barsOf = (task: { visual?: { kind: string } }, where: string): { bars: Bars; scaleMax: number } => {
    const v = task.visual as { kind: string; bars: Bars; scaleMax: number } | undefined;
    if (v?.kind !== 'bars') throw new Error(`no bars drawing ${where}`);
    return v;
};
const items = chartThemes.flatMap((t) => t.items);
const labelOfAcc = (acc: string): string => {
    const item = items.find((i) => i.acc === acc);
    if (!item) throw new Error(`unknown accusative "${acc}"`);
    return item.label;
};

describe('generateData', () => {
    it.each([
        ['most', MOST, 4, (v: number[]) => Math.max(...v)],
        ['least', LEAST, 4, (v: number[]) => Math.min(...v)],
    ] as const)('%s: the answer is the label of the single extreme bar, among the bar labels as tiles', (_n, s, count, extreme) => {
        const themes = new Set<string>();
        forEachDraw(generateData, s, {}, (task, where) => {
            const { bars, scaleMax } = barsOf(task, where);
            expect(bars, where).toHaveLength(count);
            expect(scaleMax, where).toBe(10);
            const values = bars.map((b) => b.value);
            expect(new Set(values).size, where).toBe(count);
            for (const v of values) {
                expect(v, where).toBeGreaterThanOrEqual(1);
                expect(v, where).toBeLessThanOrEqual(10);
            }
            const target = extreme(values);
            expect(values.filter((v) => v === target), where).toHaveLength(1);
            expect(task.answer, where).toBe(bars.find((b) => b.value === target)?.label);
            expect([...(task.choices ?? [])].sort(), where).toEqual(bars.map((b) => b.label).sort());
            themes.add(chartThemes.find((t) => t.items.some((i) => i.label === bars[0].label))?.id ?? '?');
            expect(firstHint(task), where).not.toBeNull();
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(themes.size).toBe(chartThemes.length);
    });

    it('howMany: the answer is the value of the bar named in the question', () => {
        forEachDraw(generateData, HOW_MANY, {}, (task, where) => {
            const { bars } = barsOf(task, where);
            expect(bars, where).toHaveLength(3);
            const m = /zagłosowało na (.+)\?$/.exec(task.prompt);
            if (!m) throw new Error(`prompt shape ${where}`);
            const bar = bars.find((b) => b.label === labelOfAcc(m[1]));
            expect(bar, where).toBeDefined();
            expect(task.answer, where).toBe(bar?.value);
            expect(task.choices, where).toBeUndefined();
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('diff: the answer is the positive difference of the two named bars', () => {
        const answers = new Set<number>();
        forEachDraw(generateData, DIFF, {}, (task, where) => {
            const { bars } = barsOf(task, where);
            const m = /O ile więcej dzieci zagłosowało na (.+) niż na (.+)\?$/.exec(task.prompt);
            if (!m) throw new Error(`prompt shape ${where}`);
            const more = bars.find((b) => b.label === labelOfAcc(m[1]));
            const less = bars.find((b) => b.label === labelOfAcc(m[2]));
            expect(more && less && more !== less, where).toBe(true);
            expect(task.answer, where).toBe((more?.value ?? 0) - (less?.value ?? 0));
            expect(task.answer as number, where).toBeGreaterThan(0);
            answers.add(task.answer as number);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(answers.size).toBeGreaterThan(5);
    });
});

describe('parseDataParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [MOST, LEAST, HOW_MANY, DIFF]) {
            expect(() => parseDataParams(s.params), s.id).not.toThrow();
        }
    });

    it.each([
        ['unknown variant', { variant: 'sum', maxValue: 10, bars: 3 }],
        ['fewer values than bars', { variant: 'most', maxValue: 3, bars: 4 }],
        ['maxValue above 20', { variant: 'most', maxValue: 21, bars: 3 }],
        ['2 bars', { variant: 'most', maxValue: 10, bars: 2 }],
        ['5 bars', { variant: 'most', maxValue: 10, bars: 5 }],
        ['fractional maxValue', { variant: 'most', maxValue: 9.5, bars: 3 }],
        ['missing maxValue', { variant: 'most', bars: 3 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseDataParams(params)).toThrow(TypeError);
    });
});
