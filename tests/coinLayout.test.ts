// Geometry of the coin tray and wallet (S-14d phase 6). Oracle: MIN_TOUCH_TARGET 96, at most 4 kinds on a tray
// (3 in one row, 4 in a 2 x 2 grid), and the wallet holds balance.coinDrag.maxTotal (6) coins, each on a drop centre of the pack wallet art.
import { describe, expect, it } from 'vitest';
import { coinGeometry, coinLayout, interiorPoint, liftedSlot, walletFull, type Rect } from '../src/core/round/dragLayout';
import { emptyWallet } from '../src/core/coins';
import type { Carrying } from '../src/core/trayDrag';
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

    it('the wallet has one drop centre per coin the reducer takes', () => {
        expect(spec.art.dropCenters.length).toBe(balance.coinDrag.maxTotal);
    });

    it('the wallet rect keeps the art proportions (width and height scale agree within 1 %)', () => {
        const sx = spec.wallet.width / spec.art.width;
        const sy = spec.wallet.height / spec.art.height;
        expect(Math.abs(sx - sy) / sx).toBeLessThan(0.01);
    });

    it('placed coins keep a gap of coinGap between neighbours, so two coins never touch', () => {
        const layout = coinLayout(spec, sets[2]);
        expect(spec.coinGap).toBeGreaterThan(0);
        const coins = spec.art.dropCenters.map((_, i) => layout.coin(i));
        for (let i = 0; i < coins.length; i += 1) {
            for (let j = i + 1; j < coins.length; j += 1) {
                const gapX = Math.max(coins[j].x - (coins[i].x + coins[i].width), coins[i].x - (coins[j].x + coins[j].width));
                const gapY = Math.max(coins[j].y - (coins[i].y + coins[i].height), coins[i].y - (coins[j].y + coins[j].height));
                expect(Math.max(gapX, gapY), `${i} and ${j}`).toBeGreaterThanOrEqual(spec.coinGap - 0.01);
            }
        }
    });

    it('coin i is centred on its scaled drop centre (+-1 px), and a seventh coin has no place', () => {
        const layout = coinLayout(spec, sets[2]);
        const s = spec.wallet.width / spec.art.width;
        spec.art.dropCenters.forEach(([cx, cy], i) => {
            const c = layout.coin(i);
            expect(Math.abs(c.x + c.width / 2 - (spec.wallet.x + cx * s))).toBeLessThanOrEqual(1);
            expect(Math.abs(c.y + c.height / 2 - (spec.wallet.y + cy * s))).toBeLessThanOrEqual(1);
        });
        expect(() => layout.coin(spec.art.dropCenters.length)).toThrow();
    });
});

describe('coinGeometry', () => {
    const kinds: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl'];
    const layout = coinLayout(spec, kinds);
    const geo = coinGeometry(layout, kinds);
    const mat = { 'coin-1zl': 1, 'coin-2zl': 0, 'coin-5zl': 2 } as Record<MoneyId, number>;
    it('finds a tray tile by its interior and the wallet by its rectangle', () => {
        const p = interiorPoint(layout.tray['coin-2zl']!);
        expect(geo.trayAt(p.x, p.y)).toBe('coin-2zl');
        const w = interiorPoint(layout.wallet);
        expect(geo.onMat(w.x, w.y)).toBe(true);
        expect(geo.onMat(p.x, p.y)).toBe(false);
    });
    it('finds a placed coin in the cell of its place in the largest-first list, and nothing in an empty cell', () => {
        const cell = (i: number) => interiorPoint(layout.coin(i));
        expect(geo.matAt(cell(0).x, cell(0).y, mat)).toBe('coin-5zl');
        expect(geo.matAt(cell(1).x, cell(1).y, mat)).toBe('coin-5zl');
        expect(geo.matAt(cell(2).x, cell(2).y, mat)).toBe('coin-1zl');
        expect(geo.matAt(cell(3).x, cell(3).y, mat)).toBeNull();
    });
});

describe('liftedSlot', () => {
    const kinds: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl'];
    const layout = coinLayout(spec, kinds);
    const list: MoneyId[] = ['coin-2zl', 'coin-2zl', 'coin-1zl'];
    const carrying = (kind: MoneyId, cell: number | null): Carrying<MoneyId> => {
        const p = interiorPoint(layout.coin(cell ?? 0));
        return { pointerId: 1, kind, from: cell === null ? 'tray' : 'mat', x: p.x, y: p.y, startX: p.x, startY: p.y, moved: true };
    };
    it('is the touched cell: the FIRST of two equal coins when that one was grabbed (lastIndexOf would say 1)', () => {
        expect(liftedSlot(layout, list, carrying('coin-2zl', 0))).toBe(0);
        expect(liftedSlot(layout, list, carrying('coin-2zl', 1))).toBe(1);
        expect(liftedSlot(layout, list, carrying('coin-1zl', 2))).toBe(2);
    });
    it('falls back to the last coin of the kind when the start point is in a cell of another kind', () => {
        const wrong = { ...carrying('coin-2zl', 2) };
        expect(liftedSlot(layout, list, wrong)).toBe(1);
    });
    it('is -1 for nothing carried or a coin carried from the tray', () => {
        expect(liftedSlot(layout, list, null)).toBe(-1);
        expect(liftedSlot(layout, list, carrying('coin-1zl', null))).toBe(-1);
    });
});

describe('walletFull', () => {
    const wallet = (n: number) => ({ ...emptyWallet(), 'coin-1zl': n });
    it('is true from the cap on, false below it', () => {
        expect(walletFull(wallet(balance.coinDrag.maxTotal - 1), balance.coinDrag.maxTotal)).toBe(false);
        expect(walletFull(wallet(balance.coinDrag.maxTotal), balance.coinDrag.maxTotal)).toBe(true);
    });
});
