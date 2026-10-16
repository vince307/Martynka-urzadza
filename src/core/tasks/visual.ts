// Drawing descriptions carried by a task (S-13): numbers and labels only, no colours or pixels.
// The scene decides how to draw them; core only validates and keys them.
import { GRID_ITEMS, GRID_LIMITS, type GridItemId } from '../../data/gridItems';
import { balance } from '../../data/balance';
import { ART_LIMITS, ICONS, JUGS, MONEY, THERMOMETER, WEIGHTS, type IconId, type JugId, type MoneyId, type WeightId } from '../../data/measures';
import { PATTERN_LIMITS } from '../../data/shapes';
import { faceLabel, isFace } from './faces';
import { formatCelsius, formatMoney } from '../text/measure';
import { formatTime } from '../text/time';
import type { SkillDef } from '../types';

export type AnswerMode = SkillDef['answer'];

export type TaskVisual =
    // `set`: the child turns the hands; hour/minute are the start pose and `snap` (60 or 5 minutes) the only source of the snapping.
    | { kind: 'clock'; hour: number; minute: number; set?: true; snap?: 60 | 5 }
    | { kind: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; fromMm: number; toMm: number }
    | { kind: 'blocks'; hundreds: number; tens: number; ones: number }
    | { kind: 'bars'; bars: readonly { label: string; value: number }[]; scaleMax: number }
    // `pay` (S-14d, MONEY_PAY): nothing lies on the table (`items` empty); the child pays from a tray of these nominals (1..4 kinds).
    | { kind: 'money'; items: readonly MoneyId[]; pay?: { tray: readonly MoneyId[]; fewest: boolean } }
    | { kind: 'scale'; item: IconId; weights: readonly WeightId[] }
    | { kind: 'jugs'; jugs: readonly JugId[] }
    | { kind: 'thermometer'; celsius: number }
    // `motion` (S-14d): two groups where the second one comes to the first ('come', an arrow towards it) or leaves it ('go').
    // `sides` (S-14d visual gate, COMPARE_QTY): two groups side by side, each in its own frame, the first one on the left.
    | { kind: 'icons'; icon: IconId; groups: readonly number[]; framed: boolean; motion?: 'come' | 'go'; sides?: true }
    // A row of different icons with a start mark on its left (S-14d, ORDINAL): the child counts the place from the mark.
    | { kind: 'row'; icons: readonly IconId[]; mark: 'left' }
    // Number cells (S-13b): row-major 3x3 magic square, or a pyramid as [top, middle x2, base x3]; exactly one cell is null (the empty one).
    | { kind: 'cells'; layout: 'square3' | 'pyramid3'; values: readonly (number | null)[] }
    // A square grid with labelled columns (A..) and rows (1..) and items on distinct cells (col, row are zero-based).
    | { kind: 'grid'; columns: number; rows: number; items: readonly { item: GridItemId; col: number; row: number }[] }
    // A polygon in lattice units; sides[i] labels the edge from vertex i to i+1 (null = no label).
    | { kind: 'figure'; lattice: boolean; vertices: readonly (readonly [number, number])[]; sides: readonly (number | null)[] }
    // A written column (S-14b): operands right-aligned, the result has exactly `columns` digits.
    | { kind: 'column'; op: '+' | '−'; a: number; b: number; columns: number }
    // A number line (S-14b): ticks every `tick` from `from` to `to`; `labels` are the numbers written under ticks, `box` the empty box, `jumps` arcs between ticks.
    | { kind: 'numberLine'; from: number; to: number; tick: number; labels: readonly number[]; box: number | null; jumps: readonly { from: number; to: number }[] }
    // A row of figures (S-14d): face codes, exactly one null (the empty place) and it is the last item.
    | { kind: 'pattern'; items: readonly (string | null)[] }
    // An arrow graph or table (S-14b): every input goes to its output by the rule "op n"; exactly one value is null (the empty field).
    | { kind: 'arrows'; layout: 'graph'; op: '+' | '−'; n: number; input: number | null; output: number | null }
    | { kind: 'arrows'; layout: 'table'; op: '+' | '−'; n: number; inputs: readonly number[]; outputs: readonly (number | null)[] };

/**
 * `tall` drawings are narrower than high and need the room beside the keypad solution; `long` ones (a number line) are far wider than
 * high and take the notebook's full width in a tiles task (visual gate S-14b); the rest are wide.
 */
export type VisualShape = 'wide' | 'tall' | 'long';

/** The answer modes with a layout for a tall drawing (`pictureLayout` `tallOf`). */
export const TALL_MODES = ['tiles', 'keypad'] as const;

