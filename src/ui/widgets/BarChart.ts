import type { GameObjects, Scene } from 'phaser';
import { CHART_COLORS, PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

/** Gridline step for an axis up to `scaleMax`: every 1 up to 10, else every 2. */
export const gridStep = (scaleMax: number): number => (scaleMax <= 10 ? 1 : 2);

/**
 * A column chart drawn in code: vertical axis 0..scaleMax with gridlines, one column per bar, labels under the columns.
 * DESIGN-GAP (docs/design-gaps.md row 53): the kit has no chart reference. The value is never written above a column; the child reads the axis.
 */
export class BarChart {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(bars: readonly { label: string; value: number }[], scaleMax: number, rect: Rect): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        const c = TASK_LAYOUT.chart;
        const widthUnits = c.axisInset + bars.length * c.barWidth + (bars.length + 1) * c.barGap;
        const heightUnits = c.plotHeight + c.labelDrop + c.labelHeight;
        const s = Math.min(rect.width / widthUnits, rect.height / heightUnits, c.maxScale);
        const left = rect.x + (rect.width - widthUnits * s) / 2;
        const top = rect.y + (rect.height - heightUnits * s) / 2;
        const plotLeft = left + c.axisInset * s;
        const plotRight = left + widthUnits * s;
        const baseY = top + c.plotHeight * s;
        const yOf = (value: number): number => baseY - (value / scaleMax) * c.plotHeight * s;
        const teal = PLACEHOLDER_COLORS.deepTeal;
        const g = this.graphics;
        g.clear().setVisible(true);
        const step = gridStep(scaleMax);
        for (let v = 0; v <= scaleMax; v += step) {
            g.lineStyle(c.gridWidth * s, PLACEHOLDER_COLORS.tileBorder, 1);
            g.lineBetween(plotLeft, yOf(v), plotRight, yOf(v));
            this.texts.push(this.scene.add.text(plotLeft - 12 * s, yOf(v), String(v), textStyle('chartAxis')).setOrigin(1, 0.5).setScale(s));
        }
        bars.forEach((bar, i) => {
            const x = plotLeft + (c.barGap + i * (c.barWidth + c.barGap)) * s;
            const color = CHART_COLORS[i % CHART_COLORS.length] ?? PLACEHOLDER_COLORS.turquoise;
            g.fillStyle(color, 1);
            g.fillRect(x, yOf(bar.value), c.barWidth * s, baseY - yOf(bar.value));
            g.lineStyle(c.border * s, teal, 1);
            g.strokeRect(x, yOf(bar.value), c.barWidth * s, baseY - yOf(bar.value));
            this.texts.push(
                this.scene.add.text(x + (c.barWidth * s) / 2, baseY + c.labelDrop * s, bar.label, textStyle('chartLabel')).setOrigin(0.5, 0).setScale(s),
            );
        });
        g.lineStyle(c.border * s, teal, 1);
        g.lineBetween(plotLeft, yOf(0), plotRight, yOf(0));
        g.lineBetween(plotLeft, yOf(0), plotLeft, yOf(scaleMax));
    }

    setVisible(visible: boolean): void {
        this.graphics.setVisible(visible);
        this.texts.forEach((t) => t.setVisible(visible));
        if (!visible) {
            this.graphics.clear();
        }
    }

    bounds(): Rect {
        return this.area;
    }
}
