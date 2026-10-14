// DESIGN-GAP 63 (docs/design-gaps.md): the keypad has no minus and no comma, so negative temperatures and "12 zł 50 gr" cannot be typed.
// MONEY_COUNT and MONEY_CHANGE (ZADANIA.md, section 4): coins and notes lie on a table (a `money` drawing) and the child adds
// them up, or says what is left after a purchase. Amounts are kept in grosze; the answer is whole złoty, grosze or a text tile in
// the school notation ("3 zł 40 gr"). The drawing is what the story is about, so the oracle is the sum of its items.
import { MONEY, type MoneyId } from '../../../data/measures';
import { pl } from '../../../data/pl';
import { contexts, people } from '../../../data/wordTemplates';
import type { Rng } from '../../rng';
import { formatMoney, spokenMoney } from '../../text/measure';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type MoneyAnswer = 'number-zl' | 'number-gr' | 'text';

export interface MoneyParams {
    variant: 'count' | 'change';
    ids: MoneyId[];          // the nominals that may lie on the table
    max: number;             // the largest total, in grosze
    maxItems: number;        // 2..10 items on the table
    answer: MoneyAnswer;
}

const ANSWERS: readonly MoneyAnswer[] = ['number-zl', 'number-gr', 'text'];
const isInt = (x: unknown): x is number => Number.isInteger(x);
const value = (id: MoneyId): number => MONEY.find((m) => m.id === id)?.grosze ?? 0;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const parseMoney = (type: string, variant: MoneyParams['variant'], params: Record<string, unknown>): MoneyParams => {
    const fail = (why: string): never => {
        throw new TypeError(`${type} ${why}`);
    };
    const { ids, max, maxItems, answer } = params;
    if (params.variant !== variant) fail(`needs params.variant "${variant}", got ${String(params.variant)}`);
    if (!Array.isArray(ids) || ids.length === 0) return fail('needs a non-empty params.ids');
    if (new Set(ids).size !== ids.length) fail('params.ids has a duplicate');
    const known = new Set<string>(MONEY.map((m) => m.id));
    for (const id of ids) if (!known.has(String(id))) fail(`has an unknown money id ${String(id)}`);
    const typed = ids as MoneyId[];
    if (!isInt(max) || max < 1) fail(`needs an integer params.max >= 1 (grosze), got ${String(max)}`);
    if (!isInt(maxItems) || maxItems < 2 || maxItems > 10) fail(`needs params.maxItems in 2..10, got ${String(maxItems)}`);
    if (!ANSWERS.includes(answer as MoneyAnswer)) fail(`params.answer must be one of ${ANSWERS.join(', ')}, got ${String(answer)}`);
    const values = typed.map(value);
    if (answer === 'number-zl' && values.some((v) => v % 100 !== 0)) fail('number-zl needs whole-złoty nominals only');
    if (answer === 'number-gr' && values.some((v) => v >= 100)) fail('number-gr needs grosz coins only');
    if (2 * Math.min(...values) > (max as number)) fail(`params.max ${String(max)} cannot hold two of the smallest nominal`);
    if (answer === 'text') {
        const coin = Math.min(...values);
        const zloty = Math.min(...values.filter((v) => v >= 100));
        if (coin >= 100 || !Number.isFinite(zloty)) fail('text answers need both grosz and złoty nominals');
        if (coin + zloty > (max as number)) fail('params.max cannot hold a złoty and a grosz nominal together');
    }
    return { variant, ids: typed, max: max as number, maxItems: maxItems as number, answer: answer as MoneyAnswer };
};

export const parseMoneyCountParams = (params: Record<string, unknown>): MoneyParams => parseMoney('MONEY_COUNT', 'count', params);
export const parseMoneyChangeParams = (params: Record<string, unknown>): MoneyParams => parseMoney('MONEY_CHANGE', 'change', params);

const total = (items: readonly MoneyId[]): number => items.reduce((sum, id) => sum + value(id), 0);
/** Whole złoty and some grosze: the sum a "zł gr" answer needs. */
const isMixed = (items: readonly MoneyId[]): boolean => total(items) % 100 !== 0 && items.some((id) => value(id) >= 100);

/** 2..maxItems items within the maximum, the largest first (the table is laid out that way). */
const drawItems = (p: MoneyParams, rng: Rng): MoneyId[] => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
        const n = rng.int(2, p.maxItems);
        const items: MoneyId[] = [];
        let remaining = p.max;
        for (let i = 0; i < n; i += 1) {
            const fits = p.ids.filter((id) => value(id) <= remaining);
            if (fits.length === 0) break;
            const id = rng.pick(fits);
            items.push(id);
            remaining -= value(id);
        }
        if (items.length >= 2 && (p.answer !== 'text' || isMixed(items))) {
            return items.sort((a, b) => value(b) - value(a));
        }
    }
    // The parser guarantees these two fit: the two smallest nominals (a złoty and a grosz coin for text answers).
    const byValue = [...p.ids].sort((a, b) => value(a) - value(b));
    const fallback = p.answer === 'text' ? [byValue.find((id) => value(id) >= 100), byValue[0]] : [byValue[0], byValue[0]];
    return (fallback as MoneyId[]).sort((a, b) => value(b) - value(a));
};

const sum = (parts: readonly number[]): number => parts.reduce((a, b) => a + b, 0);

/** "3 zł 40 gr" read the wrong way round: "40 zł 3 gr". */
const swapUnits = (grosze: number): number | undefined => {
    const zl = Math.floor(grosze / 100);
    const gr = grosze % 100;
    return gr > 0 && zl > 0 && zl < 100 && gr !== zl ? gr * 100 + zl : undefined;
};

