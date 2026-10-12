import { describe, expect, it } from 'vitest';
import { isExpression } from '../src/core/round/prompt';
import { FONT_SIZES, FONT_WEIGHT_RANGE, FONT_WEIGHTS, MIN_TOUCH_TARGET, PLACEHOLDER_COLORS, TASK_LAYOUT, TASK_TOUCH_TARGETS } from '../src/data/layout';

describe('task screen layout constants', () => {
    it('keeps every touch target at least the minimum size', () => {
        for (const [name, size] of Object.entries(TASK_TOUCH_TARGETS)) {
            expect(size.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(size.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
    });

    it('uses the kit tile height of 136 px, not smaller', () => {
        expect(TASK_LAYOUT.tiles.height).toBeGreaterThanOrEqual(136);
    });

    it('keeps the prompt font at 64 px or more', () => {
        expect(FONT_SIZES.prompt).toBeGreaterThanOrEqual(64);
    });

    it('uses the style guide weights (650-750) for every kit text role, inside the font range', () => {
        const [min, max] = FONT_WEIGHT_RANGE.split(' ').map(Number);
        for (const [role, weight] of Object.entries(FONT_WEIGHTS)) {
            expect(weight, role).toBeGreaterThanOrEqual(min);
            expect(weight, role).toBeLessThanOrEqual(max);
            if (role !== 'caption') {   // the build id is technical, not a kit text
                expect(weight, role).toBeGreaterThanOrEqual(650);
                expect(weight, role).toBeLessThanOrEqual(750);
            }
        }
    });

    it('fits four tiles and the keypad inside the notebook', () => {
        const { tiles, keypad, notebook } = TASK_LAYOUT;
        const tilesRight = tiles.left + 4 * tiles.width + 3 * tiles.gap;
        expect(tilesRight).toBeLessThanOrEqual(notebook.left + notebook.width);
        expect(keypad.left + keypad.width).toBeLessThanOrEqual(notebook.left + notebook.width);
        expect(3 * keypad.keyWidth + 2 * keypad.gap).toBe(keypad.width);
    });

    it('keeps the solution lines (expression centre, bar width) inside the notebook and left of the keypad', () => {
        const { notebook, keypad, barSpan, expression, expressionWide } = TASK_LAYOUT;
        const inner = { left: notebook.left + notebook.border, right: notebook.left + notebook.width - notebook.border };
        for (const [centre, width, right] of [
            [expressionWide.x, barSpan.tiles.width, inner.right],
            [expression.x, barSpan.keypad.width, keypad.left],
        ] as const) {
            expect(centre - width / 2).toBeGreaterThanOrEqual(inner.left);
            expect(centre + width / 2).toBeLessThanOrEqual(right);
        }
    });

    it('draws colours from the palette as valid RGB numbers', () => {
        for (const color of Object.values(PLACEHOLDER_COLORS)) {
            expect(Number.isInteger(color) && color >= 0 && color <= 0xffffff).toBe(true);
        }
    });
});

describe('isExpression', () => {
    it('recognises bare calculations and rejects sentences', () => {
        expect(isExpression('38 + 27')).toBe(true);
        expect(isExpression('17 − 8 = □')).toBe(true);
        expect(isExpression('Ile jest filiżanek?')).toBe(false);
        expect(isExpression('Liczba 3 jest parzysta czy nieparzysta?')).toBe(false);
    });
});
