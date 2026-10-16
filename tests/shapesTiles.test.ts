// SHAPES (S-14d): the oracle reads the figures off the face codes of the tiles, never off the generator's fields.
import { describe, expect, it } from 'vitest';
import { generateShapes, parseShapesParams } from '../src/core/tasks/generators/shapes';
import { parseFace, faceLabel, isFace, type Face } from '../src/core/tasks/faces';
import { FIGURES, NAMED_FIGURE_IDS } from '../src/data/shapes';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (variants: string[], answer: SkillDef['answer'], figures: string[] = [...NAMED_FIGURE_IDS]): SkillDef => ({
    id: `E1.1.shapes_${variants.join('_')}`,
    stage: 'E1',
    step: 1,
    type: 'SHAPES',
    params: { variants, figures },
    answer,
});

const facesOf = (choices: readonly (number | string)[] | undefined, where: string): Face[] =>
    (choices ?? []).map((c) => {
        const face = parseFace(c);
        expect(face, `${where} choice ${String(c)}`).not.toBeNull();
        return face as Face;
    });

const genitive = (figure: string): string => FIGURES.find((f) => f.id === figure)?.genitive ?? '';
const genitivePlural = (figure: string): string => FIGURES.find((f) => f.id === figure)?.genitivePlural ?? '';

/** Per feature, the index of the tile that is alone with its value while the other three agree; one entry per such (tile, feature). */
const oddOnes = (faces: readonly Face[]): { tile: number; feature: 'figure' | 'colour' | 'size' }[] => {
    const out: { tile: number; feature: 'figure' | 'colour' | 'size' }[] = [];
    for (const feature of ['figure', 'colour', 'size'] as const) {
        faces.forEach((face, i) => {
            const rest = faces.filter((_, j) => j !== i).map((f) => f[feature]);
            if (rest.every((v) => v === rest[0]) && rest[0] !== face[feature]) out.push({ tile: i, feature });
        });
    }
    return out;
};

describe('parseShapesParams', () => {
    it('accepts the named figures and the three variants', () => {
        expect(parseShapesParams({ variants: ['name', 'odd', 'all'], figures: [...NAMED_FIGURE_IDS] })).toEqual({
            variants: ['name', 'odd', 'all'],
            figures: [...NAMED_FIGURE_IDS],
        });
    });

    it('rejects data nobody could solve', () => {
        expect(() => parseShapesParams({ variants: [], figures: [...NAMED_FIGURE_IDS] })).toThrow(TypeError);
        expect(() => parseShapesParams({ variants: ['pick'], figures: [...NAMED_FIGURE_IDS] })).toThrow(TypeError);
        expect(() => parseShapesParams({ variants: ['name'], figures: ['circle', 'square'] })).toThrow(TypeError);
        expect(() => parseShapesParams({ variants: ['name'], figures: ['circle', 'square', 'triangle', 'star'] })).toThrow(TypeError);
        expect(() => parseShapesParams({ variants: ['name'], figures: ['circle', 'circle', 'square', 'triangle'] })).toThrow(TypeError);
        expect(() => parseShapesParams({ variants: ['name'] })).toThrow(TypeError);
    });
});

describe('generateShapes: name', () => {
    it('1000 draws: one tile has the named figure and it is the answer', () => {
        const seen = new Set<string>();
        forEachDraw(generateShapes, skill(['name'], 'tiles'), {}, (task, where) => {
            const faces = facesOf(task.choices, where);
            expect(faces.length, where).toBeGreaterThanOrEqual(3);
            expect(faces.length, where).toBeLessThanOrEqual(4);
            const named = /^Dotknij (.+)\.$/.exec(task.prompt)?.[1];
            const target = NAMED_FIGURE_IDS.find((id) => genitive(id) === named);
            expect(target, where).toBeDefined();
            seen.add(target as string);
            expect(new Set(faces.map((f) => f.figure)).size, where).toBe(faces.length);
            const matching = (task.choices ?? []).filter((_, i) => faces[i].figure === target);
            expect(matching, where).toHaveLength(1);
            expect(task.answer, where).toBe(matching[0]);
            expect(task.input === undefined || task.input === 'tiles', where).toBe(true);
        });
        expect([...seen].sort()).toEqual([...NAMED_FIGURE_IDS].sort());
    });
});

