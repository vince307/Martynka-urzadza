import { describe, expect, it } from 'vitest';
import { thumbFit } from '../src/core/thumbFit';
import { ROOM_LAYOUT } from '../src/data/layout';
import { SALON } from '../src/data/rooms';

const { size, inset, nameHeight } = ROOM_LAYOUT.thumbs;

describe('thumbFit', () => {
    it('keeps the visible part of every salon slot inside the thumbnail and above the name', () => {
        for (const slot of SALON.slots) {
            const fit = thumbFit(slot.visibleRect, size, inset, nameHeight);
            expect(fit.left, slot.id).toBeGreaterThanOrEqual(inset - 1e-9);
            expect(fit.left + fit.width, slot.id).toBeLessThanOrEqual(size - inset + 1e-9);
            expect(fit.top, slot.id).toBeGreaterThanOrEqual(inset - 1e-9);
            expect(fit.top + fit.height, slot.id).toBeLessThanOrEqual(size - inset - nameHeight + 1e-9);
            expect(fit.scale, slot.id).toBeGreaterThan(0);
        }
    });

    it('keeps the aspect of the object and centres it', () => {
        const fit = thumbFit([10, 20, 400, 100], 200, 20, 36);
        expect(fit.width / fit.height).toBeCloseTo(4);
        expect(fit.left * 2 + fit.width).toBeCloseTo(200);
    });
});
