// MASS (ZADANIA.md, section 4): a pan balance in equilibrium (a `scale` drawing): an item on the left pan, weights on the right.
// Variants: `read` (the item's mass in kg or dag), `half` (how many dag are missing to half a kilogram) and `convert` (to a
// kilogram). The item's mass comes from a table of believable masses per icon (`SCALE_ITEMS`), never a free number, and the
// weights are a real way to build exactly that mass with the kit's weights (at most 6 on the pan).
import { ICONS, MASS_FACTORS, MASS_PACKS, SCALE_ITEMS, WEIGHTS, type IconId, type WeightId } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import { DIVIDE, MINUS, TIMES } from '../symbols';
import type { Rng } from '../../rng';
import type { Generator, Task } from '../types';

export interface ScaleMassParams {
    variant: 'read' | 'half' | 'convert';
    unit: 'kg' | 'dag';
    weights: WeightId[];
    max: number;            // the largest answer, in `unit`
}

export type TextKind = 'net' | 'gross' | 'tare' | 'kgToG' | 'fractionKg' | 'tToKg' | 'qToKg';

/** A MASS task told in words, with no drawing: brutto / netto / tara of a pack and unit conversions. */
export interface TextMassParams {
    variant: 'text';
    kinds: TextKind[];
    unit?: 'g' | 'kg';      // the unit of a pack's masses, needed by net, gross and tare
    max: number;            // the largest number on screen
}

export type MassParams = ScaleMassParams | TextMassParams;

const VARIANTS: readonly ScaleMassParams['variant'][] = ['read', 'half', 'convert'];
const isInt = (x: unknown): x is number => Number.isInteger(x);
const grams = (id: WeightId): number => WEIGHTS.find((w) => w.id === id)?.grams ?? 0;
const MAX_ON_PAN = 6;

/** Every multiset of the given weights (heaviest first) with exactly `target` grams on at most 6 pieces. */
const builds = (target: number, weights: readonly WeightId[]): WeightId[][] => {
    const sorted = [...weights].sort((a, b) => grams(b) - grams(a));
    const out: WeightId[][] = [];
    const walk = (index: number, left: number, picked: WeightId[]): void => {
        if (left === 0) {
            out.push(picked);
            return;
        }
        if (index >= sorted.length || picked.length >= MAX_ON_PAN) return;
        const w = sorted[index];
        for (let n = Math.min(MAX_ON_PAN - picked.length, Math.floor(left / grams(w))); n >= 0; n -= 1) {
            walk(index + 1, left - n * grams(w), [...picked, ...Array<WeightId>(n).fill(w)]);
        }
    };
    walk(0, target, []);
    return out;
};

interface Option {
    icon: IconId;
    grams: number;
    builds: WeightId[][];
}

/** The (item, mass) pairs a skill may draw, each with the ways to put that mass on the pan. */
const optionsOf = (p: ScaleMassParams): Option[] => {
    const wanted = (g: number): boolean => {
        if (p.variant === 'half') return g >= 100 && g <= 400;
        if (p.variant === 'convert') return g >= 100 && g <= 900;
        return p.unit === 'kg' ? g % 1000 === 0 && g / 1000 <= p.max : g / 10 <= p.max;
    };
    const out: Option[] = [];
    for (const item of SCALE_ITEMS) {
        for (const g of item.grams) {
            const all = wanted(g) ? builds(g, p.weights) : [];
            // A shopkeeper does not put five 10 dag weights where one 50 dag weight fits: at most two pieces more than the fewest.
            const fewest = Math.min(...all.map((w) => w.length));
            const ways = all.filter((w) => w.length <= fewest + 2);
            if (ways.length > 0) out.push({ icon: item.icon, grams: g, builds: ways });
        }
    }
    return out;
};

const TEXT_KINDS: readonly TextKind[] = ['net', 'gross', 'tare', 'kgToG', 'fractionKg', 'tToKg', 'qToKg'];
const PACK_KINDS: readonly TextKind[] = ['net', 'gross', 'tare'];
const isPackKind = (k: TextKind): boolean => PACK_KINDS.includes(k);
const GROSS_STEP_G = 50;
const TARE_STEP_G = 10;
const MIN_COUNT = 2;
const TO_KILO_MIN = 100;
const TO_KILO_MAX = 900;

/** Largest count of the big unit asked for a conversion kind: the larger number on screen stays within `max`. */
const maxCount = (kind: 'kgToG' | 'tToKg' | 'qToKg', max: number): number => Math.min(MASS_FACTORS[kind].maxN, Math.floor(max / MASS_FACTORS[kind].factor));

