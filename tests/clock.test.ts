import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { generateClock, parseClockParams } from '../src/core/tasks/generators/clock';
import { formatTime } from '../src/core/text/time';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const clockSkill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E3', step: 3, type: 'CLOCK', params, answer: 'tiles' });

// The oracle works from the drawing (visual), never from task.answer.
const SKILLS = {
    readFull: clockSkill('E3.3.clock_read_full', { variant: 'read', minuteStep: 60 }),
    readHalf: clockSkill('E4.3.clock_read_half', { variant: 'read', minuteStep: 30 }),
    readQuarter: clockSkill('E4.3.clock_read_quarter', { variant: 'read', minuteStep: 15 }),
    read5: clockSkill('E4.3.clock_read_5', { variant: 'read', minuteStep: 5 }),
    later: clockSkill('E3.3.clock_later_full', { variant: 'later', minuteStep: 60, maxShift: 3 }),
    h24: clockSkill('E3.11.clock_24h', { variant: 'h24', minuteStep: 60 }),
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

    it('speak names the drawing without the time', () => {
        const task = generateClock(SKILLS.readHalf, createRng(5));
        expect(task.speak).toMatch(/zegar/i);
        expect(task.speak ?? '').not.toMatch(/\d/);
    });
});

describe('parseClockParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const skill of Object.values(SKILLS)) {
            expect(() => parseClockParams(skill.params), skill.id).not.toThrow();
        }
    });

    it.each([
        ['unknown variant', { variant: 'set', minuteStep: 60 }],
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
