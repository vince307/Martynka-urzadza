import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { visualKey } from '../src/core/tasks/visual';
import { firstHint } from '../src/core/round/hints';
import { generateMass, parseMassParams, type MassParams } from '../src/core/tasks/generators/mass';
import type { Task } from '../src/core/tasks/types';
import type { SkillDef } from '../src/core/types';
import { ICONS, MASS_PACKS, SCALE_ITEMS, WEIGHTS, type WeightId } from '../src/data/measures';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>, answer: SkillDef['answer'] = 'keypad'): SkillDef => ({ id, stage: 'E3', step: 4, type: 'MASS', params, answer });

const KG: WeightId[] = ['weight-1kg', 'weight-2kg', 'weight-5kg'];
const DAG: WeightId[] = ['weight-10dag', 'weight-20dag', 'weight-50dag'];

const READ_KG = skill('E1.11.mass_kg_10', { variant: 'read', unit: 'kg', weights: KG, max: 10 }, 'tiles');
const READ_DAG = skill('E3.4.mass_dag_100', { variant: 'read', unit: 'dag', weights: DAG, max: 100 });
const HALF = skill('E4.1.mass_half_kg', { variant: 'half', unit: 'dag', weights: DAG, max: 100 });
const CONVERT = skill('E2.8.mass_convert', { variant: 'convert', unit: 'dag', weights: DAG, max: 100 });

/** The scale variants (read, half, convert) have weights; the text variant has none. */
const scaleParams = (s: SkillDef): Extract<MassParams, { variant: 'read' | 'half' | 'convert' }> => {
    const p = parseMassParams(s.params);
    if (p.variant === 'text') throw new Error(`${s.id} is a text skill`);
    return p;
};

const grams = (id: string): number => WEIGHTS.find((w) => w.id === id)?.grams ?? Number.NaN;

/** The oracle reads the drawing: the item, the weights, and what that item can believably weigh. */
const weighed = (task: Task, where: string): { icon: string; weights: readonly WeightId[]; mass: number } => {
    expect(task.visual?.kind, where).toBe('scale');
    if (task.visual?.kind !== 'scale') throw new Error(`no scale ${where}`);
    const mass = task.visual.weights.reduce((sum, id) => sum + grams(id), 0);
    const item = SCALE_ITEMS.find((i) => i.icon === (task.visual?.kind === 'scale' ? task.visual.item : ''));
    // The weights must add up to a mass that item can have, not to any number.
    expect(item?.grams, where).toContain(mass);
    return { icon: task.visual.item, weights: task.visual.weights, mass };
};

