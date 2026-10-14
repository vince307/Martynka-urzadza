import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generateTemperature, parseTemperatureParams } from '../src/core/tasks/generators/temperature';
import type { Task } from '../src/core/tasks/types';
import { visualKey } from '../src/core/tasks/visual';
import { formatCelsius, spokenCelsius } from '../src/core/text/measure';
import { inflect } from '../src/core/text/plural';
import type { SkillDef } from '../src/core/types';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>, answer: SkillDef['answer']): SkillDef => ({ id, stage: 'E6', step: 1, type: 'TEMPERATURE', params, answer });

const E3_READ = skill('E3.11.temperature_read_30', { variant: 'read', low: -30, high: 30, step: 5, answer: 'text' }, 'tiles');
const E5_READ = skill('E5.4.temperature_read_0_30', { variant: 'read', low: 0, high: 30, step: 2, answer: 'number' }, 'keypad');
const E6_NEG = skill('E6.1.temperature_negative', { variant: 'read', low: -30, high: 30, step: 2, answer: 'text' }, 'tiles');
const E6_DIFF = skill('E6.1.temperature_diff', { variant: 'diff', low: -20, high: 20, step: 2, answer: 'number' }, 'keypad');

const shown = (task: Task, where: string): number => {
    expect(task.visual?.kind, where).toBe('thermometer');
    if (task.visual?.kind !== 'thermometer') throw new Error(`no thermometer ${where}`);
    return task.visual.celsius;
};

describe('generateTemperature read', () => {
    for (const s of [E3_READ, E5_READ, E6_NEG]) {
        const p = parseTemperatureParams(s.params);
        it(`${s.id}: 1000 draws read the temperature the thermometer shows (${p.low}..${p.high}, step ${p.step}, ${p.answer})`, () => {
            const seen = new Set<number>();
            forEachDraw(generateTemperature, s, {}, (task, where) => {
                const c = shown(task, where);
                seen.add(c);
                expect(Math.abs(c % p.step), where).toBe(0);
                expect(c, where).toBeGreaterThanOrEqual(p.low);
                expect(c, where).toBeLessThanOrEqual(p.high);
                expect(task.answer, where).toBe(p.answer === 'number' ? c : formatCelsius(c));
                expect(task.prompt, where).toBe(p.answer === 'number' ? 'Ile stopni pokazuje termometr?' : 'Jaką temperaturę pokazuje termometr?');
                expect(task.hint[0], where).toBe('Znajdź koniec słupka i najbliższą liczbę.');
                expect(firstHint(task), where).toBe(task.hint[0]);
                expect(task.hint.includes('Poniżej zera liczymy w dół.'), where).toBe(c < 0);
                expect(task.hint[task.hint.length - 1], where).toBe(`Termometr pokazuje ${formatCelsius(c)}.`);
                if (p.answer === 'text') {
                    // Four tiles, the right one among them, no hyphen for a minus, none below -30 or above +30.
                    expect(task.choices, where).toHaveLength(4);
                    expect(task.choices, where).toContain(formatCelsius(c));
                    for (const choice of task.choices ?? []) {
                        expect(String(choice), where).toMatch(/^(−)?\d+ °C$/);
                        const v = Number(String(choice).replace('−', '-').replace(' °C', ''));
                        expect(v, where).toBeGreaterThanOrEqual(-30);
                        expect(v, where).toBeLessThanOrEqual(30);
                    }
                } else {
                    expect(task.choices, where).toBeUndefined();
                    expect(task.tileRange, where).toEqual({ min: p.low, max: p.high });
                }
            });
            expect(seen.size, 'different temperatures').toBeGreaterThanOrEqual(12);
        });
    }

    it('a negative reading offers the opposite sign among the tiles (the mistake a child makes)', () => {
        let negatives = 0;
        forEachDraw(generateTemperature, E6_NEG, {}, (task, where) => {
            const c = shown(task, where);
            if (c === 0) return;
            negatives += 1;
            expect(task.choices, where).toContain(formatCelsius(-c));
        });
        expect(negatives).toBeGreaterThan(900);
    });

    it('zero is read as 0 °C with no sign, also as a tile', () => {
        let zeros = 0;
        forEachDraw(generateTemperature, E6_NEG, {}, (task, where) => {
            if (shown(task, where) !== 0) return;
            zeros += 1;
            expect(task.answer, where).toBe('0 °C');
            expect(task.hint, where).not.toContain('Poniżej zera liczymy w dół.');
            for (const choice of task.choices ?? []) expect(String(choice), where).not.toMatch(/^[−-]0/);
        });
        expect(zeros, 'zero shown').toBeGreaterThan(0);
    });
});

