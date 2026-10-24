import { describe, expect, it } from 'vitest';
import type { Rect } from '../src/core/geometry';
import { guideRect } from '../src/core/guideLayout';
import { notebookGeometry } from '../src/core/notebookGeometry';
import { letterRow } from '../src/core/minigames/word';
import { answerSpans, clockSetLayout, hintPictureLayout, pictureLayout } from '../src/core/round/pictureLayout';
import { coinLayout, dragLayout } from '../src/core/round/dragLayout';
import { keypadGrid } from '../src/ui/widgets/geometry';
import { TALL_MODES, type AnswerMode, type VisualShape } from '../src/core/tasks/visual';
import { ANSWER_MODES } from '../src/core/types';
import type { MoneyId } from '../src/data/measures';
import { MINIGAME_WORDS } from '../src/data/minigames';
import { ANIMATION, BEADS, FONT_SIZES, GUIDE, HUD_LAYOUT, MINIGAME_LAYOUT, SUMMARY_LAYOUT, TASK_LAYOUT, UNLOCK_LAYOUT } from '../src/data/layout';

const GAP = 12;
const SCENE = { width: 1920, height: 1080 };
const fox = guideRect();

const apart = (a: Rect, b: Rect, gap: number): boolean =>
    a.x + a.width + gap <= b.x || b.x + b.width + gap <= a.x || a.y + a.height + gap <= b.y || b.y + b.height + gap <= a.y;
const box = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height });
const hud = (r: { left: number; top: number; width: number; height: number }): Rect => box(r.left, r.top, r.width, r.height);

/** Shapes a drawing may have in an answer mode (a tall drawing only where `tallOf` has a column). */
const shapesFor = (mode: AnswerMode): VisualShape[] => {
    switch (mode) {
        case 'tiles': case 'keypad': return ['wide', 'long', ...(TALL_MODES.includes(mode) ? (['tall'] as const) : [])];
        case 'drag': case 'select': case 'digits': return ['wide', 'long'];
        default: { const _exhaustive: never = mode; return _exhaustive; }
    }
};

describe('guide rect', () => {
    it('is the silhouette scaled about the anchor', () => {
        expect(fox.x).toBeCloseTo(1714.5, 0);
        expect(fox.x + fox.width).toBeCloseTo(1902.6, 0);
        expect(fox.y).toBeCloseTo(180, 0);
        expect(fox.y + fox.height).toBeCloseTo(400, 0);
        expect(fox.height).toBeGreaterThanOrEqual(180);
        expect(fox.height).toBeLessThanOrEqual(240);
    });

    it('stands in the notebook corner and inside the scene with room to the right edge', () => {
        const nb = TASK_LAYOUT.notebook;
        expect(nb.left + nb.width).toBeGreaterThan(fox.x);
        expect(nb.left + nb.width).toBeLessThan(fox.x + fox.width);
        expect(Math.abs(fox.y - nb.top)).toBeLessThanOrEqual(40);
        expect(fox.y).toBeGreaterThanOrEqual(0);
        expect(fox.x + fox.width).toBeLessThanOrEqual(SCENE.width - GAP);
        expect(fox.y + fox.height).toBeLessThanOrEqual(SCENE.height);
    });

    it('keeps its distance when popped by the pose change', () => {
        const s = ANIMATION.guidePopScale;
        const cx = GUIDE.anchor.x;
        const cy = GUIDE.anchor.y;
        const popped = box(cx + (fox.x - cx) * s, cy + (fox.y - cy) * s, fox.width * s, fox.height * s);
        expect(popped.x + popped.width).toBeLessThanOrEqual(SCENE.width - 8);
        const tallLines = TASK_LAYOUT.picture.tall.tiles.lines;
        expect(popped.x).toBeGreaterThanOrEqual(tallLines.x + tallLines.width + 8);
        const sc = TASK_LAYOUT.starCounter;
        const grownBottom = sc.top + sc.height / 2 + (sc.height / 2) * ANIMATION.counterPopScale;
        expect(popped.y).toBeGreaterThanOrEqual(grownBottom + 8);
    });
});

