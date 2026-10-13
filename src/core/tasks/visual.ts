// Drawing descriptions carried by a task (S-13): numbers and labels only, no colours or pixels.
// The scene decides how to draw them; core only validates and keys them.
import { formatTime } from '../text/time';
import type { SkillDef } from '../types';

export type AnswerMode = SkillDef['answer'];

export type TaskVisual =
    | { kind: 'clock'; hour: number; minute: number }
    | { kind: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; fromMm: number; toMm: number }
    | { kind: 'blocks'; hundreds: number; tens: number; ones: number }
    | { kind: 'bars'; bars: readonly { label: string; value: number }[]; scaleMax: number };

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
    }
};
