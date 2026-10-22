import { describe, expect, it } from 'vitest';
import { notebookGeometry } from '../src/core/notebookGeometry';

// Oracles are computed by hand from the kit CSS: notebook left 180, top 204, 1560 x 788, border 16.
describe('notebookGeometry', () => {
    const g = notebookGeometry();

    it('puts nine stitch marks every 100 px from 20 px above the top to 20 px below the bottom', () => {
        expect(g.stitches.map((s) => s.y)).toEqual([184, 284, 384, 484, 584, 684, 784, 884, 984]);
        expect(g.stitches[0]).toEqual({ x: 236, y: 184, width: 26, height: 10 });
    });
    it('draws the margin line at the inner left + 92 px', () => {
        expect(g.margin).toEqual({ x: 180 + 16 + 92, y: 242, width: 2, height: 712 });
    });
    it('hangs the ribbon 16 px above the top, 92 px in from the right edge', () => {
        expect(g.ribbon[0]).toEqual({ x: 1600, y: 188 });
        expect(g.ribbon[1]).toEqual({ x: 180 + 1560 - 92, y: 188 });
        expect(g.ribbon[2]).toEqual({ x: 1648, y: 262 });
        expect(g.ribbon[3].x).toBe(1624);
        expect(g.ribbon[3].y).toBeCloseTo(188 + 0.78 * 74, 5);
        expect(g.ribbon[4]).toEqual({ x: 1600, y: 262 });
    });
    it('puts a 12 px edge on the bottom and the shadow 22 px lower', () => {
        expect(g.face).toEqual({ x: 196, y: 220, width: 1528, height: 756 });
        expect(g.edge).toEqual({ x: 180, y: 980, width: 1560, height: 12 });
        expect(g.shadow).toEqual({ x: 180, y: 226, width: 1560, height: 788 });
    });
    it('keeps every rect inside the 1920 x 1080 scene', () => {
        const rects = [g.face, g.edge, g.shadow, g.margin, ...g.stitches];
        for (const r of rects) {
            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.y).toBeGreaterThanOrEqual(0);
            expect(r.x + r.width).toBeLessThanOrEqual(1920);
            expect(r.y + r.height).toBeLessThanOrEqual(1080);
        }
        for (const p of g.ribbon) {
            expect(p.x).toBeGreaterThanOrEqual(0);
            expect(p.x).toBeLessThanOrEqual(1920);
            expect(p.y).toBeGreaterThanOrEqual(0);
            expect(p.y).toBeLessThanOrEqual(1080);
        }
    });
});
