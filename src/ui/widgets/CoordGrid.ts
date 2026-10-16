import type { GameObjects, Scene } from 'phaser';
import type { GridItemId } from '../../data/gridItems';
import { CHART_COLORS, PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { Rect } from './geometry';
import { coordScale } from '../../core/round/drawingFit';
import { drawShape } from './faceDraw';
import { drawLattice } from './lattice';
import { textStyle } from './textStyle';

const ITEM_COLOR: Record<GridItemId, number> = {
    circle: CHART_COLORS[0] ?? PLACEHOLDER_COLORS.turquoise,
    square: CHART_COLORS[1] ?? PLACEHOLDER_COLORS.butter,
    triangle: CHART_COLORS[2] ?? PLACEHOLDER_COLORS.terracotta,
    star: CHART_COLORS[3] ?? PLACEHOLDER_COLORS.dotDone,
    heart: 0xe0707a,
};

/**
 * A square grid drawn in code with column letters above and row numbers on the left, items drawn as coloured shapes.
 * DESIGN-GAP (docs/design-gaps.md row 74): the kit grid is 8 x 5 with no marks; this one is at most 6 x 5 so a cell stays large for a finger-sized read.
 */
export class CoordGrid {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(columns: number, rows: number, items: readonly { item: GridItemId; col: number; row: number }[], rect: Rect): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        const c = TASK_LAYOUT.coord;
        const widthUnits = c.labelInset + columns * c.cell;
        const heightUnits = c.labelDrop + rows * c.cell;
        const s = coordScale(columns, rows, rect, c);
        const left = rect.x + (rect.width - widthUnits * s) / 2 + c.labelInset * s;
        const top = rect.y + (rect.height - heightUnits * s) / 2 + c.labelDrop * s;
        const cell = c.cell * s;
        const g = this.graphics;
        g.clear().setVisible(true);
        g.fillStyle(PLACEHOLDER_COLORS.field, 1);
        g.fillRect(left, top, columns * cell, rows * cell);
        g.lineStyle(c.line * s, PLACEHOLDER_COLORS.tileBorder, 1);
        drawLattice(g, left, top, columns, rows, cell, false);
        g.lineStyle(c.border * s, PLACEHOLDER_COLORS.deepTeal, 1);
        g.strokeRect(left, top, columns * cell, rows * cell);
        for (let i = 0; i < columns; i++) {
            this.texts.push(this.scene.add.text(left + (i + 0.5) * cell, top - 6 * s, String.fromCharCode(65 + i), textStyle('gridLabel')).setOrigin(0.5, 1).setScale(s));
        }
        for (let j = 0; j < rows; j++) {
            this.texts.push(this.scene.add.text(left - 10 * s, top + (j + 0.5) * cell, String(j + 1), textStyle('gridLabel')).setOrigin(1, 0.5).setScale(s));
        }
        for (const it of items) {
            g.fillStyle(ITEM_COLOR[it.item], 1);
            g.lineStyle(c.border * s * 0.6, PLACEHOLDER_COLORS.deepTeal, 1);
            drawShape(g, it.item, left + (it.col + 0.5) * cell, top + (it.row + 0.5) * cell, (cell * c.itemFill) / 2);
        }
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
