// Drawing descriptions carried by a task (S-13): numbers and labels only, no colours or pixels.
// The scene decides how to draw them; core only validates and keys them.
import { ICONS, JUGS, MONEY, THERMOMETER, WEIGHTS, type IconId, type JugId, type MoneyId, type WeightId } from '../../data/measures';
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
    | { kind: 'icons'; icon: IconId; groups: readonly number[]; framed: boolean };

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
            if (v.items.length < 1 || v.items.length > 10) out.push(`${v.items.length} money items, need 1..10`);
            for (const id of v.items) if (!MONEY.some((m) => m.id === id)) out.push(`unknown money id ${id}`);
            break;
        case 'scale':
            if (!ICONS.some((i) => i.id === v.item)) out.push(`unknown scale item ${v.item}`);
            if (v.weights.length < 1 || v.weights.length > 6) out.push(`${v.weights.length} weights, need 1..6`);
            for (const id of v.weights) if (!WEIGHTS.some((w) => w.id === id)) out.push(`unknown weight id ${id}`);
            break;
        case 'jugs':
            if (v.jugs.length < 1 || v.jugs.length > 10) out.push(`${v.jugs.length} jugs, need 1..10`);
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
            if (v.groups.reduce((a, b) => a + b, 0) > 30) out.push('more than 30 icons');
            if (v.framed && (v.groups.length < 2 || v.groups.some((g) => g !== v.groups[0]))) out.push('framed icons need 2 or more equal groups');
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
    }
};
