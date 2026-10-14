import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { DigitBoxes } from '../../core/round/digitBoxes';
import type { ColumnMarks, ColumnVisual } from '../../core/tasks/written';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

const TEAL = PLACEHOLDER_COLORS.deepTeal;

/** How the result boxes look: `active` marks the box the next digit goes into, `locked` takes no input, `correct` is the settled answer. */
export type ColumnMode = 'active' | 'locked' | 'correct';

/**
 * A written column after the kit's reference/written-addition.svg: operands right-aligned, the sign at the left, a rule, a row of result boxes.
 * Carries are a small digit in a gold circle above the next column; a borrow strikes the lender's digit and writes the smaller one above it, with a
 * small "1" before the digit of the column that borrows. DESIGN-GAP 90 and 91 (docs/design-gaps.md): the kit has no result boxes, no active box and no borrow notation.
 */
export class WrittenColumn {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(v: ColumnVisual, rect: Rect, marks: ColumnMarks, boxes: DigitBoxes, mode: ColumnMode): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        const W = TASK_LAYOUT.written;
        const widthUnits = (v.columns + 1) * W.colW;
        const heightUnits = W.markRow + 2 * W.row + W.ruleGap + W.box.height;
        const s = Math.min(rect.width / widthUnits, rect.height / heightUnits, W.maxScale);
        const left = rect.x + (rect.width - widthUnits * s) / 2;
        const top = rect.y + (rect.height - heightUnits * s) / 2;
        const xOf = (col: number): number => left + (v.columns - col + 0.5) * W.colW * s;
        const markY = top + (W.markRow / 2) * s;
        const rowAY = top + (W.markRow + W.row / 2) * s;
        const rowBY = top + (W.markRow + W.row * 1.5) * s;
        const ruleY = top + (W.markRow + 2 * W.row + W.ruleGap / 2) * s;
        const boxTop = top + (W.markRow + 2 * W.row + W.ruleGap) * s;
        const g = this.graphics;
        g.clear().setVisible(true);

        const struck = new Map<number, number>();   // col -> the digit written above the struck one
        const prefixed = new Set<number>();
        for (const borrow of marks.borrows) {
            prefixed.add(borrow.col);
            borrow.lenders.forEach((l) => struck.set(l.col, l.now));
        }
        const a = String(v.a).padStart(v.columns, '0');
        const b = String(v.b);
        for (let col = 0; col < v.columns; col += 1) {
            this.digit(xOf(col), rowAY, a[v.columns - 1 - col], 'columnDigit', s);
            if (col < b.length) {
                this.digit(xOf(col), rowBY, b[b.length - 1 - col], 'columnDigit', s);
            }
        }
        this.digit(left + 0.5 * W.colW * s, rowBY, v.op, 'columnSign', s);
        for (const [col, now] of struck) {
            g.lineStyle(W.strike * s, TEAL, 1);
            g.lineBetween(xOf(col) - 0.3 * W.colW * s, rowAY + 0.3 * W.row * s, xOf(col) + 0.3 * W.colW * s, rowAY - 0.3 * W.row * s);
            this.digit(xOf(col) + (prefixed.has(col) ? 12 * s : 0), markY + W.lendDrop * s, String(now), 'columnMark', s);
        }
        for (const col of prefixed) {
            this.digit(xOf(col) - 22 * s, markY + W.lendDrop * s, '1', 'columnMark', s);
        }
        for (const { col } of marks.carries) {
            if (col >= v.columns) continue;
            g.fillStyle(PLACEHOLDER_COLORS.butter, 1);
            g.fillCircle(xOf(col), markY, W.carry.radius * s);
            g.lineStyle(W.carry.border * s, PLACEHOLDER_COLORS.starOutline, 1);
            g.strokeCircle(xOf(col), markY, W.carry.radius * s);
            this.digit(xOf(col), markY, '1', 'columnMark', s);
        }
        g.lineStyle(W.rule * s, TEAL, 1);
        g.lineBetween(left + 0.15 * W.colW * s, ruleY, left + (widthUnits - 0.1 * W.colW) * s, ruleY);

        const activeBox = mode === 'active' && boxes.digits.length < boxes.count ? boxes.digits.length : -1;
        for (let col = 0; col < v.columns; col += 1) {
            const w = W.box.width * s;
            const h = W.box.height * s;
            const x = xOf(col) - w / 2;
            const value = boxes.digits[col];
            const isActive = col === activeBox;
            g.fillStyle(mode === 'correct' ? PLACEHOLDER_COLORS.correct : isActive ? PLACEHOLDER_COLORS.butter : value === undefined ? PLACEHOLDER_COLORS.field : PLACEHOLDER_COLORS.tile, 1);
            g.fillRoundedRect(x, boxTop, w, h, W.box.radius * s);
            g.lineStyle((isActive ? W.box.activeBorder : W.box.border) * s, isActive ? TEAL : PLACEHOLDER_COLORS.tileBorder, 1);
            g.strokeRoundedRect(x, boxTop, w, h, W.box.radius * s);
            if (value !== undefined) {
                this.digit(xOf(col), boxTop + h / 2, String(value), 'columnDigit', s);
            }
        }
    }

    private digit(x: number, y: number, text: string, role: 'columnDigit' | 'columnSign' | 'columnMark', s: number): void {
        this.texts.push(this.scene.add.text(x, y, text, textStyle(role)).setOrigin(0.5).setScale(s));
    }

    setVisible(visible: boolean): void {
        this.graphics.setVisible(visible);
        this.texts.forEach((t) => t.setVisible(visible));
        if (!visible) {
            this.graphics.clear();
        }
    }

    /** True while the column is on screen (the e2e hook reads it, not the rectangle). */
    shown(): boolean {
        return this.graphics.visible;
    }

    bounds(): Rect {
        return this.area;
    }
}
