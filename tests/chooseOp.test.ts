import { describe, expect, it } from 'vitest';
import { generateChooseOp, parseChooseOpParams } from '../src/core/tasks/generators/chooseOp';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.chooseop', stage: 'E1', step: 3, type: 'CHOOSE_OP', params, answer: 'tiles' });
const TILE = /^(\d+) ([+−]) (\d+)$/;
const LINE = /^(\d+) ([+−]) (\d+) = (\d+)$/;
const value = (tile: string | number): number => {
    const m = TILE.exec(String(tile))!;
    return m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
};

describe('generateChooseOp', () => {
    it('max 10: exactly one tile has the story result, no negatives, hint does not give the operation, 1000 draws', () => {
        const kinds = new Set<string>();
        forEachDraw(generateChooseOp, skillOf({ max: 10, kinds: ['sum', 'left', 'moreBy'] }), {}, (task, where) => {
            const choices = (task.choices ?? []) as string[];
            expect(choices.length, where).toBe(3);
            expect(new Set(choices).size, where).toBe(3);
            for (const c of choices) {
                expect(TILE.test(c), `${c} ${where}`).toBe(true);
                expect(value(c), where).toBeGreaterThanOrEqual(0);
            }
            // The story's own result is on the last hint line: "a ± b = c".
            const line = LINE.exec(task.hint[task.hint.length - 1])!;
            expect(line, where).not.toBeNull();
            const result = Number(line[4]);
            expect(result, where).toBeLessThanOrEqual(10);
            expect(choices.filter((c) => value(c) === result), where).toEqual([task.answer]);
            expect(task.hint.length, where).toBe(2);
            expect(task.hint[0], where).not.toContain(String(task.answer));
            expect(TILE.test(task.hint[0]), where).toBe(false);
            expect(task.prompt, where).toContain('Które działanie pasuje?');
            kinds.add(String(task.answer).includes('+') ? '+' : '−');
        });
        expect(kinds).toEqual(new Set(['+', '−']));
    });

    it('rejects kinds without one direct operation and a max below the minimum', () => {
        expect(() => parseChooseOpParams({ max: 10, kinds: ['start'] })).toThrow(TypeError);
        expect(() => parseChooseOpParams({ max: 10, kinds: ['twoSteps'] })).toThrow(TypeError);
        expect(() => parseChooseOpParams({ max: 10, kinds: [] })).toThrow(TypeError);
        expect(() => parseChooseOpParams({ max: 10 })).toThrow(TypeError);
        expect(() => parseChooseOpParams({ max: 1, kinds: ['sum'] })).toThrow(TypeError);
        // impl-review S-03: max 2 leaves no third tile; the generator used to throw at draw time.
        expect(() => parseChooseOpParams({ max: 2, kinds: ['left'] })).toThrow(TypeError);
        expect(() => parseChooseOpParams({ max: 3, kinds: ['sum', 'left', 'moreBy'] })).not.toThrow();
        expect(parseChooseOpParams({ max: 10, kinds: ['sum', 'left'] })).toEqual({ max: 10, kinds: ['sum', 'left'] });
    });

    it('picture: the drawing decides the operation, 1000 draws', () => {
        const motions = new Set<string>();
        forEachDraw(generateChooseOp, skillOf({ max: 10, kinds: ['picture'] }), {}, (task, where) => {
            expect(task.visual?.kind, where).toBe('icons');
            if (task.visual?.kind !== 'icons') return;
            const { groups, motion } = task.visual;
            expect(groups, where).toHaveLength(2);
            expect(motion === 'come' || motion === 'go', where).toBe(true);
            motions.add(String(motion));
            const [a, b] = groups;
            expect(a + (motion === 'come' ? b : 0), where).toBeLessThanOrEqual(10);
            expect(task.answer, where).toBe(motion === 'come' ? `${a} + ${b}` : `${a} − ${b}`);
            if (motion === 'go') expect(a, where).toBeGreaterThan(b);
            const choices = (task.choices ?? []) as string[];
            expect(choices.length, where).toBe(3);
            expect(new Set(choices).size, where).toBe(3);
            for (const c of choices) {
                expect(TILE.test(c), `${c} ${where}`).toBe(true);
                expect(value(c), where).toBeGreaterThanOrEqual(0);
            }
            const result = motion === 'come' ? a + b : a - b;
            expect(choices.filter((c) => value(c) === result), where).toEqual([task.answer]);
            expect(task.prompt, where).toContain(motion === 'come' ? `Dołożono ${b}.` : `Zabrano ${b}.`);
            expect(task.prompt, where).toContain('Które działanie pasuje?');
            expect(task.prompt, where).toMatch(new RegExp(`^Na stole (było|były) ${a} `));
            expect(task.hint, where).toHaveLength(2);
            expect(task.hint[0], where).not.toContain(String(task.answer));
            expect(TILE.test(task.hint[0]), where).toBe(false);
            expect(LINE.exec(task.hint[1])?.[4], where).toBe(String(result));
        });
        expect(motions).toEqual(new Set(['come', 'go']));
    });

    it('picture only fits the pictures of 10 icons', () => {
        expect(() => parseChooseOpParams({ max: 12, kinds: ['picture'] })).toThrow(TypeError);
        expect(() => parseChooseOpParams({ max: 10, kinds: ['sum', 'picture'] })).not.toThrow();
        expect(() => parseChooseOpParams({ max: 2, kinds: ['picture'] })).toThrow(TypeError);
    });
});
