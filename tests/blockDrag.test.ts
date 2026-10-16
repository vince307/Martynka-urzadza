// Block-drag reducer (S-13 phase 8). Oracle: research section 7 and the plan's "Reduktor przeciagania":
// a drop over the mat adds a block, a drop outside leaves the count, a cancelled touch changes nothing, a tap on the
// tray adds one, a tap on a mat block removes it, a mat block dropped outside leaves the mat, at most 9 of a kind.
// The thresholds (12 px, 9 blocks) are written out here, not read from the implementation.
import { describe, expect, it } from 'vitest';
import {
    emptyMat, initialBlockDrag, matValue, stepBlockDrag,
    type BlockDragEvent, type BlockDragGeo, type BlockDragState, type Mat,
} from '../src/core/blockDrag';
import { balance } from '../src/data/balance';

const rules = { startDistance: 12, maxPerKind: 9 };
// Tray: tens at x 0-99, ones at x 100-199 (y 0-99). Mat: x 300-599, y 0-299. Mat blocks: tens at x 300-399, ones at x 400-499 while present.
const geo: BlockDragGeo = {
    trayAt: (x, y) => (y < 0 || y > 99 ? null : x >= 0 && x < 100 ? 'ten' : x >= 100 && x < 200 ? 'one' : null),
    onMat: (x, y) => x >= 300 && x < 600 && y >= 0 && y < 300,
    matBlockAt: (x, y, mat) => {
        if (y < 0 || y >= 300) return null;
        if (x >= 300 && x < 400 && mat.ten > 0) return 'ten';
        if (x >= 400 && x < 500 && mat.one > 0) return 'one';
        return null;
    },
};
const run = (events: BlockDragEvent[], start: BlockDragState = initialBlockDrag()): BlockDragState =>
    events.reduce((s, e) => stepBlockDrag(s, e, geo, rules), start);
const down = (x: number, y: number, pointerId = 1): BlockDragEvent => ({ type: 'down', pointerId, x, y });
const move = (x: number, y: number, pointerId = 1): BlockDragEvent => ({ type: 'move', pointerId, x, y });
const up = (x: number, y: number, pointerId = 1): BlockDragEvent => ({ type: 'up', pointerId, x, y });
const withMat = (mat: Partial<Mat>): BlockDragState => ({ mat: { ...emptyMat(), ...mat }, carrying: null });
const drag = (from: [number, number], to: [number, number], id = 1): BlockDragEvent[] =>
    [down(...from, id), move(...to, id), up(...to, id)];

describe('balance.blockDrag', () => {
    it('holds the numbers of the plan', () => {
        expect(balance.blockDrag).toEqual({ startDistance: 12, maxPerKind: 9 });
    });
});

describe('matValue', () => {
    it('is 100 hundreds + 10 tens + ones', () => {
        expect(matValue({ hundred: 0, ten: 2, one: 3 })).toBe(23);
        expect(matValue({ hundred: 4, ten: 0, one: 7 })).toBe(407);
        expect(matValue(emptyMat())).toBe(0);
    });
});

