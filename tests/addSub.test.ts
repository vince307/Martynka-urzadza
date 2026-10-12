import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { crossesTen, generateAddSub, MINUS, parseAddSubParams } from '../src/core/tasks/generators/addSub';
import type { SkillDef } from '../src/core/types';
import { E3 } from '../src/data/curriculum/E3';

const skills: SkillDef[] = E3.steps.flatMap((step) => step.skills).filter((s) => s.type === 'ADD_SUB');

const evaluate = (prompt: string): { a: number; b: number; op: '+' | '-'; value: number } => {
    const m = /^(\d+) ([+−]) (\d+)$/.exec(prompt);
    if (!m) {
        throw new Error(`unexpected prompt ${prompt}`);
    }
    const a = Number(m[1]);
    const b = Number(m[3]);
    const op = m[2] === '+' ? '+' : '-';
    return { a, b, op, value: op === '+' ? a + b : a - b };
};

const SEEDS = 20;
const DRAWS_PER_SEED = 50;

describe('generateAddSub', () => {
    expect(skills.length).toBe(3);

    for (const skill of skills) {
        const params = parseAddSubParams(skill.params);

        it(`${skill.id}: ${SEEDS * DRAWS_PER_SEED} draws stay within the contract`, () => {
            for (let seed = 1; seed <= SEEDS; seed += 1) {
                const rng = createRng(20261012 + seed);
                for (let i = 0; i < DRAWS_PER_SEED; i += 1) {
                    const task = generateAddSub(skill, rng);
                    const where = `${skill.id} seed=${seed} draw=${i} prompt="${task.prompt}"`;
                    const { a, b, op, value } = evaluate(task.prompt);
                    expect(task.skillId, where).toBe(skill.id);
                    expect(params.ops, where).toContain(op);
                    expect(a, where).toBeGreaterThanOrEqual(0);
                    expect(b, where).toBeGreaterThanOrEqual(0);
                    expect(a, where).toBeLessThanOrEqual(params.max);
                    expect(b, where).toBeLessThanOrEqual(params.max);
                    expect(value, where).toBeGreaterThanOrEqual(0);
                    expect(value, where).toBeLessThanOrEqual(params.max);
                    expect(task.answer, where).toBe(value);
                    if (params.bridge !== 'any') {
                        expect(crossesTen(a, b, op), where).toBe(params.bridge === 'ten');
                    }
                    expect(task.hint.length, where).toBeGreaterThan(0);
                    for (const step of task.hint) {
                        expect(step, where).not.toMatch(/[-−]\s*\d+\s*=\s*-/);
                    }
                    expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${value}$`));
                }
            }
        });
    }

    it('is deterministic for the same seed', () => {
        const skill = skills[0];
        const first = generateAddSub(skill, createRng(99));
        const second = generateAddSub(skill, createRng(99));
        expect(first).toEqual(second);
    });

    it('writes hints with the typographic minus and ten-crossing steps', () => {
        const task = generateAddSub(
            { id: 'x', stage: 'E3', step: 2, type: 'ADD_SUB', params: { max: 20, ops: ['-'], bridge: 'ten' }, answer: 'keypad' },
            createRng(5),
        );
        expect(task.prompt).toContain(MINUS);
        expect(task.hint).toHaveLength(2);
        expect(task.hint[0]).toMatch(/= \d*0$/);
    });

    it('rejects malformed params', () => {
        expect(() => parseAddSubParams({ max: '20', ops: ['+'], bridge: 'any' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 20, ops: [], bridge: 'any' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 20, ops: ['+'], bridge: 'x' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 20, ops: ['*'], bridge: 'any' })).toThrow(TypeError);
    });
});
