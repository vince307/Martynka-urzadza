// The drawing description of a task: stable key, validation and the one-line sample form (S-13).
import { describe, expect, it } from 'vitest';
import { describeVisual, validateVisual, visualKey, visualShape, type TaskVisual } from '../src/core/tasks/visual';

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

const money = (...items: Extract<TaskVisual, { kind: 'money' }>['items'][number][]): TaskVisual => ({ kind: 'money', items });
const scale = (item: 'apple' | 'lamp', weights: Extract<TaskVisual, { kind: 'scale' }>['weights'][number][]): TaskVisual => ({ kind: 'scale', item, weights });
const jugs = (...list: Extract<TaskVisual, { kind: 'jugs' }>['jugs'][number][]): TaskVisual => ({ kind: 'jugs', jugs: list });
const thermo = (celsius: number): TaskVisual => ({ kind: 'thermometer', celsius });
const icons = (groups: number[], framed = false): TaskVisual => ({ kind: 'icons', icon: 'apple', groups, framed });

describe('art visuals (S-14)', () => {
    it('keys differ by every field and keep the order of items', () => {
        expect(visualKey(money('note-10zl', 'coin-2zl'))).not.toBe(visualKey(money('coin-2zl', 'note-10zl')));
        expect(visualKey(money('coin-1zl'))).not.toBe(visualKey(money('coin-2zl')));
        expect(visualKey(scale('apple', ['weight-10dag']))).not.toBe(visualKey(scale('apple', ['weight-20dag'])));
        expect(visualKey(scale('apple', ['weight-10dag']))).not.toBe(visualKey(scale('lamp', ['weight-10dag'])));
        expect(visualKey(jugs('container-1l'))).not.toBe(visualKey(jugs('container-half-l')));
        expect(visualKey(thermo(-5))).not.toBe(visualKey(thermo(5)));
        expect(visualKey(icons([10, 2]))).not.toBe(visualKey(icons([12])));
        expect(visualKey(icons([4, 4, 4], true))).not.toBe(visualKey(icons([4, 4, 4], false)));
        expect(visualKey(thermo(7))).toBe(visualKey(thermo(7)));
        expect(visualKey(money('coin-1zl'))).not.toBe('');
    });

    it('accepts good drawings', () => {
        expect(validateVisual(money('note-10zl', 'coin-2zl', 'coin-50gr'))).toEqual([]);
        expect(validateVisual(scale('apple', ['weight-10dag', 'weight-10dag']))).toEqual([]);
        expect(validateVisual(jugs('container-1l', 'container-half-l', 'container-half-l'))).toEqual([]);
        expect(validateVisual(thermo(-30))).toEqual([]);
        expect(validateVisual(thermo(30))).toEqual([]);
        expect(validateVisual(icons([10, 2]))).toEqual([]);
        expect(validateVisual(icons([3, 3, 3], true))).toEqual([]);
    });

    it('rejects an empty or too long money row, and unknown ids', () => {
        expect(validateVisual(money())).not.toEqual([]);
        expect(validateVisual(money(...Array<'coin-1zl'>(10).fill('coin-1zl')))).toEqual([]);
        expect(validateVisual(money(...Array<'coin-1zl'>(11).fill('coin-1zl')))).not.toEqual([]);
        expect(validateVisual({ kind: 'money', items: ['coin-3zl' as never] })).not.toEqual([]);
    });

    it('rejects scales with no weights, more than 6 weights or an unknown item', () => {
        expect(validateVisual(scale('apple', []))).not.toEqual([]);
        expect(validateVisual(scale('apple', Array<'weight-1kg'>(6).fill('weight-1kg')))).toEqual([]);
        expect(validateVisual(scale('apple', Array<'weight-1kg'>(7).fill('weight-1kg')))).not.toEqual([]);
        expect(validateVisual({ kind: 'scale', item: 'dragon' as never, weights: ['weight-1kg'] })).not.toEqual([]);
    });

    it('rejects 0 or 11 jugs', () => {
        expect(validateVisual(jugs())).not.toEqual([]);
        expect(validateVisual(jugs(...Array<'container-1l'>(10).fill('container-1l')))).toEqual([]);
        expect(validateVisual(jugs(...Array<'container-1l'>(11).fill('container-1l')))).not.toEqual([]);
    });

    it('keeps the thermometer to whole degrees from -30 to 30', () => {
        expect(validateVisual(thermo(-31))).not.toEqual([]);
        expect(validateVisual(thermo(31))).not.toEqual([]);
        expect(validateVisual(thermo(2.5))).not.toEqual([]);
    });

    it('checks icon groups: positive, at most 30 in all, framed means 2+ equal groups', () => {
        expect(validateVisual(icons([]))).not.toEqual([]);
        expect(validateVisual(icons([0, 5]))).not.toEqual([]);
        expect(validateVisual(icons([30]))).toEqual([]);
        expect(validateVisual(icons([31]))).not.toEqual([]);
        expect(validateVisual(icons([5], true))).not.toEqual([]);
        expect(validateVisual(icons([3, 4], true))).not.toEqual([]);
        expect(validateVisual({ kind: 'icons', icon: 'dragon' as never, groups: [3], framed: false })).not.toEqual([]);
    });

    it('describes each kind on one line for the sample script', () => {
        expect(describeVisual(money('note-10zl', 'coin-2zl'))).toBe('[money note-10zl coin-2zl = 12 zł]');
        expect(describeVisual(scale('apple', ['weight-10dag', 'weight-10dag']))).toBe('[scale apple | weight-10dag weight-10dag]');
        expect(describeVisual(jugs('container-1l', 'container-1l', 'container-1l'))).toBe('[jugs 3 × 1 l]');
        expect(describeVisual(jugs('container-1l', 'container-half-l'))).toBe('[jugs 1 × 1 l, 1 × ½ l]');
        expect(describeVisual(thermo(-5))).toBe('[thermometer \u22125 °C]');
        expect(describeVisual(icons([10, 2]))).toBe('[icons apple 10+2]');
        expect(describeVisual(icons([4, 4, 4], true))).toBe('[icons apple 4+4+4 framed]');
    });

    it('only the thermometer is tall', () => {
        expect(visualShape(thermo(3))).toBe('tall');
        for (const v of [money('coin-1zl'), scale('apple', ['weight-10dag']), jugs('container-1l'), icons([3]), clock(3, 0), ruler(0, 50), bars([1, 2])]) {
            expect(visualShape(v), v.kind).toBe('wide');
        }
    });
});
