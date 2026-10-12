import { describe, expect, it } from 'vitest';
import { generateChain, parseChainParams } from '../src/core/tasks/generators/chain';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.chain', stage: 'E1', step: 5, type: 'CHAIN', params, answer: 'keypad' });
const PROMPT = /^(\d+) ([+−]) (\d+) ([+−]) (\d+)$/;
const calc = (a: number, op: string, b: number): number => (op === '+' ? a + b : a - b);

describe('generateChain', () => {
    for (const [max, ops] of [[9, ['+', '-']], [10, ['+']], [20, ['-']]] as const) {
        it(`max ${max} ops ${ops.join('')}: 1000 draws`, () => {
            const skill = skillOf({ max, ops, terms: 3 });
            const seen = new Map<string, number>();
            forEachDraw(generateChain, skill, { max }, (task, where) => {
                const m = PROMPT.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const [a, op1, b, op2, c] = [Number(m![1]), m![2], Number(m![3]), m![4], Number(m![5])];
                for (const n of [a, b, c]) {
                    expect(n, where).toBeGreaterThanOrEqual(1);
                    expect(n, where).toBeLessThanOrEqual(max);
                }
                const mid = calc(a, op1, b);
                expect(mid, where).toBeGreaterThanOrEqual(1);
                expect(mid, where).toBeLessThanOrEqual(max);
                const end = calc(mid, op2, c);
                expect(end, where).toBeGreaterThanOrEqual(1);
                expect(end, where).toBeLessThanOrEqual(max);
                expect(task.answer, where).toBe(end);
                expect(task.hint, where).toHaveLength(2);
                expect(task.hint[0], where).toBe(`${a} ${op1} ${b} = ${mid}`);
                expect(task.hint[1], where).toBe(`${mid} ${op2} ${c} = ${end}`);
                for (const sign of [op1, op2]) {
                    expect(ops.map((o) => (o === '+' ? '+' : '−')), where).toContain(sign);
                }
                seen.set(task.prompt, (seen.get(task.prompt) ?? 0) + 1);
            });
            if (max === 9 && ops.length === 2) {
                const total = [...seen.values()].reduce((x, y) => x + y, 0);
                expect(seen.size).toBeGreaterThanOrEqual(12);
                expect(Math.max(...seen.values()) / total).toBeLessThanOrEqual(0.15);
            }
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseChainParams({ max: 2, ops: ['+'], terms: 3 })).toThrow(TypeError);
        expect(() => parseChainParams({ max: 9, ops: [], terms: 3 })).toThrow(TypeError);
        expect(() => parseChainParams({ max: 9, ops: ['*'], terms: 3 })).toThrow(TypeError);
        expect(() => parseChainParams({ max: 9, ops: ['+'], terms: 4 })).toThrow(TypeError);
        expect(() => parseChainParams({ max: 9, ops: ['+'], terms: 3 })).not.toThrow();
    });
});
