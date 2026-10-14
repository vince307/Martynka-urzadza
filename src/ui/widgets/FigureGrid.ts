import { Math as PhaserMath, type GameObjects, type Scene } from 'phaser';
import { figureLayout, type FigureInput } from '../../core/round/figureLayout';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

/**
 * A figure drawn in code: the outline, an optional lattice of whole cells and the lengths written at the sides.
 * The places come from `figureLayout`. DESIGN-GAP (docs/design-gaps.md rows 75 and 76): the kit has no side labels and no figure in a 768 x 190 strip.
 */
export class FigureGrid {
    private readonly graphics: GameObjects.Graphics;
    private texts: GameObjects.Text[] = [];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(figure: FigureInput, rect: Rect): void {
        this.area = rect;
        this.texts.forEach((t) => t.destroy());
        this.texts = [];
        const look = TASK_LAYOUT.figure;
        const out = figureLayout(figure, rect, look);
        const g = this.graphics;
        g.clear().setVisible(true);
        g.fillStyle(PLACEHOLDER_COLORS.field, 1);
        g.fillPoints(
            out.points.map((p) => new PhaserMath.Vector2(p.x, p.y)),
            true,
        );
        if (out.lattice) {
            const l = out.lattice;
            g.lineStyle(look.grid, PLACEHOLDER_COLORS.tileBorder, 1);
            for (let x = 0; x <= Math.round(l.width / out.cell); x++) {
                g.lineBetween(l.x + x * out.cell, l.y, l.x + x * out.cell, l.y + l.height);
            }
            for (let y = 0; y <= Math.round(l.height / out.cell); y++) {
                g.lineBetween(l.x, l.y + y * out.cell, l.x + l.width, l.y + y * out.cell);
            }
        }
        g.lineStyle(look.line, PLACEHOLDER_COLORS.deepTeal, 1);
        g.strokePoints(
            out.points.map((p) => new PhaserMath.Vector2(p.x, p.y)),
            true,
            true,
        );
        out.labels.forEach((l) => {
            this.texts.push(this.scene.add.text(l.x, l.y, l.text, textStyle('sideLabel')).setOrigin(0.5));
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

    /** The side labels on screen now (e2e hook / tests). */
    labels(): string[] {
        return this.texts.map((t) => t.text);
    }

    bounds(): Rect {
        return this.area;
    }
}
