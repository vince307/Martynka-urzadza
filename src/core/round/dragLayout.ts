// Geometry of the `drag` answer mode (S-13 phase 8): pure rectangles in the 1920x1080 scene space, from numbers in
// TASK_LAYOUT.drag (injected, like pictureLayout). The same rectangles draw the tray and the mat and answer a touch.
import type { BlockDragGeo, BlockKind, Mat } from '../blockDrag';

export interface Rect { x: number; y: number; width: number; height: number }

export interface DragSpec {
    tray: Rect & { gap: number };
    mat: Rect;
    ok: Rect;
    /** Each mat block sits in a grid cell, inset by this much on every side. */
    cellInset: number;
    /** Cells per row of a kind's mat column. */
    columns: number;
    /** Largest number of blocks of one kind (cells per column = columns * rows >= this). */
    maxPerKind: number;
}

export interface DragLayout {
    tray: Partial<Record<BlockKind, Rect>>;
    mat: Rect;
    ok: Rect;
    matBlock: (kind: BlockKind, i: number) => Rect;
}

export const dragLayout = (spec: DragSpec, kinds: readonly BlockKind[]): DragLayout => {
    const n = Math.max(kinds.length, 1);
    const trayWidth = (spec.tray.width - spec.tray.gap * (n - 1)) / n;
    const colWidth = spec.mat.width / n;
    const rows = Math.ceil(spec.maxPerKind / spec.columns);
    const cellW = colWidth / spec.columns;
    const cellH = spec.mat.height / rows;
    const tray: Partial<Record<BlockKind, Rect>> = {};
    kinds.forEach((kind, k) => {
        tray[kind] = { x: spec.tray.x + k * (trayWidth + spec.tray.gap), y: spec.tray.y, width: trayWidth, height: spec.tray.height };
    });
    const matBlock = (kind: BlockKind, i: number): Rect => {
        const k = Math.max(kinds.indexOf(kind), 0);
        const col = i % spec.columns;
        const row = Math.floor(i / spec.columns);
        return {
            x: spec.mat.x + k * colWidth + col * cellW + spec.cellInset,
            y: spec.mat.y + row * cellH + spec.cellInset,
            width: cellW - 2 * spec.cellInset,
            height: cellH - 2 * spec.cellInset,
        };
    };
    return { tray, mat: spec.mat, ok: spec.ok, matBlock };
};

export const insideRect = (r: Rect, x: number, y: number): boolean =>
    x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;

/** Centre of a rectangle: a touch there lands inside by half the rectangle on every side (hold-point idea of roomHit). */
export const interiorPoint = (r: Rect): { x: number; y: number } => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });

/** Hit tests for the reducer. Mat blocks are found by their cells, so only blocks that are on the mat answer a touch. */
export const dragGeometry = (layout: DragLayout, kinds: readonly BlockKind[]): BlockDragGeo => ({
    trayAt: (x, y) => kinds.find((kind) => { const r = layout.tray[kind]; return r !== undefined && insideRect(r, x, y); }) ?? null,
    onMat: (x, y) => insideRect(layout.mat, x, y),
    matBlockAt: (x, y, mat: Mat) => {
        for (const kind of kinds) {
            for (let i = mat[kind] - 1; i >= 0; i -= 1) {
                if (insideRect(layout.matBlock(kind, i), x, y)) return kind;
            }
        }
        return null;
    },
});
