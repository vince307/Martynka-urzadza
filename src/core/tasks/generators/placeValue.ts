// PLACE_VALUE: hundreds, tens and ones (ZADANIA.md, section 4). Variants: `read`
// (blocks -> the number), `tens` (blocks -> how many tens), `decompose`
// ("47 = 40 + □", no drawing) and `build` ("Zbuduj z klocków liczbę 23.", no
// drawing: the child drags blocks onto the mat, answer mode `drag`).
import { pl } from '../../../data/pl';
import { BOX, MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type PlaceValueVariant = 'read' | 'tens' | 'decompose' | 'build';

export interface PlaceValueParams {
    variant: PlaceValueVariant;
    min: number;
    max: number;
}

const VARIANTS: readonly PlaceValueVariant[] = ['read', 'tens', 'decompose', 'build'];

export const parsePlaceValueParams = (params: Record<string, unknown>): PlaceValueParams => {
    const { variant, min, max } = params;
    if (!VARIANTS.includes(variant as PlaceValueVariant)) {
        throw new TypeError(`PLACE_VALUE params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
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

export const generatePlaceValue: Generator = (skill, rng): Task => {
    const p = parsePlaceValueParams(skill.params);
    let n = rng.int(p.min, p.max);
    if (p.variant === 'decompose') {
        while (n % 10 === 0 || n <= 10) {
            n = rng.int(p.min, p.max);
        }
    }
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
