import { describe, expect, it } from 'vitest';
import { answerSpans, belowPrompt, clockHandAngles, clockSetLayout, fitSize, pictureLayout, type PictureRect } from '../src/core/round/pictureLayout';
import { FONT_SIZES, TASK_LAYOUT } from '../src/data/layout';
import { visualShape } from '../src/core/tasks/visual';

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
                const { picture, lines } = pictureLayout(spec, input, solution, 'wide');
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
            expect(pictureLayout(spec, input, false, 'wide').lines).toBeNull();
            const { picture, lines } = pictureLayout(spec, input, true, 'wide');
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

describe('pictureLayout of a tall drawing (S-14, visual gate F3)', () => {
    const barTop = bar.bottom - bar.height;
    const tilesRight = (n: number): PictureRect => {
        const area = answerSpans(spec, 'tiles', 'tall').tiles!;
        const total = n * tiles.width + (n - 1) * tiles.gap;
        return { x: area.x + (area.width - total) / 2, y: tiles.top, width: total, height: tiles.height };
    };

    for (const input of ['tiles', 'keypad'] as const) {
        it(`keeps a tall drawing in one ${input} column in every phase: same rectangle, lines only in the solution`, () => {
            const first = pictureLayout(spec, input, false, 'tall');
            const solved = pictureLayout(spec, input, true, 'tall');
            expect(first.lines).toBeNull();
            expect(solved.picture).toEqual(first.picture);
            expect(solved.lines).not.toBeNull();
            expect(apart(first.picture, solved.lines!)).toBe(true);
            expect(inside(first.picture, page)).toBe(true);
            expect(inside(solved.lines!, page)).toBe(true);
            expect(first.picture.height).toBeGreaterThan(2 * first.picture.width);
            expect(first.picture.y + first.picture.height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        });
    }

    it('gives the thermometer at least 1.4 times the height of the wide picture, so a degree is readable (F3)', () => {
        expect(pictureLayout(spec, 'tiles', false, 'tall').picture.height).toBeGreaterThanOrEqual(1.4 * spec.keypad.height);
        expect(pictureLayout(spec, 'keypad', false, 'tall').picture.height).toBeGreaterThanOrEqual(1.4 * spec.keypad.height);
    });

    it('moves the tiles, the bar and the lines right of the tiles column, clear of each other', () => {
        const { picture, lines } = pictureLayout(spec, 'tiles', true, 'tall');
        const spans = answerSpans(spec, 'tiles', 'tall');
        for (const n of [3, 4]) {
            expect(apart(picture, tilesRight(n))).toBe(true);
            expect(inside(tilesRight(n), page)).toBe(true);
            expect(apart(lines!, tilesRight(n))).toBe(true);
        }
        expect(spans.bar!.x).toBeGreaterThanOrEqual(picture.x + picture.width);
        expect(spans.bar!.x + spans.bar!.width).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(lines!.y + lines!.height).toBeLessThanOrEqual(tiles.top);
    });

    it('keeps the keypad column, the lines and the bar left of the keypad, the bar right of the column', () => {
        const { picture, lines } = pictureLayout(spec, 'keypad', true, 'tall');
        const spans = answerSpans(spec, 'keypad', 'tall');
        expect(spans.tiles).toBeNull();
        expect(apart(picture, keypadRect)).toBe(true);
        expect(apart(lines!, keypadRect)).toBe(true);
        expect(lines!.width).toBeGreaterThanOrEqual(480);
        expect(lines!.y + lines!.height).toBeLessThanOrEqual(barTop);
        expect(spans.bar!.x).toBeGreaterThanOrEqual(picture.x + picture.width);
        expect(spans.bar!.x + spans.bar!.width).toBeLessThanOrEqual(keypad.left);
    });

    it('leaves the answers and the bar of a wide drawing where they were', () => {
        for (const input of ['tiles', 'keypad', 'select', 'drag'] as const) {
            expect(answerSpans(spec, input, 'wide')).toEqual({ tiles: null, bar: null });
        }
        expect(pictureLayout(spec, 'keypad', true, 'wide').picture).toEqual(spec.keypadSolution.picture);
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
        expect(belowPrompt(spec.keypad, spec.keypad.y - 40, 16, spec.minHeight)).toEqual(spec.keypad);
    });

    it('moves the top under a long prompt and keeps the bottom', () => {
        const r = belowPrompt(spec.keypad, 600, 16, spec.minHeight);
        expect(r.y).toBe(616);
        expect(r.y + r.height).toBe(spec.keypad.y + spec.keypad.height);
        expect(r.x).toBe(spec.keypad.x);
        expect(r.width).toBe(spec.keypad.width);
    });

    it('never gives a drawing less than the minimum height, however long the prompt (audit S13-08)', () => {
        expect(belowPrompt(spec.keypad, 5000, 16, spec.minHeight).height).toBe(spec.minHeight);
        expect(belowPrompt(spec.keypad, 5000, 16, spec.minHeight).y + spec.minHeight).toBe(spec.keypad.y + spec.keypad.height);
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

describe('pictured select and drag tasks (S-13b, follow-up S-13)', () => {
    const selectTop = TASK_LAYOUT.select.top;
    for (const solution of [false, true]) {
        it(`keeps a ${solution ? 'solved ' : ''}select drawing above the select tiles and inside the notebook`, () => {
            const { picture, lines } = pictureLayout(spec, 'select', solution, 'wide');
            expect(picture.y + picture.height).toBeLessThanOrEqual(selectTop);
            expect(inside(picture, page)).toBe(true);
            expect(picture.height).toBeGreaterThan(0);
            if (solution) {
                expect(lines).not.toBeNull();
                expect(lines!.y + lines!.height).toBeLessThanOrEqual(selectTop);
                expect(apart(picture, lines!)).toBe(true);
            } else {
                expect(lines).toBeNull();
            }
        });
    }

    it('puts the drawing of a drag task on the mat and its solution lines where the tray was', () => {
        const first = pictureLayout(spec, 'drag', false, 'wide');
        const solved = pictureLayout(spec, 'drag', true, 'wide');
        expect(first.picture).toEqual(TASK_LAYOUT.drag.mat);
        expect(first.lines).toBeNull();
        expect(solved.picture).toEqual(TASK_LAYOUT.drag.mat);
        expect(solved.lines).toEqual(TASK_LAYOUT.drag.solutionLines);
    });
});

describe('clockSetLayout', () => {
    const layout = clockSetLayout(TASK_LAYOUT.drag, TASK_LAYOUT.clockSet.dial);
    const { dial } = TASK_LAYOUT.clockSet;
    const mat = TASK_LAYOUT.drag.mat;

    it('centres the dial on the mat and keeps the whole face inside it', () => {
        const radius = dial.outer * layout.scale;
        expect(layout.centre.x).toBe(mat.x + mat.width / 2);
        expect(layout.centre.y).toBe(mat.y + mat.height / 2);
        expect(layout.centre.x - radius).toBeGreaterThanOrEqual(mat.x);
        expect(layout.centre.x + radius).toBeLessThanOrEqual(mat.x + mat.width);
        expect(layout.centre.y - radius).toBeGreaterThanOrEqual(mat.y);
        expect(layout.centre.y + radius).toBeLessThanOrEqual(mat.y + mat.height);
    });

    it('scales the hands with the dial', () => {
        expect(layout.hourLength).toBeCloseTo(dial.hourLength * layout.scale, 6);
        expect(layout.minuteLength).toBeCloseTo(dial.minuteLength * layout.scale, 6);
    });

    it('leaves five minutes at least 80 scene pixels of arc at the tip of the minute hand (a finger can tell them apart)', () => {
        expect((2 * Math.PI * layout.minuteLength) / 12).toBeGreaterThanOrEqual(80);
    });

    it('keeps "OK" and the solution lines (which replace it) off the dial', () => {
        const face: PictureRect = { x: layout.centre.x - dial.outer * layout.scale, y: layout.centre.y - dial.outer * layout.scale, width: 2 * dial.outer * layout.scale, height: 2 * dial.outer * layout.scale };
        expect(layout.ok).toEqual(TASK_LAYOUT.drag.ok);
        expect(layout.lines).toEqual(TASK_LAYOUT.drag.solutionLines);
        expect(apart(face, layout.ok)).toBe(true);
        expect(apart(face, layout.lines)).toBe(true);
    });
});

describe('a long drawing: the number line of a tiles task (visual gate S-14b: 0..30 jumps drew labels about 9 CSS px tall on a 1024 px tablet)', () => {
    const L = TASK_LAYOUT.numberLine;
    const TABLET = 1024 / 1920;
    // The NumberLine widget's own fit: 31 ticks a dense gap apart, arcs above, labels and the box under the axis.
    const labelPx = (rect: PictureRect): number => {
        const widthUnits = 2 * L.pad + 30 * L.denseGap;
        const heightUnits = L.arcZone + L.tick / 2 + L.labelDrop + L.box.height;
        return Math.min(rect.width / widthUnits, rect.height / heightUnits, L.maxScale) * FONT_SIZES.lineLabel * TABLET;
    };
    const line = { kind: 'numberLine', from: 0, to: 30, tick: 1, labels: [0, 5], box: null, jumps: [] } as const;

    it('a number line is long, a chart stays wide and a thermometer tall', () => {
        expect(visualShape(line)).toBe('long');
        expect(visualShape({ kind: 'thermometer', celsius: 5 })).toBe('tall');
    });

    it('keeps the labels of a 0..30 line at least 12 CSS px on the tablet, before and during the solution', () => {
        expect(labelPx(pictureLayout(spec, 'tiles', false, 'long').picture)).toBeGreaterThanOrEqual(12);
        expect(labelPx(pictureLayout(spec, 'tiles', true, 'long').picture)).toBeGreaterThanOrEqual(12);
    });

    it('stays inside the page, above the tiles row, with the solution lines under the line', () => {
        for (const solution of [false, true]) {
            const { picture, lines } = pictureLayout(spec, 'tiles', solution, 'long');
            expect(inside(picture, page)).toBe(true);
            expect(apart(picture, tileRowRect(3))).toBe(true);
            if (lines) {
                expect(apart(picture, lines)).toBe(true);
                expect(apart(lines, tileRowRect(3))).toBe(true);
                expect(inside(lines, page)).toBe(true);
            }
        }
    });

    it('a long drawing beside the keypad keeps the wide rectangles', () => {
        expect(pictureLayout(spec, 'keypad', false, 'long')).toEqual(pictureLayout(spec, 'keypad', false, 'wide'));
        expect(pictureLayout(spec, 'keypad', true, 'long')).toEqual(pictureLayout(spec, 'keypad', true, 'wide'));
    });
});