const parseTextParams = (params: Record<string, unknown>): TextMassParams => {
    const fail = (why: string): never => {
        throw new TypeError(`MASS text ${why}`);
    };
    const { kinds, unit, max } = params;
    if (!Array.isArray(kinds) || kinds.length === 0) fail('needs a non-empty params.kinds');
    const list = kinds as TextKind[];
    if (new Set(list).size !== list.length) fail('params.kinds has a duplicate');
    for (const k of list) if (!TEXT_KINDS.includes(k)) fail(`has an unknown kind ${String(k)}`);
    if (!isInt(max)) return fail(`needs an integer params.max, got ${String(max)}`);
    if (list.some(isPackKind)) {
        if (unit !== 'g' && unit !== 'kg') fail(`net, gross and tare need params.unit g or kg, got ${String(unit)}`);
        if (!MASS_PACKS.some((x) => x.unit === unit && x.min <= max)) fail(`params.max ${max} holds no pack in ${String(unit)}`);
    }
    for (const k of list) {
        if ((k === 'kgToG' || k === 'tToKg' || k === 'qToKg') && maxCount(k, max) < MIN_COUNT) fail(`${k} needs params.max to hold ${MIN_COUNT} units, got ${max}`);
        if (k === 'fractionKg' && max < 1000) fail(`fractionKg needs params.max >= 1000, got ${max}`);
    }
    return { variant: 'text', kinds: list, ...(list.some(isPackKind) ? { unit: unit as 'g' | 'kg' } : {}), max };
};

