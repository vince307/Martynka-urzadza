import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { cellPositions, cellsScale, type CellsLayout } from '../../core/round/drawingFit';
import { dashedRect } from './dashed';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

/**
 * A magic square or a number pyramid drawn in code: a tile per cell with its number, the empty cell dashed with a "?".
 * DESIGN-GAP (docs/design-gaps.md row 73): the kit has no number cells.
 */
export class NumberCells {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(layout: CellsLayout, values: readonly (number | null)[], rect: Rect): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        const c = TASK_LAYOUT.cells;
        const spots = cellPositions(layout);
        const cols = 3;
        const s = cellsScale(rect, c);
        const left = rect.x + (rect.width - cols * c.cell * s) / 2;
        const top = rect.y + (rect.height - 3 * c.cell * s) / 2;
        const g = this.graphics;
        g.clear().setVisible(true);
        spots.forEach((spot, i) => {
            const x = left + spot.x * c.cell * s;
            const y = top + spot.y * c.cell * s;
            const size = c.cell * s;
            const value = values[i] ?? null;
            if (value === null) {
                g.fillStyle(PLACEHOLDER_COLORS.butter, 1);
                g.fillRect(x, y, size, size);
                g.lineStyle(c.border * s, PLACEHOLDER_COLORS.deepTeal, 1);
                dashedRect(g, x, y, size, size, c.dash * s);
            } else {
                g.fillStyle(PLACEHOLDER_COLORS.tile, 1);
                g.fillRect(x, y, size, size);
                g.lineStyle(c.border * s, PLACEHOLDER_COLORS.deepTeal, 1);
                g.strokeRect(x, y, size, size);
            }
            const label = value === null ? '?' : String(value);
            const color = value === null ? '#245c59' : undefined;
            const text = this.scene.add.text(x + size / 2, y + size / 2, label, textStyle('cellValue', color)).setOrigin(0.5).setScale(s);
            this.texts.push(text);
        });
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
