import { describe, expect, it } from 'vitest';
import { generateUnitChoice, parseUnitChoiceParams } from '../src/core/tasks/generators/unitChoice';
import type { SkillDef } from '../src/core/types';
import { UNIT_TILES } from '../src/data/measures';
import { forEachDraw } from './helpers';

const skill = (quantities: string[]): SkillDef => ({
    id: `T.unit_choice.${quantities.join('')}`,
    stage: 'E5',
    step: 7,
    type: 'UNIT_CHOICE',
    params: { quantities },
    answer: 'tiles',
});

// Independent oracle, owned by this test: what the thing can believably be, in metres (length) or grams (mass).
const PLAUSIBLE: Record<string, [number, number]> = {
    Długopis: [0.08, 0.25],
    Ołówek: [0.08, 0.25],
    Mrówka: [0.001, 0.015],
    'Ziarnko ryżu': [0.002, 0.015],
    Klasa: [4, 15],
    'Boisko szkolne': [20, 120],
    'Droga do szkoły': [300, 5000],
    'Droga z Warszawy do Krakowa': [50_000, 1_000_000],
    Jabłko: [50, 400],
    Moneta: [1, 15],
    'Kromka chleba': [15, 80],
    Jajko: [40, 100],
    Kot: [2000, 8000],
    'Plecak ucznia': [1500, 10_000],
    Pies: [3000, 50_000],
    Tata: [50_000, 150_000],
};
const BASE: Record<string, number> = { mm: 0.001, cm: 0.01, m: 1, km: 1000, g: 1, dag: 10, kg: 1000 };

describe('generateUnitChoice', () => {
    for (const quantity of ['length', 'mass'] as const) {
        it(`${quantity}: exactly one tile makes sense for the number, the answer is that tile`, () => {
            const subjects = new Set<string>();
            forEachDraw(generateUnitChoice, skill([quantity]), {}, (task, where) => {
                const m = /^(.+) (ma|waży) (\d+) □\.$/u.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const [, subject, verb, n] = m!;
                subjects.add(subject);
                expect(verb, where).toBe(quantity === 'length' ? 'ma' : 'waży');
                const band = PLAUSIBLE[subject];
                expect(band, `${where}: unknown subject`).toBeDefined();
                const choices = (task.choices ?? []) as string[];
                expect(choices.length, where).toBeGreaterThanOrEqual(3);
                expect(choices.length, where).toBeLessThanOrEqual(4);
                for (const c of choices) expect(UNIT_TILES[quantity] as readonly string[], where).toContain(c);
                const sensible = choices.filter((c) => Number(n) * BASE[c] >= band[0] && Number(n) * BASE[c] <= band[1]);
                expect(sensible, where).toEqual([task.answer]);
                expect(task.speak, where).toBe(`${subject} ${verb} ${n}. Jaka to jednostka?`);
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[0], where).not.toMatch(new RegExp(`(^|[^\\p{L}])${String(task.answer)}([^\\p{L}]|$)`, 'u'));
                expect(task.hint[task.hint.length - 1], where).toBe(`${subject} ${verb} ${n} ${String(task.answer)}.`);
            });
            expect(subjects.size, 'different subjects').toBeGreaterThanOrEqual(6);
        });
    }

    it('shows several answers (not a constant) and shuffles the tiles', () => {
        const answers = new Set<string>();
        const orders = new Set<string>();
        forEachDraw(generateUnitChoice, skill(['length', 'mass']), {}, (task) => {
            answers.add(String(task.answer));
            orders.add((task.choices ?? []).join('/'));
        });
        expect([...answers].sort()).toEqual(['cm', 'g', 'kg', 'km', 'm', 'mm']);
        expect(orders.size).toBeGreaterThan(8);
    });

    it('rejects no quantity, an unknown one and a duplicate', () => {
        expect(() => parseUnitChoiceParams({ quantities: [] })).toThrow(TypeError);
        expect(() => parseUnitChoiceParams({ quantities: ['time'] })).toThrow(TypeError);
        expect(() => parseUnitChoiceParams({ quantities: ['mass', 'mass'] })).toThrow(TypeError);
        expect(() => parseUnitChoiceParams({})).toThrow(TypeError);
    });
});
