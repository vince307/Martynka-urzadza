// CALENDAR: months in order, quarters and dates with a Roman month
// (ZADANIA.md, section 4). Names and cases come from data/calendar.ts.
import { months, quarters, timeFacts, weekdays } from '../../../data/calendar';
import { pl } from '../../../data/pl';
import { spellRoman, toRoman } from '../../text/roman';
import { numberChoices, pickChoices } from '../distractors';
import type { Generator, Task } from '../types';

export type CalendarVariant = 'nextMonth' | 'prevMonth' | 'quarter' | 'romanMonth' | 'nextWeekday' | 'prevWeekday' | 'monthDays' | 'timeFacts';

export interface CalendarParams {
    variants: readonly CalendarVariant[];
}

const VARIANTS: readonly CalendarVariant[] = ['nextMonth', 'prevMonth', 'quarter', 'romanMonth', 'nextWeekday', 'prevWeekday', 'monthDays', 'timeFacts'];
const isVariant = (x: unknown): x is CalendarVariant => VARIANTS.includes(x as CalendarVariant);

export const parseCalendarParams = (params: Record<string, unknown>): CalendarParams => {
    const { variants = VARIANTS } = params;
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every(isVariant)) {
        throw new TypeError(`CALENDAR params.variants must be a non-empty list of ${VARIANTS.join(', ')}, got ${JSON.stringify(variants)}`);
    }
    return { variants };
};

const monthNames = months.map((m) => m.name);
const weekdayNames = weekdays.map((d) => d.name);
const weekdaysList = (): string => pl.tasks.weekdaysHint(weekdayNames.join(', '));
const longMonths = months.filter((m) => m.name !== 'luty');
const monthsList = (): string => pl.tasks.monthsHint(monthNames.join(', '));

export const generateCalendar: Generator = (skill, rng): Task => {
    const p = parseCalendarParams(skill.params);
    const variant = rng.pick(p.variants);
    if (variant === 'nextWeekday' || variant === 'prevWeekday') {
        const i = rng.int(0, weekdays.length - 1);
        const next = variant === 'nextWeekday';
        const answer = weekdays[(i + (next ? 1 : weekdays.length - 1)) % weekdays.length].name;
        const prompt = next ? pl.tasks.nextWeekday(weekdays[i].after) : pl.tasks.prevWeekday(weekdays[i].before);
        return { skillId: skill.id, prompt, answer, choices: pickChoices(answer, weekdayNames, 3, rng), hint: [weekdaysList()] };
    }
    if (variant === 'monthDays') {
        const m = rng.pick(longMonths);
        return {
            skillId: skill.id,
            prompt: pl.tasks.monthDays(m.name),
            answer: m.days,
            choices: [30, 31],
            hint: [pl.tasks.knuckleHint, pl.tasks.monthDaysHint(m.name, m.days)],
        };
    }
    if (variant === 'timeFacts') {
        const fact = rng.pick(timeFacts);
        const choices = numberChoices(fact.answer, rng, { count: 3, min: 1, max: fact.answer * 2 });
        return { skillId: skill.id, prompt: fact.question, answer: fact.answer, choices, hint: [fact.hint] };
    }
    const month = rng.pick(months);
    switch (variant) {
        case 'nextMonth': {
            const answer = months[month.index % 12].name;
            return { skillId: skill.id, prompt: pl.tasks.nextMonth(month.locative), answer, choices: pickChoices(answer, monthNames, 3, rng), hint: [monthsList()] };
        }
        case 'prevMonth': {
            const answer = months[(month.index + 10) % 12].name;
            return { skillId: skill.id, prompt: pl.tasks.prevMonth(month.instrumental), answer, choices: pickChoices(answer, monthNames, 3, rng), hint: [monthsList()] };
        }
        case 'quarter': {
            const answer = quarters[month.quarter - 1];
            const names = months.filter((m) => m.quarter === month.quarter).map((m) => m.name).join(', ');
            return { skillId: skill.id, prompt: pl.tasks.quarterOf(month.name), answer, choices: [...quarters], hint: [pl.tasks.quarterHint(answer, names)] };
        }
        default: {
            const day = rng.int(1, 28);
            const roman = toRoman(month.index);
            return {
                skillId: skill.id,
                prompt: pl.tasks.romanMonth(day, roman),
                speak: pl.tasks.romanMonthSpeak(day, spellRoman(roman, pl.tasks.romanLetters)),
                answer: month.name,
                choices: pickChoices(month.name, monthNames, 3, rng),
                hint: [pl.tasks.romanMonthHint(roman, month.index), monthsList()],
            };
        }
    }
};
