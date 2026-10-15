// The heart figure (S-14d visual gate): one outline, so a heart reads as one figure and not as two circles on a triangle.
import { describe, expect, it } from 'vitest';
import { heartPoints } from '../src/ui/widgets/figurePoints';

describe('heartPoints', () => {
    const cx = 200;
    const cy = 100;
    const r = 50;
    const pts = heartPoints(cx, cy, r);

    it('is one closed outline inside the figure box, symmetric about the centre line', () => {
        expect(pts.length).toBeGreaterThanOrEqual(32);
        for (const p of pts) {
            expect(Math.abs(p.x - cx)).toBeLessThanOrEqual(r + 1e-9);
            expect(Math.abs(p.y - cy)).toBeLessThanOrEqual(r + 1e-9);
            expect(pts.some((q) => Math.abs(q.x - (2 * cx - p.x)) < 1 && Math.abs(q.y - p.y) < 1)).toBe(true);
        }
        expect(Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))).toBeCloseTo(2 * r, 5);
    });

    it('ends in a tip at the bottom centre and dips between the two lobes at the top', () => {
        const lowest = pts.reduce((a, b) => (b.y > a.y ? b : a));
        expect(lowest.x).toBeCloseTo(cx, 5);
        const top = Math.min(...pts.map((p) => p.y));
        const centreTop = Math.min(...pts.filter((p) => Math.abs(p.x - cx) < 1e-6).map((p) => p.y));
        expect(centreTop).toBeGreaterThan(top + r * 0.2);
    });
});
