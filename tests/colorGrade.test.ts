// Colour grade rule (change salon-style, phase 1). Oracle: the matrices come from the research prototype's grade_matrix
// (sepia, saturation, brightness, contrast, lift), not from this code.
import { describe, expect, it } from 'vitest';
import { gradeMatrix } from '../src/core/colorGrade';
import { ROOM_LAYOUT } from '../src/data/layout';

const close = (got: number[], want: number[]): void => {
    expect(got).toHaveLength(want.length);
    want.forEach((w, i) => expect(got[i], `cell ${i}`).toBeCloseTo(w, 4));
};

describe('gradeMatrix', () => {
    it('the worn grade equals the prototype matrix', () => {
        close(gradeMatrix(ROOM_LAYOUT.worn.grade), [0.5794, 0.1842, 0.0941, 0, 16.8, 0.1208, 0.6284, 0.0918, 0, 16.8, 0.1121, 0.1576, 0.5412, 0, 16.8, 0, 0, 0, 1, 0]);
    });
    it('the soft grade equals the prototype matrix', () => {
        close(gradeMatrix(ROOM_LAYOUT.worn.soft), [0.691, 0.1693, 0.1168, 0, 0, 0.1325, 0.7199, 0.1155, 0, 0, 0.1278, 0.1548, 0.669, 0, 0, 0, 0, 0, 1, 0]);
    });
    it('identity parameters give the identity matrix', () => {
        close(gradeMatrix({ sepia: 0, saturate: 0, brightness: 1, contrast: 1, lift: 0 }), [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
    });
});