describe('generateMass', () => {
    for (const s of [READ_KG, READ_DAG]) {
        const p = scaleParams(s);
        const unit = p.unit === 'kg' ? 1000 : 10;
        it(`${s.id}: 1000 draws read the weights on the right pan (${p.unit})`, () => {
            const seen = new Set<string>();
            forEachDraw(generateMass, s, {}, (task, where) => {
                const { icon, weights, mass } = weighed(task, where);
                seen.add(icon);
                expect(weights.length, where).toBeGreaterThanOrEqual(1);
                expect(weights.length, where).toBeLessThanOrEqual(6);
                for (const id of weights) expect(p.weights, where).toContain(id);
                expect(task.answer, where).toBe(mass / unit);
                expect(Number(task.answer), where).toBeLessThanOrEqual(p.max);
                expect(Number(task.answer), where).toBeGreaterThanOrEqual(1);
                const noun = ICONS.find((i) => i.id === icon)?.noun ?? '';
                expect(task.prompt, where).toBe(`Waga jest w równowadze. Ile ${p.unit === 'kg' ? 'kilogramów' : 'dekagramów'} waży ${noun}?`);
                expect(task.hint[task.hint.length - 1], where).toBe(`${noun[0].toUpperCase()}${noun.slice(1)} waży ${String(task.answer)} ${p.unit}.`);
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.tileRange?.min, where).toBe(1);
            });
            expect(seen.size, 'different items on the scale').toBeGreaterThanOrEqual(3);
        });
    }

    it('more than one weight teaches the sum; weights are listed from the heaviest', () => {
        let sums = 0;
        let singles = 0;
        forEachDraw(generateMass, READ_DAG, {}, (task, where) => {
            const { weights, mass } = weighed(task, where);
            expect([...weights].sort((a, b) => grams(b) - grams(a)), where).toEqual(weights);
            if (weights.length > 1) {
                sums += 1;
                expect(task.hint, where).toContain(`${weights.map((w) => grams(w) / 10).join(' + ')} = ${mass / 10}`);
            } else {
                singles += 1;
                expect(task.hint, where).toHaveLength(2);
            }
        });
        expect(sums, 'several weights').toBeGreaterThan(300);
        expect(singles, 'a single weight').toBeGreaterThan(50);
    });

    it('half: how many dag are missing to half a kilogram (50 − what the weights show), never a constant', () => {
        const answers = new Set<number>();
        forEachDraw(generateMass, HALF, {}, (task, where) => {
            const { mass } = weighed(task, where);
            expect(mass, where).toBeGreaterThanOrEqual(100);
            expect(mass, where).toBeLessThanOrEqual(400);
            expect(task.answer, where).toBe(50 - mass / 10);
            answers.add(Number(task.answer));
            expect(task.prompt, where).toBe('Waga jest w równowadze. Ile dekagramów brakuje do pół kilograma?');
            expect(task.hint[0], where).toBe('Pół kilograma to 50 dag.');
            expect(task.hint, where).toContain(`50 − ${mass / 10} = ${50 - mass / 10}`);
            expect(task.hint[task.hint.length - 1], where).toBe(`Brakuje ${String(task.answer)} dag.`);
            expect(firstHint(task), where).toBe(task.hint[0]);
        });
        expect([...answers].sort((a, b) => a - b)).toEqual([10, 20, 30, 40]);
    });

    it('convert: how many dag are missing to a kilogram (100 − what the weights show), never a constant', () => {
        const answers = new Set<number>();
        forEachDraw(generateMass, CONVERT, {}, (task, where) => {
            const { mass } = weighed(task, where);
            expect(mass, where).toBeGreaterThanOrEqual(100);
            expect(mass, where).toBeLessThanOrEqual(900);
            expect(task.answer, where).toBe(100 - mass / 10);
            answers.add(Number(task.answer));
            expect(task.prompt, where).toBe('Waga jest w równowadze. Ile dekagramów brakuje do kilograma?');
            expect(task.hint[0], where).toBe('1 kg = 100 dag');
            expect(task.hint, where).toContain(`100 − ${mass / 10} = ${100 - mass / 10}`);
            expect(task.hint[task.hint.length - 1], where).toBe(`Brakuje ${String(task.answer)} dag.`);
            expect(firstHint(task), where).toBe(task.hint[0]);
        });
        expect(answers.size, 'different answers').toBeGreaterThanOrEqual(7);
    });
});

describe('parseMassParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [READ_KG, READ_DAG, HALF, CONVERT]) expect(() => parseMassParams(s.params), s.id).not.toThrow();
    });

    const ok = { variant: 'read', unit: 'kg', weights: KG, max: 10 };
    it.each([
        ['an unknown weight', { ...ok, weights: ['weight-3kg'] }],
        ['no weights', { ...ok, weights: [] }],
        ['a duplicated weight', { ...ok, weights: ['weight-1kg', 'weight-1kg'] }],
        ['dag weights read in kg', { ...ok, weights: DAG }],
        ['kg weights read in dag', { ...ok, unit: 'dag', weights: KG }],
        ['an unknown variant', { ...ok, variant: 'tilt' }],
        ['half in kg', { ...ok, variant: 'half' }],
        ['half with a max below 50 dag', { ...ok, variant: 'half', unit: 'dag', weights: DAG, max: 40 }],
        ['convert with a max below 100 dag', { ...ok, variant: 'convert', unit: 'dag', weights: DAG, max: 90 }],
        ['a max no item reaches', { ...ok, max: 0 }],
        ['weights that build no believable mass (only 5 kg, max 4)', { ...ok, weights: ['weight-5kg'], max: 4 }],
        ['a non-integer max', { ...ok, max: 5.5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseMassParams(params)).toThrow(TypeError);
    });
});

