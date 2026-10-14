// Drawing descriptions carried by a task (S-13): numbers and labels only, no colours or pixels.
// The scene decides how to draw them; core only validates and keys them.
import { GRID_ITEMS, GRID_LIMITS, type GridItemId } from '../../data/gridItems';
import { ART_LIMITS, ICONS, JUGS, MONEY, THERMOMETER, WEIGHTS, type IconId, type JugId, type MoneyId, type WeightId } from '../../data/measures';
import { formatCelsius, formatMoney } from '../text/measure';
import { formatTime } from '../text/time';
import type { SkillDef } from '../types';

export type AnswerMode = SkillDef['answer'];

export type TaskVisual =
    | { kind: 'clock'; hour: number; minute: number }
    | { kind: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; fromMm: number; toMm: number }
    | { kind: 'blocks'; hundreds: number; tens: number; ones: number }
    | { kind: 'bars'; bars: readonly { label: string; value: number }[]; scaleMax: number }
    | { kind: 'money'; items: readonly MoneyId[] }
    | { kind: 'scale'; item: IconId; weights: readonly WeightId[] }
    | { kind: 'jugs'; jugs: readonly JugId[] }
    | { kind: 'thermometer'; celsius: number }
    | { kind: 'icons'; icon: IconId; groups: readonly number[]; framed: boolean }
    // Number cells (S-13b): row-major 3x3 magic square, or a pyramid as [top, middle x2, base x3]; exactly one cell is null (the empty one).
    | { kind: 'cells'; layout: 'square3' | 'pyramid3'; values: readonly (number | null)[] }
    // A square grid with labelled columns (A..) and rows (1..) and items on distinct cells (col, row are zero-based).
    | { kind: 'grid'; columns: number; rows: number; items: readonly { item: GridItemId; col: number; row: number }[] }
    // A polygon in lattice units; sides[i] labels the edge from vertex i to i+1 (null = no label).
    | { kind: 'figure'; lattice: boolean; vertices: readonly (readonly [number, number])[]; sides: readonly (number | null)[] };

/** `tall` drawings are narrower than high and need the room beside the keypad solution; the rest are wide. */
export type VisualShape = 'wide' | 'tall';

export const visualShape = (v: TaskVisual): VisualShape => (v.kind === 'thermometer' ? 'tall' : 'wide');

/** Stable identity of a drawing (fixed field order); '' for none. */
export const visualKey = (v: TaskVisual | undefined): string => {
    if (!v) {
        return '';
    }
    switch (v.kind) {
        case 'clock':
            return `clock:${v.hour}:${v.minute}`;
        case 'ruler':
            return `ruler:${v.unit}:${v.lengthCm}:${v.fromMm}:${v.toMm}`;
        case 'blocks':
            return `blocks:${v.hundreds}:${v.tens}:${v.ones}`;
        case 'bars':
            return `bars:${v.scaleMax}:${v.bars.map((b) => `${b.label}=${b.value}`).join(',')}`;
        case 'money':
            return `money:${v.items.join(',')}`;
        case 'scale':
            return `scale:${v.item}:${v.weights.join(',')}`;
        case 'jugs':
            return `jugs:${v.jugs.join(',')}`;
        case 'thermometer':
            return `thermometer:${v.celsius}`;
        case 'icons':
            return `icons:${v.icon}:${v.framed ? 'framed' : 'plain'}:${v.groups.join(',')}`;
        case 'cells':
            return `cells:${v.layout}:${v.values.map((x) => x ?? '_').join(',')}`;
        case 'grid':
            return `grid:${v.columns}x${v.rows}:${v.items.map((i) => `${i.item}@${i.col},${i.row}`).join(';')}`;
        case 'figure':
            return `figure:${v.lattice ? 'lattice' : 'free'}:${v.vertices.map(([x, y]) => `${x},${y}`).join(';')}:${v.sides.map((x) => x ?? '_').join(',')}`;
    }
};

const isInt = (n: number): boolean => Number.isInteger(n);

