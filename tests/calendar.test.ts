import { describe, expect, it } from 'vitest';
import { generateCalendar, parseCalendarParams } from '../src/core/tasks/generators/calendar';
import { fromRoman } from '../src/core/text/roman';
import { months, quarters, timeFacts, weekdays } from '../src/data/calendar';
import { E3 } from '../src/data/curriculum/E3';
import type { SkillDef } from '../src/core/types';
import { forEachDraw, skillsOfType } from './helpers';

const byName = (name: string) => months.find((m) => m.name === name)!;

describe('generateCalendar', () => {
    for (const skill of skillsOfType(E3, 'CALENDAR')) {
        it(`${skill.id}: 1000 draws`, () => {
            forEachDraw(generateCalendar, skill, {}, (task, where) => {
                expect(task.choices!.length, where).toBeGreaterThanOrEqual(3);
                const answer = task.answer as string;
                if (task.prompt.startsWith('Który miesiąc jest po ')) {
                    const asked = months.find((m) => task.prompt.includes(`po ${m.locative}?`))!;
                    expect(byName(answer).index, where).toBe((asked.index % 12) + 1);
                } else if (task.prompt.startsWith('Który miesiąc jest przed ')) {
                    const asked = months.find((m) => task.prompt.includes(`przed ${m.instrumental}?`))!;
                    expect(byName(answer).index, where).toBe(((asked.index + 10) % 12) + 1);
                } else if (task.prompt.startsWith('W którym kwartale')) {
                    const asked = months.find((m) => task.prompt.endsWith(`${m.name}?`))!;
                    expect(answer, where).toBe(quarters[asked.quarter - 1]);
                } else {
                    const m = /^Data (\d+) ([IVX]+)\./.exec(task.prompt)!;
                    expect(Number(m[1]), where).toBeLessThanOrEqual(28);
                    expect(byName(answer).index, where).toBe(fromRoman(m[2]));
                }
            });
        });
    }

    it('rejects malformed params', () => {
        expect(() => parseCalendarParams({ variants: ['weekday'] })).toThrow(TypeError);
    });

    it('accepts the weekday, month-length and time-fact variants', () => {
        expect(() => parseCalendarParams({ variants: ['nextWeekday', 'prevWeekday', 'monthDays', 'timeFacts'] })).not.toThrow();
    });
});

const skillWith = (variant: string): SkillDef => ({
    id: `T.calendar.${variant}`,
    stage: 'E1',
    step: 4,
    type: 'CALENDAR',
    params: { variants: [variant] },
    answer: 'tiles',
});
const weekdayIndex = (name: string): number => weekdays.findIndex((d) => d.name === name);

describe('generateCalendar weekdays, month lengths and time facts', () => {
    it('nextWeekday follows the weekday order, Sunday wraps to Monday', () => {
        const seen = new Set<string>();
        forEachDraw(generateCalendar, skillWith('nextWeekday'), {}, (task, where) => {
            const asked = weekdays.find((d) => task.prompt === `Jaki dzień tygodnia jest po ${d.after}?`)!;
            expect(asked, where).toBeDefined();
            seen.add(asked.name);
            expect(weekdayIndex(task.answer as string), where).toBe((weekdayIndex(asked.name) + 1) % 7);
            expect(task.choices!.length, where).toBeGreaterThanOrEqual(3);
            expect(task.hint[0], where).not.toContain(task.answer as string + ' ');
        });
        expect(seen.has('niedziela')).toBe(true);
    });

    it('prevWeekday follows the weekday order, Monday wraps to Sunday', () => {
        const seen = new Set<string>();
        forEachDraw(generateCalendar, skillWith('prevWeekday'), {}, (task, where) => {
            const asked = weekdays.find((d) => task.prompt === `Jaki dzień tygodnia jest przed ${d.before}?`)!;
            expect(asked, where).toBeDefined();
            seen.add(asked.name);
            expect(weekdayIndex(task.answer as string), where).toBe((weekdayIndex(asked.name) + 6) % 7);
        });
        expect(seen.has('poniedziałek')).toBe(true);
    });

    it('monthDays never asks about February and answers with the month length', () => {
        forEachDraw(generateCalendar, skillWith('monthDays'), {}, (task, where) => {
            const asked = months.find((m) => task.prompt === `Ile dni ma ${m.name}?`)!;
            expect(asked, where).toBeDefined();
            expect(asked.name, where).not.toBe('luty');
            expect(task.answer, where).toBe(asked.days);
            expect(task.choices, where).toEqual(expect.arrayContaining([30, 31]));
            expect(task.hint[0], where).not.toMatch(/\b3[01]\b/);
        });
    });

    it('timeFacts asks a question from the data and answers with its number', () => {
        forEachDraw(generateCalendar, skillWith('timeFacts'), {}, (task, where) => {
            const fact = timeFacts.find((f) => f.question === task.prompt)!;
            expect(fact, where).toBeDefined();
            expect(task.answer, where).toBe(fact.answer);
            expect(task.choices, where).toContain(fact.answer);
            expect(task.choices!.length, where).toBeGreaterThanOrEqual(3);
        });
    });
});
