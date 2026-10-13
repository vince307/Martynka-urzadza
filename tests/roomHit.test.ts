// Slot hit-testing (S-10 phase 1, test-plan risk #16). Oracle: US-02 AC (every furnished
// piece can be held to change it) and FR-018 (an empty slot opens nothing). Points are
// worked out by hand from the SALON layout (centre +- half size), not read from the code.
import { describe, expect, it } from 'vitest';
import { holdPoint, slotAt, slotBox } from '../src/core/roomHit';
import type { SlotSizes } from '../src/core/roomHit';
import { SALON, SALON_PLACEHOLDERS } from '../src/data/rooms';

const sizes: SlotSizes = SALON_PLACEHOLDERS;
const all: Record<string, number> = Object.fromEntries(SALON.slots.map((s) => [s.id, 0]));
const at = (x: number, y: number, chosen: Record<string, number> = all) => slotAt(SALON, sizes, chosen, { x, y });

describe('slotAt', () => {
    it('the middle of the sofa is the sofa (highest depth wins)', () => {
        expect(at(1000, 600)).toBe('sofa');
    });
    it('the rug is reachable beside the sofa and below it', () => {
        expect(at(650, 700)).toBe('rug');
        expect(at(960, 740)).toBe('rug');
    });
    it('floor and walls are reachable away from furniture', () => {
        expect(at(200, 800)).toBe('floor');
        expect(at(200, 300)).toBe('walls');
    });
    it('an unfurnished sofa does not catch the finger: the rug under it does', () => {
        const rest = { ...all };
        delete rest.sofa;
        expect(at(1000, 660, rest)).toBe('rug');
    });
    it('nothing is furnished: nothing is hit anywhere', () => {
        for (const [x, y] of [[1000, 600], [200, 800], [200, 300], [960, 700]]) expect(at(x, y, {})).toBeNull();
    });
    it('a point outside every slot is null', () => {
        expect(at(5, 5)).toBeNull();
        expect(at(1900, 1070)).toBeNull();
    });
    it('box edges are inclusive', () => {
        expect(at(720, 480)).toBe('sofa');
        expect(at(1280, 720)).toBe('sofa');
    });
});

describe('slotBox', () => {
    it('is the centre plus or minus half the size', () => {
        const sofa = SALON.slots.find((s) => s.id === 'sofa')!;
        expect(slotBox(sofa, { width: 560, height: 240 })).toEqual({ left: 720, top: 480, right: 1280, bottom: 720 });
    });
});

describe('holdPoint', () => {
    it('gives a point that hits the slot for every furnished slot of the salon', () => {
        for (const s of SALON.slots) {
            const p = holdPoint(SALON, sizes, all, s.id);
            expect(p, s.id).not.toBeNull();
            expect(slotAt(SALON, sizes, all, p!), s.id).toBe(s.id);
        }
    });
    it('is null for an unfurnished slot', () => {
        expect(holdPoint(SALON, sizes, {}, 'sofa')).toBeNull();
    });
    it('is null for an unknown slot', () => {
        expect(holdPoint(SALON, sizes, all, 'nope')).toBeNull();
    });
});
