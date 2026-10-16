// GRD-03: the raw pointer events of the scene become reducer events in one pure place, and every cancel names its pointer.
import { describe, expect, it } from 'vitest';
import { rawToDragEvent } from '../src/core/dragEvents';

const p = { id: 3, x: 10, y: 20 };

describe('rawToDragEvent', () => {
    it('maps down, move and up with the pointer id and position', () => {
        expect(rawToDragEvent('down', p)).toEqual({ type: 'down', pointerId: 3, x: 10, y: 20 });
        expect(rawToDragEvent('move', p)).toEqual({ type: 'move', pointerId: 3, x: 10, y: 20 });
        expect(rawToDragEvent('up', p)).toEqual({ type: 'up', pointerId: 3, x: 10, y: 20 });
    });

    it('an up that the system cancelled is a cancel of that pointer', () => {
        expect(rawToDragEvent('up', { ...p, wasCanceled: true })).toEqual({ type: 'cancel', pointerId: 3 });
    });

    it('a finger lifted outside the canvas is a cancel of that pointer', () => {
        expect(rawToDragEvent('upoutside', p)).toEqual({ type: 'cancel', pointerId: 3 });
    });
});
