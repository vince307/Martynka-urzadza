// PRICE: quantity · price = value, and the price of one (ZADANIA.md, section 4, E4+). Whole złoty up to `max`.
// The first hint names the operation, the last line states the result.
import { goodObj, goods, people } from '../../../data/wordTemplates';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import { DIVIDE, TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export type PriceVariant = 'total' | 'unit';

export interface PriceParams {
    max: number;
    maxQty: number;
    minQty: number;          // 2 for the school tasks; 1 exercises the accusative ("1 bułkę")
    variants: readonly PriceVariant[];
}

const MAX_ATTEMPTS = 1000;
const isVariant = (x: unknown): x is PriceVariant => x === 'total' || x === 'unit';
const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const parsePriceParams = (params: Record<string, unknown>): PriceParams => {
    const { max, maxQty, minQty = 2, variants } = params;
    if (!Number.isInteger(max) || (max as number) < 8) {
        throw new TypeError(`PRICE params.max must be an integer >= 8, got ${String(max)}`);
    }
    if (!Number.isInteger(maxQty) || (maxQty as number) < 2) {
        throw new TypeError(`PRICE params.maxQty must be an integer >= 2, got ${String(maxQty)}`);
    }
    if (!Number.isInteger(minQty) || (minQty as number) < 1 || (minQty as number) > (maxQty as number)) {
        throw new TypeError(`PRICE params.minQty must be an integer in 1..maxQty, got ${String(minQty)}`);
    }
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every(isVariant)) {
        throw new TypeError(`PRICE params.variants must be a non-empty list of total unit, got ${JSON.stringify(variants)}`);
    }
    return { max: max as number, maxQty: maxQty as number, minQty: minQty as number, variants };
};

export const generatePrice: Generator = (skill, rng): Task => {
    const p = parsePriceParams(skill.params);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const variant = rng.pick(p.variants);
        const qty = rng.int(variant === 'unit' ? Math.max(2, p.minQty) : p.minQty, p.maxQty);
        const good = rng.pick(goods);
        // price >= 2 (see Good.price): with 1 złoty the total would equal the quantity that ends the first hint
        const price = rng.int(good.price[0], Math.min(good.price[1], Math.floor(p.max / qty)));
        const total = qty * price;
        if (total > p.max || price === qty || price < good.price[0]) {
            continue;
        }
        const person = rng.pick(people);
        const bought = person.gender === 'm' ? pl.words.bought[0] : pl.words.bought[1];
        const zl = nouns.złoty;
        if (variant === 'total') {
            const paid = person.gender === 'm' ? pl.words.paid[0] : pl.words.paid[1];
            return {
                skillId: skill.id,
                prompt: `${person.name} ${bought} ${goodObj(qty, good)}. ${cap(good.one)} kosztuje ${countNoun(price, zl)}. Ile złotych ${paid} za zakupy?`,
                answer: total,
                hint: [pl.tasks.priceTotalHint(`${price} ${TIMES} ${qty}`), `${price} ${TIMES} ${qty} = ${total}`],
            };
        }
        return {
            skillId: skill.id,
            prompt: `${person.name} ${bought} ${goodObj(qty, good)} za ${countNoun(total, zl)}. Ile kosztuje ${good.one}?`,
            answer: price,
            hint: [pl.tasks.priceUnitHint(`${total} ${DIVIDE} ${qty}`), `${total} ${DIVIDE} ${qty} = ${price}`],
        };
    }
    throw new Error(`PRICE: no task after ${MAX_ATTEMPTS} attempts (params ${JSON.stringify(skill.params)})`);
};