describe('generateShapes: odd', () => {
    it('1000 draws: exactly one tile differs from the other three in exactly one feature, and it is the answer', () => {
        const features = new Set<string>();
        forEachDraw(generateShapes, skill(['odd'], 'tiles'), {}, (task, where) => {
            expect(task.prompt, where).toBe('Który nie pasuje?');
            const faces = facesOf(task.choices, where);
            expect(faces, where).toHaveLength(4);
            const odd = oddOnes(faces);
            expect(odd, where).toHaveLength(1);
            features.add(odd[0].feature);
            expect(task.answer, where).toBe((task.choices ?? [])[odd[0].tile]);
        });
        expect([...features].sort()).toEqual(['colour', 'figure', 'size']);
    });
});

describe('generateShapes: all', () => {
    it('1000 draws: the answer is every tile with the named figure, checked as a set', () => {
        forEachDraw(generateShapes, skill(['all'], 'select'), {}, (task, where) => {
            const faces = facesOf(task.choices, where);
            expect(faces.length, where).toBeGreaterThanOrEqual(5);
            expect(faces.length, where).toBeLessThanOrEqual(6);
            const named = /^Dotknij wszystkich (.+)\.$/.exec(task.prompt)?.[1];
            const target = NAMED_FIGURE_IDS.find((id) => genitivePlural(id) === named);
            expect(target, where).toBeDefined();
            const right = (task.choices as string[]).filter((_, i) => faces[i].figure === target);
            expect(right.length, where).toBeGreaterThanOrEqual(2);
            expect(right.length, where).toBeLessThanOrEqual(3);
            expect(task.answer, where).toEqual(right);
            expect(task.check?.([...right].reverse()), where).toBe(true);
            expect(task.check?.(right.slice(1)), where).toBe(false);
            const wrong = (task.choices as string[]).find((c) => !right.includes(c)) as string;
            expect(task.check?.([...right, wrong]), where).toBe(false);
            expect(task.check?.([]), where).toBe(false);
            expect(task.check?.('x'), where).toBe(false);
        });
    });
});

describe('SHAPES texts', () => {
    it('keep the codes out of every text and give the result only in words', () => {
        for (const variant of ['name', 'odd', 'all'] as const) {
            forEachDraw(generateShapes, skill([variant], variant === 'all' ? 'select' : 'tiles'), {}, (task, where) => {
                for (const text of [task.prompt, ...(task.speak ? [task.speak] : []), ...task.hint]) {
                    expect(text, where).not.toContain('shape:');
                }
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                // The first line teaches a fact; it never names the tile that is the answer.
                const answers = (Array.isArray(task.answer) ? task.answer : [task.answer]).filter(isFace) as string[];
                for (const a of answers) {
                    expect(task.hint[0], where).not.toContain(faceLabel(a));
                }
            });
        }
    });
});

describe('SHAPES "all" with too few distinct wrong faces (GRD-05)', () => {
    it('throws instead of returning a task with fewer wrong tiles', () => {
        // An rng that always answers the same: every wrong face is the same one, so the distinct faces run out.
        const stuck = {
            next: () => 0,
            int: (min: number) => min,
            pick: <T,>(items: readonly T[]): T => items[0],
            shuffle: <T,>(items: readonly T[]): T[] => [...items],
            chance: () => false,
        };
        expect(() => generateShapes(skill(['all'], 'tiles', ['circle', 'square', 'triangle']), stuck)).toThrow(RangeError);
    });
});