/** A widget pools a fixed number of images (`ART_LIMITS`); a drawing past the pool is a data bug, so it throws instead of dropping pieces. */
export const assertPool = (count: number, limit: number, what: string): void => {
    if (!Number.isInteger(count) || count > limit) {
        throw new RangeError(`${what}: ${count} pieces, the pool holds ${limit}`);
    }
};

/** Number of ticks of a drawn number line; throws on a step below 1 or more ticks than the line can label. */
export const lineTicks = (line: { from: number; to: number; tick: number }): number => {
    if (!(line.tick >= 1)) {
        throw new RangeError(`number line: tick ${line.tick} is below 1`);
    }
    const ticks = Math.floor((line.to - line.from) / line.tick) + 1;
    if (ticks > balance.numberLine.maxTicks) {
        throw new RangeError(`number line: ${ticks} ticks, at most ${balance.numberLine.maxTicks}`);
    }
    return ticks;
};

export const visualShape = (v: TaskVisual): VisualShape => (v.kind === 'thermometer' ? 'tall' : v.kind === 'numberLine' || v.kind === 'pattern' || v.kind === 'row' ? 'long' : 'wide');

/** Stable identity of a drawing (fixed field order); '' for none. */
export const visualKey = (v: TaskVisual | undefined): string => {
    if (!v) {
        return '';
    }
    switch (v.kind) {
        case 'clock':
            return v.set ? `clock:${v.hour}:${v.minute}:set:${v.snap ?? ''}` : `clock:${v.hour}:${v.minute}`;
        case 'ruler':
            return `ruler:${v.unit}:${v.lengthCm}:${v.fromMm}:${v.toMm}`;
        case 'blocks':
            return `blocks:${v.hundreds}:${v.tens}:${v.ones}`;
        case 'bars':
            return `bars:${v.scaleMax}:${v.bars.map((b) => `${b.label}=${b.value}`).join(',')}`;
        case 'money':
            return v.pay ? `money:pay:${v.pay.fewest ? 'fewest' : 'any'}:${v.pay.tray.join(',')}` : `money:${v.items.join(',')}`;
        case 'scale':
            return `scale:${v.item}:${v.weights.join(',')}`;
        case 'jugs':
            return `jugs:${v.jugs.join(',')}`;
        case 'thermometer':
            return `thermometer:${v.celsius}`;
        case 'icons':
            return `icons:${v.icon}:${v.framed ? 'framed' : v.sides ? 'sides' : 'plain'}:${v.groups.join(',')}${v.motion ? `:${v.motion}` : ''}`;
        case 'row':
            return `row:${v.mark}:${v.icons.join(',')}`;
        case 'cells':
            return `cells:${v.layout}:${v.values.map((x) => x ?? '_').join(',')}`;
        case 'grid':
            return `grid:${v.columns}x${v.rows}:${v.items.map((i) => `${i.item}@${i.col},${i.row}`).join(';')}`;
        case 'figure':
            return `figure:${v.lattice ? 'lattice' : 'free'}:${v.vertices.map(([x, y]) => `${x},${y}`).join(';')}:${v.sides.map((x) => x ?? '_').join(',')}`;
        case 'column':
            return `column:${v.op}:${v.a}:${v.b}:${v.columns}`;
        case 'arrows':
            return v.layout === 'graph'
                ? `arrows:graph:${v.op}:${v.n}:${v.input ?? '_'}:${v.output ?? '_'}`
                : `arrows:table:${v.op}:${v.n}:${v.inputs.join(',')}:${v.outputs.map((x) => x ?? '_').join(',')}`;
        case 'pattern':
            return `pattern:${v.items.map((x) => x ?? '_').join(',')}`;
        case 'numberLine':
            return `line:${v.from}:${v.to}:${v.tick}:${v.labels.join(',')}:${v.box ?? '_'}:${v.jumps.map((j) => `${j.from}>${j.to}`).join(',')}`;
    }
};

/**
 * Ids of the loaded pictures a drawing is made of (what `missingIds` names), so a round can redraw a task whose picture is missing.
 * Drawn-in-code kinds return []. The shared frames (`balance-scale`, `thermometer-frame`) are not listed: every scale or
 * thermometer task uses them, so a redraw cannot avoid them.
 */
