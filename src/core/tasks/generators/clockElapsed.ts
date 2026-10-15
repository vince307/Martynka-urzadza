// CLOCK_ELAPSED: elapsed time from the school timetable (ZADANIA.md, section 4, E5-E6). Text only, no widgets.
//   end        tiles   start + duration -> the end ("Lekcja zaczyna się o 8.15 i trwa 45 minut")
//   span       keypad  minutes between two times, across one full hour at most
//   toHour     keypad  minutes left to the next full hour, counted from 60
//   nightHours keypad  whole hours across midnight (22.00 to 4.00)
// Every prompt with a time also sets `speak`, where "8.15" becomes "8 15" so the voice does not read a decimal.
import { endEvents, nightTemplates, spanTemplates, toHourTemplates, type SpanTheme } from '../../../data/elapsed';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { countNoun } from '../../text/plural';
import { formatTime, spokenTime } from '../../text/time';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';
import { nouns } from '../../../data/nouns';

export type ClockElapsedVariant = 'end' | 'span' | 'toHour' | 'nightHours';

export interface ClockElapsedParams {
    variants: readonly ClockElapsedVariant[];
    maxSpan: number;
    lesson?: true;
    theme?: SpanTheme;     // span only: a timetable ("ride") or a programme ("show"); both when absent
}

const VARIANTS: readonly ClockElapsedVariant[] = ['end', 'span', 'toHour', 'nightHours'];
const MAX_ATTEMPTS = 1000;
const DAY = 24 * 60;
const isVariant = (x: unknown): x is ClockElapsedVariant => VARIANTS.includes(x as ClockElapsedVariant);

export const parseClockElapsedParams = (params: Record<string, unknown>): ClockElapsedParams => {
    const { variants, maxSpan, lesson, theme } = params;
    if (!Array.isArray(variants) || variants.length === 0 || !variants.every(isVariant)) {
        throw new TypeError(`CLOCK_ELAPSED params.variants must be a non-empty list of ${VARIANTS.join(' ')}, got ${JSON.stringify(variants)}`);
    }
    if (variants.includes('end') && variants.length > 1) {
        throw new TypeError('CLOCK_ELAPSED end answers with tiles and cannot share a skill with keypad variants');
    }
    if (!Number.isInteger(maxSpan) || (maxSpan as number) < 10 || (maxSpan as number) > 180) {
        throw new TypeError(`CLOCK_ELAPSED params.maxSpan must be an integer in 10..180, got ${String(maxSpan)}`);
    }
    if (lesson !== undefined && (lesson !== true || !variants.includes('end'))) {
        throw new TypeError('CLOCK_ELAPSED params.lesson is true and only for the end variant');
    }
    if (theme !== undefined && ((theme !== 'ride' && theme !== 'show') || !variants.includes('span'))) {
        throw new TypeError(`CLOCK_ELAPSED params.theme is ride or show and only for the span variant, got ${JSON.stringify(theme)}`);
    }
    return { variants, maxSpan: maxSpan as number, ...(lesson ? { lesson: true as const } : {}), ...(theme ? { theme } : {}) };
};

const clock = (minutes: number): string => formatTime(Math.floor((minutes % DAY) / 60), minutes % 60);
const spoken = (minutes: number): string => spokenTime(Math.floor((minutes % DAY) / 60), minutes % 60);

/** Fills {a} {b} {d}; the spoken version swaps the times for their spoken form. */
const fill = (template: string, written: Record<string, string>, spokenForm: Record<string, string>): { prompt: string; speak: string } => {
    const swap = (values: Record<string, string>): string => template.replace(/\{(\w)\}/g, (_, key: string) => values[key] ?? '');
    return { prompt: swap(written), speak: swap({ ...written, ...spokenForm }) };
};

