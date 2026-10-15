import { describe, expect, it } from 'vitest';
import { labelRoom, labelScale } from '../src/core/fitLabel';
import { ROOM_LAYOUT } from '../src/data/layout';

const { left, width, textInset, costWidth, labelGap } = ROOM_LAYOUT.taskButton;
const row = { left, width, inset: textInset, reserved: costWidth, gap: labelGap };

describe('labelScale', () => {
    it('leaves a label that fits as it is', () => {
        expect(labelScale(labelRoom(row), row)).toBe(1);
        expect(labelScale(100, row)).toBe(1);
    });

    it('shrinks a long label so that it ends at least the gap before the star', () => {
        const labelWidth = 480;
        const scale = labelScale(labelWidth, row);
        expect(scale).toBeLessThan(1);
        const labelRight = left + textInset + labelWidth * scale;
        const starLeft = left + width - textInset - costWidth;
        expect(starLeft - labelRight).toBeGreaterThanOrEqual(labelGap - 1e-9);
    });

    it('never scales to zero or negative', () => {
        expect(labelScale(500, { ...row, reserved: width })).toBe(1);
    });

    it('keeps a real gap in the layout data', () => {
        expect(labelGap).toBeGreaterThanOrEqual(16);
        expect(labelRoom(row)).toBeGreaterThan(0);
    });
});
