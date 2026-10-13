// Geometry of the `drag` mode (S-13 phase 8). Oracle: the notebook rectangle and the bar from TASK_LAYOUT, the plan's
// "tray on the right where the keypad is, mat on the left", and "9 blocks of each kind fit on the mat".
import { describe, expect, it } from 'vitest';
import { dragGeometry, dragLayout, insideRect, interiorPoint, type Rect } from '../src/core/round/dragLayout';
import type { BlockKind } from '../src/core/blockDrag';
import { TASK_LAYOUT } from '../src/data/layout';

const spec = TASK_LAYOUT.drag;
const { notebook, bar } = TASK_LAYOUT;
const page: Rect = { x: notebook.left, y: notebook.top, width: notebook.width, height: notebook.height };
const apart = (a: Rect, b: Rect): boolean =>
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
const within = (r: Rect, outer: Rect): boolean =>
    r.x >= outer.x && r.y >= outer.y && r.x + r.width <= outer.x + outer.width && r.y + r.height <= outer.y + outer.height;
const barRect: Rect = { x: 0, y: bar.bottom - bar.height, width: 1920, height: bar.height };
const sets: BlockKind[][] = [['ten', 'one'], ['hundred', 'ten', 'one'], ['one']];

describe('dragLayout', () => {
    for (const kinds of sets) {
        const layout = dragLayout(spec, kinds);
        const trays = kinds.map((k) => layout.tray[k]!);
        const label = kinds.join('+');

        it(`${label}: the tray rectangles, the mat and OK are inside the notebook, apart, and clear of the bar`, () => {
            const all = [...trays, layout.mat, layout.ok];
            for (const r of all) {
                expect(within(r, page)).toBe(true);
                expect(apart(r, barRect)).toBe(true);
            }
            for (let i = 0; i < all.length; i += 1) {
                for (let j = i + 1; j < all.length; j += 1) expect(apart(all[i], all[j])).toBe(true);
            }
        });

        it(`${label}: the tray is on the right of the mat (where the keypad is)`, () => {
            for (const t of trays) expect(t.x).toBeGreaterThanOrEqual(layout.mat.x + layout.mat.width);
        });

        it(`${label}: 9 blocks of every kind fit on the mat, inside it and apart`, () => {
            const blocks = kinds.flatMap((k) => Array.from({ length: 9 }, (_, i) => layout.matBlock(k, i)));
            for (const b of blocks) expect(within(b, layout.mat)).toBe(true);
            for (let i = 0; i < blocks.length; i += 1) {
                for (let j = i + 1; j < blocks.length; j += 1) expect(apart(blocks[i], blocks[j])).toBe(true);
            }
        });

        it(`${label}: the interior point of a tray rectangle is its centre and hits only that kind`, () => {
            const geo = dragGeometry(layout, kinds);
            for (const k of kinds) {
                const p = interiorPoint(layout.tray[k]!);
                expect(geo.trayAt(p.x, p.y)).toBe(k);
                expect(geo.onMat(p.x, p.y)).toBe(false);
                // margin: a point 40 px off in every direction still hits the same kind
                for (const [dx, dy] of [[-40, 0], [40, 0], [0, -40], [0, 40]] as const) {
                    expect(geo.trayAt(p.x + dx, p.y + dy)).toBe(k);
                }
            }
        });

        it(`${label}: the interior point of the mat is on the mat and not on the tray`, () => {
            const geo = dragGeometry(layout, kinds);
            const p = interiorPoint(layout.mat);
            expect(geo.onMat(p.x, p.y)).toBe(true);
            expect(geo.trayAt(p.x, p.y)).toBeNull();
        });
    }

    it('finds a mat block only while it is on the mat', () => {
        const kinds: BlockKind[] = ['ten', 'one'];
        const layout = dragLayout(spec, kinds);
        const geo = dragGeometry(layout, kinds);
        const p = interiorPoint(layout.matBlock('ten', 1));
        expect(geo.matBlockAt(p.x, p.y, { hundred: 0, ten: 2, one: 0 })).toBe('ten');
        expect(geo.matBlockAt(p.x, p.y, { hundred: 0, ten: 1, one: 0 })).toBeNull();
        const q = interiorPoint(layout.matBlock('one', 0));
        expect(geo.matBlockAt(q.x, q.y, { hundred: 0, ten: 2, one: 1 })).toBe('one');
    });

    it('insideRect includes the edges', () => {
        expect(insideRect({ x: 10, y: 10, width: 5, height: 5 }, 15, 15)).toBe(true);
        expect(insideRect({ x: 10, y: 10, width: 5, height: 5 }, 16, 15)).toBe(false);
    });
});