describe('stepBlockDrag', () => {
    it('puts a tray block on the mat when it is dropped over the mat', () => {
        const s = run(drag([50, 50], [450, 150]));
        expect(s.mat).toEqual({ hundred: 0, ten: 1, one: 0 });
        expect(s.carrying).toBeNull();
    });

    it('leaves the mat as it was when a tray block is dropped outside it', () => {
        const s = run(drag([50, 50], [800, 150]));
        expect(s.mat).toEqual(emptyMat());
        expect(s.carrying).toBeNull();
    });

    it('a cancelled touch does not put the block down', () => {
        const s = run([down(50, 50), move(450, 150), { type: 'cancel' }]);
        expect(s.mat).toEqual(emptyMat());
        expect(s.carrying).toBeNull();
    });

    it('a cancelled touch does not take a mat block off either', () => {
        const s = run([down(350, 50), move(800, 150), { type: 'cancel' }], withMat({ ten: 2 }));
        expect(s.mat.ten).toBe(2);
        expect(s.carrying).toBeNull();
    });

    it('a second finger cancels the carry and changes nothing', () => {
        const s = run([down(50, 50), move(450, 150), down(150, 50, 2), up(450, 150, 1)]);
        expect(s.mat).toEqual(emptyMat());
        expect(s.carrying).toBeNull();
    });

    it('ignores moves and ups of another pointer', () => {
        const s = run([down(50, 50), move(450, 150, 2), up(450, 150, 2)]);
        expect(s.mat).toEqual(emptyMat());
        expect(s.carrying).not.toBeNull();
        expect(s.carrying?.moved).toBe(false);
    });

    it('a tap on a tray block adds one', () => {
        const s = run([down(150, 50), up(150, 50)]);
        expect(s.mat).toEqual({ hundred: 0, ten: 0, one: 1 });
    });

    it('a move under 12 px is still a tap', () => {
        const s = run([down(150, 50), move(158, 56), up(158, 56)]);
        expect(s.mat.one).toBe(1);
    });

    it('a move over 12 px is a drag: dropped outside the mat it adds nothing', () => {
        const s = run([down(150, 50), move(150, 64), up(150, 64)]);
        expect(s.mat.one).toBe(0);
    });

    it('once a drag has started, coming back near the start does not make it a tap', () => {
        const s = run([down(150, 50), move(150, 90), move(151, 51), up(151, 51)]);
        expect(s.mat.one).toBe(0);
    });

    it('a tap on a mat block removes it', () => {
        const s = run([down(350, 50), up(350, 50)], withMat({ ten: 2 }));
        expect(s.mat.ten).toBe(1);
    });

    it('a mat block dropped outside the mat leaves the mat', () => {
        const s = run(drag([350, 50], [800, 50]), withMat({ ten: 2 }));
        expect(s.mat.ten).toBe(1);
    });

    it('a mat block dropped on the mat stays', () => {
        const s = run(drag([350, 50], [550, 200]), withMat({ ten: 2 }));
        expect(s.mat.ten).toBe(2);
    });

    it('a touch on empty ground carries nothing', () => {
        const s = run([down(700, 700), move(450, 150), up(450, 150)]);
        expect(s.mat).toEqual(emptyMat());
        expect(s.carrying).toBeNull();
    });

    it('a mat column without blocks cannot be picked up', () => {
        const s = run([down(450, 50), up(450, 50)], withMat({ ten: 1 }));
        expect(s.mat).toEqual({ hundred: 0, ten: 1, one: 0 });
    });

    it('keeps 9 when a 10th ten is dropped on the mat', () => {
        const s = run(drag([50, 50], [450, 150]), withMat({ ten: 9 }));
        expect(s.mat.ten).toBe(9);
    });

    it('keeps 9 when the tray is tapped a 10th time', () => {
        const s = run([down(50, 50), up(50, 50)], withMat({ ten: 9 }));
        expect(s.mat.ten).toBe(9);
    });

    it('reset drops the carry and keeps the mat', () => {
        const s = run([down(50, 50), move(450, 150), { type: 'reset' }], withMat({ one: 3 }));
        expect(s.carrying).toBeNull();
        expect(s.mat.one).toBe(3);
    });

    it('moves update the carried position', () => {
        const s = run([down(50, 50), move(200, 200)]);
        expect(s.carrying).toMatchObject({ kind: 'ten', from: 'tray', x: 200, y: 200, moved: true });
    });

    it('builds 23 from two tens and three ones', () => {
        const s = run([
            ...drag([50, 50], [450, 150]), ...drag([50, 50], [450, 150]),
            down(150, 50), up(150, 50), down(150, 50), up(150, 50), down(150, 50), up(150, 50),
        ]);
        expect(matValue(s.mat)).toBe(23);
    });
});

describe('S13-09 (S-14d phase 6)', () => {
    it('a second down of the same finger while carrying drops the block (mat unchanged) and grabs again at the new point', () => {
        const s = run([down(50, 50), move(450, 150), down(150, 50)]);
        expect(s.mat).toEqual(emptyMat());
        expect(s.carrying).toMatchObject({ kind: 'one', from: 'tray', x: 150, y: 50, moved: false });
    });

    it('balance.coinDrag holds the numbers of the plan', () => {
        expect(balance.coinDrag).toEqual({ startDistance: 12, maxTotal: 6 });
    });
});