/** The right amount plus two other amounts as text tiles, shuffled; `likely` (the mistakes a child makes) are tried first. */
const textChoices = (answer: number, likely: readonly (number | undefined)[], step: number, rng: Rng): string[] => {
    const [swapped, ...rest] = likely;
    const candidates = [
        ...(swapped === undefined ? [] : [swapped]),
        ...rng.shuffle(rest.filter((x): x is number => x !== undefined)),
        answer + 100,
        answer - 100,
        answer + step,
        answer - step,
        answer + 2 * step,
    ];
    const chosen = new Set<number>([answer]);
    for (const amount of candidates) {
        if (chosen.size >= 3) break;
        if (amount > 0) chosen.add(amount);
    }
    return rng.shuffle([...chosen].map((g) => formatMoney(g)));
};

const asAnswer = (grosze: number, mode: MoneyAnswer): number | string => (mode === 'number-zl' ? grosze / 100 : mode === 'number-gr' ? grosze : formatMoney(grosze));
/** The amount as the answer states it: a grosz answer stays in groszy even at 100 ("100 gr", not "1 zł"). */
const amountText = (grosze: number, mode: MoneyAnswer): string => (mode === 'number-gr' ? `${grosze} gr` : formatMoney(grosze));
const unitDivisor = (mode: MoneyAnswer): number => (mode === 'number-zl' ? 100 : 1);

export const generateMoneyCount: Generator = (skill, rng): Task => {
    const p = parseMoneyCountParams(skill.params);
    const items = drawItems(p, rng);
    const sumGrosze = total(items);
    const answer = asAnswer(sumGrosze, p.answer);
    const base = { skillId: skill.id, prompt: pl.tasks.moneyCountPrompt(p.answer), speak: pl.tasks.moneyCountSpeak(p.answer), visual: { kind: 'money', items } as const };
    if (p.answer !== 'text') {
        const d = unitDivisor(p.answer);
        const parts = items.map((id) => value(id) / d);
        return {
            ...base,
            answer,
            tileRange: { min: 1, max: p.max / d },
            hint: [pl.tasks.moneyCountHint, `${parts.join(' + ')} = ${sum(parts)}`, pl.tasks.moneyCountAnswerHint(amountText(sumGrosze, p.answer))],
        };
    }
    const zloty = items.filter((id) => value(id) >= 100).map((id) => value(id) / 100);
    const grosze = items.filter((id) => value(id) < 100).map(value);
    const groszeSum = sum(grosze);
    const hint: string[] = [pl.tasks.moneyCountTextHint];
    if (zloty.length > 0) hint.push(pl.tasks.moneyZlotyLine(zloty, sum(zloty)));
    if (grosze.length > 0) hint.push(pl.tasks.moneyGroszeLine(grosze, groszeSum));
    if (groszeSum >= 100) hint.push(pl.tasks.moneyGroszeToZloty(groszeSum, formatMoney(groszeSum)));
    hint.push(pl.tasks.moneyCountAnswerHint(formatMoney(sumGrosze)));
    const distinct = [...new Set(items.map(value))];
    const likely = [
        swapUnits(sumGrosze),
        ...distinct.map((v) => (sumGrosze - v > 0 ? sumGrosze - v : undefined)),   // forgot one coin
        ...distinct.map((v) => sumGrosze + v),                                       // counted one twice
    ];
    return { ...base, answer, choices: textChoices(sumGrosze, likely, Math.min(...p.ids.map(value)), rng), hint };
};

export const generateMoneyChange: Generator = (skill, rng): Task => {
    const p = parseMoneyChangeParams(skill.params);
    const items = drawItems(p, rng);
    const had = total(items);
    // The price is a part of the amount, in steps of what the nominals share (whole złoty, 10 gr, 1 gr).
    const step = p.ids.map(value).reduce(gcd);
    const price = step * rng.int(1, had / step - 1);
    const change = had - price;
    const person = rng.pick(people);
    const feminine = person.gender === 'f';
    // A thing whose believable price holds this price (no croissant for 13 zł); the ranges in wordTemplates cover 1 gr..100 zł.
    const priced = contexts.filter((c) => c.price !== undefined && c.price[0] <= price && price <= c.price[1]);
    const thing = rng.pick(priced.length > 0 ? priced : contexts.filter((c) => c.price !== undefined)).accusative;
    const question = pl.tasks.moneyChangeQuestion(p.answer);
    const base = {
        skillId: skill.id,
        prompt: pl.tasks.moneyChange(person.name, feminine, formatMoney(had), thing, formatMoney(price), question),
        speak: pl.tasks.moneyChange(person.name, feminine, spokenMoney(had), thing, spokenMoney(price), question),
        visual: { kind: 'money', items } as const,
    };
    if (p.answer !== 'text') {
        const d = unitDivisor(p.answer);
        return {
            ...base,
            answer: change / d,
            tileRange: { min: 1, max: p.max / d },
            hint: [pl.tasks.moneyChangeHint, `${had / d} ${MINUS} ${price / d} = ${change / d}`, pl.tasks.moneyChangeAnswerHint(amountText(change, p.answer))],
        };
    }
    const hint = [pl.tasks.moneyChangeHint, pl.tasks.moneyChangeGroszeHint, pl.tasks.moneyChangeGroszeLine(had, price, change)];
    if (change >= 100) hint.push(pl.tasks.moneyGroszeToZloty(change, formatMoney(change)));
    hint.push(pl.tasks.moneyChangeAnswerHint(formatMoney(change)));
    const likely = [swapUnits(change), had + price, price === change ? undefined : price];
    return { ...base, answer: formatMoney(change), choices: textChoices(change, likely, step, rng), hint };
};
