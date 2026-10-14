import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { generateClock, parseClockParams } from '../src/core/tasks/generators/clock';
import { formatTime } from '../src/core/text/time';
import type { SkillDef } from '../src/core/types';
import { clockHandAngles } from '../src/core/round/pictureLayout';
import { reachableTimes } from '../src/core/clockSet';
import { forEachDraw } from './helpers';

const clockSkill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E3', step: 3, type: 'CLOCK', params, answer: 'tiles' });

const setSkill = (id: string, params: Record<string, unknown>): SkillDef => ({ ...clockSkill(id, params), answer: 'drag' });

// The oracle works from the drawing (visual), never from task.answer.
const SKILLS = {
    readFull: clockSkill('E3.3.clock_read_full', { variant: 'read', minuteStep: 60 }),
    readHalf: clockSkill('E4.3.clock_read_half', { variant: 'read', minuteStep: 30 }),
    readQuarter: clockSkill('E4.3.clock_read_quarter', { variant: 'read', minuteStep: 15 }),
    read5: clockSkill('E4.3.clock_read_5', { variant: 'read', minuteStep: 5 }),
    later: clockSkill('E3.3.clock_later_full', { variant: 'later', minuteStep: 60, maxShift: 3 }),
    h24: clockSkill('E3.11.clock_24h', { variant: 'h24', minuteStep: 60 }),
    setFull: setSkill('E3.3.clock_set_full', { variant: 'set', minuteStep: 60 }),
    setH24: setSkill('E3.11.clock_set_24h', { variant: 'set', minuteStep: 60, h24: true }),
    setQuarter: setSkill('E4.3.clock_set_quarter', { variant: 'set', minuteStep: 15 }),
    setHalf: setSkill('E4.3.clock_set_half', { variant: 'set', minuteStep: 30 }),
};

