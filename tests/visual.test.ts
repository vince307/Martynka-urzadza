// The drawing description of a task: stable key, validation and the one-line sample form (S-13).
import { describe, expect, it } from 'vitest';
import { describeVisual, validateVisual, visualKey, type TaskVisual } from '../src/core/tasks/visual';

const clock = (hour: number, minute: number): TaskVisual => ({ kind: 'clock', hour, minute });
const ruler = (fromMm: number, toMm: number, lengthCm = 15, unit: 'cm' | 'mm' = 'cm'): TaskVisual => ({ kind: 'ruler', unit, lengthCm, fromMm, toMm });
const bars = (values: number[], scaleMax = 10): TaskVisual => ({
    kind: 'bars',
    scaleMax,
    bars: values.map((value, i) => ({ label: `L${i}`, value })),
});

describe('visualKey', () => {
    it('is empty for no drawing', () => {
        expect(visualKey(undefined)).toBe('');
    });

    it('differs when the minute, the segment or a bar differs', () => {
        expect(visualKey(clock(3, 5))).not.toBe(visualKey(clock(3, 10)));
        expect(visualKey(clock(3, 0))).not.toBe(visualKey(clock(15, 0)));
        expect(visualKey(ruler(30, 80))).not.toBe(visualKey(ruler(30, 90)));
        expect(visualKey(bars([3, 5, 7]))).not.toBe(visualKey(bars([3, 5, 8])));
        expect(visualKey({ kind: 'blocks', hundreds: 1, tens: 2, ones: 3 })).not.toBe(visualKey({ kind: 'blocks', hundreds: 1, tens: 3, ones: 2 }));
    });

    it('is the same for the same content in another object, whatever the field order', () => {
        const a: TaskVisual = { kind: 'ruler', unit: 'cm', lengthCm: 15, fromMm: 30, toMm: 80 };
        const b = { toMm: 80, fromMm: 30, lengthCm: 15, unit: 'cm', kind: 'ruler' } as TaskVisual;
        expect(visualKey(a)).toBe(visualKey(b));
        expect(visualKey(clock(7, 5))).toBe(visualKey(clock(7, 5)));
    });

    it('differs between kinds', () => {
        expect(visualKey(clock(1, 2))).not.toBe(visualKey({ kind: 'blocks', hundreds: 1, tens: 2, ones: 0 }));
    });
});

describe('validateVisual', () => {
    it('accepts good drawings', () => {
        expect(validateVisual(clock(23, 59))).toEqual([]);
        expect(validateVisual(ruler(30, 80))).toEqual([]);
        expect(validateVisual(ruler(5, 47, 15, 'mm'))).toEqual([]);
        expect(validateVisual({ kind: 'blocks', hundreds: 0, tens: 4, ones: 9 })).toEqual([]);
        expect(validateVisual(bars([3, 5, 7]))).toEqual([]);
    });

    it.each<[string, TaskVisual]>([
        ['hour 24', clock(24, 0)],
        ['negative hour', clock(-1, 0)],
        ['minute 60', clock(3, 60)],
        ['fractional minute', clock(3, 1.5)],
        ['segment reversed', ruler(80, 30)],
        ['empty segment', ruler(30, 30)],
        ['segment past the ruler', ruler(30, 160)],
        ['cm ruler with a segment off the centimetre marks', ruler(35, 80)],
        ['no blocks at all', { kind: 'blocks', hundreds: 0, tens: 0, ones: 0 }],
        ['ten ones', { kind: 'blocks', hundreds: 0, tens: 0, ones: 10 }],
        ['one bar', bars([3])],
        ['six bars', bars([1, 2, 3, 4, 5, 6])],
        ['bar above the scale', bars([3, 11])],
        ['negative bar', bars([3, -1])],
        ['duplicate labels', { kind: 'bars', scaleMax: 10, bars: [{ label: 'A', value: 1 }, { label: 'A', value: 2 }] }],
        ['empty label', { kind: 'bars', scaleMax: 10, bars: [{ label: '', value: 1 }, { label: 'A', value: 2 }] }],
    ])('reports %s', (_name, visual) => {
        expect(validateVisual(visual).length).toBeGreaterThan(0);
    });
});

describe('describeVisual', () => {
    it('prints one line per drawing for the sample script', () => {
        expect(describeVisual(clock(15, 0))).toBe('[clock 15.00]');
        expect(describeVisual(ruler(30, 80))).toBe('[ruler 0–15 cm, 3–8 cm]');
        expect(describeVisual(ruler(5, 47, 15, 'mm'))).toBe('[ruler 0–15 cm, 5–47 mm]');
        expect(describeVisual({ kind: 'blocks', hundreds: 1, tens: 2, ones: 3 })).toBe('[blocks 1 100, 2 10, 3 1]');
        expect(describeVisual(bars([3, 5]))).toBe('[bars L0=3 L1=5, scale 10]');
    });
});
