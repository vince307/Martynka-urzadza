// Origin: S-14b visual gate. On a dense number line two labels on neighbouring ticks ("10" and "11" of 21 − 17) ran into "1011";
// the second of such a pair drops to a lower row.
import { describe, expect, it } from 'vitest';
import { labelRows } from '../src/core/round/lineLabels';

describe('labelRows', () => {
    it('puts a label on the tick next to the last one on the lower row of a dense line', () => {
        expect(labelRows([0, 10, 11, 15, 21, 25, 30], 1, true)).toEqual([0, 0, 1, 0, 0, 0, 0]);
        expect(labelRows([9, 10, 11], 1, true)).toEqual([0, 1, 0]);
    });

    it('keeps every label on one row when the ticks stand far apart', () => {
        expect(labelRows([20, 21, 25, 30], 1, false)).toEqual([0, 0, 0, 0]);
        expect(labelRows([50, 60, 70], 10, false)).toEqual([0, 0, 0]);
    });

    it('reads the labels in order whatever order they come in', () => {
        expect(labelRows([11, 0, 10], 1, true)).toEqual([1, 0, 0]);
    });
});
