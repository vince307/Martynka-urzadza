// PLACE_VALUE: hundreds, tens and ones (ZADANIA.md, section 4). Variants: `read`
// (blocks -> the number), `tens` (blocks -> how many tens), `decompose`
// ("47 = 40 + □", no drawing) and `build` ("Zbuduj z klocków liczbę 23.", no
// drawing: the child drags blocks onto the mat, answer mode `drag`).
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { formatNumber } from '../../text/formatNumber';
import { countNoun } from '../../text/plural';
import { BOX, MINUS } from '../symbols';
import { drawUntil } from '../retry';
import type { Generator, Task } from '../types';

export type PlaceValueVariant = 'read' | 'tens' | 'decompose' | 'build' | 'thousands' | 'orders';

export interface PlaceValueParams {
    variant: PlaceValueVariant;
    min: number;
    max: number;
}

const VARIANTS: readonly PlaceValueVariant[] = ['read', 'tens', 'decompose', 'build', 'thousands', 'orders'];

export const parsePlaceValueParams = (params: Record<string, unknown>): PlaceValueParams => {
    const { variant, min, max } = params;
    if (!VARIANTS.includes(variant as PlaceValueVariant)) {
        throw new TypeError(`PLACE_VALUE params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    }
    if (variant === 'thousands' || variant === 'orders') {
        // Text-only variants: no drawing, so the 999 limit of the block variants does not apply (the keypad takes 7 digits).
        const [low, high] = variant === 'thousands' ? [1001, 10000] : [110000, 1000000];
        if (typeof max !== 'number' || !Number.isInteger(max) || max < low || max > high) {
            throw new TypeError(`PLACE_VALUE ${variant} needs an integer params.max within ${low}..${high}, got ${String(max)}`);
        }
        return { variant, min: variant === 'thousands' ? 1000 : 10000, max };
    }
    if (typeof min !== 'number' || typeof max !== 'number' || !Number.isInteger(min) || !Number.isInteger(max) || min < 1 || min > max) {
        throw new TypeError(`PLACE_VALUE needs integer params.min and params.max with 1 <= min <= max, got ${String(min)}..${String(max)}`);
    }
    if (max > 999) {
        throw new TypeError(`PLACE_VALUE blocks show at most 999, got params.max ${max}`);
    }
    if (variant === 'build' && max > 99) {
        throw new TypeError(`PLACE_VALUE build works without hundreds (params.max <= 99), got ${max}`);
    }
    if (variant === 'tens' && (min < 10 || max > 99)) {
        throw new TypeError(`PLACE_VALUE tens needs two-digit numbers (10..99), got ${min}..${max}`);
    }
    if (variant === 'decompose') {
        let feasible = false;
        for (let n = min; n <= max && !feasible; n += 1) {
            feasible = n % 10 !== 0 && n > 10;
        }
        if (!feasible) {
            throw new TypeError(`PLACE_VALUE decompose needs a number above 10 that is not a full ten within ${min}..${max}`);
        }
    }
    return { variant: variant as PlaceValueVariant, min, max };
};

const PLACE_VALUES = [1000, 100, 10, 1] as const;
const PLACE_NAMES = [pl.tasks.placeValuePlaces.thousands, pl.tasks.placeValuePlaces.hundreds, pl.tasks.placeValuePlaces.tens, pl.tasks.placeValuePlaces.ones] as const;
const PLACE_NOUNS = [nouns.tysiąc, nouns.setka, nouns.dziesiątka, nouns.jedność] as const;

/** The narrator reads digits; a grouping space between them would split the number. */
const withSpeech = (task: Task): Task => {
    const plain = task.prompt.replace(/(?<=\d)\u00A0(?=\d)/gu, '');
    return plain === task.prompt ? task : { ...task, speak: plain };
};

const digitsOf = (n: number): number[] => PLACE_VALUES.map((v) => Math.floor(n / v) % 10);

const MAX_FOUR_DIGIT_ATTEMPTS = 1000;

/** A four-digit number with at least two non-zero digits (so a part is left when one is hidden). */
const drawFourDigit = (p: PlaceValueParams, rng: Rng): number[] => {
    for (let attempt = 0; attempt < MAX_FOUR_DIGIT_ATTEMPTS; attempt += 1) {
        const digits = digitsOf(rng.int(1000, Math.min(p.max, 9999)));
        if (digits.filter((d) => d > 0).length >= 2) {
            return digits;
        }
    }
    throw new Error(`PLACE_VALUE thousands: no four-digit number after ${MAX_FOUR_DIGIT_ATTEMPTS} attempts (max ${p.max})`);
};

const generateThousands = (skillId: string, p: PlaceValueParams, rng: Rng): Task => {
    const digits = drawFourDigit(p, rng);
    const n = digits.reduce((sum, d, i) => sum + d * PLACE_VALUES[i], 0);
    const nonZero = digits.map((_d, i) => i).filter((i) => digits[i] > 0);
    const kind = rng.int(0, 2);
    if (kind === 0) {
        const i = rng.pick(nonZero);
        return {
            skillId,
            prompt: pl.tasks.placeValueDigitPrompt(PLACE_NAMES[i], n),
            answer: digits[i],
            hint: [pl.tasks.placeValueDigitHint, pl.tasks.placeValueDigitLine(n, ...(digits as [number, number, number, number])), pl.tasks.placeValueDigitAnswerHint(PLACE_NAMES[i], digits[i])],
        };
    }
    if (kind === 1) {
        const hidden = rng.pick(nonZero);
        const terms = nonZero.map((i) => (i === hidden ? BOX : String(digits[i] * PLACE_VALUES[i])));
        const known = nonZero.filter((i) => i !== hidden).map((i) => digits[i] * PLACE_VALUES[i]);
        const answer = digits[hidden] * PLACE_VALUES[hidden];
        return {
            skillId,
            prompt: `${n} = ${terms.join(' + ')}`,
            answer,
            hint: [pl.tasks.placeValueGapHint, `${[n, ...known].join(` ${MINUS} `)} = ${answer}`],
        };
    }
    const parts = nonZero.map((i) => countNoun(digits[i], PLACE_NOUNS[i]));
    const phrase = pl.tasks.placeValueJoin(parts);
    const values = nonZero.map((i) => digits[i] * PLACE_VALUES[i]);
    return {
        skillId,
        prompt: pl.tasks.placeValueComposeSentence(phrase),
        answer: n,
        hint: [
            pl.tasks.placeValueComposeHint,
            nonZero.map((i) => pl.tasks.placeValuePartValue(countNoun(digits[i], PLACE_NOUNS[i]), digits[i] * PLACE_VALUES[i])).join(', ') + '.',
            `${values.join(' + ')} = ${n}`,
        ],
    };
};

const generateOrders = (skillId: string, p: PlaceValueParams, rng: Rng): Task => {
    if (rng.chance(0.7)) {
        // Composed number: the answer has six digits (a hundred thousand and up).
        const pairs: [number, number][] = [];
        for (let hundreds = 1; hundreds <= 9; hundreds += 1) {
            for (let tens = 1; tens <= 9; tens += 1) {
                if (hundreds * 100000 + tens * 10000 <= p.max) pairs.push([hundreds, tens * 10]);
            }
        }
        const [hundreds, thousands] = rng.pick(pairs);
        const answer = hundreds * 100000 + thousands * 1000;
        return withSpeech({
            skillId,
            prompt: pl.tasks.placeValueComposeSentence(pl.tasks.placeValueOrdersCompose(hundreds, thousands)),
            answer,
            hint: [pl.tasks.placeValueComposeHint, pl.tasks.placeValueOrdersComposeLine(hundreds, thousands), `${formatNumber(hundreds * 100000)} + ${formatNumber(thousands * 1000)} = ${formatNumber(answer)}`],
        });
    }
    if (rng.chance(0.5)) {
        const k = rng.int(10, Math.floor(p.max / 1000));
        return withSpeech({
            skillId,
            prompt: pl.tasks.placeValueOrdersCountPrompt(k * 1000),
            answer: k,
            hint: [pl.tasks.placeValueOrdersCountHint, pl.tasks.placeValueOrdersCountAnswerHint(k * 1000, k)],
        });
    }
    const d = rng.int(1, Math.min(9, Math.floor(p.max / 100000)));
    return withSpeech({
        skillId,
        prompt: pl.tasks.placeValueOrdersHundredsPrompt(d * 100000),
        answer: d,
        hint: [pl.tasks.placeValueOrdersHundredsHint, pl.tasks.placeValueOrdersHundredsAnswerHint(d * 100000, d)],
    });
};

export const generatePlaceValue: Generator = (skill, rng): Task => {
    const p = parsePlaceValueParams(skill.params);
    if (p.variant === 'thousands') {
        return generateThousands(skill.id, p, rng);
    }
    if (p.variant === 'orders') {
        return generateOrders(skill.id, p, rng);
    }
    const n =
        p.variant === 'decompose'
            ? drawUntil(`PLACE_VALUE decompose ${p.min}..${p.max}`, () => rng.int(p.min, p.max), (x) => x % 10 !== 0 && x > 10)
            : rng.int(p.min, p.max);
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    const blocks = { kind: 'blocks', hundreds: h, tens: t, ones: o } as const;

    if (p.variant === 'read') {
        const hint: string[] = [h > 0 ? pl.tasks.placeValueReadHundredsHint : pl.tasks.placeValueReadHint];
        if (h > 0) hint.push(pl.tasks.placeValueHundredsLine(h));
        if (t > 0) hint.push(pl.tasks.placeValueTensLine(t));
        const parts = [h * 100, t * 10, o].filter((x) => x > 0);
        if (parts.length > 1) hint.push(`${parts.join(' + ')} = ${n}`);
        hint.push(pl.tasks.placeValueReadAnswerHint(n));
        return { skillId: skill.id, prompt: pl.tasks.placeValueRead, speak: pl.tasks.placeValueReadSpeak, visual: blocks, answer: n, hint };
    }
    if (p.variant === 'tens') {
        return {
            skillId: skill.id,
            prompt: pl.tasks.placeValueTens,
            speak: pl.tasks.placeValueTensSpeak,
            visual: blocks,
            answer: t,
            hint: [pl.tasks.placeValueTensHint, pl.tasks.placeValueTensAnswerHint(t)],
        };
    }
    if (p.variant === 'decompose') {
        const rest = n - o;
        return {
            skillId: skill.id,
            prompt: `${n} = ${rest} + ${BOX}`,
            answer: o,
            hint: [pl.tasks.placeValueDecomposeHint, `${n} ${MINUS} ${rest} = ${o}`],
        };
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.placeValueBuild(n),
        answer: n,
        hint: [pl.tasks.placeValueBuildHint, pl.tasks.placeValueBuildAnswerHint(n, t, o)],
    };
};
