// MASS (ZADANIA.md, section 4): a pan balance in equilibrium (a `scale` drawing): an item on the left pan, weights on the right.
// Variants: `read` (the item's mass in kg or dag), `half` (how many dag are missing to half a kilogram) and `convert` (to a
// kilogram). The item's mass comes from a table of believable masses per icon (`SCALE_ITEMS`), never a free number, and the
// weights are a real way to build exactly that mass with the kit's weights (at most 6 on the pan).
import { ICONS, SCALE_ITEMS, WEIGHTS, type IconId, type WeightId } from '../../../data/measures';
import { pl } from '../../../data/pl';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export interface MassParams {
    variant: 'read' | 'half' | 'convert';
    unit: 'kg' | 'dag';
    weights: WeightId[];
    max: number;            // the largest answer, in `unit`
}

const VARIANTS: readonly MassParams['variant'][] = ['read', 'half', 'convert'];
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
const optionsOf = (p: MassParams): Option[] => {
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

export const parseMassParams = (params: Record<string, unknown>): MassParams => {
    const fail = (why: string): never => {
        throw new TypeError(`MASS ${why}`);
    };
    const { variant, unit, weights, max } = params;
    if (!VARIANTS.includes(variant as MassParams['variant'])) fail(`params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
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
    const parsed: MassParams = { variant: variant as MassParams['variant'], unit: unit as MassParams['unit'], weights: typed, max: max as number };
    if (optionsOf(parsed).length === 0) fail('has no believable item mass buildable from these weights');
    return parsed;
};

export const generateMass: Generator = (skill, rng): Task => {
    const p = parseMassParams(skill.params);
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
