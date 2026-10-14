import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generateCapacity, parseCapacityParams } from '../src/core/tasks/generators/capacity';
import type { Task } from '../src/core/tasks/types';
import { visualKey } from '../src/core/tasks/visual';
import { inflect } from '../src/core/text/plural';
import type { SkillDef } from '../src/core/types';
import { JUGS, type JugId } from '../src/data/measures';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E4', step: 7, type: 'CAPACITY', params, answer: 'keypad' });

const L1: JugId = 'container-1l';
const L2: JugId = 'container-half-l';
const L4: JugId = 'container-quarter-l';

const E2_LITRES = skill('E2.2.capacity_litres', { jugs: [L1], variant: 'toLitres', maxLitres: 10 });
const HALF_L = skill('E4.7.capacity_half_l', { jugs: [L1, L2], variant: 'toLitres', maxLitres: 6 });
const LITRES_HALF = skill('E4.7.capacity_litres_half', { jugs: [L2], variant: 'howMany', maxLitres: 10 });
const QUARTER_L = skill('E5.5.capacity_quarter_l', { jugs: [L1, L2, L4], variant: 'toLitres', maxLitres: 4 });
const QUARTER_HOW = skill('E5.5.capacity_howmany_quarter', { jugs: [L4], variant: 'howMany', maxLitres: 3 });

const ml = (id: string): number => JUGS.find((j) => j.id === id)?.ml ?? Number.NaN;
const litre = (n: number): string => `${n} ${inflect(n, nouns.litr)}`;

const jugsOf = (task: Task, where: string): readonly JugId[] => {
    expect(task.visual?.kind, where).toBe('jugs');
    if (task.visual?.kind !== 'jugs') throw new Error(`no jugs ${where}`);
    return task.visual.jugs;
};

describe('generateCapacity toLitres', () => {
    for (const s of [E2_LITRES, HALF_L, QUARTER_L]) {
        const p = parseCapacityParams(s.params);
        it(`${s.id}: 1000 draws add up the drawn jugs to whole litres (at most 10 jugs, up to ${p.maxLitres} l)`, () => {
            const seen = new Set<string>();
            forEachDraw(generateCapacity, s, {}, (task, where) => {
                const jugs = jugsOf(task, where);
                seen.add(visualKey(task.visual));
                expect(jugs.length, where).toBeGreaterThanOrEqual(1);
                expect(jugs.length, where).toBeLessThanOrEqual(10);
                for (const id of jugs) expect(p.jugs, where).toContain(id);
                // The oracle is the drawing: the millilitres of the jugs, never the answer itself.
                const total = jugs.reduce((sum, id) => sum + ml(id), 0);
                expect(total % 1000, `${where} not whole litres`).toBe(0);
                expect(task.answer, where).toBe(total / 1000);
                expect(total / 1000, where).toBeGreaterThanOrEqual(1);
                expect(total / 1000, where).toBeLessThanOrEqual(p.maxLitres);
                // Half-litre jugs come in pairs and quarter-litre jugs in fours.
                expect(jugs.filter((j) => j === L2).length % 2, where).toBe(0);
                expect(jugs.filter((j) => j === L4).length % 4, where).toBe(0);
                // The largest jug first, as the row is laid out.
                expect([...jugs].sort((a, b) => ml(b) - ml(a)), where).toEqual(jugs);
                expect(task.prompt, where).toBe('Ile litrów wody jest w dzbankach?');
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[task.hint.length - 1], where).toBe(`To razem ${litre(Number(task.answer))}.`);
                expect(task.tileRange?.max, where).toBe(p.maxLitres);
            });
            expect(seen.size, 'different rows').toBeGreaterThanOrEqual(10);
        });
    }

    it('a mixed row teaches the pairs and the fours, then adds the litres', () => {
        let pairs = 0;
        let fours = 0;
        let sums = 0;
        forEachDraw(generateCapacity, QUARTER_L, {}, (task, where) => {
            const jugs = jugsOf(task, where);
            const n2 = jugs.filter((j) => j === L2).length;
            const n4 = jugs.filter((j) => j === L4).length;
            const parts = [jugs.filter((j) => j === L1).length, n2 / 2, n4 / 4].filter((x) => x > 0);
            expect(task.hint.some((h) => h.startsWith('Dwa dzbanki po pół litra')), where).toBe(n2 > 0);
            expect(task.hint.some((h) => h.includes('po ćwierć litra')), where).toBe(n4 > 0);
            if (n2 > 0) pairs += 1;
            if (n4 > 0) fours += 1;
            if (parts.length > 1) {
                sums += 1;
                expect(task.hint, where).toContain(`${parts.join(' + ')} = ${parts.reduce((a, b) => a + b, 0)}`);
            }
        });
        expect(pairs, 'rows with half-litre jugs').toBeGreaterThan(100);
        expect(fours, 'rows with quarter-litre jugs').toBeGreaterThan(100);
        expect(sums, 'rows with several kinds').toBeGreaterThan(100);
    });
});

