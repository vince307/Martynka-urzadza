// LENGTH: read a drawn ruler (a segment that may start away from zero) and
// convert metres to centimetres (ZADANIA.md, section 4). Whole-number answers
// on the keypad: centimetres in E3, millimetres in E4.
import { SCALE_PLACES, SCALE_PLAN_CM, TWO_UNIT_PAIRS, type TwoUnitPair } from '../../../data/measures';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { BOX, DIVIDE, MINUS, TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export type LengthParams =
    | { variant: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; minMm: number; maxMm: number; startShift: number }
    | { variant: 'convert'; maxM: number; cmStep: number }
    | { variant: 'scale'; scales: number[]; max: number }
    | { variant: 'twoUnit'; pairs: TwoUnitPair[]; max: number };


const isInt = (x: unknown): x is number => Number.isInteger(x);

interface ScaleOption {
    per: number;
    place: string;
    plan: number;
}

/** Every (scale, place, plan length) with a whole real length inside the place's range and under `max`. */
const scaleOptions = (scales: readonly number[], max: number): ScaleOption[] =>
    scales.flatMap((per) =>
        SCALE_PLACES.flatMap(({ subject, minM, maxM }) => {
            const out: ScaleOption[] = [];
            for (let plan = SCALE_PLAN_CM.min; plan <= SCALE_PLAN_CM.max; plan += 1) {
                const real = plan * per;
                if (real >= minM && real <= maxM && real <= max) out.push({ per, place: subject, plan });
            }
            return out;
        }),
    );

/** The larger part of a two-unit expression: 1..maxBig, less where `max` could not hold the total. */
const bigLimit = (pair: TwoUnitPair, max: number): number => {
    const { factor, maxBig } = TWO_UNIT_PAIRS[pair];
    return Math.min(maxBig, Math.floor((max - (factor - 1)) / factor));
};

export const parseLengthParams = (params: Record<string, unknown>): LengthParams => {
    const { variant } = params;
    if (variant === 'scale') {
        const { scales, max } = params;
        if (!Array.isArray(scales) || scales.length === 0 || !scales.every((x) => isInt(x) && x >= 2 && x <= 10) || new Set(scales).size !== scales.length) {
            throw new TypeError('LENGTH scale needs params.scales: distinct whole numbers of metres per centimetre, 2..10');
        }
        if (!isInt(max) || max < 1) throw new TypeError(`LENGTH scale needs an integer params.max >= 1, got ${String(max)}`);
        for (const per of scales as number[]) {
            if (scaleOptions([per], max).length === 0) throw new TypeError(`LENGTH scale ${per} m per cm has no plan that fits under ${max} m`);
        }
        return { variant, scales: scales as number[], max };
    }
    if (variant === 'twoUnit') {
        const { pairs, max } = params;
        const known = Object.keys(TWO_UNIT_PAIRS);
        if (!Array.isArray(pairs) || pairs.length === 0 || !pairs.every((x) => known.includes(x as string)) || new Set(pairs).size !== pairs.length) {
            throw new TypeError(`LENGTH twoUnit needs distinct params.pairs from ${known.join(', ')}`);
        }
        if (!isInt(max)) throw new TypeError(`LENGTH twoUnit needs an integer params.max, got ${String(max)}`);
        for (const pair of pairs as TwoUnitPair[]) {
            if (bigLimit(pair, max) < TWO_UNIT_PAIRS[pair].minBig) throw new TypeError(`LENGTH twoUnit ${pair} does not fit under ${max}`);
        }
        return { variant, pairs: pairs as TwoUnitPair[], max };
    }
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
    throw new TypeError(`LENGTH params.variant must be ruler, convert, scale or twoUnit, got ${String(variant)}`);
};

const generateScale = (skillId: string, p: Extract<LengthParams, { variant: 'scale' }>, rng: Rng): Task => {
    const { per, place, plan } = rng.pick(scaleOptions(p.scales, p.max));
    const real = plan * per;
    if (rng.chance(0.5)) {
        return {
            skillId,
            prompt: pl.tasks.lengthScalePlanPrompt(per, place, plan),
            answer: real,
            hint: [pl.tasks.lengthScalePlanFirst, `${plan} ${TIMES} ${per} = ${real}`, pl.tasks.lengthScalePlanAnswer(place, real)],
        };
    }
    return {
        skillId,
        prompt: pl.tasks.lengthScaleRealPrompt(per, place, real),
        answer: plan,
        hint: [pl.tasks.lengthScaleRealFirst, `${real} ${DIVIDE} ${per} = ${plan}`, pl.tasks.lengthScaleRealAnswer(place, plan)],
    };
};

const generateTwoUnit = (skillId: string, p: Extract<LengthParams, { variant: 'twoUnit' }>, rng: Rng): Task => {
    const pair = rng.pick(p.pairs);
    const { big, small, factor, minBig } = TWO_UNIT_PAIRS[pair];
    const bigN = rng.int(minBig, bigLimit(pair, p.max));
    // Under a hundred the small part sometimes has a leading zero in the total (2 m 5 cm = 205 cm): the trap worth practising.
    const smallN = factor === 100 && rng.chance(0.3) ? rng.int(1, 9) : rng.int(factor === 100 ? 10 : 1, factor - 1);
    const total = bigN * factor + smallN;
    const fact = pl.tasks.lengthFact(big, factor, small);
    const product = `${bigN} ${TIMES} ${factor} = ${bigN * factor}`;
    if (rng.chance(0.5)) {
        return { skillId, prompt: `${bigN} ${big} ${smallN} ${small} = ${BOX} ${small}`, answer: total, hint: [fact, product, `${bigN * factor} + ${smallN} = ${total}`] };
    }
    return { skillId, prompt: `${total} ${small} = ${bigN} ${big} ${BOX} ${small}`, answer: smallN, hint: [fact, product, `${total} ${MINUS} ${bigN * factor} = ${smallN}`] };
};

export const generateLength: Generator = (skill, rng): Task => {
    const p = parseLengthParams(skill.params);
    if (p.variant === 'scale') return generateScale(skill.id, p, rng);
    if (p.variant === 'twoUnit') return generateTwoUnit(skill.id, p, rng);
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
