// House view rules (S-23): what each cell shows, what a tap does and which room a wake from the house may visit.
// Pure: no Phaser, no data import.
import type { HouseCellDef, HouseGeometry, HouseState } from './types';

export type HouseCellState = 'current' | 'done' | 'closed';
export interface HouseCellView extends HouseCellDef { room: string | null; state: HouseCellState }
export type CellTap = { kind: 'none' } | { kind: 'room'; visit: string | null };

/**
 * One view per geometry cell, in geometry order. `doneOf` answers null for a room the build does not know. A cell is
 * `current` for the room in renovation (even when done), `done` for a finished room, `closed` for everything else
 * (an empty cell, an unknown room or a known room not yet reached: one room at a time, FR-033).
 */
export function houseCells(g: HouseGeometry, h: HouseState, current: string, doneOf: (room: string) => boolean | null): HouseCellView[] {
    return g.cells.map((c) => {
        const place = h.rooms.find((r) => r.floor === c.floor && r.place === c.place);
        const done = place === undefined ? null : doneOf(place.room);
        const room = place !== undefined && done !== null ? place.room : null;
        const state: HouseCellState = room === null ? 'closed' : room === current ? 'current' : done === true ? 'done' : 'closed';
        return { ...c, room, state };
    });
}

/** A closed cell does nothing, the current cell returns to the room in renovation, a done cell visits its room. */
export function cellTap(cell: HouseCellView): CellTap {
    if (cell.state === 'current') return { kind: 'room', visit: null };
    if (cell.state === 'done' && cell.room !== null) return { kind: 'room', visit: cell.room };
    return { kind: 'none' };
}

/** The room a wake from the house may visit: only a done cell other than the current room, else null (FR-039). */
export function houseWakeVisit(data: unknown, current: string, cells: readonly HouseCellView[]): string | null {
    if (typeof data !== 'object' || data === null || !('visit' in data)) return null;
    const visit = data.visit;
    if (typeof visit !== 'string' || visit === current) return null;
    return cells.some((c) => c.state === 'done' && c.room === visit) ? visit : null;
}

/** The art keys a geometry draws (shell, closed cell, frame), without repeats, in a fresh array; the house scene loads and judges these only. */
export function houseArtKeys(g: HouseGeometry): string[] {
    return [...new Set([g.shell, g.cellClosed, g.cellFrame])];
}
