// CLOCK: read a drawn analogue clock (ZADANIA.md, section 4). Three variants:
// `read` (which time is shown), `later` (the time n hours on, through 12) and
// `h24` (an afternoon time written the 24-hour way). The answer is a tile text
// in the school notation ("3.30", "15.00"); the face is a `clock` visual.
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { clockHandAngles } from '../../round/pictureLayout';
import { formatTime } from '../../text/time';
import { MINUS } from '../symbols';
import type { SkillDef } from '../../types';
import type { Generator, Task } from '../types';

export type ClockVariant = 'read' | 'later' | 'h24' | 'set';
export type MinuteStep = 60 | 30 | 15 | 5;

export interface ClockParams {
    variant: ClockVariant;
    minuteStep: MinuteStep;
    maxShift?: number;   // later only: the largest number of hours added
    h24?: boolean;       // set only: the asked time is written the 24-hour way ("15.00"), the hands show "3.00"
}

const VARIANTS: readonly ClockVariant[] = ['read', 'later', 'h24', 'set'];
const STEPS: readonly number[] = [60, 30, 15, 5];
/** Smallest angle between the hands of a start pose, so neither hides the other. */
const SET_MIN_GAP = 30;

export const parseClockParams = (params: Record<string, unknown>): ClockParams => {
    const { variant, minuteStep, maxShift, h24 } = params;
    if (!VARIANTS.includes(variant as ClockVariant)) {
        throw new TypeError(`CLOCK params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    }
    if (!STEPS.includes(minuteStep as number)) {
        throw new TypeError(`CLOCK params.minuteStep must be one of ${STEPS.join(', ')}, got ${String(minuteStep)}`);
    }
    if (variant === 'later' && (!Number.isInteger(maxShift) || (maxShift as number) < 1 || (maxShift as number) > 11)) {
        throw new TypeError(`CLOCK later needs an integer params.maxShift in 1..11, got ${String(maxShift)}`);
    }
    if (variant === 'h24' && minuteStep !== 60) {
        throw new TypeError('CLOCK h24 works on full hours only (minuteStep 60)');
    }
    if (variant === 'set' && (minuteStep === 5 || (h24 === true && minuteStep !== 60))) {
        throw new TypeError('CLOCK set takes minuteStep 60, 30 or 15 and h24 only with 60');
    }
    return {
        variant: variant as ClockVariant, minuteStep: minuteStep as MinuteStep,
        maxShift: variant === 'later' ? (maxShift as number) : undefined,
        h24: variant === 'set' && h24 === true ? true : undefined,
    };
};

/** Hours on a 12-hour dial are 1..12; 12 stands for 0. */
const wrap12 = (h: number): number => ((((h - 1) % 12) + 12) % 12) + 1;

const randomMinute = (step: MinuteStep, rng: Rng): number => (step === 60 ? 0 : rng.int(0, 60 / step - 1) * step);

/** The correct text plus two other texts, distinct, shuffled; `likely` are tried first (closest mistakes). */
const timeChoices = (answer: string, likely: readonly string[], fallback: readonly string[], rng: Rng): string[] => {
    const chosen = new Set<string>([answer]);
    for (const candidate of [...rng.shuffle([...likely]), ...rng.shuffle([...fallback])]) {
        if (chosen.size >= 3) {
            break;
        }
        chosen.add(candidate);
    }
    return rng.shuffle([...chosen]);
};

/** Mistakes a child makes on the 12-hour face: hands swapped, one hour off, one step of minutes off. */
const faceDistractors = (hour: number, minute: number, step: MinuteStep): { likely: string[]; fallback: string[] } => {
    const likely: string[] = [];
    if (minute % 5 === 0) {
        const swappedHour = minute === 0 ? 12 : minute / 5;
        const swappedMinute = (hour % 12) * 5;
        if (swappedMinute % (step === 60 ? 60 : step) === 0 && !(swappedHour === hour && swappedMinute === minute)) {
            likely.push(formatTime(swappedHour, swappedMinute));
        }
    }
    likely.push(formatTime(wrap12(hour + 1), minute), formatTime(wrap12(hour - 1), minute));
    if (step !== 60) {
        if (minute - step >= 0) likely.push(formatTime(hour, minute - step));
        if (minute + step < 60) likely.push(formatTime(hour, minute + step));
    }
    return { likely, fallback: [formatTime(wrap12(hour + 2), minute), formatTime(wrap12(hour - 2), minute), formatTime(wrap12(hour + 3), minute)] };
};

/** Angle between two hands, 0..180 degrees. */
const handGap = (hour: number, minute: number): number => {
    const a = clockHandAngles(hour, minute);
    const d = Math.abs(a.hour - a.minute) % 360;
    return d > 180 ? 360 - d : d;
};

/** A start pose for the hands to set: other hour (and other minute when minutes move), hands clearly apart. */
const startPose = (answerHour: number, answerMinute: number, snap: 60 | 5, rng: Rng): { hour: number; minute: number } => {
    const poses: { hour: number; minute: number }[] = [];
    for (let hour = 1; hour <= 12; hour += 1) {
        for (let minute = 0; minute < 60; minute += snap) {
            if (hour !== answerHour && (snap === 60 || minute !== answerMinute) && handGap(hour, minute) >= SET_MIN_GAP) {
                poses.push({ hour, minute });
            }
        }
    }
    return rng.pick(poses);
};

const generateClockSet = (skill: SkillDef, p: ClockParams, rng: Rng): Task => {
    const snap = p.minuteStep === 60 ? 60 : 5;
    const askedHour = p.h24 ? rng.int(13, 23) : rng.int(1, 12);
    const minute = randomMinute(p.minuteStep, rng);
    const hour = p.h24 ? askedHour - 12 : askedHour;
    const answer = formatTime(hour, minute);
    const asked = formatTime(askedHour, minute);
    const start = startPose(hour, minute, snap, rng);
    // On a full-hour dial (snap 60) the long hand cannot move, so the hints speak of the short hand only.
    const hint: string[] = [snap === 60 ? pl.tasks.clockSetHourHandHint : pl.tasks.clockSetHandsHint];
    if (p.h24) {
        hint.push(pl.tasks.clockSetH24Hint, `${askedHour} ${MINUS} 12 = ${hour}`);
    }
    hint.push(
        pl.tasks.clockSetShortHint(hour, minute, wrap12(hour + 1)),
        snap === 60 ? pl.tasks.clockSetLongStaysHint : pl.tasks.clockSetLongHint(minute === 0 ? 12 : minute / 5, minute),
        pl.tasks.clockSetAnswerHint(answer),
    );
    return {
        skillId: skill.id,
        prompt: pl.tasks.clockSet(asked),
        speak: pl.tasks.clockSetSpeak(askedHour, minute),
        visual: { kind: 'clock', hour: start.hour, minute: start.minute, set: true, snap },
        input: 'drag',
        answer,
        hint,
    };
};

export const generateClock: Generator = (skill, rng): Task => {
    const p = parseClockParams(skill.params);
    if (p.variant === 'set') {
        return generateClockSet(skill, p, rng);
    }
    if (p.variant === 'h24') {
        const hour = rng.int(13, 23);
        const answer = formatTime(hour, 0);
        // The "without 12" mistake (3.00 for 15.00) is mandatory; the third tile is a neighbouring afternoon hour.
        const withoutTwelve = formatTime(hour % 12, 0);
        const neighbours = [hour - 1, hour + 1, hour - 2, hour + 2].filter((h) => h >= 13 && h <= 23).map((h) => formatTime(h, 0));
        return {
            skillId: skill.id,
            prompt: pl.tasks.clockH24,
            speak: pl.tasks.clockH24Speak,
            visual: { kind: 'clock', hour, minute: 0 },
            answer,
            choices: rng.shuffle([answer, withoutTwelve, rng.pick(neighbours)]),
            hint: [pl.tasks.clockH24Hint, `${hour % 12} + 12 = ${hour}`, pl.tasks.clockH24AnswerHint(answer)],
        };
    }
    const hour = rng.int(1, 12);
    const minute = randomMinute(p.minuteStep, rng);
    if (p.variant === 'later') {
        const n = rng.int(1, p.maxShift ?? 1);
        const target = wrap12(hour + n);
        const answer = formatTime(target, minute);
        const sum = hour + n;
        const { likely, fallback } = faceDistractors(target, minute, p.minuteStep);
        const hint = [pl.tasks.clockLaterNowHint(formatTime(hour, minute)), `${hour} + ${n} = ${sum}`];
        if (sum > 12) {
            hint.push(`${sum} ${MINUS} 12 = ${target}`);
        }
        hint.push(pl.tasks.clockLaterAnswerHint(answer));
        return {
            skillId: skill.id,
            prompt: pl.tasks.clockLater(n),
            speak: pl.tasks.clockLaterSpeak(n),
            visual: { kind: 'clock', hour, minute },
            answer,
            choices: timeChoices(answer, [formatTime(wrap12(hour - n), minute), ...likely], fallback, rng),
            hint,
        };
    }
    const answer = formatTime(hour, minute);
    const { likely, fallback } = faceDistractors(hour, minute, p.minuteStep);
    return {
        skillId: skill.id,
        prompt: pl.tasks.clockRead,
        speak: pl.tasks.clockReadSpeak,
        visual: { kind: 'clock', hour, minute },
        answer,
        choices: timeChoices(answer, likely, fallback, rng),
        hint: [
            pl.tasks.clockHandsHint,
            pl.tasks.clockShortHandHint(hour, minute, wrap12(hour + 1)),
            pl.tasks.clockLongHandHint(minute === 0 ? 12 : minute / 5, minute),
            pl.tasks.clockAnswerHint(answer),
        ],
    };
};