// The thresholds of tests/contentInvariants.test.ts (>= 12 different tasks, the most frequent <= 15 %), measured here for the
// parameter sets the curriculum phases will use, so a task space that is too small fails in this phase and not in the data phase.
describe('task space of the planned skills', () => {
    const planned: [string, SkillDef][] = [
        ['E1.11 / E3.4 read kg', READ_KG],
        ['E2.8 / E3.4 read dag', READ_DAG],
        ['E2.8 convert', CONVERT],
        ['E4.1 / E5.5 half', HALF],
    ];
    it.each(planned)('%s: at least 12 different tasks, none above 15 %%', (_name, s) => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateMass(s, createRng(910_000 + i));
            const key = `${task.prompt}|${visualKey(task.visual)}|${(task.choices ?? []).join('/')}`;
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});

// ---- text variant (phase 5): brutto / netto / tara and conversions, no drawing ----

const textSkill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E5', step: 7, type: 'MASS', params: { variant: 'text', ...params }, answer: 'keypad' });
const NET_G = textSkill('T.mass_net_g', { kinds: ['net'], unit: 'g', max: 5000 });
const ALL_KG = textSkill('T.mass_pack_kg', { kinds: ['net', 'gross', 'tare'], unit: 'kg', max: 100 });
const KG_TO_G = textSkill('T.mass_kg_g', { kinds: ['kgToG'], max: 5000 });
const FRACTION = textSkill('T.mass_fraction', { kinds: ['fractionKg'], max: 5000 });
const TONNE = textSkill('T.mass_tonne', { kinds: ['tToKg', 'qToKg'], max: 5000 });

// Independent oracle: how many grams one of the named unit is, keyed by any form of the noun.
const GRAMS: Record<string, number> = { gram: 1, dekagram: 10, kilogram: 1000, kwintal: 100_000, tona: 1_000_000 };
const gramsOf = (form: string): number => {
    const key = Object.entries(nouns).find(([, forms]) => forms.includes(form))?.[0];
    if (!key || !(key in GRAMS)) throw new Error(`unknown unit "${form}"`);
    return GRAMS[key];
};
const PACK_SUBJECTS = MASS_PACKS.map((p) => p.subject);

describe('generateMass text: brutto, netto, tara', () => {
    for (const s of [NET_G, ALL_KG]) {
        it(`${s.id}: 1000 draws, the sums and the unit of the pack hold`, () => {
            const kinds = new Set<string>();
            forEachDraw(generateMass, s, {}, (task, where) => {
                expect(task.visual, where).toBeUndefined();
                const m = /^(.+): (.+)\. Ile waży (zawartość \(netto\)|całość \(brutto\)|opakowanie \(tara\))\?$/u.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const [, subject, body, asked] = m!;
                const pack = MASS_PACKS.find((p) => p.subject === subject);
                expect(pack, `${where}: unknown pack`).toBeDefined();
                const numbers = [...body.matchAll(/(\d+) (g|kg)\b/gu)].map((x) => ({ n: Number(x[1]), unit: x[2] }));
                expect(numbers, where).toHaveLength(2);
                for (const x of numbers) expect(x.unit, where).toBe(pack!.unit);
                const [a, b] = [numbers[0].n, numbers[1].n];
                // "razem z opakowaniem (brutto) waży A, opakowanie (tara) B" -> netto A - B, and so on.
                const expected = asked.includes('netto') ? a - b : asked.includes('brutto') ? a + b : a - b;
                kinds.add(asked.split(' ')[0]);
                expect(task.answer, where).toBe(expected);
                expect(expected, where).toBeGreaterThan(0);
                expect(Math.min(a, b), where).toBeGreaterThan(0);
                const wholePack = asked.includes('brutto') ? expected : a;
                expect(wholePack, `${where}: gross mass inside the pack's range`).toBeGreaterThanOrEqual(pack!.min);
                expect(wholePack, where).toBeLessThanOrEqual(pack!.max);
                expect(Math.max(expected, a, b), where).toBeLessThanOrEqual(Number(s.params.max));
                if (asked.includes('netto')) expect(body, where).toMatch(/razem z opakowaniem \(brutto\)/u);
                if (asked.includes('brutto')) expect(body, where).toMatch(/^zawartość \(netto\)/u);
                if (asked.includes('tara')) expect(body, where).toMatch(/^razem z opakowaniem \(brutto\).*sama zawartość \(netto\)/u);
                // The tare is the lighter number in every wording: gross > net > 0 and tare < gross.
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(expected)}$`));
            });
            expect(kinds.size, 'kinds drawn').toBe(s === NET_G ? 1 : 3);
        });
    }

    it('the pack and the unit go together: grams for the small packs, kilograms for the big ones', () => {
        const seen = new Set<string>();
        forEachDraw(generateMass, NET_G, {}, (task) => seen.add(task.prompt.split(':')[0]));
        expect([...seen].every((x) => MASS_PACKS.find((p) => p.subject === x)?.unit === 'g')).toBe(true);
        expect(seen.size).toBeGreaterThanOrEqual(3);
        for (const s of seen) expect(PACK_SUBJECTS).toContain(s);
    });

    it('the packaging weighs a fraction of the whole: tare is at most a quarter of the gross', () => {
        forEachDraw(generateMass, textSkill('T.mass_net_kg', { kinds: ['net'], unit: 'kg', max: 100 }), {}, (task, where) => {
            const [gross, tare] = [...task.prompt.matchAll(/(\d+) kg/gu)].map((x) => Number(x[1]));
            expect(tare, where).toBeLessThanOrEqual(gross / 4);
        });
    });
});

describe('generateMass text: conversions', () => {
    for (const [name, s, asks] of [
        ['kilograms and grams', KG_TO_G, ['gramów', 'kilogramów']],
        ['tonnes, quintals and kilograms', TONNE, ['kilogramów', 'ton', 'kwintali']],
    ] as const) {
        it(`${name}: 1000 draws convert both ways with the unit agreeing with its number`, () => {
            const askedSeen = new Set<string>();
            forEachDraw(generateMass, s, {}, (task, where) => {
                const m = /^Ile (\p{L}+) to (\d+) (\p{L}+)\?$/u.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const [, asked, n, given] = m!;
                askedSeen.add(asked);
                expect(task.answer, where).toBe((Number(n) * gramsOf(given)) / gramsOf(asked));
                expect(Number.isInteger(task.answer), where).toBe(true);
                expect(task.answer as number, where).toBeGreaterThanOrEqual(2);
                expect(task.hint[0], where).toMatch(/^1 \p{L}+ to \d+ \p{L}+\.$/u);
                expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
                expect(task.visual, where).toBeUndefined();
            });
            expect([...askedSeen].sort()).toEqual([...asks].sort());
        });
    }

    it('numeral agreement: 2 tony, 5 ton, 3 kwintale, 5 kwintali', () => {
        const seen = new Set<string>();
        forEachDraw(generateMass, TONNE, {}, (task) => {
            const given = /to (\d+ \p{L}+)\?$/u.exec(task.prompt)![1];
            if (/ton|kwint/u.test(given)) seen.add(given);
        });
        expect([...seen]).toEqual(expect.arrayContaining(['2 tony', '5 ton', '3 kwintale', '5 kwintali']));
    });

    it('half and quarter of a kilogram in grams, and what is missing to a kilogram', () => {
        const prompts = new Set<string>();
        forEachDraw(generateMass, FRACTION, {}, (task, where) => {
            prompts.add(task.prompt);
            if (task.prompt === 'Ile gramów to pół kilograma?') expect(task.answer, where).toBe(500);
            else if (task.prompt === 'Ile gramów to ćwierć kilograma?') expect(task.answer, where).toBe(250);
            else {
                const m = /^Na wadze jest (\d+) g\. Ile gramów brakuje do 1 kg\?$/u.exec(task.prompt);
                expect(m, where).not.toBeNull();
                expect(task.answer, where).toBe(1000 - Number(m![1]));
            }
            expect(task.hint[0], where).toBe('1 kilogram to 1000 gramów.');
            expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
        });
        expect(prompts.has('Ile gramów to pół kilograma?')).toBe(true);
        expect(prompts.has('Ile gramów to ćwierć kilograma?')).toBe(true);
        expect(prompts.size).toBeGreaterThan(10);
    });
});

describe('parseMassParams text', () => {
    it('accepts the planned text parameter sets', () => {
        for (const s of [NET_G, ALL_KG, KG_TO_G, FRACTION, TONNE]) expect(() => parseMassParams(s.params), s.id).not.toThrow();
        expect(parseMassParams(NET_G.params).variant).toBe('text');
    });

    it.each([
        ['no kinds', { kinds: [], unit: 'g', max: 5000 }],
        ['an unknown kind', { kinds: ['lbs'], max: 5000 }],
        ['net without a unit', { kinds: ['net'], max: 5000 }],
        ['an unknown unit', { kinds: ['net'], unit: 'dag', max: 5000 }],
        ['tonnes with a max under 2000 kg', { kinds: ['tToKg'], max: 1999 }],
        ['kilograms to grams with a max under 2000 g', { kinds: ['kgToG'], max: 1999 }],
        ['grams of a pack with a max under 200', { kinds: ['net'], unit: 'g', max: 199 }],
        ['a non-integer max', { kinds: ['kgToG'], max: 5000.5 }],
        ['a duplicated kind', { kinds: ['net', 'net'], unit: 'g', max: 5000 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseMassParams({ variant: 'text', ...params })).toThrow(TypeError);
    });
});