export const parseMassParams = (params: Record<string, unknown>): MassParams => {
    const fail = (why: string): never => {
        throw new TypeError(`MASS ${why}`);
    };
    const { variant, unit, weights, max } = params;
    if (variant === 'text') return parseTextParams(params);
    if (!VARIANTS.includes(variant as ScaleMassParams['variant'])) fail(`params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    if (unit !== 'kg' && unit !== 'dag') fail(`params.unit must be kg or dag, got ${String(unit)}`);
    if (!Array.isArray(weights) || weights.length === 0) return fail('needs a non-empty params.weights');
    if (new Set(weights).size !== weights.length) fail('params.weights has a duplicate');
    for (const id of weights) if (!WEIGHTS.some((w) => w.id === id)) fail(`has an unknown weight ${String(id)}`);
    const typed = weights as WeightId[];
    if (!isInt(max) || max < 1) fail(`needs an integer params.max >= 1, got ${String(max)}`);
    if (variant !== 'read' && unit !== 'dag') fail(`${String(variant)} is counted in dag`);
    if (variant === 'half' && (max as number) < 50) fail('half needs params.max >= 50 (dag)');
    if (variant === 'convert' && (max as number) < 100) fail('convert needs params.max >= 100 (dag)');
    // One unit per scale: kg weights read in kg, dag weights in dag (no "1 kg 20 dag" sums).
    const inUnit = (id: WeightId): boolean => (unit === 'kg' ? grams(id) % 1000 === 0 : grams(id) < 1000);
    if (!typed.every(inUnit)) fail(`params.weights must all be ${String(unit)} weights`);
    const parsed: ScaleMassParams = { variant: variant as ScaleMassParams['variant'], unit: unit as ScaleMassParams['unit'], weights: typed, max: max as number };
    if (optionsOf(parsed).length === 0) fail('has no believable item mass buildable from these weights');
    return parsed;
};

const generatePack = (skillId: string, p: TextMassParams, kind: 'net' | 'gross' | 'tare', rng: Rng): Task => {
    const unit = p.unit ?? 'g';
    const pack = rng.pick(MASS_PACKS.filter((x) => x.unit === unit && x.min <= p.max));
    // The gross mass is a round number inside the pack's range; the packaging is at most a quarter of it.
    const grossStep = unit === 'g' ? GROSS_STEP_G : 1;
    const gross = grossStep * rng.int(Math.ceil(pack.min / grossStep), Math.floor(Math.min(pack.max, p.max) / grossStep));
    const tareStep = unit === 'g' ? TARE_STEP_G : 1;
    const tare = tareStep * rng.int(1, Math.floor(gross / 4 / tareStep));
    const net = gross - tare;
    const first = pl.tasks.massPackFirst[kind];
    if (kind === 'net') {
        return { skillId, prompt: pl.tasks.massPackPrompt.net(pack.subject, gross, tare, unit), answer: net, hint: [first, `${gross} ${MINUS} ${tare} = ${net}`] };
    }
    if (kind === 'gross') {
        return { skillId, prompt: pl.tasks.massPackPrompt.gross(pack.subject, net, tare, unit), answer: gross, hint: [first, `${net} + ${tare} = ${gross}`] };
    }
    return { skillId, prompt: pl.tasks.massPackPrompt.tare(pack.subject, gross, net, unit), answer: tare, hint: [first, `${gross} ${MINUS} ${net} = ${tare}`] };
};

const generateConversion = (skillId: string, p: TextMassParams, kind: 'kgToG' | 'tToKg' | 'qToKg', rng: Rng): Task => {
    const def = MASS_FACTORS[kind];
    const [big, small] = [nouns[def.big], nouns[def.small]];
    const n = rng.int(MIN_COUNT, maxCount(kind, p.max));
    const total = n * def.factor;
    const fact = pl.tasks.massFact(big[0], countNoun(def.factor, small));
    if (rng.chance(0.5)) {
        return { skillId, prompt: pl.tasks.massAsk(small[2], countNoun(n, big)), answer: total, hint: [fact, `${n} ${TIMES} ${def.factor} = ${total}`] };
    }
    return { skillId, prompt: pl.tasks.massAsk(big[2], countNoun(total, small)), answer: n, hint: [fact, `${total} ${DIVIDE} ${def.factor} = ${n}`] };
};

const generateFractionKg = (skillId: string, rng: Rng): Task => {
    const fact = pl.tasks.massFact(nouns.kilogram[0], countNoun(1000, nouns.gram));
    const roll = rng.int(0, 4);
    if (roll === 0) return { skillId, prompt: pl.tasks.massHalfKgPrompt, answer: 500, hint: [fact, `1000 ${DIVIDE} 2 = 500`] };
    if (roll === 1) return { skillId, prompt: pl.tasks.massQuarterKgPrompt, answer: 250, hint: [fact, `1000 ${DIVIDE} 4 = 250`] };
    const grams = GROSS_STEP_G * rng.int(TO_KILO_MIN / GROSS_STEP_G, TO_KILO_MAX / GROSS_STEP_G);
    return { skillId, prompt: pl.tasks.massToKiloPrompt(grams), answer: 1000 - grams, hint: [fact, `1000 ${MINUS} ${grams} = ${1000 - grams}`] };
};

const generateText = (skillId: string, p: TextMassParams, rng: Rng): Task => {
    const kind = rng.pick(p.kinds);
    if (kind === 'net' || kind === 'gross' || kind === 'tare') return generatePack(skillId, p, kind, rng);
    if (kind === 'fractionKg') return generateFractionKg(skillId, rng);
    return generateConversion(skillId, p, kind, rng);
};

export const generateMass: Generator = (skill, rng): Task => {
    const p = parseMassParams(skill.params);
    if (p.variant === 'text') return generateText(skill.id, p, rng);
    const option = rng.pick(optionsOf(p));
    const weights = rng.pick(option.builds);
    const noun = ICONS.find((i) => i.id === option.icon)?.noun ?? option.icon;
    const visual = { kind: 'scale', item: option.icon, weights } as const;
    const mass = p.unit === 'kg' ? option.grams / 1000 : option.grams / 10;
    const parts = weights.map((w) => (p.unit === 'kg' ? grams(w) / 1000 : grams(w) / 10));
    if (p.variant === 'read') {
        const hint =
            weights.length > 1
                ? [pl.tasks.massReadHint, `${parts.join(' + ')} = ${mass}`, pl.tasks.massAnswerHint(noun, mass, p.unit)]
                : [pl.tasks.massReadOneHint, pl.tasks.massAnswerHint(noun, mass, p.unit)];
        return { skillId: skill.id, prompt: pl.tasks.massPrompt(p.unit, noun), visual, answer: mass, tileRange: { min: 1, max: p.max }, hint };
    }
    const target = p.variant === 'half' ? 50 : 100;
    const missing = target - mass;
    const hint = [
        p.variant === 'half' ? pl.tasks.massHalfFactHint : pl.tasks.massKiloFactHint,
        weights.length > 1 ? `${parts.join(' + ')} = ${mass}` : pl.tasks.massWeighsHint(mass),
        `${target} ${MINUS} ${mass} = ${missing}`,
        pl.tasks.massMissingAnswerHint(missing),
    ];
    return {
        skillId: skill.id,
        prompt: p.variant === 'half' ? pl.tasks.massHalfPrompt : pl.tasks.massKiloPrompt,
        visual,
        answer: missing,
        tileRange: { min: 1, max: p.max },
        hint,
    };
};
