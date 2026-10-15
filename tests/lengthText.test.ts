// S-14c phase 6: LENGTH in words, no drawing. `scale` (plan scale, whole numbers both ways) and `twoUnit` ("4 cm 7 mm = □ mm").
// The oracles parse the prompt and are typed here, not read from the generator's data.
import { describe, expect, it } from 'vitest';
import { firstHint } from '../src/core/round/hints';
import { generateLength, parseLengthParams } from '../src/core/tasks/generators/length';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const lengthSkill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E5', step: 12, type: 'LENGTH', params, answer: 'keypad' });

const SCALE = lengthSkill('E5.12.length_scale', { variant: 'scale', scales: [2, 5, 10], max: 100 });
const TWO_UNITS = lengthSkill('E6.3.length_two_units', { variant: 'twoUnit', pairs: ['cm-mm', 'm-cm'], max: 1000 });

/** What each place of a plan can really measure, in metres (a typed oracle: a room is not 40 m long). */
const BANDS: Record<string, [number, number]> = {
    Pokój: [3, 9],
    Klasa: [6, 10],
    Ogród: [10, 40],
    'Sala gimnastyczna': [20, 40],
    Boisko: [30, 100],
    Ulica: [50, 100],
};
const PLACE = Object.keys(BANDS).join('|');
const PLACE_LOWER = PLACE.toLowerCase();
const FORWARD = new RegExp(`^Na planie 1 cm to (\\d+) m\\. (${PLACE}) ma na planie (\\d+) cm długości\\. Ile metrów długości ma naprawdę\\?$`);
const BACKWARD = new RegExp(`^Na planie 1 cm to (\\d+) m\\. (${PLACE}) ma naprawdę (\\d+) m długości\\. Ile centymetrów ma (${PLACE_LOWER}) na planie\\?$`);

describe('generateLength scale', () => {
    it('1000 draws: whole numbers both ways, a believable place, no drawing', () => {
        let forward = 0;
        let backward = 0;
        const scales = new Set<number>();
        const places = new Set<string>();
        forEachDraw(generateLength, SCALE, {}, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            const f = FORWARD.exec(task.prompt);
            const b = BACKWARD.exec(task.prompt);
            expect(f ?? b, where).not.toBeNull();
            const m = (f ?? b)!;
            const per = Number(m[1]);
            const place = m[2];
            if (b) expect(m[4], where).toBe(place.toLowerCase());
            scales.add(per);
            places.add(place);
            expect([2, 5, 10], where).toContain(per);
            if (f) {
                forward += 1;
                const plan = Number(m[3]);
                expect(task.answer, where).toBe(plan * per);
                expect(plan, where).toBeGreaterThanOrEqual(2);
                expect(plan, where).toBeLessThanOrEqual(12);
                expect(plan * per, where).toBeGreaterThanOrEqual(BANDS[place][0]);
                expect(plan * per, where).toBeLessThanOrEqual(BANDS[place][1]);
                expect(task.hint[task.hint.length - 1], where).toBe(`${place} ma naprawdę ${plan * per} m długości.`);
                expect(task.hint, where).toContain(`${plan} · ${per} = ${plan * per}`);
            } else {
                backward += 1;
                const real = Number(m[3]);
                expect(real % per, `${where} scale leaves a remainder`).toBe(0);
                expect(task.answer, where).toBe(real / per);
                expect(real / per, where).toBeGreaterThanOrEqual(2);
                expect(real / per, where).toBeLessThanOrEqual(12);
                expect(real, where).toBeGreaterThanOrEqual(BANDS[place][0]);
                expect(real, where).toBeLessThanOrEqual(BANDS[place][1]);
                expect(task.hint[task.hint.length - 1], where).toBe(`${place} ma na planie ${real / per} cm długości.`);
                expect(task.hint, where).toContain(`${real} : ${per} = ${real / per}`);
            }
            expect(firstHint(task), where).toBe(task.hint[0]);
            expect(task.hint[0], where).not.toContain(String(task.answer));
        });
        expect(forward, 'plan to real').toBeGreaterThan(300);
        expect(backward, 'real to plan').toBeGreaterThan(300);
        expect([...scales].sort((a, b) => a - b)).toEqual([2, 5, 10]);
        expect(places.size, 'different places').toBe(Object.keys(BANDS).length);
    });
});

