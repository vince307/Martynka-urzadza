// The drawing description of a task: stable key, validation and the one-line sample form (S-13).
import { describe, expect, it } from 'vitest';
import { assertPool, describeVisual, lineTicks, validateVisual, visualArtIds, visualKey, visualShape, type TaskVisual } from '../src/core/tasks/visual';

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

describe('a clock to set (S-13b)', () => {
    const set = (hour: number, minute: number, snap: 60 | 5): TaskVisual => ({ kind: 'clock', hour, minute, set: true, snap });

    it('has its own key: the same hands to read are not the same drawing as hands to set', () => {
        expect(visualKey(set(9, 0, 60))).not.toBe(visualKey(clock(9, 0)));
        expect(visualKey(set(9, 0, 60))).not.toBe(visualKey(set(9, 0, 5)));
        expect(visualKey(set(9, 0, 60))).toBe(visualKey(set(9, 0, 60)));
    });

    it('is described by its start pose', () => {
        expect(describeVisual(set(9, 0, 60))).toBe('[clock set from 9.00]');
        expect(describeVisual(set(4, 15, 5))).toBe('[clock set from 4.15]');
    });

    it('accepts hands on the snap and refuses the rest', () => {
        expect(validateVisual(set(9, 0, 60))).toEqual([]);
        expect(validateVisual(set(4, 15, 5))).toEqual([]);
        expect(validateVisual(set(4, 15, 60))).not.toEqual([]);
        expect(validateVisual(set(4, 14, 5))).not.toEqual([]);
        expect(validateVisual(set(0, 0, 60))).not.toEqual([]);
        expect(validateVisual(set(13, 0, 60))).not.toEqual([]);
        expect(validateVisual({ kind: 'clock', hour: 3, minute: 0, set: true } as unknown as TaskVisual)).not.toEqual([]);   // the type forbids it; data from outside might not
    });

    it('is wide', () => {
        expect(visualShape(set(9, 0, 60))).toBe('wide');
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

const cells = (layout: 'square3' | 'pyramid3', values: (number | null)[]): TaskVisual => ({ kind: 'cells', layout, values });
const grid = (columns: number, rows: number, items: Extract<TaskVisual, { kind: 'grid' }>['items'][number][]): TaskVisual => ({ kind: 'grid', columns, rows, items });
const figure = (lattice: boolean, vertices: [number, number][], sides: (number | null)[]): TaskVisual => ({ kind: 'figure', lattice, vertices, sides });
const L_SHAPE: [number, number][] = [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]];
const GRID_OK = grid(5, 4, [{ item: 'heart', col: 2, row: 1 }, { item: 'star', col: 1, row: 2 }]);

describe('grid-task visuals (S-13b)', () => {
    it('accepts good drawings', () => {
        expect(validateVisual(cells('square3', [8, 1, 6, 3, 5, 7, 4, null, 2]))).toEqual([]);
        expect(validateVisual(cells('pyramid3', [null, 5, 7, 2, 3, 4]))).toEqual([]);
        expect(validateVisual(GRID_OK)).toEqual([]);
        expect(validateVisual(figure(true, L_SHAPE, [3, 1, 2, 1, 1, 2]))).toEqual([]);
        expect(validateVisual(figure(false, [[0, 0], [5, 0], [5, 3], [0, 3]], [5, 3, 5, null]))).toEqual([]);
    });

    it.each<[string, TaskVisual]>([
        ['no empty cell', cells('square3', [8, 1, 6, 3, 5, 7, 4, 9, 2])],
        ['two empty cells', cells('square3', [8, null, 6, 3, 5, 7, 4, null, 2])],
        ['pyramid with 9 cells', cells('pyramid3', [1, 2, 3, 4, 5, 6, 7, 8, null])],
        ['square with 6 cells', cells('square3', [null, 5, 7, 2, 3, 4])],
        ['negative cell', cells('pyramid3', [null, 5, 7, 2, -3, 4])],
        ['one grid item', grid(5, 4, [{ item: 'heart', col: 2, row: 1 }])],
        ['six grid items', grid(6, 5, [0, 1, 2, 3, 4, 5].map((col) => ({ item: 'star' as const, col, row: 0 })))],
        ['two items on one cell', grid(5, 4, [{ item: 'heart', col: 2, row: 1 }, { item: 'star', col: 2, row: 1 }])],
        ['item outside the grid', grid(5, 4, [{ item: 'heart', col: 5, row: 1 }, { item: 'star', col: 1, row: 2 }])],
        ['seven columns', grid(7, 4, GRID_OK.kind === 'grid' ? [...GRID_OK.items] : [])],
        ['six rows', grid(5, 6, GRID_OK.kind === 'grid' ? [...GRID_OK.items] : [])],
        ['unknown grid item', { kind: 'grid', columns: 5, rows: 4, items: [{ item: 'dog' as never, col: 0, row: 0 }, { item: 'star', col: 1, row: 2 }] }],
        ['two vertices', figure(false, [[0, 0], [5, 0]], [5, 5])],
        ['side labels do not match vertices', figure(true, L_SHAPE, [3, 1, 2])],
        ['lattice figure with a slanted edge', figure(true, [[0, 0], [3, 0], [2, 2]], [3, null, null])],
        ['lattice figure with a fractional vertex', figure(true, [[0, 0], [3, 0], [3, 1.5], [0, 1.5]], [3, null, 3, null])],
    ])('reports %s', (_name, visual) => {
        expect(validateVisual(visual).length).toBeGreaterThan(0);
    });

    it('allows a slanted edge in a figure that is not on the lattice', () => {
        expect(validateVisual(figure(false, [[0, 0], [4, 0], [2, 3]], [4, 3, 3]))).toEqual([]);
    });

    it('keys differ by layout, empty cell, item place and side labels', () => {
        expect(visualKey(cells('square3', [8, 1, 6, 3, 5, 7, 4, null, 2]))).not.toBe(visualKey(cells('square3', [8, 1, 6, 3, null, 7, 4, 9, 2])));
        expect(visualKey(cells('pyramid3', [null, 5, 7, 2, 3, 4]))).not.toBe(visualKey(cells('pyramid3', [12, null, 7, 2, 3, 4])));
        expect(visualKey(GRID_OK)).not.toBe(visualKey(grid(5, 4, [{ item: 'heart', col: 2, row: 2 }, { item: 'star', col: 1, row: 2 }])));
        expect(visualKey(figure(true, L_SHAPE, [3, 1, 2, 1, 1, 2]))).not.toBe(visualKey(figure(true, L_SHAPE, [3, 1, 2, 1, 1, null])));
        expect(visualKey(GRID_OK)).toBe(visualKey(grid(5, 4, [{ item: 'heart', col: 2, row: 1 }, { item: 'star', col: 1, row: 2 }])));
    });

    it('prints one line per drawing and is wide', () => {
        expect(describeVisual(cells('square3', [8, 1, 6, 3, 5, 7, 4, null, 2]))).toBe('[cells square3 8 1 6 3 5 7 4 _ 2]');
        expect(describeVisual(GRID_OK)).toBe('[grid 5×4 serce C2, gwiazdka B3]');
        expect(describeVisual(figure(true, L_SHAPE, [3, 1, 2, 1, 1, 2]))).toBe('[figure lattice 6 vertices]');
        expect(describeVisual(figure(false, [[0, 0], [3, 0], [3, 5], [0, 5]], [3, 5, 3, 5]))).toBe('[figure 3 cm 5 cm 3 cm 5 cm]');
        for (const v of [cells('square3', [8, 1, 6, 3, 5, 7, 4, null, 2]), GRID_OK, figure(true, L_SHAPE, [3, 1, 2, 1, 1, 2])]) {
            expect(visualShape(v)).toBe('wide');
        }
    });
});

describe('column and numberLine drawings (S-14b)', () => {
    const column = (op: '+' | '−', a: number, b: number, columns: number): TaskVisual => ({ kind: 'column', op, a, b, columns });
    const line = (over: Partial<Extract<TaskVisual, { kind: 'numberLine' }>> = {}): TaskVisual => ({
        kind: 'numberLine', from: 0, to: 100, tick: 10, labels: [30, 40, 60], box: 50, jumps: [], ...over,
    });
    it('keys and describes a column and a number line', () => {
        expect(visualKey(column('+', 38, 27, 2))).not.toBe(visualKey(column('+', 38, 28, 2)));
        expect(visualKey(line())).not.toBe(visualKey(line({ box: 40 })));
        expect(describeVisual(column('+', 38, 27, 2))).toBe('[column 38 + 27]');
        expect(describeVisual(line())).toBe('[line 0–100/10 labels 30 40 60 box 50]');
        expect(visualShape(column('+', 38, 27, 2))).toBe('wide');
        expect(visualShape(line())).toBe('long');   // visual gate S-14b: the full notebook width in a tiles task
    });
    it('accepts good columns and rejects a result with the wrong digit count or a negative result', () => {
        expect(validateVisual(column('+', 38, 27, 2))).toEqual([]);
        expect(validateVisual(column('+', 68, 47, 2)).join()).toMatch(/digits/);       // 115 has three digits
        expect(validateVisual(column('−', 27, 38, 2)).join()).toMatch(/negative/);
        expect(validateVisual(column('−', 65, 62, 2)).join()).toMatch(/digits/);       // 3 has one digit
        expect(validateVisual(column('+', 38, 27, 3)).join()).toMatch(/columns/);
    });
    it('accepts a good number line and rejects off-tick, out-of-range and too many ticks', () => {
        expect(validateVisual(line())).toEqual([]);
        expect(validateVisual(line({ labels: [35] })).join()).toMatch(/tick/);
        expect(validateVisual(line({ box: 110 })).join()).toMatch(/tick|range/);
        expect(validateVisual(line({ from: 0, to: 40, tick: 1, labels: [], box: null })).join()).toMatch(/ticks/);   // 41 ticks
        expect(validateVisual(line({ jumps: [{ from: 0, to: 15 }] })).join()).toMatch(/tick/);
        expect(validateVisual(line({ from: 50, to: 50 })).join()).toMatch(/from/);
    });
});

describe('arrows drawing (S-14b)', () => {
    const graph = (over: Partial<Extract<TaskVisual, { kind: 'arrows'; layout: 'graph' }>> = {}): TaskVisual => ({
        kind: 'arrows', layout: 'graph', op: '+', n: 5, input: 7, output: null, ...over,
    });
    const table = (outputs: (number | null)[], inputs = [3, 5, 8]): TaskVisual => ({ kind: 'arrows', layout: 'table', op: '−', n: 2, inputs, outputs });
    it('keys and describes a graph and a table', () => {
        expect(visualKey(graph())).not.toBe(visualKey(graph({ input: 8 })));
        expect(visualKey(graph())).not.toBe('');
        expect(visualKey(graph())).not.toBe(visualKey(table([1, 3, null])));
        expect(describeVisual(graph())).toBe('[arrows graph 7 +5 □]');
        expect(describeVisual(table([1, 3, null]))).toBe('[arrows table −2: 3>1 5>3 8>□]');
        expect(visualShape(graph())).toBe('wide');
    });
    it('accepts one empty field that follows the rule', () => {
        expect(validateVisual(graph())).toEqual([]);
        expect(validateVisual(graph({ input: null, output: 12 }))).toEqual([]);
        expect(validateVisual(table([1, 3, null]))).toEqual([]);
    });
    it.each([
        ['no empty field in a graph', graph({ output: 12 })],
        ['two empty fields in a graph', graph({ input: null })],
        ['a graph off the rule', graph({ input: 7, output: 11, n: 5 })],
        ['a value above 20', graph({ input: 18, output: null })],
        ['a negative value', graph({ op: '−', input: 3, output: null })],
        ['two empty outputs in a table', table([1, null, null])],
        ['no empty output in a table', table([1, 3, 6])],
        ['a table off the rule', table([1, 4, null])],
        ['outputs of another length', table([1, null], [3, 5, 8])],
        ['a rule of zero', graph({ n: 0, output: 7 })],
        ['duplicate inputs', table([1, 1, null], [3, 3, 8])],
    ])('rejects %s', (_name, v) => {
        expect(validateVisual(v)).not.toEqual([]);
    });
});

describe('row of icons and the icon motion (S-14d)', () => {
    const row = (icons: string[], mark = 'left'): TaskVisual => ({ kind: 'row', icons, mark }) as unknown as TaskVisual;
    const moving = (groups: number[], motion: string | undefined, framed = false): TaskVisual =>
        ({ kind: 'icons', icon: 'apple', groups, framed, ...(motion ? { motion } : {}) }) as unknown as TaskVisual;

    it('a row of 3 to 10 different known icons with the start mark on the left is valid', () => {
        expect(validateVisual(row(['key', 'apple', 'cup']))).toEqual([]);
        expect(validateVisual(row(['key', 'apple']))).not.toEqual([]);
        expect(validateVisual(row(['key', 'apple', 'apple']))).not.toEqual([]);
        expect(validateVisual(row(['key', 'apple', 'dragon']))).not.toEqual([]);
        expect(validateVisual(row(['key', 'apple', 'cup'], 'right'))).not.toEqual([]);
        const many = ['cup', 'croissant', 'flower', 'cushion', 'book', 'lamp', 'apple', 'pear', 'teapot', 'pencil', 'key'];
        expect(validateVisual(row(many))).not.toEqual([]);
        expect(validateVisual(row(many.slice(0, 10)))).toEqual([]);
    });

    it('a motion needs exactly two plain groups', () => {
        expect(validateVisual(moving([3, 2], 'come'))).toEqual([]);
        expect(validateVisual(moving([5, 2], 'go'))).toEqual([]);
        expect(validateVisual(moving([3], 'come'))).not.toEqual([]);
        expect(validateVisual(moving([3, 2, 1], 'go'))).not.toEqual([]);
        expect(validateVisual(moving([3, 3], 'come', true))).not.toEqual([]);
    });

    it('two groups side by side (COMPARE_QTY, visual gate S-14d) are exactly two plain groups without a motion', () => {
        const sides = (groups: number[], extra: Record<string, unknown> = {}): TaskVisual =>
            ({ kind: 'icons', icon: 'apple', groups, framed: false, sides: true, ...extra }) as unknown as TaskVisual;
        expect(validateVisual(sides([3, 7]))).toEqual([]);
        expect(validateVisual(sides([3]))).not.toEqual([]);
        expect(validateVisual(sides([3, 2, 1]))).not.toEqual([]);
        expect(validateVisual(sides([3, 3], { framed: true }))).not.toEqual([]);
        expect(validateVisual(sides([3, 2], { motion: 'come' }))).not.toEqual([]);
        expect(visualKey(sides([3, 2]))).not.toBe(visualKey(icons([3, 2])));
        expect(describeVisual(sides([3, 2]))).toBe('[icons apple 3|2]');
    });

    it('keys differ by icon order and by motion; the sample line names both', () => {
        expect(visualKey(row(['key', 'apple', 'cup']))).not.toBe(visualKey(row(['apple', 'key', 'cup'])));
        expect(visualKey(moving([3, 2], 'come'))).not.toBe(visualKey(moving([3, 2], 'go')));
        expect(visualKey(moving([3, 2], 'come'))).not.toBe(visualKey(moving([3, 2], undefined)));
        expect(describeVisual(row(['key', 'apple', 'cup']))).toBe('[row key apple cup]');
        expect(describeVisual(moving([3, 2], 'go'))).toBe('[icons apple 3+2 go]');
        expect(visualShape(row(['key', 'apple', 'cup']))).toBe('long');
    });
});

describe('visualArtIds (child-flow-guards p1)', () => {
    it('names the pictures a drawing needs, [] for drawn-in-code kinds', () => {
        expect(visualArtIds({ kind: 'icons', icon: 'key', groups: [2, 3], framed: false })).toEqual(['key']);
        expect(visualArtIds({ kind: 'row', icons: ['key', 'cup', 'book'], mark: 'left' })).toEqual(['key', 'cup', 'book']);
        expect(visualArtIds({ kind: 'scale', item: 'apple', weights: ['weight-1kg', 'weight-2kg'] })).toEqual(['apple', 'weight-1kg', 'weight-2kg']);
        expect(visualArtIds({ kind: 'money', items: ['coin-1zl', 'note-10zl'] })).toEqual(['coin-1zl', 'note-10zl']);
        expect(visualArtIds({ kind: 'money', items: [], pay: { tray: ['coin-1zl', 'coin-5zl'], fewest: false } })).toEqual(['coin-1zl', 'coin-5zl']);
        expect(visualArtIds({ kind: 'jugs', jugs: ['container-1l', 'container-half-l'] })).toEqual(['container-1l', 'container-half-l']);
        expect(visualArtIds(clock(3, 0))).toEqual([]);
        expect(visualArtIds({ kind: 'thermometer', celsius: 5 })).toEqual([]);
    });
});

describe('assertPool and lineTicks', () => {
    it('assertPool passes up to the limit and throws past it', () => {
        expect(() => assertPool(10, 10, 'money')).not.toThrow();
        expect(() => assertPool(11, 10, 'money')).toThrow(/money.*11.*10/);
    });
    it('lineTicks counts ticks and throws on a bad step or too many ticks', () => {
        expect(lineTicks({ from: 0, to: 100, tick: 10 })).toBe(11);
        expect(() => lineTicks({ from: 0, to: 10, tick: 0 })).toThrow(/tick/);
        expect(() => lineTicks({ from: 0, to: 10, tick: -1 })).toThrow(/tick/);
        expect(() => lineTicks({ from: 0, to: 40, tick: 1 })).toThrow(/ticks/);
    });
});
