import { describe, expect, it } from 'vitest';
import { generateClockElapsed, parseClockElapsedParams } from '../src/core/tasks/generators/clockElapsed';
import { formatTime } from '../src/core/text/time';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (params: Record<string, unknown>, answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id: `T.clock_elapsed.${JSON.stringify(params.variants)}`,
    stage: 'E5',
    step: 3,
    type: 'CLOCK_ELAPSED',
    params,
    answer,
});

const TIME = /\b(\d{1,2})\.(\d{2})\b/g;
/** Minutes after midnight of every clock time written in the prompt. */
const times = (prompt: string): number[] => [...prompt.matchAll(TIME)].map((m) => Number(m[1]) * 60 + Number(m[2]));
const DAY = 24 * 60;
const text = (min: number): string => formatTime(Math.floor((min % DAY) / 60), min % 60);

describe('generateClockElapsed', () => {
    it('end (lesson): start plus 45 minutes, exactly one tile is the end, never "8.60"', () => {
        const lesson = skill({ variants: ['end'], maxSpan: 45, lesson: true }, 'tiles');
        const hours = new Set<string>();
        forEachDraw(generateClockElapsed, lesson, {}, (task, where) => {
            const [start] = times(task.prompt);
            expect(task.prompt, where).toMatch(/trwa 45 minut/);
            const expected = text(start + 45);
            expect(task.answer, where).toBe(expected);
            expect(task.choices, where).toHaveLength(3);
            expect(task.choices!.filter((c) => c === expected), where).toHaveLength(1);
            for (const c of task.choices as string[]) {
                expect(Number(c.split('.')[1]), `${where} tile ${c}`).toBeLessThan(60);
            }
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toContain(expected);
            hours.add(expected);
        });
        expect(hours.size, 'variety of ends').toBeGreaterThan(30);
    });

    it('end (other events): the duration comes from the prompt and stays within maxSpan', () => {
        forEachDraw(generateClockElapsed, skill({ variants: ['end'], maxSpan: 90 }, 'tiles'), {}, (task, where) => {
            const [start] = times(task.prompt);
            const d = Number(/trwa (\d+) minut/.exec(task.prompt)?.[1]);
            expect(d, where).toBeLessThanOrEqual(90);
            expect(task.answer, where).toBe(text(start + d));
            expect(task.choices!.filter((c) => c === task.answer), where).toHaveLength(1);
        });
    });

    it('span: minutes between two times of a timetable, one full hour boundary at most', () => {
        const crossings = new Set<boolean>();
        forEachDraw(generateClockElapsed, skill({ variants: ['span'], maxSpan: 90 }), {}, (task, where) => {
            const [from, to] = times(task.prompt);
            expect(task.answer, where).toBe(to - from);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(10);
            expect(task.answer as number, where).toBeLessThanOrEqual(90);
            crossings.add(Math.floor(from / 60) !== Math.floor(to / 60));
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
            expect(task.choices, where).toBeUndefined();
        });
        expect([...crossings].sort(), 'both inside one hour and across a full hour').toEqual([false, true]);
    });

    it('toHour: minutes left to the next full hour are counted from 60, never from 0', () => {
        forEachDraw(generateClockElapsed, skill({ variants: ['toHour'], maxSpan: 60 }), {}, (task, where) => {
            const [now, next] = times(task.prompt);
            expect(next % 60, where).toBe(0);
            expect(next - now, where).toBe(task.answer);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(1);
            expect(task.answer as number, where).toBeLessThanOrEqual(59);
            expect(task.hint[task.hint.length - 1], where).toBe(`60 − ${now % 60} = ${String(task.answer)}`);
        });
    });

    it('nightHours: whole hours across midnight (22.00 to 4.00 is 6)', () => {
        forEachDraw(generateClockElapsed, skill({ variants: ['nightHours'], maxSpan: 60 }), {}, (task, where) => {
            const [from, to] = times(task.prompt);
            expect(from % 60, where).toBe(0);
            expect(to % 60, where).toBe(0);
            expect(to, where).toBeLessThan(from);
            expect(task.answer, where).toBe(((to - from + DAY) % DAY) / 60);
            expect(task.hint[0], where).not.toMatch(new RegExp(`\\b${String(task.answer)}\\b`));
            expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${String(task.answer)}$`));
        });
    });

    it('speaks every time as "8 15", never "8.15" (the voice would read a decimal)', () => {
        for (const params of [
            { variants: ['end'], maxSpan: 45, lesson: true },
            { variants: ['span', 'nightHours'], maxSpan: 90 },
            { variants: ['toHour'], maxSpan: 60 },
        ]) {
            forEachDraw(generateClockElapsed, skill(params), {}, (task, where) => {
                expect(task.speak, where).toBeDefined();
                expect(task.speak, where).not.toMatch(/\d+\.\d{2}/);
                const spoken = [...task.prompt.matchAll(TIME)].map((m) => (m[2] === '00' ? m[1] : `${m[1]} ${m[2]}`));
                for (const s of spoken) {
                    expect(task.speak, where).toContain(s);
                }
            });
        }
    });

    it('rejects bad params: unknown or mixed variants, tiles mixed with keypad, lesson without end, tiny maxSpan', () => {
        expect(() => parseClockElapsedParams({ variants: ['later'], maxSpan: 60 })).toThrow(TypeError);
        expect(() => parseClockElapsedParams({ variants: [], maxSpan: 60 })).toThrow(TypeError);
        expect(() => parseClockElapsedParams({ variants: ['end', 'span'], maxSpan: 60 })).toThrow(TypeError);
        expect(() => parseClockElapsedParams({ variants: ['span'], maxSpan: 60, lesson: true })).toThrow(TypeError);
        expect(() => parseClockElapsedParams({ variants: ['span'], maxSpan: 5 })).toThrow(TypeError);
        expect(() => parseClockElapsedParams({ variants: ['span'] })).toThrow(TypeError);
        expect(parseClockElapsedParams({ variants: ['span', 'nightHours'], maxSpan: 75 }).maxSpan).toBe(75);
    });
});
