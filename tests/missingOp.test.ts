import { describe, expect, it } from 'vitest';
import { generateMissingOp, parseMissingOpParams } from '../src/core/tasks/generators/missingOp';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.missingop', stage: 'E1', step: 9, type: 'MISSING_OP', params, answer: 'tiles' });
const PROMPT = /^(\d+) □ (\d+) = (\d+)$/;
// Independent of the generator: which signs make the equation true.
const fits = (a: number, b: number, c: number): string[] => [a + b === c ? '+' : '', a - b === c ? '−' : ''].filter(Boolean);

describe('generateMissingOp', () => {
    it('max 10: exactly one sign fits, b >= 1, 1000 draws', () => {
        const seen = new Set<string>();
        let same = 0;
        let total = 0;
        forEachDraw(generateMissingOp, skillOf({ max: 10, ops: ['+', '-'] }), { max: 10 }, (task, where) => {
            const m = PROMPT.exec(task.prompt);
            expect(m, where).not.toBeNull();
            const [a, b, c] = [Number(m![1]), Number(m![2]), Number(m![3])];
            expect(b, where).toBeGreaterThanOrEqual(1);
            expect(c, where).toBeGreaterThanOrEqual(0);
            expect(c, where).toBeLessThanOrEqual(10);
            expect(a, where).toBeLessThanOrEqual(10);
            expect(fits(a, b, c), where).toEqual([task.answer]);
            expect([...(task.choices ?? [])].sort(), where).toEqual(['+', '−']);
            expect(task.hint.length, where).toBe(2);
            expect(task.hint[1], where).toBe(`${a} ${String(task.answer)} ${b} = ${c}`);
            seen.add(task.prompt);
            total += 1;
            if (a === b) same += 1;
        });
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(same / total).toBeLessThanOrEqual(0.1);
    });

    it('both signs appear as answers', () => {
        const answers = new Set<unknown>();
        forEachDraw(generateMissingOp, skillOf({ max: 10, ops: ['+', '-'] }), {}, (task) => answers.add(task.answer));
        expect(answers).toEqual(new Set(['+', '−']));
    });

    it('rejects malformed params', () => {
        expect(() => parseMissingOpParams({ max: 10, ops: ['+', '*'] })).toThrow(TypeError);
        expect(() => parseMissingOpParams({ max: 10, ops: ['+', '/'] })).toThrow(TypeError);
        expect(() => parseMissingOpParams({ max: 10, ops: ['+'] })).toThrow(TypeError);
        expect(() => parseMissingOpParams({ max: 1, ops: ['+', '-'] })).toThrow(TypeError);
        expect(() => parseMissingOpParams({ max: 10, ops: ['+', '-'] })).not.toThrow();
    });
});
