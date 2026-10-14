import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { visualKey } from '../src/core/tasks/visual';
import { firstHint } from '../src/core/round/hints';
import { generateMass, parseMassParams } from '../src/core/tasks/generators/mass';
import type { Task } from '../src/core/tasks/types';
import type { SkillDef } from '../src/core/types';
import { ICONS, SCALE_ITEMS, WEIGHTS, type WeightId } from '../src/data/measures';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>, answer: SkillDef['answer'] = 'keypad'): SkillDef => ({ id, stage: 'E3', step: 4, type: 'MASS', params, answer });

const KG: WeightId[] = ['weight-1kg', 'weight-2kg', 'weight-5kg'];
const DAG: WeightId[] = ['weight-10dag', 'weight-20dag', 'weight-50dag'];

const READ_KG = skill('E1.11.mass_kg_10', { variant: 'read', unit: 'kg', weights: KG, max: 10 }, 'tiles');
const READ_DAG = skill('E3.4.mass_dag_100', { variant: 'read', unit: 'dag', weights: DAG, max: 100 });
const HALF = skill('E4.1.mass_half_kg', { variant: 'half', unit: 'dag', weights: DAG, max: 100 });
const CONVERT = skill('E2.8.mass_convert', { variant: 'convert', unit: 'dag', weights: DAG, max: 100 });

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
        const p = parseMassParams(s.params);
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
