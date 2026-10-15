// Block-drag gesture (S-13 phase 8): a thin instance of the generic tray-to-mat reducer (trayDrag.ts) for base-ten
// blocks. The gesture rules, including S13-09, live there. A cancelled touch never puts a block on the mat or takes one off.
import { stepTrayDrag, type Carrying as TrayCarrying, type TrayDragEvent, type TrayDragState } from './trayDrag';

export type BlockKind = 'hundred' | 'ten' | 'one';
export type Mat = Record<BlockKind, number>;

export type Carrying = TrayCarrying<BlockKind>;
export type BlockDragState = TrayDragState<BlockKind>;
export type BlockDragEvent = TrayDragEvent;

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

export const stepBlockDrag = (
    state: BlockDragState, event: BlockDragEvent, geo: BlockDragGeo, rules: BlockDragRules,
): BlockDragState =>
    stepTrayDrag(state, event, { trayAt: geo.trayAt, matAt: geo.matBlockAt, onMat: geo.onMat }, rules);
