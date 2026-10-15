// Texts and numbers for CLOCK_ELAPSED and TIME_UNITS (ZADANIA.md, section 4, E5-E6). Times are written "8.15" in the prompt;
// the narrator gets the same sentence with "8 15" (core/text/time.ts `spokenTime`). Placeholders: {a} {b} times, {d} a duration.
// Subjects are singular, so the verb never agrees with a numeral ("trwa 45 minut" is the one numeral construction).

export interface EndEvent {
    template: string;
    durations: readonly number[];   // minutes
    firstHour: number;
    lastHour: number;
    lesson?: true;
}

export const endEvents: readonly EndEvent[] = [
    { template: 'Lekcja zaczyna się o {a} i trwa {d}. O której godzinie się kończy?', durations: [45], firstHour: 8, lastHour: 13, lesson: true },
    { template: 'Przerwa zaczyna się o {a} i trwa {d}. O której godzinie się kończy?', durations: [10, 15, 20], firstHour: 9, lastHour: 14 },
    { template: 'Film w kinie zaczyna się o {a} i trwa {d}. O której godzinie się kończy?', durations: [60, 75, 90], firstHour: 10, lastHour: 19 },
    { template: 'Bajka w telewizji zaczyna się o {a} i trwa {d}. O której godzinie się kończy?', durations: [20, 25, 30], firstHour: 16, lastHour: 19 },
    { template: 'Spacer z psem zaczyna się o {a} i trwa {d}. O której godzinie się kończy?', durations: [30, 40, 45, 50], firstHour: 10, lastHour: 18 },
];

export type SpanTheme = 'ride' | 'show';

/** A span sentence and the shortest duration that is believable for it (a match on TV is not 11 minutes long). */
export interface SpanTemplate {
    template: string;
    minSpan: number;   // minutes
}

export const spanTemplates: Readonly<Record<SpanTheme, readonly SpanTemplate[]>> = {
    ride: [
        { template: 'Autobus odjeżdża o {a}, a przyjeżdża o {b}. Ile minut trwa jazda?', minSpan: 10 },
        { template: 'Pociąg odjeżdża o {a}, a przyjeżdża o {b}. Ile minut trwa podróż?', minSpan: 20 },
        { template: 'Tramwaj odjeżdża o {a}, a dojeżdża o {b}. Ile minut trwa przejazd?', minSpan: 10 },
    ],
    show: [
        { template: 'Film w telewizji zaczyna się o {a}, a kończy o {b}. Ile minut trwa film?', minSpan: 30 },
        { template: 'Mecz w telewizji zaczyna się o {a}, a kończy o {b}. Ile minut trwa mecz?', minSpan: 45 },
        { template: 'Program o zwierzętach zaczyna się o {a}, a kończy o {b}. Ile minut trwa program?', minSpan: 10 },
    ],
};

export const toHourTemplates: readonly string[] = [
    'Jest {a}. Ile minut zostało do {b}?',
    'Na zegarze jest {a}. Ile minut brakuje do {b}?',
];

export const nightTemplates: readonly string[] = [
    'Pociąg wyjechał o {a}, a przyjechał o {b}. Ile godzin trwała podróż?',
    'Samolot wyleciał o {a}, a wylądował o {b}. Ile godzin trwał lot?',
    'Autobus wyjechał o {a}, a przyjechał o {b}. Ile godzin trwała jazda?',
];

/** One unit of the big kind in the small one; `maxN` is the largest count of big units asked (a day has 24 hours, a quarter 15 minutes). */
export interface TimeUnitsPairDef {
    big: string;     // key in nouns.ts
    small: string;
    factor: number;
    maxN: number;
}

export const timeUnitsPairs = {
    hMin: { big: 'godzina', small: 'minuta', factor: 60, maxN: 10 },
    minS: { big: 'minuta', small: 'sekunda', factor: 60, maxN: 10 },
    dayH: { big: 'doba', small: 'godzina', factor: 24, maxN: 10 },
    quarterMin: { big: 'kwadrans', small: 'minuta', factor: 15, maxN: 4 },
} as const satisfies Record<string, TimeUnitsPairDef>;
