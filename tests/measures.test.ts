// The art kit's ids and values (S-14). The expected tables are copied from the kit's manifest.json, not derived from the data.
import { describe, expect, it } from 'vitest';
import { ICONS, JUG_VISIBLE_RECT, JUGS, MONEY, PLATE_ICONS, SCALE_ITEMS, THERMOMETER, WEIGHTS } from '../src/data/measures';
import { nouns } from '../src/data/nouns';

describe('measures data', () => {
    it('money values in grosze match the manifest', () => {
        expect(Object.fromEntries(MONEY.map((m) => [m.id, m.grosze]))).toEqual({
            'coin-01gr': 1, 'coin-02gr': 2, 'coin-05gr': 5, 'coin-10gr': 10, 'coin-20gr': 20, 'coin-50gr': 50,
            'coin-1zl': 100, 'coin-2zl': 200, 'coin-5zl': 500,
            'note-10zl': 1000, 'note-20zl': 2000, 'note-50zl': 5000, 'note-100zl': 10000, 'note-200zl': 20000, 'note-500zl': 50000,
        });
    });

    it('weights in grams and jugs in millilitres match the manifest', () => {
        expect(Object.fromEntries(WEIGHTS.map((w) => [w.id, w.grams]))).toEqual({
            'weight-1kg': 1000, 'weight-2kg': 2000, 'weight-5kg': 5000, 'weight-10dag': 100, 'weight-20dag': 200, 'weight-50dag': 500,
        });
        expect(Object.fromEntries(JUGS.map((j) => [j.id, j.ml]))).toEqual({ 'container-1l': 1000, 'container-half-l': 500, 'container-quarter-l': 250 });
        expect(JUG_VISIBLE_RECT).toEqual({ x: 32, y: 78, width: 448, height: 356 });
    });

    it('has the 15 icons of the kits, each with a dictionary noun (the dictionary wins over the kit label)', () => {
        expect(ICONS.map((i) => i.id).sort()).toEqual(
            ['apple', 'book', 'croissant', 'cup', 'cushion', 'flower', 'key', 'lamp', 'pear', 'pencil', 'teapot', 'yarn', 'plate', 'box', 'sticker'].sort(),
        );
        expect(ICONS).toHaveLength(15);
        for (const icon of ICONS) {
            expect(nouns[icon.noun], icon.id).toBeDefined();
        }
        expect(ICONS.find((i) => i.id === 'pencil')?.noun).toBe('kredka');
        expect(ICONS.filter((i) => ['plate', 'box', 'sticker'].includes(i.id)).map((i) => i.noun)).toEqual(['talerz', 'pudełko', 'naklejka']);
        for (const id of ['plate', 'box', 'sticker']) {
            expect(PLATE_ICONS as readonly string[], id).not.toContain(id);
            expect(SCALE_ITEMS.map((item) => item.icon) as string[], id).not.toContain(id);
        }
    });

    it('every scale item mass can be built from at most 6 weights (subset-sum over the kit weights, repeats allowed)', () => {
        const build = (grams: number, left: number): boolean =>
            grams === 0 || (left > 0 && WEIGHTS.some((w) => w.grams <= grams && build(grams - w.grams, left - 1)));
        expect(SCALE_ITEMS.length).toBeGreaterThanOrEqual(6);
        for (const item of SCALE_ITEMS) {
            expect(ICONS.some((i) => i.id === item.icon), item.icon).toBe(true);
            for (const grams of item.grams) {
                expect(build(grams, 6), `${item.icon} ${grams} g`).toBe(true);
            }
        }
    });

    it('the thermometer scale maps -30 to y 1260 and +30 to y 300 (reference/thermometer-face.js)', () => {
        const y = (c: number): number => THERMOMETER.yForMinus30 - (c - THERMOMETER.min) * THERMOMETER.pixelsPerDegree;
        expect(THERMOMETER.min).toBe(-30);
        expect(THERMOMETER.max).toBe(30);
        expect(y(-30)).toBe(1260);
        expect(y(30)).toBe(300);
        expect(THERMOMETER.frame).toEqual({ width: 512, height: 1536 });
    });
});
