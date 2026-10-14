// Where a figure with labelled sides is drawn (S-13b): pure scene-space geometry, so the labels' places are testable without Phaser.
// The widget (FigureGrid) only draws what this returns. DESIGN-GAP rows 75 and 76 (docs/design-gaps.md).
import { pl } from '../../data/pl';
import type { Rect } from '../geometry';

export interface FigureLook {
    line: number;
    grid: number;
    labelPad: number;
    fontSize: number;
    maxCell: number;
    minCell: number;
    textWidth: number;
    dot: number;
}

export interface FigureInput {
    vertices: readonly (readonly [number, number])[];
    sides: readonly (number | null)[];
    lattice: boolean;
}

export interface FigureLabel {
    /** Index of the edge (vertex `edge` to the next one) this label belongs to. */
    edge: number;
    text: string;
    /** Centre of the text, scene pixels. */
    x: number;
    y: number;
    /** Estimated text width (the widget draws it centred). */
    width: number;
}

export interface FigureLayoutResult {
    points: { x: number; y: number }[];
    labels: FigureLabel[];
    /** Pixels per unit of the figure (a lattice cell). */
    cell: number;
    /** Lattice bounds in scene pixels (the grid is drawn over them), null for a free figure. */
    lattice: Rect | null;
}

/** Fits the figure into `rect`, leaving room outside the outline for its side labels, and puts each label at the middle of its edge on the outer side. */
export const figureLayout = (figure: FigureInput, rect: Rect, look: FigureLook): FigureLayoutResult => {
    const { vertices, sides } = figure;
    const maxX = Math.max(...vertices.map((v) => v[0]));
    const maxY = Math.max(...vertices.map((v) => v[1]));
    const minX = Math.min(...vertices.map((v) => v[0]));
    const minY = Math.min(...vertices.map((v) => v[1]));
    const texts = sides.map((s) => (s === null ? null : pl.tasks.sideLabel(s)));
    const widths = texts.map((t) => (t === null ? 0 : t.length * look.fontSize * look.textWidth));
    const labelled = texts.some((t) => t !== null);
    const marginX = labelled ? look.labelPad + Math.max(...widths) : look.line;
    const marginY = labelled ? look.labelPad + look.fontSize : look.line;
    const extentX = Math.max(1, maxX - minX);
    const extentY = Math.max(1, maxY - minY);
    const cell = Math.min((rect.width - 2 * marginX) / extentX, (rect.height - 2 * marginY) / extentY, look.maxCell);
    const left = rect.x + (rect.width - extentX * cell) / 2;
    const top = rect.y + (rect.height - extentY * cell) / 2;
    const points = vertices.map(([x, y]) => ({ x: left + (x - minX) * cell, y: top + (y - minY) * cell }));
    const centre = {
        x: points.reduce((a, p) => a + p.x, 0) / points.length,
        y: points.reduce((a, p) => a + p.y, 0) / points.length,
    };
    const labels: FigureLabel[] = [];
    points.forEach((a, edge) => {
        const text = texts[edge];
        if (text === null || text === undefined) {
            return;
        }
        const b = points[(edge + 1) % points.length];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        let nx = dy / len;
        let ny = -dx / len;
        if ((mx - centre.x) * nx + (my - centre.y) * ny < 0) {
            nx = -nx;
            ny = -ny;
        }
        const width = widths[edge];
        const reach = look.labelPad + Math.abs(nx) * (width / 2) + Math.abs(ny) * (look.fontSize / 2);
        labels.push({ edge, text, x: mx + nx * reach, y: my + ny * reach, width });
    });
    return {
        points,
        labels,
        cell,
        lattice: figure.lattice ? { x: left, y: top, width: extentX * cell, height: extentY * cell } : null,
    };
};
