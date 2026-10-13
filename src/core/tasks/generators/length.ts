// LENGTH: read a drawn ruler (a segment that may start away from zero) and
// convert metres to centimetres (ZADANIA.md, section 4). Whole-number answers
// on the keypad: centimetres in E3, millimetres in E4.
import { pl } from '../../../data/pl';
import { MINUS, TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export type LengthParams =
    | { variant: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; minMm: number; maxMm: number; startShift: number }
    | { variant: 'convert'; maxM: number; cmStep: number };

const isInt = (x: unknown): x is number => Number.isInteger(x);

export const parseLengthParams = (params: Record<string, unknown>): LengthParams => {
    const { variant } = params;
    if (variant === 'convert') {
        const { maxM, cmStep } = params;
        if (!isInt(maxM) || maxM < 2) {
            throw new TypeError(`LENGTH convert needs an integer params.maxM >= 2, got ${String(maxM)}`);
        }
        if (!isInt(cmStep) || cmStep < 1 || cmStep > 50 || 100 % cmStep !== 0) {
            throw new TypeError(`LENGTH convert needs params.cmStep dividing 100 (1..50), got ${String(cmStep)}`);
        }
        return { variant, maxM, cmStep };
    }
    if (variant === 'ruler') {
        const { unit, lengthCm, minMm, maxMm, startShift } = params;
        if (unit !== 'cm' && unit !== 'mm') {
            throw new TypeError(`LENGTH ruler params.unit must be cm or mm, got ${String(unit)}`);
        }
        if (!isInt(lengthCm) || lengthCm < 1 || !isInt(minMm) || !isInt(maxMm) || minMm < 1 || minMm > maxMm) {
            throw new TypeError('LENGTH ruler needs integer lengthCm >= 1 and 1 <= minMm <= maxMm');
        }
        if (maxMm > lengthCm * 10) {
            throw new TypeError(`LENGTH ruler segment up to ${maxMm} mm does not fit a ${lengthCm} cm ruler`);
        }
        if (unit === 'cm' && (minMm % 10 !== 0 || maxMm % 10 !== 0)) {
            throw new TypeError('LENGTH cm ruler needs minMm and maxMm on whole centimetres');
        }
        if (typeof startShift !== 'number' || !(startShift >= 0 && startShift <= 1)) {
            throw new TypeError(`LENGTH ruler params.startShift must be within 0..1, got ${String(startShift)}`);
        }
        return { variant, unit, lengthCm, minMm, maxMm, startShift };
    }
    throw new TypeError(`LENGTH params.variant must be ruler or convert, got ${String(variant)}`);
};

export const generateLength: Generator = (skill, rng): Task => {
    const p = parseLengthParams(skill.params);
    if (p.variant === 'convert') {
        // 1 m with no centimetres would leave a one-line hint; a whole metre starts at 2 m.
        let metres = rng.int(1, p.maxM);
        const cm = rng.int(0, 100 / p.cmStep - 1) * p.cmStep;
        if (metres === 1 && cm === 0) {
            metres = rng.int(2, p.maxM);
        }
        const answer = 100 * metres + cm;
        const hint: string[] = [pl.tasks.lengthMetreHint];
        if (metres > 1) {
            hint.push(`${metres} ${TIMES} 100 = ${100 * metres}`);
        }
        if (cm > 0) {
            hint.push(`${100 * metres} + ${cm} = ${answer}`);
        }
        hint.push(pl.tasks.lengthConvertAnswerHint(answer));
        return { skillId: skill.id, prompt: pl.tasks.lengthConvert(metres, cm), answer, hint };
    }
    const grid = p.unit === 'cm' ? 10 : 1;
    const lenMm = rng.int(p.minMm / grid, p.maxMm / grid) * grid;
    const room = p.lengthCm * 10 - lenMm;
    // A segment that does not start at 0 starts on a whole centimetre, also on the millimetre ruler: one end read to the
    // millimetre is enough for grade 2 (teacher read, S-13 impl-review).
    const shifted = room >= 10 && rng.chance(p.startShift);
    const fromMm = shifted ? rng.int(1, Math.floor(room / 10)) * 10 : 0;
    const toMm = fromMm + lenMm;
    const [from, to, len] = [fromMm / grid, toMm / grid, lenMm / grid];
    const hint = shifted
        ? [pl.tasks.lengthReadMarksHint, `${to} ${MINUS} ${from} = ${len}`, pl.tasks.lengthAnswerHint(len, p.unit)]
        : [pl.tasks.lengthReadMarksHint, pl.tasks.lengthFromZeroHint(to, len, p.unit)];
    return {
        skillId: skill.id,
        prompt: pl.tasks.lengthRuler(p.unit),
        speak: pl.tasks.lengthRulerSpeak(p.unit),
        visual: { kind: 'ruler', unit: p.unit, lengthCm: p.lengthCm, fromMm, toMm },
        answer: len,
        hint,
    };
};
