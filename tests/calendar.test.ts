import { describe, expect, it } from 'vitest';
import { generateCalendar, parseCalendarParams } from '../src/core/tasks/generators/calendar';
import { fromRoman } from '../src/core/text/roman';
import { months, quarters } from '../src/data/calendar';
import { E3 } from '../src/data/curriculum/E3';
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
});
