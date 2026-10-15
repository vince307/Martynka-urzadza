// PATTERN (S-14d): the oracle finds the smallest period of the shown faces and reads the successor from it.
import { describe, expect, it } from 'vitest';
import { generatePattern, parsePatternParams } from '../src/core/tasks/generators/pattern';
import { isFace } from '../src/core/tasks/faces';
import { describeVisual } from '../src/core/tasks/visual';
import { PATTERN_LIMITS } from '../src/data/shapes';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const FIGURES = ['circle', 'square', 'triangle', 'star', 'heart'];

const skill = (period: string, figures: string[] = FIGURES): SkillDef => ({
    id: `E1.1.pattern_${period}`,
    stage: 'E1',
    step: 1,
    type: 'PATTERN',
    params: { periods: [period], figures },
    answer: 'tiles',
});

const smallestPeriod = (shown: readonly string[]): number => {
    for (let p = 1; p < shown.length; p += 1) {
        if (shown.every((v, i) => i < p || v === shown[i - p])) return p;
    }
    return shown.length;
};

describe('parsePatternParams', () => {
    it('accepts the four periods', () => {
        const p = parsePatternParams({ periods: ['AB', 'ABB', 'AAB', 'ABC'], figures: FIGURES });
        expect(p.periods).toEqual(['AB', 'ABB', 'AAB', 'ABC']);
    });

    it('rejects data nobody could solve', () => {
        expect(() => parsePatternParams({ periods: [], figures: FIGURES })).toThrow(TypeError);
        expect(() => parsePatternParams({ periods: ['ABCD'], figures: FIGURES })).toThrow(TypeError);
        expect(() => parsePatternParams({ periods: ['ABC'], figures: ['circle', 'square'] })).toThrow(TypeError);
        expect(() => parsePatternParams({ periods: ['AB'], figures: ['circle', 'cube', 'square'] })).toThrow(TypeError);
        expect(() => parsePatternParams({ periods: ['AB'] })).toThrow(TypeError);
    });
});

describe('generatePattern with the fewest figures', () => {
    it('three figures are enough for every period', () => {
        for (const period of ['AB', 'ABB', 'AAB', 'ABC']) {
            forEachDraw(generatePattern, skill(period, ['circle', 'square', 'triangle']), {}, (task, where) => {
                expect(task.choices, where).toHaveLength(PATTERN_LIMITS.tiles);
                expect(task.choices?.every(isFace), where).toBe(true);
            });
        }
    });
});

describe('generatePattern', () => {
    for (const [period, length, distinct] of [['AB', 2, 2], ['ABB', 3, 2], ['AAB', 3, 2], ['ABC', 3, 3]] as const) {
        it(`${period}: 1000 draws, the gap is filled by the next place of the period`, () => {
            const modes = new Set<string>();
            forEachDraw(generatePattern, skill(period), {}, (task, where) => {
                expect(task.prompt, where).toBe('Co będzie dalej?');
                const visual = task.visual;
                expect(visual?.kind, where).toBe('pattern');
                const items = visual?.kind === 'pattern' ? visual.items : [];
                expect(items.at(-1), where).toBeNull();
                const shown = items.slice(0, -1) as string[];
                expect(shown.every(isFace), where).toBe(true);
                expect(shown.length, where).toBeGreaterThanOrEqual(PATTERN_LIMITS.minShown);
                expect(shown.length, where).toBeLessThanOrEqual(PATTERN_LIMITS.maxShown);
                expect(smallestPeriod(shown), where).toBe(length);
                expect(new Set(shown).size, where).toBe(distinct);
                expect(task.answer, where).toBe(shown[shown.length - length]);
                if (period === 'ABB') {
                    expect(shown[0] !== shown[1] && shown[1] === shown[2], where).toBe(true);
                }
                if (period === 'AAB') {
                    expect(shown[0] === shown[1] && shown[1] !== shown[2], where).toBe(true);
                }
                expect(task.choices, where).toHaveLength(PATTERN_LIMITS.tiles);
                expect(task.choices, where).toContain(task.answer);
                expect(new Set(task.choices).size, where).toBe(PATTERN_LIMITS.tiles);
                // What varies along the row: the figure, the colour or both.
                const figures = new Set(shown.map((c) => c.split(':')[1]));
                const colours = new Set(shown.map((c) => c.split(':')[2]));
                modes.add(figures.size > 1 && colours.size > 1 ? 'both' : figures.size > 1 ? 'figure' : 'colour');
                expect(describeVisual(visual!), where).not.toContain('shape:');
                for (const text of [task.prompt, ...task.hint]) expect(text, where).not.toContain('shape:');
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
            });
            expect([...modes].sort()).toEqual(['both', 'colour', 'figure']);
        });
    }
});
