import { describe, expect, it } from 'vitest';
import { applyOp, type Op } from '../src/core/tasks/arith';
import { generateCompareExpr, parseCompareExprParams } from '../src/core/tasks/generators/compareExpr';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.cmpexpr', stage: 'E1', step: 7, type: 'COMPARE_EXPR', params, answer: 'tiles' });
const PROMPT = /^(\d+) ([+−]) (\d+) □ (\d+) ([+−]) (\d+)$/;
const op = (s: string): Op => (s === '+' ? '+' : '-');

describe('generateCompareExpr', () => {
    it('max 10: sign matches independently computed results, operands >= 1, 1000 draws', () => {
        const seen = new Set<string>();
        let equal = 0;
        let total = 0;
        forEachDraw(generateCompareExpr, skillOf({ max: 10, ops: ['+', '-'] }), {}, (task, where) => {
            const m = PROMPT.exec(task.prompt);
            expect(m, where).not.toBeNull();
            const l = applyOp(Number(m![1]), Number(m![3]), op(m![2]));
            const r = applyOp(Number(m![4]), Number(m![6]), op(m![5]));
            for (const v of [m![1], m![3], m![4], m![6]]) expect(Number(v), where).toBeGreaterThanOrEqual(1);
            for (const v of [l, r]) {
                expect(v, where).toBeGreaterThanOrEqual(0);
                expect(v, where).toBeLessThanOrEqual(10);
            }
            expect(task.answer, where).toBe(l < r ? '<' : l > r ? '>' : '=');
            expect(task.choices, where).toEqual(['<', '>', '=']);
            expect(task.hint.length, where).toBe(3);
            // identical expressions are rejected
            expect(`${m![1]} ${m![2]} ${m![3]}` === `${m![4]} ${m![5]} ${m![6]}`, where).toBe(false);
            seen.add(task.prompt);
            total += 1;
            if (l === r) equal += 1;
        });
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(equal / total).toBeGreaterThan(0.1);
        expect(equal / total).toBeLessThan(0.25);
    });

    it('rejects malformed params', () => {
        expect(() => parseCompareExprParams({ max: 1, ops: ['+'] })).toThrow(TypeError);
        expect(() => parseCompareExprParams({ max: 10, ops: [] })).toThrow(TypeError);
        expect(() => parseCompareExprParams({ max: 10, ops: ['*'] })).toThrow(TypeError);
        expect(() => parseCompareExprParams({ max: 10, ops: ['+', '-'] })).not.toThrow();
    });
});