/** Rule violations of a drawing; [] when it can be drawn and read. */
export const validateVisual = (v: TaskVisual): string[] => {
    const out: string[] = [];
    switch (v.kind) {
        case 'clock':
            if (!isInt(v.hour) || v.hour < 0 || v.hour > 23) out.push(`clock hour ${v.hour} outside 0..23`);
            if (!isInt(v.minute) || v.minute < 0 || v.minute > 59) out.push(`clock minute ${v.minute} outside 0..59`);
            break;
        case 'ruler':
            if (!isInt(v.fromMm) || !isInt(v.toMm) || v.fromMm < 0 || v.fromMm >= v.toMm || v.toMm > v.lengthCm * 10) {
                out.push(`ruler segment ${v.fromMm}..${v.toMm} mm not inside 0..${v.lengthCm * 10}`);
            }
            if (v.unit === 'cm' && (v.fromMm % 10 !== 0 || v.toMm % 10 !== 0)) out.push('cm ruler segment off the centimetre marks');
            break;
        case 'blocks':
            for (const n of [v.hundreds, v.tens, v.ones]) {
                if (!isInt(n) || n < 0 || n > 9) out.push(`blocks count ${n} outside 0..9`);
            }
            if (v.hundreds + v.tens + v.ones <= 0) out.push('blocks drawing is empty');
            break;
        case 'bars': {
            if (v.bars.length < 2 || v.bars.length > 5) out.push(`${v.bars.length} bars, need 2..5`);
            if (new Set(v.bars.map((b) => b.label)).size !== v.bars.length) out.push('duplicate bar labels');
            if (v.bars.some((b) => b.label === '')) out.push('empty bar label');
            if (v.bars.some((b) => b.value < 0 || b.value > v.scaleMax)) out.push(`bar value outside 0..${v.scaleMax}`);
            break;
        }
        case 'money':
            if (v.items.length < 1 || v.items.length > ART_LIMITS.moneyItems) out.push(`${v.items.length} money items, need 1..${ART_LIMITS.moneyItems}`);
            for (const id of v.items) if (!MONEY.some((m) => m.id === id)) out.push(`unknown money id ${id}`);
            break;
        case 'scale':
            if (!ICONS.some((i) => i.id === v.item)) out.push(`unknown scale item ${v.item}`);
            if (v.weights.length < 1 || v.weights.length > ART_LIMITS.weights) out.push(`${v.weights.length} weights, need 1..${ART_LIMITS.weights}`);
            for (const id of v.weights) if (!WEIGHTS.some((w) => w.id === id)) out.push(`unknown weight id ${id}`);
            break;
        case 'jugs':
            if (v.jugs.length < 1 || v.jugs.length > ART_LIMITS.jugs) out.push(`${v.jugs.length} jugs, need 1..${ART_LIMITS.jugs}`);
            for (const id of v.jugs) if (!JUGS.some((j) => j.id === id)) out.push(`unknown jug id ${id}`);
            break;
        case 'thermometer':
            if (!isInt(v.celsius) || v.celsius < THERMOMETER.min || v.celsius > THERMOMETER.max) {
                out.push(`temperature ${v.celsius} not a whole number in ${THERMOMETER.min}..${THERMOMETER.max}`);
            }
            break;
        case 'icons': {
            if (!ICONS.some((i) => i.id === v.icon)) out.push(`unknown icon ${v.icon}`);
            if (v.groups.length < 1) out.push('icons drawing has no group');
            if (v.groups.some((g) => !isInt(g) || g < 1)) out.push('icon group sizes must be positive whole numbers');
            if (v.groups.reduce((a, b) => a + b, 0) > ART_LIMITS.icons) out.push(`more than ${ART_LIMITS.icons} icons`);
            if (v.framed && (v.groups.length < 2 || v.groups.some((g) => g !== v.groups[0]))) out.push('framed icons need 2 or more equal groups');
            break;
        }
        case 'cells': {
            const want = v.layout === 'square3' ? 9 : 6;
            if (v.values.length !== want) out.push(`${v.layout} needs ${want} cells, got ${v.values.length}`);
            const empty = v.values.filter((x) => x === null).length;
            if (empty !== 1) out.push(`cells drawing needs exactly one empty cell, got ${empty}`);
            if (v.values.some((x) => x !== null && (!isInt(x) || x < 0))) out.push('cell values must be whole numbers from 0');
            break;
        }
        case 'grid': {
            if (!isInt(v.columns) || v.columns < 2 || v.columns > GRID_LIMITS.columns) out.push(`${v.columns} columns, need 2..${GRID_LIMITS.columns}`);
            if (!isInt(v.rows) || v.rows < 2 || v.rows > GRID_LIMITS.rows) out.push(`${v.rows} rows, need 2..${GRID_LIMITS.rows}`);
            if (v.items.length < GRID_LIMITS.minItems || v.items.length > GRID_LIMITS.maxItems) {
                out.push(`${v.items.length} grid items, need ${GRID_LIMITS.minItems}..${GRID_LIMITS.maxItems}`);
            }
            const seen = new Set<string>();
            for (const it of v.items) {
                if (!GRID_ITEMS.some((g) => g.id === it.item)) out.push(`unknown grid item ${it.item}`);
                if (!isInt(it.col) || !isInt(it.row) || it.col < 0 || it.col >= v.columns || it.row < 0 || it.row >= v.rows) {
                    out.push(`grid item at ${it.col},${it.row} outside the grid`);
                }
                const at = `${it.col},${it.row}`;
                if (seen.has(at)) out.push(`two grid items on cell ${at}`);
                seen.add(at);
            }
            break;
        }
        case 'figure': {
            if (v.vertices.length < 3) out.push(`figure has ${v.vertices.length} vertices, need 3 or more`);
            if (v.sides.length !== v.vertices.length) out.push(`${v.sides.length} side labels for ${v.vertices.length} vertices`);
            if (v.lattice) {
                if (v.vertices.some(([x, y]) => !isInt(x) || !isInt(y))) out.push('lattice figure needs whole-number vertices');
                v.vertices.forEach(([x, y], i) => {
                    const [nx, ny] = v.vertices[(i + 1) % v.vertices.length] ?? [x, y];
                    if (x !== nx && y !== ny) out.push(`lattice edge ${i} is not horizontal or vertical`);
                });
            }
            break;
        }
        default: {
            const unreachable: never = v;
            out.push(`unknown visual ${JSON.stringify(unreachable)}`);
        }
    }
    return out;
};

