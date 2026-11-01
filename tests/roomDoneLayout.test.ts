import { describe, expect, it } from 'vitest';
import { roomDoneCardRect } from '../src/core/roomDoneLayout';

// Literals, computed by hand from today's 388/1144 card; deliberately not imported from src/data.
const SPEC = { centerX: 960, minWidth: 1144, padding: 30, tileWidth: 340, gap: 32 };

describe('roomDoneCardRect (design gap 204)', () => {
    const cases: [number, number, number, number[]][] = [
        [0, 388, 1144, []],
        [1, 388, 1144, [790]],
        [2, 388, 1144, [604, 976]],
        [3, 388, 1144, [418, 790, 1162]],
        [4, 202, 1516, [232, 604, 976, 1348]],
        [5, 16, 1888, [46, 418, 790, 1162, 1534]],
    ];

    it.each(cases)('count %i gives left %i, width %i', (count, left, width, tileLefts) => {
        expect(roomDoneCardRect(count, SPEC)).toEqual({ left, width, tileLefts });
    });

    it('keeps every tile inside the card for 1 to 5 tiles', () => {
        for (let n = 1; n <= 5; n++) {
            const r = roomDoneCardRect(n, SPEC);
            for (const l of r.tileLefts) {
                expect(l).toBeGreaterThanOrEqual(r.left);
                expect(l + SPEC.tileWidth).toBeLessThanOrEqual(r.left + r.width);
            }
        }
    });
});