describe('generateCapacity howMany', () => {
    for (const [s, name, per] of [
        [LITRES_HALF, 'po pół litra', 2],
        [QUARTER_HOW, 'po ćwierć litra', 4],
    ] as const) {
        it(`${s.id}: how many jugs ${name} fill the litres in the prompt`, () => {
            const answers = new Set<number>();
            forEachDraw(generateCapacity, s, {}, (task, where) => {
                const jugs = jugsOf(task, where);
                expect(jugs, where).toHaveLength(1);
                expect(ml(jugs[0]) * per, where).toBe(1000);
                const m = /nalać (\d+) (litr|litry|litrów) wody\?$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const litres = Number(m?.[1]);
                expect(m?.[2], where).toBe(inflect(litres, nouns.litr));
                expect(task.prompt, where).toBe(`Ile dzbanków ${name} potrzeba, żeby nalać ${litre(litres)} wody?`);
                expect(task.answer, where).toBe((litres * 1000) / ml(jugs[0]));
                answers.add(Number(task.answer));
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint, where).toContain(`${litres} · ${per} = ${String(task.answer)}`);
                expect(task.hint[task.hint.length - 1], where).toBe(`To razem ${String(task.answer)} ${inflect(Number(task.answer), nouns.dzbanek)}.`);
            });
            expect(answers.size, 'different answers').toBeGreaterThanOrEqual(parseCapacityParams(s.params).maxLitres);
        });
    }
});

describe('parseCapacityParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [E2_LITRES, HALF_L, LITRES_HALF, QUARTER_L, QUARTER_HOW]) expect(() => parseCapacityParams(s.params), s.id).not.toThrow();
    });

    const ok = { jugs: [L1, L2], variant: 'toLitres', maxLitres: 6 };
    it.each([
        ['no jugs', { ...ok, jugs: [] }],
        ['an unknown jug', { ...ok, jugs: ['container-2l'] }],
        ['a duplicated jug', { ...ok, jugs: [L1, L1] }],
        ['an unknown variant', { ...ok, variant: 'pour' }],
        ['more litres than ten jugs hold (only half-litre jugs, 6 l)', { ...ok, jugs: [L2] }],
        ['more litres than ten jugs hold (quarter-litre jugs, 3 l)', { ...ok, jugs: [L4], maxLitres: 3 }],
        ['a non-integer maxLitres', { ...ok, maxLitres: 2.5 }],
        ['maxLitres 0', { ...ok, maxLitres: 0 }],
        ['howMany with two kinds of jugs', { ...ok, variant: 'howMany' }],
        ['howMany with a one-litre jug', { jugs: [L1], variant: 'howMany', maxLitres: 5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseCapacityParams(params)).toThrow(TypeError);
    });
});

// The thresholds of tests/contentInvariants.test.ts, measured for the parameter sets the curriculum phases will use. E2.2 and E4.7
// have exactly ten tasks by definition (one to ten litres) and get a SMALL_SPACES entry in phase 8.
describe('task space of the planned skills', () => {
    const planned: [string, SkillDef, number][] = [
        ['E2.2 one-litre jugs', E2_LITRES, 10],
        ['E4.7 litres and half litres', HALF_L, 12],
        ['E4.7 how many half-litre jugs', LITRES_HALF, 10],
        ['E5.5 litres, half and quarter litres', QUARTER_L, 12],
    ];
    it.each(planned)('%s: at least the stated number of different tasks, none above 15 %%', (_name, s, distinct) => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateCapacity(s, createRng(910_000 + i));
            const key = `${task.prompt}|${visualKey(task.visual)}|${(task.choices ?? []).join('/')}`;
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(distinct);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});
