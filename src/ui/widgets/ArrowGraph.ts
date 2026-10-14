import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { TaskVisual } from '../../core/tasks/visual';
import { dashedRect } from './dashed';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

type Arrows = Extract<TaskVisual, { kind: 'arrows' }>;

const TEAL = PLACEHOLDER_COLORS.deepTeal;

/**
 * An arrow graph (circle - arrow with its rule - circle) or a rule table (a row of inputs over a row of outputs, the rule on an arrow at the left);
 * the empty field is dashed with a "?". DESIGN-GAP (S-14b): the kit has neither.
 */
export class ArrowGraph {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(visual: Arrows, rect: Rect): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        this.graphics.clear().setVisible(true);
        if (visual.layout === 'graph') {
            this.renderGraph(visual, rect);
        } else {
            this.renderTable(visual, rect);
        }
    }

    private renderGraph(v: Extract<Arrows, { layout: 'graph' }>, rect: Rect): void {
        const A = TASK_LAYOUT.arrows;
        const widthUnits = 2 * A.disc + A.arrow;
        const heightUnits = A.disc + A.rule;
        const s = Math.min(rect.width / widthUnits, rect.height / heightUnits, A.maxScale);
        const left = rect.x + (rect.width - widthUnits * s) / 2;
        const top = rect.y + (rect.height - heightUnits * s) / 2;
        const midY = top + (A.rule + A.disc / 2) * s;
        const r = (A.disc / 2) * s;
        this.disc(left + r, midY, r, s, v.input);
        this.disc(left + (widthUnits - A.disc / 2) * s, midY, r, s, v.output);
        this.arrow(left + A.disc * s + 8 * s, midY, left + (A.disc + A.arrow) * s - 8 * s, midY, s);
        this.rule(left + (A.disc + A.arrow / 2) * s, midY - A.rule * 0.55 * s, v, s);
    }

    private renderTable(v: Extract<Arrows, { layout: 'table' }>, rect: Rect): void {
        const A = TASK_LAYOUT.arrows;
        const n = v.inputs.length;
        const widthUnits = A.ruleColumn + n * (A.tile + A.tileGap) - A.tileGap;
        const heightUnits = 2 * A.tile + A.rowGap;
        const s = Math.min(rect.width / widthUnits, rect.height / heightUnits, A.maxScale);
        const left = rect.x + (rect.width - widthUnits * s) / 2;
        const top = rect.y + (rect.height - heightUnits * s) / 2;
        const size = A.tile * s;
        const bottomY = top + (A.tile + A.rowGap) * s;
        for (let i = 0; i < n; i += 1) {
            const x = left + (A.ruleColumn + i * (A.tile + A.tileGap)) * s;
            this.tile(x, top, size, s, v.inputs[i]);
            this.tile(x, bottomY, size, s, v.outputs[i] ?? null);
        }
        // The rule: a downward arrow from the input row to the output row, the rule written beside it.
        const ax = left + (A.ruleColumn - 40) * s;
        this.arrow(ax, top + size / 2, ax, bottomY + size / 2, s);
        this.rule(left + (A.ruleColumn - 100) * s, (top + bottomY + size) / 2, v, s);
    }

    private rule(x: number, y: number, v: Arrows, s: number): void {
        this.texts.push(this.scene.add.text(x, y, `${v.op}${v.n}`, textStyle('arrowRule')).setOrigin(0.5).setScale(s));
    }

    private arrow(x1: number, y1: number, x2: number, y2: number, s: number): void {
        const A = TASK_LAYOUT.arrows;
        const g = this.graphics;
        g.lineStyle(A.line * s, PLACEHOLDER_COLORS.turquoise, 1);
        g.lineBetween(x1, y1, x2, y2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        for (const turn of [0.5, -0.5]) {
            g.lineBetween(x2, y2, x2 - Math.cos(angle + turn) * A.head * s, y2 - Math.sin(angle + turn) * A.head * s);
        }
    }

    private disc(x: number, y: number, r: number, s: number, value: number | null): void {
        const A = TASK_LAYOUT.arrows;
        const g = this.graphics;
        g.fillStyle(value === null ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.tile, 1);
        g.fillCircle(x, y, r);
        g.lineStyle(A.border * s, TEAL, 1);
        if (value === null) {
            const steps = 16;
            for (let i = 0; i < steps; i += 2) {
                const a1 = (i / steps) * Math.PI * 2;
                const a2 = ((i + 1) / steps) * Math.PI * 2;
                g.lineBetween(x + Math.cos(a1) * r, y + Math.sin(a1) * r, x + Math.cos(a2) * r, y + Math.sin(a2) * r);
            }
        } else {
            g.strokeCircle(x, y, r);
        }
        this.value(x, y, s, value);
    }

    private tile(x: number, y: number, size: number, s: number, value: number | null): void {
        const A = TASK_LAYOUT.arrows;
        const g = this.graphics;
        g.fillStyle(value === null ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.tile, 1);
        g.fillRect(x, y, size, size);
        g.lineStyle(A.border * s, TEAL, 1);
        if (value === null) {
            dashedRect(g, x, y, size, size, A.dash * s);
        } else {
            g.strokeRect(x, y, size, size);
        }
        this.value(x + size / 2, y + size / 2, s, value);
    }

    private value(x: number, y: number, s: number, value: number | null): void {
        const text = this.scene.add.text(x, y, value === null ? '?' : String(value), textStyle('cellValue', value === null ? '#245c59' : undefined));
        this.texts.push(text.setOrigin(0.5).setScale(s));
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