describe('generateTemperature diff', () => {
    const p = parseTemperatureParams(E6_DIFF.params);
    it(`${E6_DIFF.id}: how many degrees warmer or colder than the morning in the prompt`, () => {
        let warmer = 0;
        let colder = 0;
        let across = 0;
        forEachDraw(generateTemperature, E6_DIFF, {}, (task, where) => {
            const now = shown(task, where);
            const m = /^Rano było (−?\d+) °C\. Popatrz na termometr: tyle jest teraz\. O ile stopni się (ociepliło|ochłodziło)\?$/.exec(task.prompt);
            expect(m, where).not.toBeNull();
            const morning = Number((m?.[1] ?? '').replace('−', '-'));
            expect(Math.abs(morning % p.step), where).toBe(0);
            expect(morning, where).toBeGreaterThanOrEqual(p.low);
            expect(morning, where).toBeLessThanOrEqual(p.high);
            expect(Math.abs(now % p.step), where).toBe(0);
            expect(now, where).not.toBe(morning);
            expect(now, `${where} zero is not a change worth drawing`).not.toBe(0);
            expect(morning, where).not.toBe(0);
            expect(m?.[2], where).toBe(now > morning ? 'ociepliło' : 'ochłodziło');
            if (now > morning) warmer += 1;
            else colder += 1;
            if (Math.sign(now) * Math.sign(morning) < 0) across += 1;
            // The oracle is the drawing and the prompt: the distance between the two readings.
            const diff = Math.abs(now - morning);
            expect(task.answer, where).toBe(diff);
            expect(task.speak, where).toBe(`Rano było ${spokenCelsius(morning)}. Popatrz na termometr: tyle jest teraz. O ile stopni się ${now > morning ? 'ociepliło' : 'ochłodziło'}?`);
            expect(firstHint(task), where).toBe(task.hint[0]);
            expect(task.hint[0], where).toBe('Znajdź koniec słupka i najbliższą liczbę.');
            expect(task.hint, where).toContain(`Teraz jest ${formatCelsius(now)}.`);
            expect(task.hint[task.hint.length - 1], where).toBe(`Zmiana to ${diff} ${inflect(diff, nouns.stopień)}.`);
            if (Math.sign(now) * Math.sign(morning) < 0) {
                expect(task.hint, where).toContain('Przejdź przez zero: policz osobno do zera i od zera.');
                expect(task.hint, where).toContain(`${Math.abs(morning)} + ${Math.abs(now)} = ${diff}`);
            } else {
                const [hi, lo] = [Math.max(Math.abs(now), Math.abs(morning)), Math.min(Math.abs(now), Math.abs(morning))];
                expect(task.hint, where).toContain(`${hi} − ${lo} = ${diff}`);
            }
        });
        expect(warmer, 'warmer').toBeGreaterThan(300);
        expect(colder, 'colder').toBeGreaterThan(300);
        expect(across, 'across zero').toBeGreaterThan(150);
    });
});

describe('parseTemperatureParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [E3_READ, E5_READ, E6_NEG, E6_DIFF]) expect(() => parseTemperatureParams(s.params), s.id).not.toThrow();
    });

    const ok = { variant: 'read', low: 0, high: 30, step: 2, answer: 'number' };
    it.each([
        ['an unknown variant', { ...ok, variant: 'rise' }],
        ['low below -30', { ...ok, low: -32, answer: 'text' }],
        ['high above 30', { ...ok, high: 32 }],
        ['low not below high', { ...ok, low: 10, high: 10 }],
        ['a number answer when readings go below zero', { ...ok, low: -10 }],
        ['a step of 1', { ...ok, step: 1 }],
        ['a fractional step', { ...ok, step: 2.5 }],
        ['a text diff', { ...ok, variant: 'diff', answer: 'text' }],
        ['fewer than four readings to choose from', { ...ok, low: 0, high: 6, step: 3 }],
        ['an unknown answer mode', { ...ok, answer: 'words' }],
        ['a non-integer low', { ...ok, low: 0.5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseTemperatureParams(params)).toThrow(TypeError);
    });
});

describe('task space of the planned skills', () => {
    const planned: [string, SkillDef][] = [
        ['E3.11 text, step 5', E3_READ],
        ['E5.4 number, step 2', E5_READ],
        ['E6.1 negative, step 2', E6_NEG],
        ['E6.1 difference', E6_DIFF],
    ];
    it.each(planned)('%s: at least 12 different tasks, none above 15 %%', (_name, s) => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateTemperature(s, createRng(910_000 + i));
            const key = `${task.prompt}|${visualKey(task.visual)}|${(task.choices ?? []).join('/')}`;
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});
