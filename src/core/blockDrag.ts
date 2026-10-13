// Block-drag gesture as a pure reducer (S-13 phase 8), modelled on longPress.ts. The scene feeds raw pointer events;
// geometry arrives as injected pure functions. A cancelled touch never puts a block on the mat or takes one off.
export type BlockKind = 'hundred' | 'ten' | 'one';
export type Mat = Record<BlockKind, number>;

export interface Carrying {
    pointerId: number;
    kind: BlockKind;
    from: 'tray' | 'mat';
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
}
export interface BlockDragState { mat: Mat; carrying: Carrying | null }

export type BlockDragEvent =
    | { type: 'down'; pointerId: number; x: number; y: number }
    | { type: 'move'; pointerId: number; x: number; y: number }
    | { type: 'up'; pointerId: number; x: number; y: number }
    | { type: 'cancel' }
    | { type: 'reset' };

export interface BlockDragGeo {
    trayAt: (x: number, y: number) => BlockKind | null;
    /** Kind of the block lying on the mat under the point (only blocks that are on the mat count). */
    matBlockAt: (x: number, y: number, mat: Mat) => BlockKind | null;
    onMat: (x: number, y: number) => boolean;
}

export interface BlockDragRules { startDistance: number; maxPerKind: number }

export const emptyMat = (): Mat => ({ hundred: 0, ten: 0, one: 0 });
export const matValue = (mat: Mat): number => 100 * mat.hundred + 10 * mat.ten + mat.one;
export const initialBlockDrag = (): BlockDragState => ({ mat: emptyMat(), carrying: null });

const put = (mat: Mat, kind: BlockKind, max: number): Mat => ({ ...mat, [kind]: Math.min(mat[kind] + 1, max) });
const take = (mat: Mat, kind: BlockKind): Mat => ({ ...mat, [kind]: Math.max(mat[kind] - 1, 0) });
const idle = (state: BlockDragState): BlockDragState => ({ mat: state.mat, carrying: null });

/**
 * Rules: a touch on a tray or mat block starts a carry; a second finger or `cancel`/`reset` ends it with the mat
 * unchanged. Moving past `startDistance` makes it a drag for good. Lifting a drag over the mat puts a tray block down
 * (to `maxPerKind`) and leaves a mat block; lifting it elsewhere sends a tray block back and removes a mat block.
 * Lifting without a drag is a tap: tray +1, mat block -1.
 */
export const stepBlockDrag = (
    state: BlockDragState, event: BlockDragEvent, geo: BlockDragGeo, rules: BlockDragRules,
): BlockDragState => {
    if (event.type === 'cancel' || event.type === 'reset') return idle(state);
    const carrying = state.carrying;
    if (event.type === 'down') {
        if (carrying) return event.pointerId === carrying.pointerId ? state : idle(state);
        const fromTray = geo.trayAt(event.x, event.y);
        const kind = fromTray ?? geo.matBlockAt(event.x, event.y, state.mat);
        if (!kind) return state;
        return {
            mat: state.mat,
            carrying: {
                pointerId: event.pointerId, kind, from: fromTray ? 'tray' : 'mat',
                x: event.x, y: event.y, startX: event.x, startY: event.y, moved: false,
            },
        };
    }
    if (!carrying || event.pointerId !== carrying.pointerId) return state;
    if (event.type === 'move') {
        const moved = carrying.moved || Math.hypot(event.x - carrying.startX, event.y - carrying.startY) > rules.startDistance;
        return { mat: state.mat, carrying: { ...carrying, x: event.x, y: event.y, moved } };
    }
    const { kind, from } = carrying;
    const dragged = carrying.moved || Math.hypot(event.x - carrying.startX, event.y - carrying.startY) > rules.startDistance;
    if (!dragged) {
        return { mat: from === 'tray' ? put(state.mat, kind, rules.maxPerKind) : take(state.mat, kind), carrying: null };
    }
    const over = geo.onMat(event.x, event.y);
    if (from === 'tray') return { mat: over ? put(state.mat, kind, rules.maxPerKind) : state.mat, carrying: null };
    return { mat: over ? state.mat : take(state.mat, kind), carrying: null };
};
