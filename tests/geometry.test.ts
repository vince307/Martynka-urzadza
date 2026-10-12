import { describe, expect, it } from 'vitest';
import { MIN_TOUCH_TARGET, TASK_LAYOUT } from '../src/data/layout';
import { keypadGrid, tileRow, type Rect } from '../src/ui/widgets/geometry';

const { notebook, tiles, keypad } = TASK_LAYOUT;
const inner: Rect = {
    x: notebook.left + notebook.border,
    y: tiles.top,
    width: notebook.width - 2 * notebook.border,
    height: tiles.height,
};

const overlaps = (a: Rect, b: Rect): boolean =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const inside = (r: Rect, area: Rect): boolean =>
    r.x >= area.x && r.y >= area.y && r.x + r.width <= area.x + area.width && r.y + r.height <= area.y + area.height;

describe('tileRow', () => {
    for (const count of [3, 4]) {
        it(`lays out ${count} tiles without overlap, inside the notebook, at touch size`, () => {
            const rects = tileRow(count, inner, tiles);
            expect(rects).toHaveLength(count);
            rects.forEach((r, i) => {
                expect(r.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
                expect(r.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
                expect(inside(r, inner)).toBe(true);
                rects.slice(i + 1).forEach((other) => expect(overlaps(r, other)).toBe(false));
            });
        });
    }

    it('centres the row on the notebook', () => {
        const rects = tileRow(4, inner, tiles);
        const last = rects[3];
        expect((rects[0].x + last.x + last.width) / 2).toBeCloseTo(notebook.left + notebook.width / 2);
    });
});

describe('keypadGrid', () => {
    const grid = keypadGrid(keypad);
    const notebookInner: Rect = {
        x: notebook.left + notebook.border,
        y: notebook.top + notebook.border,
        width: notebook.width - 2 * notebook.border,
        height: notebook.height - 2 * notebook.border,
    };

    it('has the field and twelve keys: 0-9, kasuj and OK', () => {
        expect(grid.keys.map((k) => k.key).sort()).toEqual(
            ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete', 'ok'].sort(),
        );
    });

    it('keeps every key at touch size, apart and inside the notebook', () => {
        const all = [grid.field, ...grid.keys.map((k) => k.rect)];
        all.forEach((r, i) => {
            expect(inside(r, notebookInner)).toBe(true);
            all.slice(i + 1).forEach((other) => expect(overlaps(r, other)).toBe(false));
        });
        grid.keys.forEach(({ rect }) => {
            expect(rect.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(rect.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        });
    });
});
