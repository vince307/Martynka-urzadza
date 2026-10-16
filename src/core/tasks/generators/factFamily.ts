// FACT_FAMILY: commutativity and checking an operation by its inverse
// (ZADANIA.md, section 4): "4 + 7 = 7 + □", "12 − 5 = 7. Sprawdź: 7 + 5 = □".
// `max` bounds every number in the prompt, for checkDiv the product as well.
import { pl } from '../../../data/pl';
import { arithLine } from '../arith';
import { BOX, DIVIDE, MINUS, TIMES } from '../symbols';
import { drawUntil } from '../retry';
import type { Generator, Task } from '../types';

export type FactVariant = 'swap' | 'checkSub' | 'checkAdd' | 'checkDiv';

export interface FactFamilyParams {
    max: number;
    variants: FactVariant[];
}

const VARIANTS: readonly FactVariant[] = ['swap', 'checkSub', 'checkAdd', 'checkDiv'];
/** Smallest `max` that leaves a task for the variant (swap needs a ≠ b, checkDiv 2 · 2). */
const MIN_MAX: Readonly<Record<FactVariant, number>> = { swap: 3, checkSub: 2, checkAdd: 2, checkDiv: 4 };
/** checkDiv keeps divisor and quotient in the times table (2–10). */
const TABLE = 10;
const isVariant = (value: unknown): value is FactVariant => VARIANTS.includes(value as FactVariant);

export const parseFactFamilyParams = (params: Record<string, unknown>): FactFamilyParams => {
    const { max, variants } = params;
    if (!Number.isInteger(max) || (max as number) < 3) {
        throw new TypeError(`FACT_FAMILY params.max must be an integer >= 3, got ${String(max)}`);
    }
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every(isVariant)) {
        throw new TypeError(`FACT_FAMILY params.variants must be a non-empty list of ${VARIANTS.join(', ')}, got ${JSON.stringify(variants)}`);
    }
    for (const variant of variants) {
        if ((max as number) < MIN_MAX[variant]) {
            throw new TypeError(`FACT_FAMILY variant ${variant} needs max >= ${MIN_MAX[variant]}, got ${String(max)}`);
        }
    }
    return { max: max as number, variants };
};

export const generateFactFamily: Generator = (skill, rng): Task => {
    const p = parseFactFamilyParams(skill.params);
    const variant = rng.pick(p.variants);
    const make = (prompt: string, answer: number, rule: string, line: string): Task => ({
        skillId: skill.id,
        prompt,
        answer,
        hint: [rule, line],
    });
    switch (variant) {
        case 'swap': {
            const [a, b] = drawUntil<[number, number]>(
                `FACT_FAMILY swap max ${p.max}`,
                () => {
                    const x = rng.int(1, p.max - 1);
                    return [x, rng.int(1, p.max - x)];
                },
                ([x, y]) => x !== y,
            );
            // The unknown is the term that is not repeated on the right side.
            return rng.chance(0.5)
                ? make(`${a} + ${b} = ${b} + ${BOX}`, a, pl.tasks.factSwapHint, arithLine(b, a, '+'))
                : make(`${a} + ${b} = ${BOX} + ${a}`, b, pl.tasks.factSwapHint, arithLine(b, a, '+'));
        }
        case 'checkSub': {
            const a = rng.int(2, p.max);
            const b = rng.int(1, a - 1);
            return make(`${a} ${MINUS} ${b} = ${a - b}. ${pl.tasks.factCheck} ${a - b} + ${b} = ${BOX}`, a, pl.tasks.factCheckSubHint, arithLine(a - b, b, '+'));
        }
        case 'checkAdd': {
            const a = rng.int(1, p.max - 1);
            const b = rng.int(1, p.max - a);
            return make(`${a} + ${b} = ${a + b}. ${pl.tasks.factCheck} ${a + b} ${MINUS} ${b} = ${BOX}`, a, pl.tasks.factCheckAddHint, arithLine(a + b, b, '-'));
        }
        default: {
            // Within the times table: checking 98 : 49 by 2 · 49 is not a grade-2/3 check (impl-review S-03).
            const divisor = rng.int(2, Math.min(TABLE, Math.floor(p.max / 2)));
            const quotient = rng.int(2, Math.min(TABLE, Math.floor(p.max / divisor)));
            const product = divisor * quotient;
            return make(
                `${product} ${DIVIDE} ${divisor} = ${quotient}. ${pl.tasks.factCheck} ${quotient} ${TIMES} ${divisor} = ${BOX}`,
                product,
                pl.tasks.factCheckDivHint,
                `${quotient} ${TIMES} ${divisor} = ${product}`,
            );
        }
    }
};