describe('generateLength twoUnit', () => {
    const FORWARD_2 = /^(\d+) (cm|m) (\d+) (mm|cm) = □ (mm|cm)$/;
    const BACKWARD_2 = /^(\d+) (mm|cm) = (\d+) (cm|m) □ (mm|cm)$/;
    const factor = (big: string, small: string): number => {
        if (big === 'cm' && small === 'mm') return 10;
        if (big === 'm' && small === 'cm') return 100;
        throw new Error(`unit pair ${big}-${small}`);
    };

    it('1000 draws: "4 cm 7 mm = □ mm" and "47 mm = 4 cm □ mm", the small part below one big unit', () => {
        let forward = 0;
        let backward = 0;
        let smallBelowTen = 0;
        const pairs = new Set<string>();
        forEachDraw(generateLength, TWO_UNITS, {}, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            const f = FORWARD_2.exec(task.prompt);
            const b = BACKWARD_2.exec(task.prompt);
            expect(f ?? b, where).not.toBeNull();
            if (f) {
                forward += 1;
                const [big, small] = [f[2], f[4]];
                expect(f[5], where).toBe(small);
                const k = factor(big, small);
                const [bigN, smallN] = [Number(f[1]), Number(f[3])];
                pairs.add(`${big}-${small}`);
                expect(smallN, where).toBeGreaterThanOrEqual(1);
                expect(smallN, where).toBeLessThan(k);
                expect(task.answer, where).toBe(bigN * k + smallN);
                if (big === 'm' && smallN < 10) smallBelowTen += 1;
                expect(task.hint, where).toContain(`${bigN} · ${k} = ${bigN * k}`);
                expect(task.hint[task.hint.length - 1], where).toBe(`${bigN * k} + ${smallN} = ${bigN * k + smallN}`);
            } else {
                backward += 1;
                const m = b!;
                const [big, small] = [m[4], m[2]];
                expect(m[5], where).toBe(small);
                const k = factor(big, small);
                const [total, bigN] = [Number(m[1]), Number(m[3])];
                pairs.add(`${big}-${small}`);
                expect(Math.floor(total / k), where).toBe(bigN);
                expect(total % k, `${where} no small part left`).toBeGreaterThan(0);
                expect(task.answer, where).toBe(total - bigN * k);
                expect(task.hint, where).toContain(`${bigN} · ${k} = ${bigN * k}`);
                expect(task.hint[task.hint.length - 1], where).toBe(`${total} − ${bigN * k} = ${total - bigN * k}`);
            }
            expect(task.hint[0], where).toMatch(/^1 (cm = 10 mm|m = 100 cm)$/);
            expect(task.hint.length, where).toBe(3);
        });
        expect(forward, 'two units to one').toBeGreaterThan(300);
        expect(backward, 'one unit to two').toBeGreaterThan(300);
        expect([...pairs].sort()).toEqual(['cm-mm', 'm-cm']);
        expect(smallBelowTen, '2 m 5 cm style traps (the 0 in 205)').toBeGreaterThan(20);
    });
});

describe('parseLengthParams text variants', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [SCALE, TWO_UNITS]) expect(() => parseLengthParams(s.params), s.id).not.toThrow();
    });

    it.each([
        ['scale without scales', { variant: 'scale', scales: [], max: 100 }],
        ['scale with a fractional scale', { variant: 'scale', scales: [2.5], max: 100 }],
        ['scale with scale 1 (nothing to calculate)', { variant: 'scale', scales: [1], max: 100 }],
        ['scale with a duplicated scale', { variant: 'scale', scales: [2, 2], max: 100 }],
        ['scale with no place that fits under max', { variant: 'scale', scales: [10], max: 12 }],
        ['scale with a non-integer max', { variant: 'scale', scales: [2], max: 50.5 }],
        ['twoUnit without pairs', { variant: 'twoUnit', pairs: [], max: 1000 }],
        ['twoUnit with an unknown pair', { variant: 'twoUnit', pairs: ['m-mm'], max: 1000 }],
        ['twoUnit with a duplicated pair', { variant: 'twoUnit', pairs: ['cm-mm', 'cm-mm'], max: 1000 }],
        ['twoUnit with max too small for metres and centimetres', { variant: 'twoUnit', pairs: ['m-cm'], max: 150 }],
        ['twoUnit with max too small for centimetres and millimetres', { variant: 'twoUnit', pairs: ['cm-mm'], max: 15 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseLengthParams(params)).toThrow(TypeError);
    });
});
