import { describe, expect, it } from 'vitest';
import { figureLayout, type FigureLook } from '../src/core/round/figureLayout';
import { FONT_SIZES, TASK_LAYOUT } from '../src/data/layout';

type V = readonly [number, number];
const look: FigureLook = TASK_LAYOUT.figure;
const SOLUTION = TASK_LAYOUT.picture.keypadSolution.picture;
const NORMAL = TASK_LAYOUT.picture.keypad;

const rectangle = (w: number, h: number): { vertices: V[]; sides: (number | null)[]; lattice: boolean } => ({
    vertices: [[0, 0], [w, 0], [w, h], [0, h]],
    sides: [12, 7, 12, 7],
    lattice: false,
});
const triangle = { vertices: [[0, 0], [6, 0], [2, 4]] as V[], sides: [11, 9, 8] as (number | null)[], lattice: false };
const inside = (x: number, y: number, r: { x: number; y: number; width: number; height: number }): boolean =>
    x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
const centroid = (pts: readonly { x: number; y: number }[]): { x: number; y: number } => ({
    x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
    y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
});

describe('figureLayout', () => {
    for (const [name, rect] of [['solution 768 x 190', SOLUTION], ['keypad 768 x 378', NORMAL]] as const) {
        for (const [shape, fig] of [['rectangle', rectangle(8, 4)], ['wide rectangle', rectangle(8, 2)], ['triangle', triangle]] as const) {
            it(`${shape} in ${name}: a label per labelled side, at the middle of its edge and outside the polygon`, () => {
                const out = figureLayout(fig, rect, look);
                expect(out.labels).toHaveLength(fig.sides.filter((s) => s !== null).length);
                const mid = centroid(out.points);
                out.labels.forEach((l, i) => {
                    const a = out.points[l.edge];
                    const b = out.points[(l.edge + 1) % out.points.length];
                    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                    expect(l.text).toBe(`${fig.sides[l.edge]} cm`);
                    // farther from the figure's centre than the edge middle: the label sits outside
                    expect(Math.hypot(l.x - mid.x, l.y - mid.y), `label ${i} outside`).toBeGreaterThan(Math.hypot(m.x - mid.x, m.y - mid.y));
                    expect(Math.hypot(l.x - m.x, l.y - m.y), `label ${i} near its edge`).toBeLessThan(look.labelPad + look.fontSize * 4);
                });
            });
            it(`${shape} in ${name}: polygon and labels stay inside the rectangle`, () => {
                const out = figureLayout(fig, rect, look);
                out.points.forEach((p) => expect(inside(p.x, p.y, rect)).toBe(true));
                out.labels.forEach((l) => {
                    expect(inside(l.x - l.width / 2, l.y - look.fontSize / 2, rect)).toBe(true);
                    expect(inside(l.x + l.width / 2, l.y + look.fontSize / 2, rect)).toBe(true);
                });
            });
        }
    }

    it('a label is never smaller than the design minimum', () => {
        expect(look.fontSize).toBeGreaterThanOrEqual(24);
        expect(look.fontSize).toBe(FONT_SIZES.sideLabel);
    });

    it('a lattice figure keeps a cell of at least 36 px in the solution rectangle', () => {
        const stairs: V[] = [[0, 0], [5, 0], [5, 2], [3, 2], [3, 4], [0, 4]];
        const out = figureLayout({ vertices: stairs, sides: stairs.map(() => null), lattice: true }, SOLUTION, look);
        expect(out.cell).toBeGreaterThanOrEqual(36);
        expect(out.labels).toHaveLength(0);
    });
});
