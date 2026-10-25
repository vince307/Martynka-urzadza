// The worn set and the contact shadows (change salon-style, phase 1). Oracle: the coordinates are computed by hand from the
// SALON numbers (x + anchor + offset, visible width x factor), not read from the code under test.
import { describe, expect, it } from 'vitest';
import { contactShadowPieces, emptyRoomState, roomDone, wornPieces, shownVariants } from '../src/core/rooms';
import { SALON } from '../src/data/rooms';
import type { RoomDef, RoomState } from '../src/core/types';

const st = (tasksDone: number, chosen: RoomState['chosen'] = {}): RoomState => ({ tasksDone, chosen });
const RATIO = 0.32;

describe('wornPieces', () => {
    it('lists the ten worn pieces in draw order before the stage', () => {
        const worn = wornPieces(SALON, emptyRoomState());
        expect(worn.map((w) => w.key)).toEqual([
            'salon/wall-frames', 'salon/rug', 'salon/cabinet', 'salon/lamp-table', 'salon/plant-left',
            'salon/sofa-morska', 'salon/plant-right', 'salon/armchair', 'salon/coffee-table', 'salon/pouf',
        ]);
        expect(worn.filter((w) => w.soft).map((w) => w.id)).toEqual(['rug', 'sofa', 'armchair', 'pouf']);
        expect(worn[5]).toMatchObject({ id: 'sofa', x: 838, y: 257, width: 835, height: 566, z: 30 });
    });
    it('is empty once the stage task is done', () => {
        expect(wornPieces(SALON, st(1))).toEqual([]);
        expect(wornPieces(SALON, st(5, { sofa: 0 }))).toEqual([]);
    });
    it('a variant picks the matching texture of the slot', () => {
        const room: RoomDef = { ...SALON, worn: [{ piece: 'sofa', variant: 1 }] };
        expect(wornPieces(room, emptyRoomState()).map((w) => w.key)).toEqual(['salon/sofa-sloneczna']);
    });
    it('an unknown piece is a data error', () => {
        const room: RoomDef = { ...SALON, worn: [{ piece: 'chandelier' }] };
        expect(() => wornPieces(room, emptyRoomState())).toThrow(/chandelier/);
    });
    it('never returns a piece the room shows as bought or default, in any state', () => {
        for (let done = 0; done <= SALON.tasks.length; done++) {
            const chosen: RoomState['chosen'] = {};
            SALON.tasks.slice(0, done).forEach((t) => { if (t.kind === 'slot') chosen[t.slot] = 0; });
            const state = st(done, chosen);
            const shown = Object.keys(shownVariants(SALON, state));
            const worn = wornPieces(SALON, state).map((w) => w.id);
            expect(worn.filter((id) => shown.includes(id)), `tasksDone ${done}`).toEqual([]);
        }
    });
});

describe('contactShadowPieces', () => {
    it('is empty before the stage', () => {
        expect(contactShadowPieces(SALON, emptyRoomState(), RATIO)).toEqual([]);
    });
    it('after the stage: one shadow per standing piece at the hand-computed place', () => {
        const out = contactShadowPieces(SALON, st(1), RATIO);
        expect(out.map((s) => s.id)).toEqual(['lamp-table', 'plant-left', 'pouf', 'plant-right']);
        const by = Object.fromEntries(out.map((s) => [s.id, s]));
        expect(by['lamp-table']).toMatchObject({ cx: 897, cy: 487 });
        expect(by['lamp-table'].width).toBeCloseTo(155.25, 4);
        expect(by['lamp-table'].height).toBeCloseTo(49.68, 4);
        expect(by['plant-left']).toMatchObject({ cx: 223, cy: 653 });
        expect(by['plant-left'].width).toBeCloseTo(141.9, 4);
        expect(by['pouf']).toMatchObject({ cx: 605, cy: 932 });
        expect(by['pouf'].width).toBeCloseTo(233.7, 4);
        expect(by['plant-right']).toMatchObject({ cx: 1778, cy: 737 });
        expect(by['plant-right'].width).toBeCloseTo(127.2, 4);
    });
    it('a bought variant of the lamp keeps its shadow', () => {
        const out = contactShadowPieces(SALON, st(10, { 'lamp-table': 1 }), RATIO);
        expect(out.map((s) => s.id)).toContain('lamp-table');
    });
    it('a slot that shows nothing has no shadow', () => {
        const room: RoomDef = { ...SALON, contactShadows: [{ piece: 'rug', widthFactor: 1, offset: [0, 0] }] };
        expect(contactShadowPieces(room, st(1), RATIO)).toEqual([]);
    });
    it('is empty in a done room', () => {
        const done = st(SALON.tasks.length);
        expect(roomDone(SALON, done)).toBe(true);
        expect(contactShadowPieces(SALON, done, RATIO)).toEqual([]);
    });
});