describe('guide rect never covers the task', () => {
    const P = TASK_LAYOUT.picture;
    const cases: [string, Rect][] = [];
    const add = (name: string, r: Rect): void => { cases.push([name, r]); };

    for (const mode of ANSWER_MODES) {
        for (const shape of shapesFor(mode)) {
            for (const solution of [false, true]) {
                const l = pictureLayout(P, mode, solution, shape);
                add(`picture ${mode}/${shape}/${solution ? 'solution' : 'plain'}`, l.picture);
                if (l.lines) add(`lines ${mode}/${shape}/${solution ? 'solution' : 'plain'}`, l.lines);
            }
            const spans = answerSpans(P, mode, shape);
            if (spans.tiles) add(`tiles row ${mode}/${shape}`, box(spans.tiles.x, TASK_LAYOUT.tiles.top, spans.tiles.width, TASK_LAYOUT.tiles.height));
            if (spans.bar) add(`bar ${mode}/${shape}`, box(spans.bar.x, TASK_LAYOUT.bar.bottom - TASK_LAYOUT.bar.height, spans.bar.width, TASK_LAYOUT.bar.height));
        }
    }
    const hint = hintPictureLayout(P, 'keypad');
    add('hint picture', hint.picture);
    add('hint lines', hint.lines);

    const T = TASK_LAYOUT;
    add('bar under tiles', box(T.barSpan.tiles.x, T.bar.bottom - T.bar.height, T.barSpan.tiles.width, T.bar.height));
    add('bar by keypad', box(T.barSpan.keypad.x, T.bar.bottom - T.bar.height, T.barSpan.keypad.width, T.bar.height));
    add('tall bars', box(P.tall.tiles.bar.x, T.bar.bottom - T.bar.height, P.tall.tiles.bar.width, T.bar.height));
    add('tall keypad bar', box(P.tall.keypad.bar.x, T.bar.bottom - T.bar.height, P.tall.keypad.bar.width, T.bar.height));
    add('tiles row', box(T.tiles.left, T.tiles.top, 4 * T.tiles.width + 3 * T.tiles.gap, T.tiles.height));
    add('prompt', box(T.prompt.x - T.prompt.maxWidth / 2, T.prompt.y - 60, T.prompt.maxWidth, 120));
    add('expressionWide', box(T.expressionWide.x - T.expressionWide.maxWidth / 2, T.expressionWide.y - 80, T.expressionWide.maxWidth, 160));
    add('expression beside', box(T.expression.x - T.expression.maxWidth / 2, T.expression.y - 80, T.expression.maxWidth, 160));

    const grid = keypadGrid(T.keypad);
    const keypadBottom = Math.max(...grid.keys.map((k) => k.rect.y + k.rect.height));
    add('keypad', box(T.keypad.left, T.keypad.top, grid.field.width, keypadBottom - T.keypad.top));

    const dl = dragLayout({ ...T.drag, tray: T.drag.tray }, ['hundred', 'ten', 'one']);
    add('drag mat', dl.mat);
    add('drag ok', dl.ok);
    for (const r of Object.values(dl.tray)) if (r) add('drag tray tile', r);
    add('drag tray', box(T.drag.tray.x, T.drag.tray.y, T.drag.tray.width, T.drag.tray.height));
    const clock = clockSetLayout({ mat: T.drag.mat, ok: T.drag.ok, solutionLines: T.drag.solutionLines }, T.clockSet.dial);
    add('clock ok', clock.ok);
    add('clock lines', clock.lines);
    const cl = coinLayout(T.coinDrag, (['coin-05gr', 'coin-10gr', 'coin-20gr', 'coin-50gr'] as MoneyId[]).slice(0, T.coinDrag.maxKinds));
    add('coin wallet', cl.wallet);
    add('coin ok', cl.ok);
    for (const r of Object.values(cl.tray)) if (r) add('coin tray tile', r);
    for (let i = 0; i < T.coinDrag.art.dropCenters.length; i++) add(`coin place ${i}`, cl.coin(i));
    add('select row', box(T.tiles.left, T.select.top, 6 * T.select.tileWidth + 5 * T.tiles.gap, T.tiles.height));

    const beadsHalf = (5 * BEADS.gap) / 2 + BEADS.radius;
    add('warm-up beads', box(T.dots.centerX - beadsHalf, T.dots.y - BEADS.radius, 2 * beadsHalf, 2 * BEADS.radius));
    add('notebook ribbon', (() => {
        const pts = notebookGeometry().ribbon;
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        return box(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    })());

    add('speaker', hud(HUD_LAYOUT.speaker));
    add('room switch', hud(HUD_LAYOUT.roomSwitch));
    add('settings gear', hud(HUD_LAYOUT.settings));
    add('title', box(HUD_LAYOUT.title.centerX - HUD_LAYOUT.title.maxWidth / 2, HUD_LAYOUT.title.y - 40, HUD_LAYOUT.title.maxWidth, 80));
    const sc = T.starCounter;
    const grow = ANIMATION.counterPopScale;
    add('star counter grown', box(sc.left + sc.width / 2 - (sc.width * grow) / 2, sc.top + sc.height / 2 - (sc.height * grow) / 2, sc.width * grow, sc.height * grow));
    const hb = HUD_LAYOUT.settingsHint;
    const hintHeight = 6 * FONT_SIZES.settingsHint * 1.4 + 2 * hb.padding;
    add('settings hint bubble', box(hb.right - hb.width, hb.bottom - hintHeight, hb.width, hintHeight));

    const L = MINIGAME_LAYOUT.letters;
    const word = MINIGAME_WORDS.reduce((a, b) => (b.length > a.length ? b : a));
    const lefts = letterRow(word.length, { width: L.width, gap: L.gap }, L.centerX);
    add('letter row', box(lefts[0], L.top, lefts[lefts.length - 1] + L.width - lefts[0], L.height));
    const B = MINIGAME_LAYOUT.board;
    add('dice board', box(B.left, B.top, B.columns * B.width + (B.columns - 1) * B.gap, 2 * B.height + B.gap));
    add('minigame card', hud(MINIGAME_LAYOUT.card));
    add('summary stars', box(SUMMARY_LAYOUT.stars.left, SUMMARY_LAYOUT.stars.top, 6 * SUMMARY_LAYOUT.stars.size + 5 * SUMMARY_LAYOUT.stars.gap, SUMMARY_LAYOUT.stars.size));
    add('summary buttons', box(SUMMARY_LAYOUT.buttons.left, SUMMARY_LAYOUT.buttons.top, 2 * SUMMARY_LAYOUT.buttons.width + SUMMARY_LAYOUT.buttons.gap, SUMMARY_LAYOUT.buttons.height));
    add('unlock card', hud(UNLOCK_LAYOUT.card));

    it.each(cases)('%s keeps its distance from the fox', (_name, rect) => {
        expect(apart(fox, rect, GAP), `${_name} ${JSON.stringify(rect)} vs fox ${JSON.stringify(fox)}`).toBe(true);
    });
});
