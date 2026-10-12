import { describe, expect, it } from 'vitest';
import { generateEvenOdd, parseEvenOddParams } from '../src/core/tasks/generators/evenOdd';
import { E3 } from '../src/data/curriculum/E3';
import { pl } from '../src/data/pl';
import { forEachDraw, skillsOfType } from './helpers';

describe('generateEvenOdd', () => {
    for (const skill of skillsOfType(E3, 'EVEN_ODD')) {
        const p = parseEvenOddParams(skill.params);
        it(`${skill.id}: 1000 draws (${p.variant})`, () => {
            forEachDraw(generateEvenOdd, skill, {}, (task, where) => {
                if (p.variant === 'single') {
                    const n = Number(/Czy (\d+) /.exec(task.prompt)?.[1]);
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
});
