import { describe, expect, it } from 'vitest';
import { generateFactFamily, parseFactFamilyParams } from '../src/core/tasks/generators/factFamily';
import type { Task } from '../src/core/tasks/types';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.fact', stage: 'E2', step: 4, type: 'FACT_FAMILY', params, answer: 'keypad' });
const SWAP = /^(\d+) \+ (\d+) = (?:(\d+) \+ □|□ \+ (\d+))$/;
const CHECK = /^(\d+) ([+−·:]) (\d+) = (\d+)\. Sprawdź: (\d+) ([+−·:]) (\d+) = □$/;
const calc = (a: number, op: string, b: number): number => (op === '+' ? a + b : op === '−' ? a - b : op === '·' ? a * b : a / b);
const numbersIn = (text: string): number[] => (text.match(/\d+/g) ?? []).map(Number);
const holdsNumber = (text: string, n: number): boolean => numbersIn(text).includes(n);

// Independent re-derivation of the answer from the prompt alone.
const solve = (prompt: string): number => {
    const swap = SWAP.exec(prompt);
    if (swap) {
        const [a, b] = [Number(swap[1]), Number(swap[2])];
        return swap[3] !== undefined ? Number(swap[3]) === b ? a : -1 : Number(swap[4]) === a ? b : -1;
    }
    const m = CHECK.exec(prompt)!;
    expect(calc(Number(m[1]), m[2], Number(m[3])), prompt).toBe(Number(m[4]));
    return calc(Number(m[5]), m[6], Number(m[7]));
};

const common = (task: Task, max: number, where: string): void => {
    expect(task.answer, where).toBe(solve(task.prompt));
    for (const n of numbersIn(task.prompt)) expect(n, where).toBeLessThanOrEqual(max);
    for (const n of numbersIn(task.prompt)) expect(n, where).toBeGreaterThanOrEqual(1);
    expect(task.hint.length, where).toBe(2);
    expect(holdsNumber(task.hint[0], task.answer as number), `first hint line must not give the answer: ${where}`).toBe(false);
    expect(numbersIn(task.hint[0]), where).toEqual([]);
    expect(holdsNumber(task.hint[1], task.answer as number), where).toBe(true);
    expect(task.hint[1].endsWith(`= ${String(task.answer)}`) || task.hint[1].startsWith(`${String(task.answer)} =`) || holdsNumber(task.hint[1], task.answer as number), where).toBe(true);
};

describe('generateFactFamily', () => {
    it('swap: a ≠ b, true commutative sentence, at least 12 different tasks for max 20', () => {
        const seen = new Set<string>();
        forEachDraw(generateFactFamily, skillOf({ max: 20, variants: ['swap'] }), { max: 20 }, (task, where) => {
            const m = SWAP.exec(task.prompt);
            expect(m, where).not.toBeNull();
            expect(m![1], where).not.toBe(m![2]);
            common(task, 20, where);
            seen.add(task.prompt);
        });
        expect(seen.size).toBeGreaterThanOrEqual(12);
    });

    it('checkSub / checkAdd / checkDiv: the stated equation is true, the answer reverses it, numbers within max', () => {
        for (const variant of ['checkSub', 'checkAdd', 'checkDiv'] as const) {
            const ops = new Set<string>();
            forEachDraw(generateFactFamily, skillOf({ max: 100, variants: [variant] }), { max: 100 }, (task, where) => {
                const m = CHECK.exec(task.prompt)!;
                expect(m, where).not.toBeNull();
                ops.add(m[2] + m[6]);
                if (variant === 'checkDiv') {
                    expect(Number(m[3]), where).toBeGreaterThanOrEqual(2);
                    expect(Number(m[4]), where).toBeGreaterThanOrEqual(2);
                }
                expect(task.answer, where).toBe(Number(m[1]));
                common(task, 100, where);
            });
            expect([...ops], variant).toEqual([{ checkSub: '−+', checkAdd: '+−', checkDiv: ':·' }[variant]]);
        }
    });

    it('all variants together stay within a small max', () => {
        const kinds = new Set<string>();
        forEachDraw(generateFactFamily, skillOf({ max: 10, variants: ['swap', 'checkSub', 'checkAdd', 'checkDiv'] }), { max: 10 }, (task, where) => {
            kinds.add(SWAP.test(task.prompt) ? 'swap' : CHECK.exec(task.prompt)![2]);
            common(task, 10, where);
        });
        expect(kinds).toEqual(new Set(['swap', '−', '+', ':']));
    });

    it('rejects malformed params', () => {
        expect(() => parseFactFamilyParams({ max: 20, variants: [] })).toThrow(TypeError);
        expect(() => parseFactFamilyParams({ max: 20, variants: ['nope'] })).toThrow(TypeError);
        expect(() => parseFactFamilyParams({ max: 20 })).toThrow(TypeError);
        expect(() => parseFactFamilyParams({ max: 2, variants: ['swap'] })).toThrow(TypeError);
        expect(() => parseFactFamilyParams({ max: 3, variants: ['checkDiv'] })).toThrow(TypeError);
        expect(() => parseFactFamilyParams({ variants: ['swap'] })).toThrow(TypeError);
        expect(parseFactFamilyParams({ max: 20, variants: ['swap', 'checkSub'] })).toEqual({ max: 20, variants: ['swap', 'checkSub'] });
    });
});