export const visualArtIds = (v: TaskVisual): readonly string[] => {
    switch (v.kind) {
        case 'icons':
            return [v.icon];
        case 'row':
            return v.icons;
        case 'scale':
            return [v.item, ...v.weights];
        case 'money':
            return v.pay ? v.pay.tray : v.items;
        case 'jugs':
            return v.jugs;
        case 'clock':
        case 'ruler':
        case 'blocks':
        case 'bars':
        case 'thermometer':
        case 'cells':
        case 'grid':
        case 'figure':
        case 'column':
        case 'arrows':
        case 'pattern':
        case 'numberLine':
            return [];
        default: {
            const never: never = v;
            return never;
        }
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
            if (v.set) {
                if (v.snap !== 60 && v.snap !== 5) out.push(`clock to set needs snap 60 or 5, got ${String(v.snap)}`);
                if (v.hour < 1 || v.hour > 12) out.push(`clock to set starts on hour ${v.hour}, need 1..12`);
                if (v.snap && v.minute % v.snap !== 0 && !(v.snap === 60 && v.minute === 0)) out.push(`clock to set starts on minute ${v.minute}, off the snap ${v.snap}`);
            } else if (v.snap !== undefined) {
                out.push('clock snap without set');
            }
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
            if (v.pay) {
                // Paying: the table is empty and the tray holds 1..4 different nominals.
                if (v.items.length > 0) out.push(`${v.items.length} money items beside a payment tray, need an empty table`);
                if (v.pay.tray.length < 1 || v.pay.tray.length > ART_LIMITS.trayKinds) out.push(`${v.pay.tray.length} tray kinds, need 1..${ART_LIMITS.trayKinds}`);
                if (new Set(v.pay.tray).size !== v.pay.tray.length) out.push('duplicate tray nominal');
                for (const id of v.pay.tray) if (!MONEY.some((m) => m.id === id)) out.push(`unknown money id ${id}`);
                break;
            }
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
            if (v.motion !== undefined && (v.groups.length !== 2 || v.framed)) out.push('an icon motion needs exactly two plain groups');
            if (v.sides && (v.groups.length !== 2 || v.framed || v.motion !== undefined)) out.push('groups side by side need exactly two plain groups without a motion');
            break;
        }
        case 'row': {
            if (v.icons.length < ART_LIMITS.rowMinIcons || v.icons.length > ART_LIMITS.rowIcons) {
                out.push(`${v.icons.length} icons in a row, need ${ART_LIMITS.rowMinIcons}..${ART_LIMITS.rowIcons}`);
            }
            if (new Set(v.icons).size !== v.icons.length) out.push('the icons of a row must differ');
            for (const id of v.icons) if (!ICONS.some((i) => i.id === id)) out.push(`unknown row icon ${id}`);
            if (v.mark !== 'left') out.push(`row mark ${String(v.mark)} is not left`);
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
        case 'column': {
            const wider = Math.max(v.a, v.b);
            if (!isInt(v.a) || !isInt(v.b) || v.a < 0 || v.b < 0) out.push('column operands must be whole numbers from 0');
            if (v.columns !== String(wider).length) out.push(`${v.columns} columns for the ${String(wider).length}-digit ${wider}`);
            const result = v.op === '+' ? v.a + v.b : v.a - v.b;
            if (result < 0) out.push(`negative column result ${result}`);
            else if (String(result).length !== v.columns) out.push(`column result ${result} does not have ${v.columns} digits`);
            break;
        }
        case 'pattern': {
            const shown = v.items.slice(0, -1);
            if (v.items.at(-1) !== null) out.push('pattern must end with the empty place');
            if (shown.some((x) => x === null)) out.push('pattern has more than one empty place');
            if (shown.length < PATTERN_LIMITS.minShown || shown.length > PATTERN_LIMITS.maxShown) {
                out.push(`${shown.length} shown figures, need ${PATTERN_LIMITS.minShown}..${PATTERN_LIMITS.maxShown}`);
            }
            for (const x of shown) if (x !== null && !isFace(x)) out.push(`pattern item ${JSON.stringify(x)} is not a face`);
            break;
        }
        case 'numberLine': {
            if (!isInt(v.from) || !isInt(v.to) || !isInt(v.tick) || v.tick < 1 || v.from >= v.to) {
                out.push(`number line from ${v.from} to ${v.to} every ${v.tick} is not a rising whole-number scale`);
                break;
            }
            if ((v.to - v.from) % v.tick !== 0) out.push(`number line ${v.from}..${v.to} is not a whole number of ticks of ${v.tick}`);
            const ticks = Math.floor((v.to - v.from) / v.tick) + 1;
            if (ticks > balance.numberLine.maxTicks) out.push(`${ticks} ticks, at most ${balance.numberLine.maxTicks}`);
            const onTick = (n: number): boolean => isInt(n) && n >= v.from && n <= v.to && (n - v.from) % v.tick === 0;
            for (const n of v.labels) if (!onTick(n)) out.push(`label ${n} is not on a tick in the range`);
            if (v.box !== null && !onTick(v.box)) out.push(`box ${v.box} is not on a tick in the range`);
            for (const j of v.jumps) if (!onTick(j.from) || !onTick(j.to)) out.push(`jump ${j.from}>${j.to} does not start and end on a tick`);
            break;
        }
        case 'arrows': {
            const max = balance.arrows.maxValue;
            const go = (x: number): number => (v.op === '+' ? x + v.n : x - v.n);
            if (!isInt(v.n) || v.n < 1) out.push(`arrow rule step ${v.n} is not a positive whole number`);
            const pairs: { input: number | null; output: number | null }[] =
                v.layout === 'graph' ? [{ input: v.input, output: v.output }] : v.inputs.map((input, i) => ({ input, output: v.outputs[i] ?? null }));
            if (v.layout === 'table') {
                if (v.outputs.length !== v.inputs.length) out.push(`${v.outputs.length} outputs for ${v.inputs.length} inputs`);
                if (v.inputs.length < balance.arrows.tableMin || v.inputs.length > balance.arrows.tableMax) {
                    out.push(`${v.inputs.length} table rows, need ${balance.arrows.tableMin}..${balance.arrows.tableMax}`);
                }
                if (new Set(v.inputs).size !== v.inputs.length) out.push('duplicate table inputs');
            }
            const empty = pairs.reduce((n, p) => n + (p.input === null ? 1 : 0) + (p.output === null ? 1 : 0), 0);
            if (empty !== 1) out.push(`arrows drawing needs exactly one empty field, got ${empty}`);
            for (const p of pairs) {
                // The empty field is derived from the other one of its pair.
                const input = p.input ?? (p.output === null ? null : v.op === '+' ? p.output - v.n : p.output + v.n);
                const output = p.output ?? (p.input === null ? null : go(p.input));
                if (input === null || output === null) continue;
                if (go(input) !== output) out.push(`arrow ${input} to ${output} is off the rule ${v.op}${v.n}`);
                for (const x of [input, output]) if (!isInt(x) || x < 0 || x > max) out.push(`arrow value ${x} outside 0..${max}`);
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
            return v.set ? `[clock set from ${formatTime(v.hour, v.minute)}]` : `[clock ${formatTime(v.hour, v.minute)}]`;
        case 'ruler': {
            const [from, to, unit] = v.unit === 'cm' ? [v.fromMm / 10, v.toMm / 10, 'cm'] : [v.fromMm, v.toMm, 'mm'];
            return `[ruler 0–${v.lengthCm} cm, ${from}–${to} ${unit}]`;
        }
        case 'blocks':
            return `[blocks ${v.hundreds} 100, ${v.tens} 10, ${v.ones} 1]`;
        case 'bars':
            return `[bars ${v.bars.map((b) => `${b.label}=${b.value}`).join(' ')}, scale ${v.scaleMax}]`;
        case 'money':
            if (v.pay) return `[money tray ${v.pay.tray.join(' ')}${v.pay.fewest ? ', fewest' : ''}]`;
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
            return `[icons ${v.icon} ${v.groups.join(v.sides ? '|' : '+')}${v.framed ? ' framed' : ''}${v.motion ? ` ${v.motion}` : ''}]`;
        case 'row':
            return `[row ${v.icons.join(' ')}]`;
        case 'cells':
            return `[cells ${v.layout} ${v.values.map((x) => x ?? '_').join(' ')}]`;
        case 'grid':
            return `[grid ${v.columns}×${v.rows} ${v.items.map((i) => `${GRID_ITEMS.find((g) => g.id === i.item)?.noun ?? i.item} ${String.fromCharCode(65 + i.col)}${i.row + 1}`).join(', ')}]`;
        case 'figure':
            return v.lattice ? `[figure lattice ${v.vertices.length} vertices]` : `[figure ${v.sides.map((x) => (x === null ? '?' : `${x} cm`)).join(' ')}]`;
        case 'column':
            return `[column ${v.a} ${v.op} ${v.b}]`;
        case 'arrows':
            return v.layout === 'graph'
                ? `[arrows graph ${v.input ?? '□'} ${v.op === '+' ? '+' : '−'}${v.n} ${v.output ?? '□'}]`
                : `[arrows table ${v.op === '+' ? '+' : '−'}${v.n}: ${v.inputs.map((x, i) => `${x}>${v.outputs[i] ?? '□'}`).join(' ')}]`;
        case 'pattern':
            return `[pattern ${v.items.map((x) => (x === null ? '□' : faceLabel(x, { size: false }))).join(', ')}]`;
        case 'numberLine':
            return `[line ${v.from}–${v.to}/${v.tick}${v.labels.length ? ` labels ${v.labels.join(' ')}` : ''}${v.box !== null ? ` box ${v.box}` : ''}${v.jumps.length ? ` jumps ${v.jumps.map((j) => `${j.from}>${j.to}`).join(' ')}` : ''}]`;
    }
};
