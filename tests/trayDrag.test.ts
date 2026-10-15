// Generic tray-to-mat reducer (S-14d phase 6). Oracle: the plan's "Wspolny reduktor" and the block-drag rules; the
// kinds are made up ('a', 'b') so nothing here depends on blocks or coins. Thresholds are written out, not imported.
import { describe, expect, it } from 'vitest';
import { stepTrayDrag, type Counts, type TrayDragEvent, type TrayDragGeo, type TrayDragRules, type TrayDragState } from '../src/core/trayDrag';

type K = 'a' | 'b';
// Tray: a at x 0-99, b at x 100-199 (y 0-99). Mat: x 300-599, y 0-299. Mat items: a at x 300-399, b at x 400-499 while present.
const geo: TrayDragGeo<K> = {
    trayAt: (x, y) => (y < 0 || y > 99 ? null : x >= 0 && x < 100 ? 'a' : x >= 100 && x < 200 ? 'b' : null),
    onMat: (x, y) => x >= 300 && x < 600 && y >= 0 && y < 300,
    matAt: (x, y, mat) => {
        if (y < 0 || y >= 300) return null;
        if (x >= 300 && x < 400 && mat.a > 0) return 'a';
        if (x >= 400 && x < 500 && mat.b > 0) return 'b';
        return null;
    },
};
const empty = (): Counts<K> => ({ a: 0, b: 0 });
const start = (mat: Partial<Counts<K>> = {}): TrayDragState<K> => ({ mat: { ...empty(), ...mat }, carrying: null });
const run = (events: TrayDragEvent[], rules: TrayDragRules, from: TrayDragState<K> = start()): TrayDragState<K> =>
    events.reduce((s, e) => stepTrayDrag(s, e, geo, rules), from);
const down = (x: number, y: number, pointerId = 1): TrayDragEvent => ({ type: 'down', pointerId, x, y });
const move = (x: number, y: number, pointerId = 1): TrayDragEvent => ({ type: 'move', pointerId, x, y });
const up = (x: number, y: number, pointerId = 1): TrayDragEvent => ({ type: 'up', pointerId, x, y });
const drag = (a: [number, number], b: [number, number]): TrayDragEvent[] => [down(...a), move(...b), up(...b)];
const plain: TrayDragRules = { startDistance: 12 };

describe('stepTrayDrag', () => {
    it('puts a tray item on the mat when it is dropped over the mat', () => {
        const s = run(drag([50, 50], [450, 150]), plain);
        expect(s.mat).toEqual({ a: 1, b: 0 });
        expect(s.carrying).toBeNull();
    });

    it('a tap on the tray adds one; a tap on a mat item removes it', () => {
        expect(run([down(150, 50), up(150, 50)], plain).mat).toEqual({ a: 0, b: 1 });
        expect(run([down(350, 50), up(350, 50)], plain, start({ a: 2 })).mat).toEqual({ a: 1, b: 0 });
    });

    it('a mat item dragged off the mat leaves it, dropped on the mat stays', () => {
        expect(run(drag([350, 50], [800, 50]), plain, start({ a: 2 })).mat.a).toBe(1);
        expect(run(drag([350, 50], [550, 200]), plain, start({ a: 2 })).mat.a).toBe(2);
    });

    it('a cancelled touch changes nothing', () => {
        const s = run([down(50, 50), move(450, 150), { type: 'cancel' }], plain);
        expect(s.mat).toEqual(empty());
        expect(s.carrying).toBeNull();
    });

    it('a second finger cancels the carry and changes nothing', () => {
        const s = run([down(50, 50), move(450, 150), down(150, 50, 2), up(450, 150, 1)], plain);
        expect(s.mat).toEqual(empty());
        expect(s.carrying).toBeNull();
    });

    it('S13-09: a down of the same finger while carrying drops the item with the mat unchanged and grabs again at the new point', () => {
        const s = run([down(50, 50), move(450, 150), down(150, 50)], plain);
        expect(s.mat).toEqual(empty());
        expect(s.carrying).toMatchObject({ kind: 'b', from: 'tray', pointerId: 1, x: 150, y: 50, startX: 150, startY: 50, moved: false });
        // the lost `up` is not replayed: the new grab completes as an ordinary tap
        expect(run([down(50, 50), move(450, 150), down(150, 50), up(150, 50)], plain).mat).toEqual({ a: 0, b: 1 });
    });

    it('S13-09: a down on empty ground while carrying leaves nothing in the air', () => {
        const s = run([down(50, 50), move(450, 150), down(700, 700)], plain);
        expect(s.mat).toEqual(empty());
        expect(s.carrying).toBeNull();
    });

    it('maxPerKind caps one kind and not the other', () => {
        const rules = { startDistance: 12, maxPerKind: 2 };
        const s = run([...drag([50, 50], [450, 150]), ...drag([50, 50], [450, 150]), ...drag([50, 50], [450, 150]), ...drag([150, 50], [450, 150])], rules);
        expect(s.mat).toEqual({ a: 2, b: 1 });
    });

    it('maxTotal caps the sum over all kinds, by drop and by tap', () => {
        const rules = { startDistance: 12, maxTotal: 3 };
        const s = run([...drag([50, 50], [450, 150]), ...drag([150, 50], [450, 150]), down(50, 50), up(50, 50), down(150, 50), up(150, 50), ...drag([50, 50], [450, 150])], rules);
        expect(s.mat.a + s.mat.b).toBe(3);
        expect(s.mat).toEqual({ a: 2, b: 1 });
    });

    it('with maxTotal reached, taking one off frees a place', () => {
        const rules = { startDistance: 12, maxTotal: 3 };
        const s = run([down(350, 50), up(350, 50), down(150, 50), up(150, 50)], rules, start({ a: 2, b: 1 }));
        expect(s.mat).toEqual({ a: 1, b: 2 });
    });

    it('no rule means no cap', () => {
        const events = Array.from({ length: 15 }, () => [down(50, 50), up(50, 50)]).flat();
        expect(run(events, plain).mat.a).toBe(15);
    });

    it('a move of 12 px or less is still a tap, over 12 is a drag for good', () => {
        expect(run([down(150, 50), move(158, 56), up(158, 56)], plain).mat.b).toBe(1);
        expect(run([down(150, 50), move(150, 64), move(151, 51), up(151, 51)], plain).mat.b).toBe(0);
    });

    it('moves of another finger are ignored; reset drops the carry and keeps the mat', () => {
        const s = run([down(50, 50), move(450, 150, 2), up(450, 150, 2)], plain);
        expect(s.carrying?.moved).toBe(false);
        const r = run([down(50, 50), move(450, 150), { type: 'reset' }], plain, start({ b: 3 }));
        expect(r.carrying).toBeNull();
        expect(r.mat.b).toBe(3);
    });
});
