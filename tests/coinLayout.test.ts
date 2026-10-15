// Geometry of the coin tray and wallet (S-14d phase 6). Oracle: MIN_TOUCH_TARGET 96, at most 4 kinds on a tray
// (3 in one row, 4 in a 2 x 2 grid), and the wallet holds balance.coinDrag.maxTotal coins.
import { describe, expect, it } from 'vitest';
import { coinLayout, type Rect } from '../src/core/round/dragLayout';
import type { MoneyId } from '../src/data/measures';
import { balance } from '../src/data/balance';
import { MIN_TOUCH_TARGET, TASK_LAYOUT } from '../src/data/layout';

const spec = TASK_LAYOUT.coinDrag;
const { notebook } = TASK_LAYOUT;
const page: Rect = { x: notebook.left, y: notebook.top, width: notebook.width, height: notebook.height };
const apart = (a: Rect, b: Rect): boolean =>
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
const within = (r: Rect, outer: Rect): boolean =>
    r.x >= outer.x && r.y >= outer.y && r.x + r.width <= outer.x + outer.width && r.y + r.height <= outer.y + outer.height;
const sets: MoneyId[][] = [
    ['coin-1zl'], ['coin-1zl', 'coin-2zl'],
    ['coin-1zl', 'coin-2zl', 'coin-5zl'],
    ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl'],
];

describe('coinLayout', () => {
    for (const kinds of sets) {
        const layout = coinLayout(spec, kinds);
        const trays = kinds.map((k) => layout.tray[k]!);

        it(`${kinds.length} kinds: every tray tile is at least ${MIN_TOUCH_TARGET} px both ways, inside the notebook, apart from each other, the wallet and OK`, () => {
            const all = [...trays, layout.wallet, layout.ok];
            for (const t of trays) {
                expect(t.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
                expect(t.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            }
            for (const r of all) expect(within(r, page)).toBe(true);
            for (let i = 0; i < all.length; i += 1) {
                for (let j = i + 1; j < all.length; j += 1) expect(apart(all[i], all[j])).toBe(true);
            }
        });

        it(`${kinds.length} kinds: the tray is on the right of the wallet and tiles lie in the tray area`, () => {
            for (const t of trays) {
                expect(t.x).toBeGreaterThanOrEqual(layout.wallet.x + layout.wallet.width);
                expect(within(t, spec.tray)).toBe(true);
            }
        });

        it(`${kinds.length} kinds: ${balance.coinDrag.maxTotal} placed coins fit in the wallet, each at least ${MIN_TOUCH_TARGET} px, apart`, () => {
            const coins = Array.from({ length: balance.coinDrag.maxTotal }, (_, i) => layout.coin(i));
            for (const c of coins) {
                expect(within(c, layout.wallet)).toBe(true);
                expect(c.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
                expect(c.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            }
            for (let i = 0; i < coins.length; i += 1) {
                for (let j = i + 1; j < coins.length; j += 1) expect(apart(coins[i], coins[j])).toBe(true);
            }
        });
    }

    it('3 kinds sit in one row, 4 kinds in a 2 x 2 grid', () => {
        const three = coinLayout(spec, sets[2]);
        expect(new Set(sets[2].map((k) => three.tray[k]!.y)).size).toBe(1);
        const four = coinLayout(spec, sets[3]);
        expect(new Set(sets[3].map((k) => four.tray[k]!.y)).size).toBe(2);
        expect(new Set(sets[3].map((k) => four.tray[k]!.x)).size).toBe(2);
    });

    it('more than 4 kinds is refused', () => {
        const five: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl'];
        expect(() => coinLayout(spec, five)).toThrow();
    });

    it('the wallet capacity matches the reducer cap', () => {
        expect(spec.columns * spec.rows).toBeGreaterThanOrEqual(balance.coinDrag.maxTotal);
    });
});
