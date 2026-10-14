import { describe, expect, it } from 'vitest';
import type { MoneyId } from '../src/data/measures';
import { TASK_LAYOUT } from '../src/data/layout';
import type { Rect } from '../src/ui/widgets/geometry';
import { moneyLayout, scaleLayout } from '../src/ui/widgets/artLayout';

const AREAS: Rect[] = [
    { x: 661, y: 396, width: 600, height: 294 },
    { x: 236, y: 470, width: 768, height: 190 },
    { x: 236, y: 396, width: 624, height: 294 },
];

const inside = (inner: Rect, outer: Rect): boolean =>
    inner.x >= outer.x - 0.01 && inner.y >= outer.y - 0.01 && inner.x + inner.width <= outer.x + outer.width + 0.01 && inner.y + inner.height <= outer.y + outer.height + 0.01;
const overlap = (a: Rect, b: Rect): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const TABLES: MoneyId[][] = [
    ['coin-1zl'],
    ['note-10zl', 'coin-2zl', 'coin-50gr'],
    ['note-100zl', 'note-50zl', 'note-20zl', 'coin-5zl', 'coin-2zl', 'coin-1zl'],
    ['coin-01gr', 'coin-02gr', 'coin-05gr', 'coin-10gr', 'coin-20gr', 'coin-50gr', 'coin-1zl', 'coin-2zl', 'coin-5zl', 'coin-1zl'],
];

describe('moneyLayout', () => {
    for (const area of AREAS) {
        for (const items of TABLES) {
            it(`keeps ${items.length} items inside ${area.width}x${area.height}, apart, notes above coins`, () => {
                const placed = moneyLayout(items, area, TASK_LAYOUT.money);
                expect(placed.map((p) => p.id).sort()).toEqual([...items].sort());
                for (const p of placed) expect(inside(p.rect, area), p.id).toBe(true);
                placed.forEach((a, i) => placed.slice(i + 1).forEach((b) => expect(overlap(a.rect, b.rect), `${a.id} / ${b.id}`).toBe(false)));
                const noteBottoms = placed.filter((p) => p.id.startsWith('note-')).map((p) => p.rect.y + p.rect.height);
                const coinTops = placed.filter((p) => p.id.startsWith('coin-')).map((p) => p.rect.y);
                if (noteBottoms.length > 0 && coinTops.length > 0) expect(Math.max(...noteBottoms)).toBeLessThanOrEqual(Math.min(...coinTops));
            });
        }
    }

    it('draws a note wider than a coin and a 5 zł coin larger than a 1 gr coin', () => {
        const [note, coin] = moneyLayout(['note-10zl', 'coin-1zl'], AREAS[0], TASK_LAYOUT.money);
        expect(note.rect.width).toBeGreaterThan(coin.rect.width);
        const [big, small] = moneyLayout(['coin-5zl', 'coin-01gr'], AREAS[0], TASK_LAYOUT.money);
        expect(big.rect.width).toBeGreaterThan(small.rect.width);
    });
});

describe('scaleLayout', () => {
    for (const area of AREAS) {
        for (let n = 1; n <= 6; n += 1) {
            it(`${n} weights stay on the right pan inside ${area.width}x${area.height}`, () => {
                const layout = scaleLayout(n, area, TASK_LAYOUT.scale);
                expect(layout.weights).toHaveLength(n);
                expect(inside(layout.scale, area)).toBe(true);
                expect(inside(layout.item, layout.scale)).toBe(true);
                const centre = layout.scale.x + layout.scale.width / 2;
                expect(layout.item.x + layout.item.width).toBeLessThan(centre);
                for (const w of layout.weights) {
                    expect(inside(w, layout.scale)).toBe(true);
                    expect(w.x).toBeGreaterThan(centre);
                }
                // A second row stands behind the first (higher, partly hidden); side by side in a row they never touch.
                const perRow = TASK_LAYOUT.scale.perRow;
                layout.weights.forEach((a, i) =>
                    layout.weights.slice(i + 1).forEach((b, j) => {
                        if (Math.floor(i / perRow) === Math.floor((i + 1 + j) / perRow)) expect(overlap(a, b)).toBe(false);
                    }),
                );
            });
        }
    }
});
