import { NOTEBOOK, TASK_LAYOUT } from '../data/layout';

export interface Rect { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }
export interface NotebookGeometry { face: Rect; edge: Rect; shadow: Rect; stitches: Rect[]; margin: Rect; ribbon: Point[] }

/** Scene-space shapes of the kit notebook; the widget only draws them. */
export const notebookGeometry = (nb: typeof TASK_LAYOUT.notebook = TASK_LAYOUT.notebook, t: typeof NOTEBOOK = NOTEBOOK): NotebookGeometry => {
    const { left, top, width, height, border } = nb;
    const s = t.stitches;
    const stitches: Rect[] = [];
    // The kit strip runs from `overhang` above the inner top to `overhang` below the inner bottom; a mark starts `phase` into each period.
    const stripTop = top + border - s.overhang;
    const stripBottom = top + height - border + s.overhang;
    for (let y = stripTop + s.phase; y + s.height <= stripBottom; y += s.every) {
        stitches.push({ x: left + border + s.inset, y, width: s.width, height: s.height });
    }
    const m = t.margin;
    const margin: Rect = { x: left + border + m.fromInnerLeft, y: top + m.inset, width: m.width, height: height - 2 * m.inset };
    const r = t.ribbon;
    const x0 = left + width - r.fromRight - r.width;
    const y0 = top + r.top;
    const ribbon: Point[] = [
        { x: x0, y: y0 },
        { x: x0 + r.width, y: y0 },
        { x: x0 + r.width, y: y0 + r.height },
        { x: x0 + r.width / 2, y: y0 + r.notch * r.height },
        { x: x0, y: y0 + r.height },
    ];
    return {
        face: { x: left + border, y: top + border, width: width - 2 * border, height: height - 2 * border },
        edge: { x: left, y: top + height - t.edge.height, width, height: t.edge.height },
        shadow: { x: left, y: top + t.shadow.offsetY, width, height },
        stitches,
        margin,
        ribbon,
    };
};
