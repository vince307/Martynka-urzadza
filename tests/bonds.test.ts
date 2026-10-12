import { describe, expect, it } from 'vitest';
import { generateBonds, parseBondsParams } from '../src/core/tasks/generators/bonds';
import { boundOf } from '../src/core/tasks/bounds';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.bonds', stage: 'E1', step: 3, type: 'BONDS', params, answer: 'keypad' });

describe('generateBonds', () => {
    for (const totals of [[2, 3, 4, 5], [6, 7], [10]]) {
        const skill = skillOf({ totals });
        it(`totals ${JSON.stringify(totals)}: 1000 draws`, () => {
            const seen = new Map<string, number>();
            forEachDraw(generateBonds, skill, {}, (task, where) => {
                const m = /(\d+) = (\d+|□) \+ (\d+|□)$/.exec(task.prompt);
                expect(m, where).not.toBeNull();
                const total = Number(m![1]);
                expect(totals, where).toContain(total);
                const boxes = [m![2], m![3]].filter((x) => x === '□');
                expect(boxes, where).toHaveLength(1);
                const shown = Number(m![2] === '□' ? m![3] : m![2]);
                expect(task.answer, where).toBe(total - shown);
                expect(total - shown, where).toBeGreaterThanOrEqual(1);
                expect(shown, where).toBeGreaterThanOrEqual(1);
                const last = task.hint[task.hint.length - 1];
                expect(last, where).toContain(String(task.answer));
                expect(task.hint[0], where).not.toContain(String(total - shown) + ' =');
                seen.set(task.prompt, (seen.get(task.prompt) ?? 0) + 1);
            });
            const total = [...seen.values()].reduce((x, y) => x + y, 0);
            expect(seen.size).toBeGreaterThanOrEqual(12);
            expect(Math.max(...seen.values()) / total).toBeLessThanOrEqual(0.15);
        });
    }

    it('zero allows 0 as a part', () => {
        const prompts = new Set<string>();
        forEachDraw(generateBonds, skillOf({ totals: [3], zero: true }), {}, (task) => prompts.add(task.prompt));
        expect([...prompts].some((p) => /\b0\b/.test(p.split('\n').pop() ?? p))).toBe(true);
    });

    it('rejects malformed params', () => {
        expect(() => parseBondsParams({ totals: [1] })).toThrow(TypeError);
        expect(() => parseBondsParams({ totals: [] })).toThrow(TypeError);
        expect(() => parseBondsParams({ totals: [2.5] })).toThrow(TypeError);
        expect(() => parseBondsParams({ totals: [1], zero: true })).not.toThrow();
    });

    it('boundOf reads the largest total', () => {
        expect(boundOf({ params: { totals: [2, 5, 4] } })).toBe(5);
    });
});
