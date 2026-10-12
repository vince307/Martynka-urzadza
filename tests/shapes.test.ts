import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { drawToken, formatShape, matchesToken, parseShape, type ShapeToken } from '../src/core/tasks/shapes';

describe('shapes', () => {
    it('parses and formats catalogue shapes', () => {
        expect(parseShape('DU+U')).toEqual({ left: 'DU', op: '+', right: 'U' });
        expect(parseShape('HTU-DT')).toEqual({ left: 'HTU', op: '-', right: 'DT' });
        expect(formatShape(parseShape('DT-U'))).toBe('DT-U');
        expect(() => parseShape('DU*U')).toThrow(TypeError);
        expect(() => parseShape('X+U')).toThrow(TypeError);
    });

    it.each<[ShapeToken, number]>([['U', 9], ['DU', 99], ['DT', 90], ['H', 900], ['HT', 990], ['HTU', 999]])(
        'drawToken(%s) stays in shape for 1000 draws',
        (token, max) => {
            const rng = createRng(3);
            const seen = new Set<number>();
            for (let i = 0; i < 1000; i += 1) {
                const n = drawToken(token, rng, 1000);
                expect(matchesToken(n, token), `${token} ${n}`).toBe(true);
                expect(n).toBeLessThanOrEqual(max);
                seen.add(n);
            }
            expect(seen.size).toBeGreaterThan(token === 'U' ? 8 : 8);
        },
    );

    it('respects max and rejects empty ranges', () => {
        const rng = createRng(1);
        for (let i = 0; i < 200; i += 1) {
            expect(drawToken('DU', rng, 30)).toBeLessThanOrEqual(30);
            expect(drawToken('DT', rng, 30)).toBeLessThanOrEqual(30);
        }
        expect(() => drawToken('H', rng, 99)).toThrow(RangeError);
    });
});
