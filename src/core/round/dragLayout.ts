// Geometry of the `drag` answer mode (S-13 phase 8): pure rectangles in the 1920x1080 scene space, from numbers in
// TASK_LAYOUT.drag (injected, like pictureLayout). The same rectangles draw the tray and the mat and answer a touch.
import type { BlockDragGeo, BlockKind, Mat } from '../blockDrag';
import { walletList } from '../coins';
import type { Carrying, Counts, TrayDragGeo } from '../trayDrag';
import type { MoneyId } from '../../data/measures';
import { insideRect, interiorPoint, type Rect } from '../geometry';

export { insideRect, interiorPoint, type Rect };

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

/** The block kinds of a build task: ones and tens below 100, hundreds as well from 100 (the tray lists only these). */
export const dragKinds = (answer: number): BlockKind[] => (answer >= 100 ? ['hundred', 'ten', 'one'] : ['ten', 'one']);

export interface CoinSpec {
    tray: Rect & { gap: number };
    wallet: Rect;
    ok: Rect;
    /** The wallet picture in its own units; its drop centres are the places of the placed coins (wallet list order). */
    art: { width: number; height: number; dropCenters: readonly (readonly [number, number])[] };
    /** A placed coin's box is its drop-centre pitch (scaled) minus this gap on both axes. */
    coinGap: number;
    /** The tray is one row up to this many kinds, a 2 x 2 grid above it. */
    rowKinds: number;
    maxKinds: number;
}
export interface CoinLayout {
    tray: Partial<Record<MoneyId, Rect>>;
    wallet: Rect;
    ok: Rect;
    /** The i-th placed coin of the wallet, in the order the wallet lists them. */
    coin: (i: number) => Rect;
}

export const coinLayout = (spec: CoinSpec, kinds: readonly MoneyId[]): CoinLayout => {
    if (kinds.length > spec.maxKinds) throw new Error(`${kinds.length} coin kinds on a tray, at most ${spec.maxKinds}`);
    const oneRow = kinds.length <= spec.rowKinds;
    const columns = oneRow ? Math.max(kinds.length, 1) : 2;
    const rows = oneRow ? 1 : Math.ceil(kinds.length / 2);
    const tileW = (spec.tray.width - spec.tray.gap * (columns - 1)) / columns;
    const tileH = oneRow ? Math.min(tileW, spec.tray.height) : (spec.tray.height - spec.tray.gap * (rows - 1)) / rows;
    const tray: Partial<Record<MoneyId, Rect>> = {};
    kinds.forEach((kind, k) => {
        tray[kind] = {
            x: spec.tray.x + (k % columns) * (tileW + spec.tray.gap),
            y: spec.tray.y + Math.floor(k / columns) * (tileH + spec.tray.gap),
            width: tileW, height: tileH,
        };
    });
    const scale = spec.wallet.width / spec.art.width;
    const pitch = (axis: 0 | 1): number => {
        let best = Infinity;
        for (const a of spec.art.dropCenters) {
            for (const b of spec.art.dropCenters) {
                const d = Math.abs(a[axis] - b[axis]);
                if (d > 0 && d < best) best = d;
            }
        }
        return best;
    };
    const boxW = pitch(0) * scale - spec.coinGap;
    const boxH = pitch(1) * scale - spec.coinGap;
    const coin = (i: number): Rect => {
        const centre = spec.art.dropCenters[i];
        if (!centre) throw new Error(`coin ${i}: the wallet art has ${spec.art.dropCenters.length} places`);
        return {
            x: spec.wallet.x + centre[0] * scale - boxW / 2,
            y: spec.wallet.y + centre[1] * scale - boxH / 2,
            width: boxW, height: boxH,
        };
    };
    return { tray, wallet: spec.wallet, ok: spec.ok, coin };
};

/** Hit tests of the coin reducer: the tray tile under a point, a placed coin by its wallet cell (the cell order is the wallet's list order; at most one cell per drop centre), the wallet rectangle. */
export const coinGeometry = (layout: CoinLayout, kinds: readonly MoneyId[]): TrayDragGeo<MoneyId> => ({
    trayAt: (x, y) => kinds.find((kind) => { const r = layout.tray[kind]; return r !== undefined && insideRect(r, x, y); }) ?? null,
    onMat: (x, y) => insideRect(layout.wallet, x, y),
    matAt: (x, y, mat) => {
        const list = walletList(mat);
        for (let i = list.length - 1; i >= 0; i -= 1) {
            if (insideRect(layout.coin(i), x, y)) return list[i];
        }
        return null;
    },
});

/**
 * The wallet cell a lifted coin leaves empty: the cell the finger went down in when it holds a coin of the carried kind (the
 * first of two equal coins can be the one grabbed), else the last coin of that kind. -1 when nothing is carried from the wallet.
 */
export const liftedSlot = (layout: CoinLayout, list: readonly MoneyId[], carrying: Carrying<MoneyId> | null): number => {
    if (!carrying || carrying.from !== 'mat') return -1;
    for (let i = 0; i < list.length; i += 1) {
        if (list[i] === carrying.kind && insideRect(layout.coin(i), carrying.startX, carrying.startY)) return i;
    }
    return list.lastIndexOf(carrying.kind);
};

/** True when the wallet holds `maxTotal` coins or more (the reducer then refuses another). */
export const walletFull = (mat: Counts<MoneyId>, maxTotal: number): boolean =>
    Object.values<number>(mat).reduce((sum, n) => sum + n, 0) >= maxTotal;
