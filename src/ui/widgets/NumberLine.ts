import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { TaskVisual } from '../../core/tasks/visual';
import { dashedRect } from './dashed';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';
import { labelRows } from '../../core/round/lineLabels';

type Line = Extract<TaskVisual, { kind: 'numberLine' }>;

const TEAL = PLACEHOLDER_COLORS.deepTeal;

/** A number line after the kit's reference/number-line.svg: axis with an arrowhead, ticks, labels, arcs for the jumps, gold start dots and a dashed box on a tick. DESIGN-GAP 88 (docs/design-gaps.md): 0..100, a box and longer jumps are not in the kit. */
export class NumberLine {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(line: Pick<Line, 'from' | 'to' | 'tick' | 'labels' | 'box' | 'jumps'>, rect: Rect): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        const L = TASK_LAYOUT.numberLine;
        const ticks = Math.floor((line.to - line.from) / line.tick) + 1;
        const gap = ticks >= L.denseFrom ? L.denseGap : L.gap;
        const hasJumps = line.jumps.length > 0;
        const above = hasJumps ? L.arcZone : L.tick;
        const widthUnits = 2 * L.pad + (ticks - 1) * gap;
        const heightUnits = above + L.tick / 2 + L.labelDrop + L.box.height;
        const s = Math.min(rect.width / widthUnits, rect.height / heightUnits, L.maxScale);
        const left = rect.x + (rect.width - widthUnits * s) / 2;
        const top = rect.y + (rect.height - heightUnits * s) / 2;
        const axisY = top + above * s;
        const xOf = (n: number): number => left + (L.pad + ((n - line.from) / line.tick) * gap) * s;
        const g = this.graphics;
        g.clear().setVisible(true);
        g.lineStyle(L.axis * s, TEAL, 1);
        const endX = left + (widthUnits - L.pad / 2) * s;
        g.lineBetween(left + (L.pad / 2) * s, axisY, endX, axisY);
        g.lineBetween(endX, axisY, endX - L.head * s, axisY - 11 * s);
        g.lineBetween(endX, axisY, endX - L.head * s, axisY + 11 * s);
        for (let n = line.from; n <= line.to; n += line.tick) {
            g.lineStyle((n === line.box ? L.axis : 2) * s, TEAL, 1);
            g.lineBetween(xOf(n), axisY - (L.tick / 2) * s, xOf(n), axisY + (L.tick / 2) * s);
        }
        const labelY = axisY + (L.tick / 2 + L.labelDrop / 2 + 4) * s;
        const shown = line.labels.filter((n) => n !== line.box);
        const rows = labelRows(shown, line.tick, ticks >= L.denseFrom);
        shown.forEach((n, i) => {
            this.texts.push(this.scene.add.text(xOf(n), labelY + rows[i] * L.labelStagger * s, String(n), textStyle('lineLabel')).setOrigin(0.5).setScale(s));
        });
        if (line.box !== null) {
            const w = (ticks >= L.denseFrom ? L.box.denseWidth : L.box.width) * s;
            const h = L.box.height * s;
            g.lineStyle(L.border * s * 0.6, TEAL, 1);
            g.fillStyle(PLACEHOLDER_COLORS.butter, 1);
            g.fillRect(xOf(line.box) - w / 2, labelY - h / 2, w, h);
            dashedRect(g, xOf(line.box) - w / 2, labelY - h / 2, w, h, L.box.dash * s);
        }
        this.drawJumps(line.jumps, xOf, axisY, s);
    }

    private drawJumps(jumps: Line['jumps'], xOf: (n: number) => number, axisY: number, s: number): void {
        const L = TASK_LAYOUT.numberLine;
        const g = this.graphics;
        const ends = new Set(jumps.map((j) => j.to));
        for (const j of jumps) {
            const x1 = xOf(j.from);
            const x2 = xOf(j.to);
            const span = Math.abs(x2 - x1);
            const rise = Math.min(L.arcMax * s, span * 0.5 + L.arcLift * s);
            const baseY = axisY - L.arcLift * s;
            const cx = (x1 + x2) / 2;
            const cy = baseY - rise * 2;
            g.lineStyle(L.arc * s, PLACEHOLDER_COLORS.turquoise, 1);
            let px = x1;
            let py = baseY;
            for (let i = 1; i <= 20; i += 1) {
                const t = i / 20;
                const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
                const y = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * cy + t * t * baseY;
                g.lineBetween(px, py, x, y);
                px = x;
                py = y;
            }
            // Arrowhead at the landing end, along the end tangent (from the control point to the end).
            const angle = Math.atan2(baseY - cy, x2 - cx);
            for (const turn of [0.5, -0.5]) {
                g.lineBetween(x2, baseY, x2 - Math.cos(angle + turn) * L.head * s, baseY - Math.sin(angle + turn) * L.head * s);
            }
            if (span >= L.minLabelSpan * s) {
                const k = Math.abs(j.to - j.from);
                const sign = j.to >= j.from ? '+' : '−';
                this.texts.push(this.scene.add.text(cx, baseY - rise - 18 * s, `${sign}${k}`, textStyle('lineJump', '#245c59')).setOrigin(0.5).setScale(s));
            }
            if (!jumps.some((o) => o !== j && o.to === j.from) && !ends.has(j.from)) {
                this.dot(x1, axisY, s);
            }
        }
    }

    private dot(x: number, y: number, s: number): void {
        const L = TASK_LAYOUT.numberLine;
        this.graphics.fillStyle(PLACEHOLDER_COLORS.butter, 1);
        this.graphics.fillCircle(x, y, L.dot * s);
        this.graphics.lineStyle(L.border * s, TEAL, 1);
        this.graphics.strokeCircle(x, y, L.dot * s);
    }

    setVisible(visible: boolean): void {
        this.graphics.setVisible(visible);
        this.texts.forEach((t) => t.setVisible(visible));
        if (!visible) {
            this.graphics.clear();
        }
    }

    /** True while the drawing is on screen (the e2e hook reads it, not the rectangle). */
    shown(): boolean {
        return this.graphics.visible;
    }

    bounds(): Rect {
        return this.area;
    }
}
