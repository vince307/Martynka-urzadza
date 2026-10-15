// DESIGN-GAP (docs/design-gaps.md row 101): the kit has no pattern row; a row of figures in code with a dashed empty place at the end.
import type { GameObjects, Scene } from 'phaser';
import { parseFace } from '../../core/tasks/faces';
import { PATTERN_LOOK, PLACEHOLDER_COLORS } from '../../data/layout';
import { drawFace } from './faceDraw';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

/** A row of figures (face codes) and one empty place (null) the child fills with a tile. */
export class PatternRow {
    private readonly graphics: GameObjects.Graphics;
    private mark: GameObjects.Text | null = null;
    private visible = false;
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(items: readonly (string | null)[], rect: Rect): void {
        this.area = rect;
        this.mark?.destroy();
        this.mark = null;
        const look = PATTERN_LOOK;
        const natural = items.length * look.cell + (items.length - 1) * look.gap;
        const s = Math.min(rect.width / natural, rect.height / look.cell, look.maxScale);
        const cell = look.cell * s;
        const gap = look.gap * s;
        const left = rect.x + (rect.width - (items.length * cell + (items.length - 1) * gap)) / 2;
        const cy = rect.y + rect.height / 2;
        const g = this.graphics;
        g.clear().setVisible(true);
        this.visible = true;
        items.forEach((item, i) => {
            const x = left + i * (cell + gap);
            const face = item === null ? null : parseFace(item);
            if (face) {
                drawFace(g, face, x + cell / 2, cy, { width: cell, height: cell });
                return;
            }
            // The empty place: a dashed frame with a "?" in it.
            g.fillStyle(PLACEHOLDER_COLORS.field, 1);
            g.fillRoundedRect(x, cy - cell / 2, cell, cell, look.radius * s);
            this.dashedRect(g, { x, y: cy - cell / 2, width: cell, height: cell }, s);
            this.mark = this.scene.add.text(x + cell / 2, cy, '?', textStyle('answer')).setOrigin(0.5).setScale(s);
        });
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.graphics.setVisible(visible);
        this.mark?.setVisible(visible);
        if (!visible) {
            this.graphics.clear();
            this.mark?.destroy();
            this.mark = null;
        }
    }

    shown(): boolean {
        return this.visible;
    }

    bounds(): Rect {
        return this.area;
    }

    private dashedRect(g: GameObjects.Graphics, r: Rect, s: number): void {
        const { dash, dashGap, dashWidth } = PATTERN_LOOK;
        g.lineStyle(dashWidth, PLACEHOLDER_COLORS.deepTeal, 1);
        const edges: [number, number, number, number][] = [
            [r.x, r.y, r.x + r.width, r.y],
            [r.x + r.width, r.y, r.x + r.width, r.y + r.height],
            [r.x + r.width, r.y + r.height, r.x, r.y + r.height],
            [r.x, r.y + r.height, r.x, r.y],
        ];
        for (const [x1, y1, x2, y2] of edges) {
            const length = Math.hypot(x2 - x1, y2 - y1);
            const ux = (x2 - x1) / length;
            const uy = (y2 - y1) / length;
            for (let at = 0; at < length; at += (dash + dashGap) * s) {
                const end = Math.min(at + dash * s, length);
                g.lineBetween(x1 + ux * at, y1 + uy * at, x1 + ux * end, y1 + uy * end);
            }
        }
    }
}
