import { describe, expect, it } from 'vitest';
import { generateEvenOdd, parseEvenOddParams } from '../src/core/tasks/generators/evenOdd';
import { E3 } from '../src/data/curriculum/E3';
import { pl } from '../src/data/pl';
import type { SkillDef } from '../src/core/types';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateEvenOdd', () => {
    for (const skill of skillsOfType(E3, 'EVEN_ODD')) {
        const p = parseEvenOddParams(skill.params);
        it(`${skill.id}: 1000 draws (${p.variant})`, () => {
            forEachDraw(generateEvenOdd, skill, {}, (task, where) => {
                if (p.variant === 'single') {
                    const n = Number(/Liczba (\d+) /.exec(task.prompt)?.[1]);
                    expect(n, where).toBeLessThanOrEqual(p.max);
                    expect(task.answer, where).toBe(n % 2 === 0 ? pl.tasks.even : pl.tasks.odd);
                    expect(task.choices, where).toEqual([pl.tasks.even, pl.tasks.odd]);
                } else {
                    expect(task.choices, where).toHaveLength(6);
                    const evens = (task.choices as number[]).filter((n) => n % 2 === 0);
                    expect(evens.length, where).toBeGreaterThanOrEqual(2);
                    expect(evens.length, where).toBeLessThanOrEqual(4);
                    expect(task.answer, where).toEqual([...evens].sort((x, y) => x - y));
                    expect(task.check?.([...evens].reverse()), where).toBe(true);
                    expect(task.check?.(evens.slice(1)), where).toBe(false);
                    const odd = (task.choices as number[]).find((n) => n % 2 === 1)!;
                    expect(task.check?.([...evens, odd]), where).toBe(false);
                    expect(task.check?.('x'), where).toBe(false);
                    for (const n of task.choices as number[]) {
                        expect(n, where).toBeLessThanOrEqual(p.max);
                    }
                }
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseEvenOddParams({ max: 30, variant: 'all' })).toThrow(TypeError);
    });

    it('min 0 draws zero as an even number and explains it', () => {
        const skill: SkillDef = { id: 'T.even_odd.zero', stage: 'E1', step: 6, type: 'EVEN_ODD', params: { max: 10, min: 0, variant: 'single' }, answer: 'tiles' };
        let zeros = 0;
        forEachDraw(generateEvenOdd, skill, {}, (task, where) => {
            const n = Number(/Liczba (\d+) /.exec(task.prompt)?.[1]);
            expect(n, where).toBeLessThanOrEqual(10);
            expect(task.answer, where).toBe(n % 2 === 0 ? pl.tasks.even : pl.tasks.odd);
            if (n === 0) {
                zeros += 1;
                expect(task.answer, where).toBe(pl.tasks.even);
                expect(task.hint.join(' '), where).toContain('0');
            }
        });
        expect(zeros).toBeGreaterThan(0);
    });

    it('rejects min other than 0 or 1 and leaves the default at 1', () => {
        expect(() => parseEvenOddParams({ max: 10, min: 2 })).toThrow(TypeError);
        expect(parseEvenOddParams({ max: 10 }).min).toBe(1);
    });
});