const generateEnd = (skillId: string, p: ClockElapsedParams, rng: Rng): Task => {
    const events = endEvents.filter((e) => (p.lesson ? e.lesson === true : e.lesson !== true && e.durations.some((d) => d <= p.maxSpan)));
    const event = rng.pick(events);
    const d = rng.pick(event.durations.filter((x) => p.lesson === true || x <= p.maxSpan));
    const start = rng.int(event.firstHour, event.lastHour) * 60 + rng.int(0, 11) * 5;
    const end = start + d;
    const answer = clock(end);
    const { prompt, speak } = fill(event.template, { a: clock(start), d: countNoun(d, nouns.minuta) }, { a: spoken(start) });
    // Wrong tiles: a few minutes off, an hour off (the full-hour slip), never a minute count above 59.
    const wrong = rng.shuffle([5, -5, 10, -10, 15, -15, 60, -60].map((shift) => clock(end + shift)).filter((t) => t !== answer));
    const choices = rng.shuffle([answer, wrong[0], wrong[1]]);

    const minute = start % 60;
    const toHour = 60 - minute;
    const hint: string[] = [];
    if (minute + d < 60 || minute === 0) {
        hint.push(pl.tasks.elapsedEndAddFirst, ...(minute === 0 ? [] : [`${minute} + ${d} = ${minute + d}`]));
    } else {
        const next = clock(start + toHour);
        hint.push(pl.tasks.elapsedToFullHour, pl.tasks.elapsedToFullHourLine(next, toHour));
        if (d > toHour) {
            hint.push(`${d} ${MINUS} ${toHour} = ${d - toHour}`, pl.tasks.elapsedEndRest(d - toHour));
        }
    }
    hint.push(pl.tasks.elapsedEndAnswer(answer));
    return { skillId, prompt, speak, answer, choices, hint };
};

const generateSpan = (skillId: string, p: ClockElapsedParams, rng: Rng): Task => {
    const templates = p.theme ? spanTemplates[p.theme] : [...spanTemplates.ride, ...spanTemplates.show];
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const hour = rng.int(6, 20);
        const m1 = rng.int(1, 59);
        const m2 = rng.int(1, 59);
        const next = rng.chance(0.5) ? 1 : 0;
        const span = next * 60 + m2 - m1;
        if (span < 10 || span > p.maxSpan) {
            continue;
        }
        const from = hour * 60 + m1;
        const to = (hour + next) * 60 + m2;
        const { prompt, speak } = fill(rng.pick(templates), { a: clock(from), b: clock(to) }, { a: spoken(from), b: spoken(to) });
        const hint = next === 0
            ? [pl.tasks.elapsedSpanSameHour, `${m2} ${MINUS} ${m1} = ${span}`]
            : [
                pl.tasks.elapsedToFullHour,
                `60 ${MINUS} ${m1} = ${60 - m1}`,
                pl.tasks.elapsedSpanAfterHour(clock((hour + 1) * 60), clock(to), m2),
                `${60 - m1} + ${m2} = ${span}`,
            ];
        return { skillId, prompt, speak, answer: span, hint };
    }
    throw new Error(`CLOCK_ELAPSED span: no task after ${MAX_ATTEMPTS} attempts (maxSpan ${p.maxSpan})`);
};

const generateToHour = (skillId: string, rng: Rng): Task => {
    const hour = rng.int(6, 20);
    const minute = rng.int(1, 59);
    const now = hour * 60 + minute;
    const next = (hour + 1) * 60;
    const { prompt, speak } = fill(rng.pick(toHourTemplates), { a: clock(now), b: clock(next) }, { a: spoken(now), b: spoken(next) });
    return { skillId, prompt, speak, answer: 60 - minute, hint: [pl.tasks.elapsedToHourFirst, `60 ${MINUS} ${minute} = ${60 - minute}`] };
};

const generateNightHours = (skillId: string, rng: Rng): Task => {
    const from = rng.int(18, 23);
    const to = rng.int(1, 8);
    const hours = 24 - from + to;
    const { prompt, speak } = fill(rng.pick(nightTemplates), { a: formatTime(from, 0), b: formatTime(to, 0) }, { a: spokenTime(from, 0), b: spokenTime(to, 0) });
    return {
        skillId,
        prompt,
        speak,
        answer: hours,
        hint: [pl.tasks.elapsedNightFirst, `24 ${MINUS} ${from} = ${24 - from}`, pl.tasks.elapsedNightAfter(formatTime(to, 0), to), `${24 - from} + ${to} = ${hours}`],
    };
};

export const generateClockElapsed: Generator = (skill, rng): Task => {
    const p = parseClockElapsedParams(skill.params);
    const variant = rng.pick(p.variants);
    switch (variant) {
        case 'end':
            return generateEnd(skill.id, p, rng);
        case 'span':
            return generateSpan(skill.id, p, rng);
        case 'toHour':
            return generateToHour(skill.id, rng);
        case 'nightHours':
            return generateNightHours(skill.id, rng);
    }
};
