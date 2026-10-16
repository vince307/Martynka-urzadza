// The raw pointer events of the task scene as events of the drag reducers (trayDrag, blockDrag, clockSet), in one pure
// place. Every cancel names its pointer (GRD-03), so a second finger's cancel cannot drop the first finger's carry.
import type { TrayDragEvent } from './trayDrag';

export type RawKind = 'down' | 'move' | 'up' | 'upoutside';
export interface RawPointer { id: number; x: number; y: number; wasCanceled?: boolean }

export const rawToDragEvent = (kind: RawKind, p: RawPointer): TrayDragEvent => {
    switch (kind) {
        case 'down': return { type: 'down', pointerId: p.id, x: p.x, y: p.y };
        case 'move': return { type: 'move', pointerId: p.id, x: p.x, y: p.y };
        case 'up': return p.wasCanceled ? { type: 'cancel', pointerId: p.id } : { type: 'up', pointerId: p.id, x: p.x, y: p.y };
        case 'upoutside': return { type: 'cancel', pointerId: p.id };
        default: { const never: never = kind; return never; }
    }
};