/** One line for `npm run sample`. */
export const describeVisual = (v: TaskVisual): string => {
    switch (v.kind) {
        case 'clock':
            return `[clock ${formatTime(v.hour, v.minute)}]`;
        case 'ruler': {
            const [from, to, unit] = v.unit === 'cm' ? [v.fromMm / 10, v.toMm / 10, 'cm'] : [v.fromMm, v.toMm, 'mm'];
            return `[ruler 0–${v.lengthCm} cm, ${from}–${to} ${unit}]`;
        }
        case 'blocks':
            return `[blocks ${v.hundreds} 100, ${v.tens} 10, ${v.ones} 1]`;
        case 'bars':
            return `[bars ${v.bars.map((b) => `${b.label}=${b.value}`).join(' ')}, scale ${v.scaleMax}]`;
        case 'money':
            return `[money ${v.items.join(' ')} = ${formatMoney(v.items.reduce((sum, id) => sum + (MONEY.find((m) => m.id === id)?.grosze ?? 0), 0))}]`;
        case 'scale':
            return `[scale ${v.item} | ${v.weights.join(' ')}]`;
        case 'jugs': {
            const runs: { id: JugId; n: number }[] = [];
            for (const id of v.jugs) {
                const last = runs[runs.length - 1];
                if (last?.id === id) last.n += 1;
                else runs.push({ id, n: 1 });
            }
            return `[jugs ${runs.map((r) => `${r.n} × ${JUGS.find((j) => j.id === r.id)?.label ?? r.id}`).join(', ')}]`;
        }
        case 'thermometer':
            return `[thermometer ${formatCelsius(v.celsius)}]`;
        case 'icons':
            return `[icons ${v.icon} ${v.groups.join('+')}${v.framed ? ' framed' : ''}]`;
        case 'cells':
            return `[cells ${v.layout} ${v.values.map((x) => x ?? '_').join(' ')}]`;
        case 'grid':
            return `[grid ${v.columns}×${v.rows} ${v.items.map((i) => `${GRID_ITEMS.find((g) => g.id === i.item)?.noun ?? i.item} ${String.fromCharCode(65 + i.col)}${i.row + 1}`).join(', ')}]`;
        case 'figure':
            return v.lattice ? `[figure lattice ${v.vertices.length} vertices]` : `[figure ${v.sides.map((x) => (x === null ? '?' : `${x} cm`)).join(' ')}]`;
    }
};
