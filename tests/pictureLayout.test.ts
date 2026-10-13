import { describe, expect, it } from 'vitest';
import { belowPrompt, clockHandAngles, fitSize, pictureLayout, type PictureRect } from '../src/core/round/pictureLayout';
import { TASK_LAYOUT } from '../src/data/layout';

const spec = TASK_LAYOUT.picture;
const apart = (a: PictureRect, b: PictureRect): boolean =>
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
const inside = (r: PictureRect, outer: PictureRect): boolean =>
    r.x >= outer.x && r.y >= outer.y && r.x + r.width <= outer.x + outer.width && r.y + r.height <= outer.y + outer.height;
const { notebook, tiles, keypad, bar } = TASK_LAYOUT;
const page: PictureRect = { x: notebook.left, y: notebook.top, width: notebook.width, height: notebook.height };
const tileRowRect = (n: number): PictureRect => {
    const total = n * tiles.width + (n - 1) * tiles.gap;
    return { x: notebook.left + (notebook.width - total) / 2, y: tiles.top, width: total, height: tiles.height };
};
const keypadRect: PictureRect = { x: keypad.left, y: keypad.top, width: 3 * keypad.keyWidth + 2 * keypad.gap, height: 600 };

describe('pictureLayout', () => {
    for (const input of ['tiles', 'keypad'] as const) {
        for (const solution of [false, true]) {
            it(`keeps the ${input} picture ${solution ? 'with' : 'without'} solution inside the notebook and off the answers`, () => {
                const { picture, lines } = pictureLayout(spec, input, solution);
                expect(inside(picture, page)).toBe(true);
                if (input === 'tiles') {
                    expect(apart(picture, tileRowRect(4))).toBe(true);
                    if (lines) expect(apart(lines, tileRowRect(4))).toBe(true);
                } else {
                    expect(apart(picture, keypadRect)).toBe(true);
                    if (lines) expect(apart(lines, keypadRect)).toBe(true);
                }
                const barTop = bar.bottom - bar.height;
                expect(picture.y + picture.height).toBeLessThanOrEqual(barTop);
                if (lines) expect(lines.y + lines.height).toBeLessThanOrEqual(barTop);
            });
        }
    }

    it('shows the solution lines next to the picture, not over it', () => {
        for (const input of ['tiles', 'keypad'] as const) {
            expect(pictureLayout(spec, input, false).lines).toBeNull();
            const { picture, lines } = pictureLayout(spec, input, true);
            expect(lines).not.toBeNull();
            expect(apart(picture, lines as PictureRect)).toBe(true);
        }
    });

    it('starts the picture under a prompt that moved up to promptY', () => {
        expect(spec.promptY).toBeGreaterThanOrEqual(notebook.top + notebook.border);
        expect(spec.tiles.y).toBeGreaterThan(spec.promptY + 2 * 77);
        expect(spec.keypad.y).toBeGreaterThan(spec.promptY + 3 * 77);
    });
});

describe('clockHandAngles', () => {
    it('puts the hands of full hours and half hours where a dial has them', () => {
        expect(clockHandAngles(3, 0)).toEqual({ hour: 90, minute: 0 });
        expect(clockHandAngles(12, 0)).toEqual({ hour: 0, minute: 0 });
        expect(clockHandAngles(7, 30)).toEqual({ hour: 225, minute: 180 });
    });

    it('draws a 24-hour time on the 12-hour dial and moves the hour hand with the minutes', () => {
        expect(clockHandAngles(15, 0).hour).toBe(clockHandAngles(3, 0).hour);
        expect(clockHandAngles(7, 45).hour).toBeGreaterThan(clockHandAngles(7, 30).hour);
        expect(clockHandAngles(7, 45).hour).toBeLessThan(clockHandAngles(8, 0).hour);
    });
});

describe('belowPrompt (visual gate S-13: a five-line chart prompt beside the keypad ran over the chart)', () => {
    it('keeps the rectangle when the prompt ends above it', () => {
        expect(belowPrompt(spec.keypad, spec.keypad.y - 40, 16)).toEqual(spec.keypad);
    });

    it('moves the top under a long prompt and keeps the bottom', () => {
        const r = belowPrompt(spec.keypad, 600, 16);
        expect(r.y).toBe(616);
        expect(r.y + r.height).toBe(spec.keypad.y + spec.keypad.height);
        expect(r.x).toBe(spec.keypad.x);
        expect(r.width).toBe(spec.keypad.width);
    });

    it('never gives a negative height', () => {
        expect(belowPrompt(spec.keypad, 5000, 16).height).toBe(0);
    });
});

describe('fitSize', () => {
    it('takes the largest size that fits, stepping down from the maximum', () => {
        expect(fitSize(64, 44, 4, (s) => s <= 50)).toBe(48);
        expect(fitSize(64, 44, 4, () => true)).toBe(64);
    });

    it('stops at the minimum when nothing fits', () => {
        expect(fitSize(64, 44, 4, () => false)).toBe(44);
    });
});
