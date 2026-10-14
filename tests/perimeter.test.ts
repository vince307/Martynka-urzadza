import { describe, expect, it } from 'vitest';
import { firstHint } from '../src/core/round/hints';
import { generatePerimeter, parsePerimeterParams } from '../src/core/tasks/generators/perimeter';
import { generators, parsers } from '../src/core/tasks/registry';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (variant: string, max: number): SkillDef => ({
    id: `E4.7.perimeter_${variant}`, stage: 'E4', step: 7, type: 'PERIMETER', params: { variant, max }, answer: 'keypad',
});

type Figure = { kind: string; lattice: boolean; vertices: [number, number][]; sides: (number | null)[] };
const figureOf = (task: { visual?: { kind: string } }, where: string): Figure => {
    const v = task.visual as Figure | undefined;
    if (v?.kind !== 'figure') throw new Error(`no figure drawing ${where}`);
    return v;
};
const edge = (f: Figure, i: number): number => {
    const [x, y] = f.vertices[i];
    const [nx, ny] = f.vertices[(i + 1) % f.vertices.length];
    return Math.abs(nx - x) + Math.abs(ny - y);
};
// First number in the prompt that is followed by " cm".
const cmIn = (text: string): number[] => [...text.matchAll(/(\d+) cm/g)].map((m) => Number(m[1]));

// Perimeter of a lattice figure counted from the cells it covers: cell sides that face a cell outside the figure.
const inside = (f: Figure, cx: number, cy: number): boolean => {
    let hit = false;
    f.vertices.forEach(([x, y], i) => {
        const [nx, ny] = f.vertices[(i + 1) % f.vertices.length];
        if (x === nx && x > cx && Math.min(y, ny) <= cy && cy < Math.max(y, ny)) hit = !hit;
    });
    return hit;
};
const countedBoundary = (f: Figure): number => {
    const xs = f.vertices.map((v) => v[0]);
    const ys = f.vertices.map((v) => v[1]);
    let sides = 0;
    for (let x = Math.min(...xs) - 1; x <= Math.max(...xs); x += 1) {
        for (let y = Math.min(...ys) - 1; y <= Math.max(...ys); y += 1) {
            if (!inside(f, x + 0.5, y + 0.5)) continue;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!inside(f, x + 0.5 + dx, y + 0.5 + dy)) sides += 1;
        }
    }
    return sides;
};

describe('generatePerimeter', () => {
    it('rect: the answer is the sum of the labelled sides of a rectangle or a square, within max', () => {
        const kinds = new Set<string>();
        forEachDraw(generatePerimeter, skill('rect', 40), { max: 40 }, (task, where) => {
            const f = figureOf(task, where);
            expect(task.input ?? 'keypad', where).toBe('keypad');
            expect(f.sides, where).toHaveLength(4);
            const s = f.sides as number[];
            expect(s[0], where).toBe(s[2]);
            expect(s[1], where).toBe(s[3]);
            for (const x of s) {
                expect(x, where).toBeGreaterThanOrEqual(2);
                expect(x, where).toBeLessThanOrEqual(20);
            }
            expect(task.answer, where).toBe(s[0] + s[1] + s[2] + s[3]);
            expect(task.answer as number, where).toBeLessThanOrEqual(40);
            kinds.add(s[0] === s[1] ? 'square' : 'rectangle');
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
            expect(firstHint(task), where).not.toBeNull();
        });
        expect(kinds.size, 'squares and rectangles both appear').toBe(2);
    });

    it('triangle: three labelled sides that form a triangle, the answer is their sum', () => {
        forEachDraw(generatePerimeter, skill('triangle', 30), { max: 30 }, (task, where) => {
            const f = figureOf(task, where);
            expect(f.vertices, where).toHaveLength(3);
            const [a, b, c] = f.sides as number[];
            expect(a + b, where).toBeGreaterThan(c);
            expect(a + c, where).toBeGreaterThan(b);
            expect(b + c, where).toBeGreaterThan(a);
            for (const x of [a, b, c]) expect(x, where).toBeGreaterThanOrEqual(2);
            expect(task.answer, where).toBe(a + b + c);
            expect(task.answer as number, where).toBeLessThanOrEqual(30);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('sideSquare: the answer is the side of a square whose perimeter is in the prompt, dividing by 4', () => {
        forEachDraw(generatePerimeter, skill('sideSquare', 40), { max: 40 }, (task, where) => {
            const [p] = cmIn(task.prompt);
            expect(p, `${where} perimeter in prompt`).toBeDefined();
            expect(p % 4, where).toBe(0);
            expect(p, where).toBeLessThanOrEqual(40);
            expect(4 * (task.answer as number), where).toBe(p);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(2);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[0], where).not.toContain(String(task.answer));
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('sideRect: the other side is a whole number from an even perimeter and the given side', () => {
        forEachDraw(generatePerimeter, skill('sideRect', 60), { max: 60 }, (task, where) => {
            const f = figureOf(task, where);
            const nums = cmIn(task.prompt);
            expect(nums, `${where} perimeter and a side in prompt`).toHaveLength(2);
            const [p, given] = nums;
            expect(p % 2, `${where} perimeter even`).toBe(0);
            expect(p, where).toBeLessThanOrEqual(60);
            expect(f.sides.filter((x) => x !== null), `${where} the drawing shows the given side`).toEqual([given]);
            expect(2 * (given + (task.answer as number)), where).toBe(p);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(2);
            expect(task.answer, where).not.toBe(given);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('composite: a lattice figure with 6 to 8 corners whose perimeter, counted from its cells, is the answer', () => {
        const corners = new Set<number>();
        forEachDraw(generatePerimeter, skill('composite', 40), { max: 40 }, (task, where) => {
            const f = figureOf(task, where);
            expect(f.lattice, where).toBe(true);
            expect(f.vertices.length, where).toBeGreaterThanOrEqual(6);
            expect(f.vertices.length, where).toBeLessThanOrEqual(8);
            corners.add(f.vertices.length);
            expect(f.sides.every((x) => x === null), `${where} no side labels`).toBe(true);
            const sum = f.vertices.reduce((a, _, i) => a + edge(f, i), 0);
            expect(task.answer, where).toBe(sum);
            expect(task.answer, `${where} counted from cells`).toBe(countedBoundary(f));
            expect(task.answer as number, where).toBeLessThanOrEqual(40);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect([...corners].sort(), 'L, U and staircase shapes both appear').toEqual([6, 8]);
    });

    it('rejects unknown variants, max outside 12..100, and is registered under PERIMETER', () => {
        expect(() => parsePerimeterParams({ variant: 'area', max: 40 })).toThrow(/variant/);
        expect(() => parsePerimeterParams({ variant: 'rect', max: 11 })).toThrow(/max/);
        expect(() => parsePerimeterParams({ variant: 'rect', max: 101 })).toThrow(/max/);
        expect(() => parsePerimeterParams({ variant: 'rect' })).toThrow(/max/);
        expect(parsePerimeterParams({ variant: 'composite', max: 40 })).toEqual({ variant: 'composite', max: 40 });
        expect(generators.PERIMETER).toBe(generatePerimeter);
        expect(parsers.PERIMETER).toBe(parsePerimeterParams);
    });
});
