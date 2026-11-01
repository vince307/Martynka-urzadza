// House view rules (S-23 phase 1). Oracle: literal synthetic houses written here (FR-033 one room at a time, FR-038 cells,
// FR-039 the notebook path never visits), never data read from src/data except the geometry data test.
import { describe, expect, it } from 'vitest';
import { cellTap, houseCells, houseWakeVisit, type HouseCellView } from '../src/core/houseCells';
import { HOUSES, HOUSE_GEOMETRY } from '../src/data/houses';
import type { HouseGeometry, HouseState } from '../src/core/types';

const cell = (id: string, floor: number, place: number) => ({ id, floor, place, x: place * 10, y: floor * 10, width: 608, height: 342 });
const geo: HouseGeometry = {
    shell: 's', cellClosed: 'c', cellFrame: 'f', cellFill: 0, frameInset: 16,
    cells: [cell('gl', 0, 0), cell('gr', 0, 1), cell('ul', 1, 0), cell('ur', 1, 1)],
    stairwell: { x: 0, y: 0, width: 1, height: 1 },
};
const house: HouseState = { id: 'h', rooms: [{ room: 'salon', floor: 0, place: 0 }, { room: 'kitchen', floor: 0, place: 1 }, { room: 'ghost', floor: 1, place: 0 }] };
const doneSet = (...ids: string[]) => (r: string): boolean | null => (['salon', 'kitchen'].includes(r) ? ids.includes(r) : null);
const states = (cells: HouseCellView[]) => cells.map((c) => c.state);
const rooms = (cells: HouseCellView[]) => cells.map((c) => c.room);

describe('houseCells', () => {
    it('salon in renovation: it is current, the not-reached kitchen and empty cells are closed', () => {
        const v = houseCells(geo, house, 'salon', doneSet());
        expect(states(v)).toEqual(['current', 'closed', 'closed', 'closed']);
        expect(rooms(v)).toEqual(['salon', 'kitchen', null, null]);
    });
    it('salon done, kitchen current', () => {
        const v = houseCells(geo, house, 'kitchen', doneSet('salon'));
        expect(states(v)).toEqual(['done', 'current', 'closed', 'closed']);
    });
    it('both done, kitchen current stays current', () => {
        expect(states(houseCells(geo, house, 'kitchen', doneSet('salon', 'kitchen')))).toEqual(['done', 'current', 'closed', 'closed']);
    });
    it('a place naming an unknown room is closed with no room', () => {
        const v = houseCells(geo, house, 'salon', doneSet());
        expect(v[2]).toMatchObject({ id: 'ul', room: null, state: 'closed' });
    });
    it('keeps geometry order and rectangles', () => {
        const v = houseCells(geo, house, 'salon', doneSet());
        expect(v.map((c) => c.id)).toEqual(['gl', 'gr', 'ul', 'ur']);
        expect(v[1]).toMatchObject({ x: 10, y: 0, width: 608, height: 342, floor: 0, place: 1 });
    });
});

describe('cellTap', () => {
    const base = { id: 'x', floor: 0, place: 0, x: 0, y: 0, width: 1, height: 1 };
    it('closed does nothing', () => expect(cellTap({ ...base, room: null, state: 'closed' })).toEqual({ kind: 'none' }));
    it('current returns to the room in renovation', () => expect(cellTap({ ...base, room: 'kitchen', state: 'current' })).toEqual({ kind: 'room', visit: null }));
    it('done visits that room', () => expect(cellTap({ ...base, room: 'salon', state: 'done' })).toEqual({ kind: 'room', visit: 'salon' }));
});

describe('houseWakeVisit', () => {
    const cells = (): HouseCellView[] => houseCells(geo, house, 'kitchen', doneSet('salon'));
    it.each([undefined, null, {}, { visit: 42 }, { visit: 'kitchen' }, { visit: 'nope' }, 'salon'])('gives null for %j', (d) => {
        expect(houseWakeVisit(d, 'kitchen', cells())).toBeNull();
    });
    it('gives null for a known room that is closed (not reached)', () => {
        expect(houseWakeVisit({ visit: 'ghost' }, 'kitchen', cells())).toBeNull();
        const salonCurrent = houseCells(geo, house, 'salon', doneSet());
        expect(houseWakeVisit({ visit: 'kitchen' }, 'salon', salonCurrent)).toBeNull();
    });
    it('gives the room id for a done room other than the current one', () => {
        expect(houseWakeVisit({ visit: 'salon' }, 'kitchen', cells())).toBe('salon');
    });
});

describe('HOUSE_GEOMETRY data', () => {
    const g = HOUSE_GEOMETRY['house-1'];
    const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    // S-29 adds the base geometry and drops this pin.
    const drawn = HOUSES.filter((h) => HOUSE_GEOMETRY[h.id] !== undefined);
    it('has a geometry for every house but the base, whose cross-section comes in S-29', () => {
        expect(HOUSES.filter((h) => HOUSE_GEOMETRY[h.id] === undefined).map((h) => h.id)).toEqual(['base-1']);
    });
    it('has a cell for every place of every house with a geometry', () => {
        for (const h of drawn) for (const p of h.rooms) expect(HOUSE_GEOMETRY[h.id].cells.some((c) => c.floor === p.floor && c.place === p.place)).toBe(true);
    });
    it('cells lie inside the scene, clear of each other and of the stairwell, 608x342', () => {
        for (const c of g.cells) {
            expect(c.x).toBeGreaterThanOrEqual(0);
            expect(c.y).toBeGreaterThanOrEqual(0);
            expect(c.x + c.width).toBeLessThanOrEqual(1920);
            expect(c.y + c.height).toBeLessThanOrEqual(1080);
            expect([c.width, c.height]).toEqual([608, 342]);
            expect(overlap(c, g.stairwell)).toBe(false);
        }
        g.cells.forEach((a, i) => g.cells.slice(i + 1).forEach((b) => expect(overlap(a, b)).toBe(false)));
    });
    it('matches the pack manifest literally', () => {
        expect(g.cells.map((c) => [c.id, c.floor, c.place, c.x, c.y])).toEqual([
            ['ground-left', 0, 0, 252, 636], ['ground-right', 0, 1, 1060, 636], ['upper-left', 1, 0, 252, 236], ['upper-right', 1, 1, 1060, 236],
        ]);
        expect(g.stairwell).toEqual({ x: 860, y: 236, width: 200, height: 742 });
        expect(g.cellFill).toBe(0xFFF5DF);
    });
});
