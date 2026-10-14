import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { boundOf, validationBounds } from '../src/core/tasks/bounds';
import { generateTask } from '../src/core/tasks/generateTask';
import { getGenerator } from '../src/core/tasks/registry';
import { validateTask } from '../src/core/tasks/validate';
import type { SkillDef } from '../src/core/types';
import { stages } from '../src/data/curriculum';
import { E1 } from '../src/data/curriculum/E1';
import { nouns } from '../src/data/nouns';

const TILE_COUNT = 4;
const SEEDS = 20;
const DRAWS = 50;

const allSkills = (): SkillDef[] =>
    Object.values(stages).flatMap((stage) => stage.steps.flatMap((step) => step.skills));

const draws = function* (skill: SkillDef): Generator<{ seed: number; i: number; rng: () => ReturnType<typeof createRng> }> {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
        for (let i = 0; i < DRAWS; i += 1) {
            yield { seed, i, rng: () => createRng(20261012 + seed * 1000 + i) };
        }
    }
    void skill;
};

const E1_NUMERIC_TILE_SKILLS = [
    'E1.3.add_sub_5',
    'E1.3.missing_5',
    'E1.3.bonds_5',
    'E1.4.bonds_6_7',
    'E1.5.add_sub_9',
    'E1.5.chain_9',
    'E1.5.word_9',
    'E1.7.bonds_10',
    'E1.7.complement_10',
    'E1.9.add_sub_10',
];

describe('generateTask over the real curriculum data', () => {
    it('E1 numeric skills are tile skills, and E1 has no keypad skill', () => {
        const e1 = E1.steps.flatMap((step) => step.skills);
        for (const id of E1_NUMERIC_TILE_SKILLS) {
            expect(e1.find((s) => s.id === id)?.answer, id).toBe('tiles');
        }
        expect(e1.filter((s) => s.answer === 'keypad').map((s) => s.id)).toEqual([]);
    });

    for (const skill of allSkills().filter((s) => s.answer === 'tiles' && getGenerator(s.type))) {
        it(`${skill.id}: 'tiles' always yields 2-4 unique non-negative tiles containing the answer`, () => {
            for (const { seed, i, rng } of draws(skill)) {
                const where = `${skill.id} seed=${seed} draw=${i}`;
                const raw = getGenerator(skill.type)!(skill, rng());
                const task = generateTask(skill, rng(), { tileCount: TILE_COUNT });
                expect(task.prompt, where).toBe(raw.prompt);
                expect(Array.isArray(task.answer), where).toBe(false); // a tile skill never has a list answer
                const tiles = task.choices;
                expect(tiles, where).toBeDefined();
                expect(tiles!.length, where).toBeGreaterThanOrEqual(2);
                expect(tiles!.length, where).toBeLessThanOrEqual(TILE_COUNT);
                expect(new Set(tiles).size, where).toBe(tiles!.length);
                expect(tiles, where).toContain(task.answer);
                if (raw.choices === undefined) {
                    // tiles added by generateTask (generator tiles may legitimately have 2 entries)
                    expect(tiles!.length, where).toBeGreaterThanOrEqual(3);
                    const bound = task.tileRange?.max ?? boundOf(skill);
                    for (const tile of tiles as number[]) {
                        expect(tile, where).toBeGreaterThanOrEqual(0);
                        if (bound !== undefined) {
                            expect(tile, where).toBeLessThanOrEqual(bound);
                        }
                    }
                } else {
                    expect(tiles, where).toEqual(raw.choices);
                }
                expect(validateTask(task, { nouns, ...validationBounds(skill) }), where).toEqual([]);
            }
        });
    }

    for (const skill of allSkills().filter((s) => s.answer === 'keypad' && getGenerator(s.type))) {
        it(`${skill.id}: 'keypad' answers are non-negative integers`, () => {
            for (const { seed, i, rng } of draws(skill)) {
                const task = generateTask(skill, rng(), { tileCount: TILE_COUNT });
                const where = `${skill.id} seed=${seed} draw=${i}`;
                expect(typeof task.answer, where).toBe('number');
                expect(Number.isInteger(task.answer), where).toBe(true);
                expect(task.answer as number, where).toBeGreaterThanOrEqual(0);
            }
        });
    }

    it('does not consume rng differently from the generator: the task text matches the bare generator', () => {
        const skill = allSkills().find((s) => s.id === 'E1.5.add_sub_9')!;
        const a = getGenerator(skill.type)!(skill, createRng(7));
        const b = generateTask(skill, createRng(7), { tileCount: TILE_COUNT });
        expect(b.prompt).toBe(a.prompt);
        expect(b.answer).toBe(a.answer);
    });

    it('throws a readable error for an unknown task type', () => {
        const skill: SkillDef = { id: 'x.none', stage: 'E1', step: 1, type: 'NO_SUCH_TYPE', params: {}, answer: 'tiles' };
        expect(() => generateTask(skill, createRng(1), { tileCount: TILE_COUNT })).toThrow(/NO_SUCH_TYPE/);
    });
});

describe('E1.3.bonds_5 tiles', () => {
    const skill = allSkills().find((s) => s.id === 'E1.3.bonds_5')!;

    it('never throws, keeps every tile within 0..sum, gives 3 tiles at sum 2 and 4 from sum 3', () => {
        const seenTotals = new Set<number>();
        for (const { seed, i, rng } of draws(skill)) {
            const where = `seed=${seed} draw=${i}`;
            const task = generateTask(skill, rng(), { tileCount: TILE_COUNT });
            const total = Number(/^(?:.*\n)?(\d+) = /.exec(task.prompt)![1]);
            seenTotals.add(total);
            const tiles = task.choices as number[];
            expect(Math.max(...tiles), where).toBeLessThanOrEqual(total);
            expect(Math.min(...tiles), where).toBeGreaterThanOrEqual(0);
            expect(tiles.length, where).toBe(total === 2 ? 3 : 4);
        }
        expect([...seenTotals].sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
    });
});

describe('generateTask answer mode', () => {
    it('stamps every task with the answer mode of its skill (all stages, both select skills included)', () => {
        const skills = allSkills();
        expect(skills.filter((s) => s.answer === 'select').length).toBeGreaterThanOrEqual(2);
        for (const skill of skills) {
            if (!getGenerator(skill.type)) continue;
            const task = generateTask(skill, createRng(77), { tileCount: TILE_COUNT });
            expect(task.input, skill.id).toBe(skill.answer);
        }
    });
});
