import { describe, expect, it } from 'vitest';
import type { MoneyId } from '../src/data/measures';
import { TASK_LAYOUT } from '../src/data/layout';
import type { Rect } from '../src/ui/widgets/geometry';
import { iconsLayout, jugsLayout, moneyLayout, scaleLayout, thermometerLayout, thermometerMarks } from '../src/ui/widgets/artLayout';
import { JUG_VISIBLE_RECT, THERMOMETER } from '../src/data/measures';

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

const JUG_SPEC = { ...TASK_LAYOUT.jugs, imageSize: 512, visible: JUG_VISIBLE_RECT };

describe('jugsLayout', () => {
    for (const area of AREAS) {
        for (const count of [1, 2, 5, 6, 10]) {
            it(`keeps ${count} jugs inside ${area.width}x${area.height} and apart`, () => {
                const { jugs, images } = jugsLayout(count, area, JUG_SPEC);
                expect(jugs).toHaveLength(count);
                expect(images).toHaveLength(count);
                for (const jug of jugs) expect(inside(jug, area)).toBe(true);
                for (let i = 0; i < count; i += 1) for (let j = i + 1; j < count; j += 1) expect(overlap(jugs[i], jugs[j])).toBe(false);
            });
        }
    }

    it('puts six jugs in two rows and five in one', () => {
        const ys = (n: number): number => new Set(jugsLayout(n, AREAS[0], JUG_SPEC).jugs.map((r) => Math.round(r.y))).size;
        expect(ys(5)).toBe(1);
        expect(ys(6)).toBe(2);
    });

    it('places the image so its visible rectangle lands on the jug rectangle', () => {
        const { jugs, images } = jugsLayout(3, AREAS[0], JUG_SPEC);
        const s = (images[0]).width / 512;
        expect((images[0]).x + JUG_VISIBLE_RECT.x * s).toBeCloseTo((jugs[0]).x);
        expect((images[0]).y + JUG_VISIBLE_RECT.y * s).toBeCloseTo((jugs[0]).y);
    });
});

describe('thermometerLayout and thermometerMarks', () => {
    const spec = { frameWidth: THERMOMETER.frame.width, frameHeight: THERMOMETER.frame.height };
    it('keeps the 1:3 proportions inside the narrow column and the wide areas', () => {
        for (const area of [...AREAS, { x: 236, y: 470, width: 240, height: 378 }]) {
            const { frame } = thermometerLayout(area, spec);
            expect(inside(frame, area)).toBe(true);
            expect(frame.height / frame.width).toBeCloseTo(3);
        }
    });

    it('marks every degree when they are far enough apart, otherwise every second one and every multiple of five', () => {
        const all = thermometerMarks(-30, 30, 8, 7).map((m) => m.value);
        expect(all).toHaveLength(61);
        const some = thermometerMarks(-30, 30, 4, 7).map((m) => m.value);
        expect(some).toContain(5);
        expect(some).toContain(-5);
        expect(some).toContain(4);
        expect(some).not.toContain(3);
        expect(some).not.toContain(-1);
    });

    it('calls every multiple of ten major and of five medium', () => {
        const marks = thermometerMarks(-30, 30, 8, 7);
        expect(marks.filter((m) => m.kind === 'major').map((m) => m.value)).toEqual([-30, -20, -10, 0, 10, 20, 30]);
        expect(marks.find((m) => m.value === 15)?.kind).toBe('five');
    });
});

describe('iconsLayout', () => {
    const SHAPES: { name: string; groups: number[]; framed: boolean }[] = [
        { name: 'one icon', groups: [1], framed: false },
        { name: 'seven icons', groups: [7], framed: false },
        { name: 'a ten and two', groups: [10, 2], framed: false },
        { name: 'a ten and ten', groups: [10, 10], framed: false },
        { name: 'two framed pairs', groups: [2, 2], framed: true },
        { name: 'three groups of three', groups: [3, 3, 3], framed: true },
        { name: 'five groups of six', groups: [6, 6, 6, 6, 6], framed: true },
    ];
    for (const area of AREAS) {
        for (const shape of SHAPES) {
            it(`${shape.name} stay inside ${area.width}x${area.height} and apart`, () => {
                const layout = iconsLayout(shape.groups, shape.framed, area, TASK_LAYOUT.icons);
                const total = shape.groups.reduce((a, b) => a + b, 0);
                expect(layout.icons).toHaveLength(total);
                expect(layout.frames).toHaveLength(shape.framed ? shape.groups.length : 0);
                layout.icons.forEach((icon, i) => {
                    expect(inside(icon, area)).toBe(true);
                    layout.icons.slice(i + 1).forEach((other) => expect(overlap(icon, other)).toBe(false));
                });
                layout.frames.forEach((frame, i) => {
                    expect(inside(frame, area)).toBe(true);
                    layout.frames.slice(i + 1).forEach((other) => expect(overlap(frame, other)).toBe(false));
                });
            });
        }
    }

    it('keeps every icon in the frame of its group', () => {
        const layout = iconsLayout([4, 4, 4], true, AREAS[0], TASK_LAYOUT.icons);
        layout.icons.forEach((icon, i) => expect(inside(icon, layout.frames[Math.floor(i / 4)])).toBe(true));
    });

    it('draws one to seven icons at 96 px or more where the area is 294 px tall', () => {
        for (const area of AREAS.filter((a) => a.height >= 294)) {
            for (const n of [1, 5, 7]) {
                expect(iconsLayout([n], false, area, TASK_LAYOUT.icons).icon).toBeGreaterThanOrEqual(96);
            }
        }
    });

    it('puts a ten in one row and the rest under it, left-aligned', () => {
        const { icons } = iconsLayout([10, 3], false, AREAS[0], TASK_LAYOUT.icons);
        expect(new Set(icons.slice(0, 10).map((r) => r.y)).size).toBe(1);
        expect(icons[10]?.y).toBeGreaterThan((icons[0]?.y ?? 0) + (icons[0]?.height ?? 0));
        expect(icons[10]?.x).toBeCloseTo(icons[0]?.x ?? 0);
    });

    it('never draws an icon above the cap', () => {
        expect(iconsLayout([1], false, AREAS[0], TASK_LAYOUT.icons).icon).toBeLessThanOrEqual(TASK_LAYOUT.icons.maxIcon);
    });
});