describe('generateClock', () => {
    for (const [name, skill] of Object.entries(SKILLS)) {
        if (!name.startsWith('read')) {
            continue;
        }
        const step = skill.params.minuteStep as number;
        it(`${skill.id}: 1000 draws read the face as drawn (1..12, minutes on the step)`, () => {
            const minutes = new Set<number>();
            forEachDraw(generateClock, skill, {}, (task, where) => {
                expect(task.visual?.kind, where).toBe('clock');
                if (task.visual?.kind !== 'clock') return;
                const { hour, minute } = task.visual;
                expect(hour, where).toBeGreaterThanOrEqual(1);
                expect(hour, where).toBeLessThanOrEqual(12);
                expect(minute % (step === 60 ? 60 : step), where).toBe(0);
                minutes.add(minute);
                expect(task.answer, where).toBe(formatTime(hour, minute));
                expect(String(task.answer), where).not.toMatch(/^0\./);
                expect(task.choices, where).toHaveLength(3);
                expect(new Set(task.choices).size, where).toBe(3);
                expect(task.choices, where).toContain(task.answer);
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
                expect(task.hint[0], where).not.toContain(String(task.answer));
                expect(task.prompt, where).not.toContain(String(task.answer));
            });
            expect(minutes.size, 'minute variety').toBe(step === 60 ? 1 : 60 / step);
        });
    }

    it('later: asks for the time n hours on, wrapping through 12 (11.00 + 2 -> 1.00, never 0.00)', () => {
        const skill = SKILLS.later;
        let wrapped = 0;
        const shifts = new Set<number>();
        forEachDraw(generateClock, skill, {}, (task, where) => {
            if (task.visual?.kind !== 'clock') throw new Error(`no clock ${where}`);
            const { hour, minute } = task.visual;
            expect(hour, where).toBeGreaterThanOrEqual(1);
            expect(hour, where).toBeLessThanOrEqual(12);
            const n = Number(/za (\d+) godzin/.exec(task.prompt)?.[1]);
            expect(n, where).toBeGreaterThanOrEqual(1);
            expect(n, where).toBeLessThanOrEqual(3);
            shifts.add(n);
            const expected = ((hour - 1 + n) % 12) + 1;
            if (hour + n > 12) wrapped += 1;
            expect(task.answer, where).toBe(formatTime(expected, minute));
            expect(String(task.answer), where).not.toMatch(/^0\./);
            expect(task.choices, where).toHaveLength(3);
            expect(new Set(task.choices).size, where).toBe(3);
            expect(task.choices, where).toContain(task.answer);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(wrapped, 'draws that pass through 12').toBeGreaterThan(50);
        expect([...shifts].sort()).toEqual([1, 2, 3]);
    });

    it('later: the plan example 11.00 + 2 -> 1.00 and 10.00 + 2 -> 12.00 appear', () => {
        const seen = new Set<string>();
        for (let seed = 1; seed <= 400; seed += 1) {
            const task = generateClock(SKILLS.later, createRng(seed));
            if (task.visual?.kind !== 'clock') continue;
            const n = Number(/za (\d+) godzin/.exec(task.prompt)?.[1]);
            seen.add(`${task.visual.hour}+${n}=${String(task.answer)}`);
        }
        expect(seen.has('11+2=1.00')).toBe(true);
        expect(seen.has('10+2=12.00')).toBe(true);
    });

    it('h24: an afternoon hour 13..23 on the face (drawn as hour % 12), answered in 24-hour writing with the "without 12" distractor', () => {
        const hours = new Set<number>();
        forEachDraw(generateClock, SKILLS.h24, {}, (task, where) => {
            if (task.visual?.kind !== 'clock') throw new Error(`no clock ${where}`);
            const { hour, minute } = task.visual;
            expect(hour, where).toBeGreaterThanOrEqual(13);
            expect(hour, where).toBeLessThanOrEqual(23);
            expect(minute, where).toBe(0);
            hours.add(hour);
            expect(task.answer, where).toBe(formatTime(hour, 0));
            expect(task.choices, where).toHaveLength(3);
            expect(new Set(task.choices).size, where).toBe(3);
            expect(task.choices, where).toContain(formatTime(hour % 12, 0));
            expect(task.prompt, where).toContain('po południu');
            expect(task.hint[0], where).not.toContain(String(task.answer));
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(hours.size).toBe(11);
    });

    it('read: past the full hour the short-hand step says the hand is between the hour and the next one (3.40 is not "at 3")', () => {
        let between = 0;
        forEachDraw(generateClock, SKILLS.read5, {}, (task, where) => {
            if (task.visual?.kind !== 'clock') return;
            const { hour, minute } = task.visual;
            const next = hour === 12 ? 1 : hour + 1;
            if (minute === 0) {
                expect(task.hint[1], where).toBe(`Krótka wskazówka jest przy ${hour}.`);
            } else {
                between += 1;
                expect(task.hint[1], where).toBe(`Krótka wskazówka jest między ${hour} a ${next}, więc godzina to ${hour}.`);
            }
        });
        expect(between).toBeGreaterThan(0);
    });

    it('speak names the drawing without the time', () => {
        const task = generateClock(SKILLS.readHalf, createRng(5));
        expect(task.speak).toMatch(/zegar/i);
        expect(task.speak ?? '').not.toMatch(/\d/);
    });
});

/** The time the prompt asks for ("Ustaw zegar na 15.00."), read from the text only. */
const askedTime = (prompt: string): { hour: number; minute: number } => {
    const m = /(\d{1,2})\.(\d{2})/.exec(prompt);
    if (!m) throw new Error(`no time in "${prompt}"`);
    return { hour: Number(m[1]), minute: Number(m[2]) };
};
const apartBy = (a: number, b: number): number => Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360));

describe('generateClock: set (the child turns the hands)', () => {
    for (const [name, skill] of Object.entries(SKILLS)) {
        if (!name.startsWith('set')) continue;
        const step = skill.params.minuteStep as number;
        const snap = step === 60 ? 60 : 5;
        it(`${skill.id}: 1000 draws ask for a time the hands can reach, start elsewhere with clear hands`, () => {
            const asked = new Set<string>();
            forEachDraw(generateClock, skill, {}, (task, where) => {
                expect(task.input, where).toBe('drag');
                expect(task.choices, where).toBeUndefined();
                if (task.visual?.kind !== 'clock') throw new Error(`no clock ${where}`);
                const { hour, minute, set, snap: drawnSnap } = task.visual;
                expect(set, where).toBe(true);
                expect(drawnSnap, where).toBe(snap);
                // The oracle: the asked time is read from the prompt, the 24-hour form folded onto the dial.
                const want = askedTime(task.prompt);
                if (skill.params.h24) {
                    expect(want.hour, where).toBeGreaterThanOrEqual(13);
                    expect(want.hour, where).toBeLessThanOrEqual(23);
                }
                expect(want.minute % step, where).toBe(0);
                const onDial = formatTime(skill.params.h24 ? want.hour - 12 : want.hour, want.minute);
                expect(task.answer, where).toBe(onDial);
                expect(reachableTimes(snap), where).toContain(task.answer);
                asked.add(onDial);
                // The hands start somewhere else and apart, so the start is neither the answer nor an overlap.
                expect(formatTime(hour, minute), where).not.toBe(onDial);
                expect(hour, where).toBeGreaterThanOrEqual(1);
                expect(hour, where).toBeLessThanOrEqual(12);
                expect(minute % snap, where).toBe(0);
                const angles = clockHandAngles(hour, minute);
                expect(apartBy(angles.hour, angles.minute), where).toBeGreaterThanOrEqual(30);
                // Hints teach the hands without stating the answer first.
                expect(task.hint.length, where).toBeGreaterThanOrEqual(3);
                expect(task.hint[0], where).not.toContain(String(task.answer));
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
                expect(task.prompt, where).toMatch(/^Ustaw zegar na /);
            });
            expect(asked.size, 'variety of asked times').toBeGreaterThanOrEqual(step === 60 ? 11 : 12 * (60 / step) - 4);
        });
    }

    it('the spoken prompt asks for the same time and does not read the start pose', () => {
        const task = generateClock(SKILLS.setQuarter, createRng(8));
        expect(task.speak).toMatch(/^Ustaw zegar/);
        expect(task.speak).toContain(String(askedTime(task.prompt).hour));
        if (task.visual?.kind === 'clock') {
            expect(task.speak ?? '').not.toContain(formatTime(task.visual.hour, task.visual.minute));
        }
    });

    it.each([
        ['set with h24 and a quarter step', { variant: 'set', minuteStep: 15, h24: true }],
        ['set with minuteStep 5', { variant: 'set', minuteStep: 5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseClockParams(params)).toThrow(/CLOCK/);
    });

    it('accepts set with h24 on full hours', () => {
        expect(parseClockParams({ variant: 'set', minuteStep: 60, h24: true }).h24).toBe(true);
    });
});

describe('parseClockParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const skill of Object.values(SKILLS)) {
            expect(() => parseClockParams(skill.params), skill.id).not.toThrow();
        }
    });

    it.each([
        ['unknown variant', { variant: 'turn', minuteStep: 60 }],
        ['minuteStep outside the list', { variant: 'read', minuteStep: 10 }],
        ['later without maxShift', { variant: 'later', minuteStep: 60 }],
        ['later with maxShift 0', { variant: 'later', minuteStep: 60, maxShift: 0 }],
        ['later with maxShift 12', { variant: 'later', minuteStep: 60, maxShift: 12 }],
        ['later with a fractional maxShift', { variant: 'later', minuteStep: 60, maxShift: 2.5 }],
        ['h24 with minutes', { variant: 'h24', minuteStep: 30 }],
        ['missing variant', { minuteStep: 60 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseClockParams(params)).toThrow(TypeError);
    });
});
