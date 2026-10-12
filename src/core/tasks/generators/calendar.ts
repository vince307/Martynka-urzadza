// CALENDAR: months in order, quarters and dates with a Roman month
// (ZADANIA.md, section 4). Names and cases come from data/calendar.ts.
import { months, quarters } from '../../../data/calendar';
import { pl } from '../../../data/pl';
import { toRoman } from '../../text/roman';
import { pickChoices } from '../distractors';
import type { Generator, Task } from '../types';

export type CalendarVariant = 'nextMonth' | 'prevMonth' | 'quarter' | 'romanMonth';

export interface CalendarParams {
    variants: readonly CalendarVariant[];
}

const VARIANTS: readonly CalendarVariant[] = ['nextMonth', 'prevMonth', 'quarter', 'romanMonth'];
const isVariant = (x: unknown): x is CalendarVariant => VARIANTS.includes(x as CalendarVariant);

export const parseCalendarParams = (params: Record<string, unknown>): CalendarParams => {
    const { variants = VARIANTS } = params;
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every(isVariant)) {
        throw new TypeError(`CALENDAR params.variants must be a non-empty list of ${VARIANTS.join(', ')}, got ${JSON.stringify(variants)}`);
    }
    return { variants };
};

const monthNames = months.map((m) => m.name);
const monthsList = (): string => pl.tasks.monthsHint(monthNames.join(', '));

export const generateCalendar: Generator = (skill, rng): Task => {
    const p = parseCalendarParams(skill.params);
    const variant = rng.pick(p.variants);
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
                answer: month.name,
                choices: pickChoices(month.name, monthNames, 3, rng),
                hint: [pl.tasks.romanMonthHint(roman, month.index), monthsList()],
            };
        }
    }
};
