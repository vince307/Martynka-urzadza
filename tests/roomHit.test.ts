// Slot hit-testing (S-10 phase 1, S-16a phase 3, test-plan risk #16). Oracle: US-02 AC (every furnished piece can be
// held to change it) and FR-018 (an empty slot opens nothing). Points are worked out by hand from the art pack's
// manifest (x/y = top-left corner, visibleRect = [left, top, width, height] inside the picture), not read from the code:
//   sofa 838,257 (+16,+16 803x534) z30  rug 432,441 (1079x608) z10  coffee-table 763,535 (505x365) z50
//   cabinet 293,226 (480x331) z20      armchair 248,554 (367x329) z40  wall-frames 1055,15 (602x393) z5
import { describe, expect, it } from 'vitest';
import { holdPoint, slotAt, slotBox } from '../src/core/roomHit';
import type { AlphaAt } from '../src/core/roomHit';
import { balance } from '../src/data/balance';
import { SALON } from '../src/data/rooms';

const all: Record<string, number> = Object.fromEntries(SALON.slots.map((s) => [s.id, 0]));
const at = (x: number, y: number, chosen: Record<string, number> = all, alpha?: AlphaAt) => slotAt(SALON, chosen, { x, y }, alpha);
const opaque: AlphaAt = () => 255;

describe('slotAt', () => {
    it('the middle of the sofa is the sofa (it is drawn above the rug)', () => {
        expect(at(1250, 520)).toBe('sofa');
    });
    it('the coffee table is drawn above the sofa and the rug', () => {
        expect(at(1000, 700)).toBe('coffee-table');
    });
    it('the rug is reachable where nothing is drawn above it', () => {
        expect(at(700, 1000)).toBe('rug');
        expect(at(1400, 900)).toBe('rug');
    });
    it('the wall frames lose to the sofa where they overlap, and win above it', () => {
        expect(at(1300, 150)).toBe('wall-frames');
        expect(at(1300, 350)).toBe('sofa');
    });
    it('cabinet and armchair are reachable', () => {
        expect(at(500, 400)).toBe('cabinet');
        expect(at(300, 700)).toBe('armchair');
    });
    it('an unfurnished sofa does not catch the finger: the wall frames above it and the rug below do', () => {
        const rest = { ...all };
        delete rest.sofa;
        expect(at(1300, 350, rest)).toBe('wall-frames');
        expect(at(1500, 700, rest)).toBe('rug');
    });
    it('nothing is furnished: nothing is hit anywhere', () => {
        for (const [x, y] of [[1250, 520], [700, 1000], [500, 400], [1300, 150]]) expect(at(x, y, {})).toBeNull();
    });
    it('a point outside every slot is null', () => {
        expect(at(5, 5)).toBeNull();
        expect(at(1900, 1070)).toBeNull();
    });
    it('box edges are inclusive and the margin of the picture (outside visibleRect) is not part of a slot', () => {
        expect(at(854, 273)).toBe('sofa');
        expect(at(1657, 807)).toBe('sofa');
        expect(at(853, 273, { sofa: 0 })).toBeNull();
        expect(at(838, 257, { sofa: 0 })).toBeNull();
    });
});

describe('slotAt with the transparency of the pictures', () => {
    // The coffee table's top-left corner (779,551) is inside its rectangle; the sofa starts at x 854, so the rug is below it.
    const corner = { x: 790, y: 560 };
    const transparentTable: AlphaAt = (id) => (id === 'coffee-table' ? 0 : 255);

    it('a transparent corner of the piece above lets the touch fall through to the piece below (risk #16: no wrong purchase target)', () => {
        expect(slotAt(SALON, all, corner, opaque)).toBe('coffee-table');
        expect(slotAt(SALON, all, corner, transparentTable)).toBe('rug');
    });
    it('falls through every transparent piece to nothing', () => {
        expect(slotAt(SALON, all, corner, () => 0)).toBeNull();
    });
    it('asks for the pixel in the picture\'s own coordinates', () => {
        const asked: [string, number, number][] = [];
        slotAt(SALON, all, { x: 1000, y: 400 }, (id, lx, ly) => {
            asked.push([id, lx, ly]);
            return 255;
        });
        expect(asked).toEqual([['sofa', 1000 - 838, 400 - 257]]);
    });
    it('a missing picture (null) counts by its rectangle alone', () => {
        expect(slotAt(SALON, all, corner, () => null)).toBe('coffee-table');
    });
    it('the pixel counts from the minimum alpha of the balance table', () => {
        const { minAlpha } = balance.roomHit;
        expect(slotAt(SALON, all, corner, (id) => (id === 'coffee-table' ? minAlpha - 1 : 255))).toBe('rug');
        expect(slotAt(SALON, all, corner, (id) => (id === 'coffee-table' ? minAlpha : 255))).toBe('coffee-table');
    });
    it('does not ask for a slot that is not furnished', () => {
        const asked = new Set<string>();
        slotAt(SALON, { rug: 0 }, { x: 1000, y: 700 }, (id) => {
            asked.add(id);
            return 255;
        });
        expect([...asked]).toEqual(['rug']);
    });
});

describe('slotBox', () => {
    it('is the picture position plus the visible rectangle', () => {
        const sofa = SALON.slots.find((s) => s.id === 'sofa')!;
        expect(slotBox(sofa)).toEqual({ left: 854, top: 273, right: 1657, bottom: 807 });
    });
});

describe('holdPoint', () => {
    it('gives a point that hits the slot for every furnished slot of the salon', () => {
        for (const s of SALON.slots) {
            const p = holdPoint(SALON, all, s.id);
            expect(p, s.id).not.toBeNull();
            expect(slotAt(SALON, all, p!), s.id).toBe(s.id);
        }
    });
    // A real touch lands within a pixel or so of the asked point (the canvas is scaled, 1080 / 720 = 1.5 game px per
    // page px, and 520 / 1.5 rounds): a point on the slot's edge misses it (phase-7 e2e of S-10: hold read 519.99).
    const shifts = [-2, 0, 2];
    const robust = (chosen: Record<string, number>, id: string, alpha?: AlphaAt) => {
        const p = holdPoint(SALON, chosen, id, 20, alpha);
        expect(p, id).not.toBeNull();
        for (const dx of shifts) {
            for (const dy of shifts) {
                expect(slotAt(SALON, chosen, { x: p!.x + dx, y: p!.y + dy }, alpha), `${id} at ${p!.x + dx},${p!.y + dy}`).toBe(id);
            }
        }
    };
    it('keeps a margin from the edge for every slot, each bought alone and all bought', () => {
        for (const s of SALON.slots) {
            robust({ [s.id]: 0 }, s.id);
            robust(all, s.id);
        }
    });
    it('lands on an opaque pixel when the picture has transparent areas', () => {
        // The rug is transparent on its left half: the point must be on the right half.
        const rug = SALON.slots.find((s) => s.id === 'rug')!;
        const rightHalf: AlphaAt = (id, lx) => (id === 'rug' && lx < 500 ? 0 : 255);
        robust(all, 'rug', rightHalf);
        const p = holdPoint(SALON, all, 'rug', 20, rightHalf)!;
        expect(p.x - rug.x).toBeGreaterThanOrEqual(500);
    });
    it('is null when the whole picture is transparent', () => {
        expect(holdPoint(SALON, all, 'rug', 20, () => 0)).toBeNull();
    });
    it('is null for an unfurnished slot', () => {
        expect(holdPoint(SALON, {}, 'sofa')).toBeNull();
    });
    it('is null for an unknown slot', () => {
        expect(holdPoint(SALON, all, 'nope')).toBeNull();
    });
});
