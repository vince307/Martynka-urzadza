import { describe, expect, it } from 'vitest';
import { blocksLayout, blockSize } from '../src/ui/widgets/BaseTenBlocks';
import { gridStep } from '../src/ui/widgets/BarChart';
import { TASK_LAYOUT } from '../src/data/layout';

const RECT = TASK_LAYOUT.picture.tiles;
const inside = (b: { x: number; y: number; width: number; height: number }): boolean =>
    b.x >= RECT.x - 1e-6 && b.y >= RECT.y - 1e-6 && b.x + b.width <= RECT.x + RECT.width + 1e-6 && b.y + b.height <= RECT.y + RECT.height + 1e-6;
const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean =>
    a.x < b.x + b.width - 1e-6 && b.x < a.x + a.width - 1e-6 && a.y < b.y + b.height - 1e-6 && b.y < a.y + a.height - 1e-6;

describe('blocksLayout', () => {
    it('draws exactly the requested blocks', () => {
        const { blocks } = blocksLayout(2, 3, 4, RECT);
        expect(blocks.filter((b) => b.kind === 'hundred')).toHaveLength(2);
        expect(blocks.filter((b) => b.kind === 'ten')).toHaveLength(3);
        expect(blocks.filter((b) => b.kind === 'one')).toHaveLength(4);
    });

    it('keeps every block inside the rectangle and never overlaps two blocks, for the largest drawings too', () => {
        for (const [h, t, o] of [[1, 0, 0], [0, 0, 9], [9, 9, 9], [5, 7, 3], [3, 4, 5]] as const) {
            const { blocks } = blocksLayout(h, t, o, RECT);
            expect(blocks.every(inside)).toBe(true);
            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    expect(overlap(blocks[i], blocks[j])).toBe(false);
                }
            }
        }
    });

    it('keeps the proportions of the kit blocks at the chosen scale', () => {
        const { scale, blocks } = blocksLayout(1, 1, 1, RECT);
        for (const b of blocks) {
            expect(b.width).toBeCloseTo(blockSize(b.kind, scale).width);
            expect(b.height).toBeCloseTo(blockSize(b.kind, scale).height);
        }
    });

    it('does not grow a lone cube beyond the maximum scale', () => {
        expect(blocksLayout(0, 0, 1, RECT).scale).toBeLessThanOrEqual(TASK_LAYOUT.blocks.maxScale);
    });
});

describe('gridStep', () => {
    it('is 1 up to a scale of 10 and 2 above', () => {
        expect([gridStep(6), gridStep(10), gridStep(12), gridStep(20)]).toEqual([1, 1, 2, 2]);
    });
});
