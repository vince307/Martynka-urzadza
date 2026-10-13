import { describe, expect, it } from 'vitest';
import { generateLength, parseLengthParams } from '../src/core/tasks/generators/length';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const lengthSkill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E3', step: 5, type: 'LENGTH', params, answer: 'keypad' });

const RULER_CM = lengthSkill('E3.5.length_ruler_cm_15', { variant: 'ruler', unit: 'cm', lengthCm: 15, minMm: 20, maxMm: 120, startShift: 0.4 });
const RULER_MM = lengthSkill('E4.7.length_ruler_mm_10', { variant: 'ruler', unit: 'mm', lengthCm: 10, minMm: 11, maxMm: 95, startShift: 0.3 });
const CONVERT = lengthSkill('E4.7.length_convert_m', { variant: 'convert', maxM: 5, cmStep: 10 });

describe('generateLength ruler', () => {
    for (const skill of [RULER_CM, RULER_MM]) {
        const p = parseLengthParams(skill.params);
        if (p.variant !== 'ruler') throw new Error('fixture');
        it(`${skill.id}: 1000 draws answer the drawn segment (to - from, not the end mark)`, () => {
            let shifted = 0;
            let fromZero = 0;
            forEachDraw(generateLength, skill, {}, (task, where) => {
                expect(task.visual?.kind, where).toBe('ruler');
                if (task.visual?.kind !== 'ruler') return;
                const v = task.visual;
                expect(v.unit, where).toBe(p.unit);
                expect(v.lengthCm, where).toBe(p.lengthCm);
                const len = v.toMm - v.fromMm;
                expect(len, where).toBeGreaterThanOrEqual(p.minMm);
                expect(len, where).toBeLessThanOrEqual(p.maxMm);
                expect(v.toMm, where).toBeLessThanOrEqual(p.lengthCm * 10);
                if (p.unit === 'cm') {
                    expect(v.fromMm % 10, where).toBe(0);
                    expect(v.toMm % 10, where).toBe(0);
                }
                if (v.fromMm > 0) shifted += 1;
                else fromZero += 1;
                expect(task.answer, where).toBe(p.unit === 'cm' ? len / 10 : len);
                expect(task.choices, where).toBeUndefined();
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                expect(task.hint[task.hint.length - 1], where).toContain(`${String(task.answer)} ${p.unit}`);
            });
            expect(shifted, 'segments not starting at zero').toBeGreaterThan(100);
            expect(fromZero, 'segments starting at zero').toBeGreaterThan(100);
        });
    }

    it('a shifted segment teaches subtraction of the two marks', () => {
        let checked = 0;
        forEachDraw(generateLength, RULER_CM, {}, (task) => {
            if (task.visual?.kind !== 'ruler' || task.visual.fromMm === 0) return;
            const { fromMm, toMm } = task.visual;
            expect(task.hint).toContain(`${toMm / 10} − ${fromMm / 10} = ${(toMm - fromMm) / 10}`);
            checked += 1;
        });
        expect(checked).toBeGreaterThan(100);
    });
});

describe('generateLength convert', () => {
    it('1000 draws turn "m cm" into centimetres, with no drawing', () => {
        let withCm = 0;
        let wholeMetres = 0;
        forEachDraw(generateLength, CONVERT, {}, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            const m = /^(\d+) m(?: (\d+) cm)? to ile centymetrów\?$/.exec(task.prompt);
            expect(m, where).not.toBeNull();
            const metres = Number(m?.[1]);
            const cm = Number(m?.[2] ?? 0);
            expect(metres, where).toBeGreaterThanOrEqual(1);
            expect(metres, where).toBeLessThanOrEqual(5);
            expect(cm % 10, where).toBe(0);
            expect(cm, where).toBeLessThan(100);
            if (cm > 0) withCm += 1;
            else wholeMetres += 1;
            expect(task.answer, where).toBe(100 * metres + cm);
            expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(withCm).toBeGreaterThan(300);
        expect(wholeMetres).toBeGreaterThan(30);
    });
});

describe('parseLengthParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const skill of [RULER_CM, RULER_MM, CONVERT]) {
            expect(() => parseLengthParams(skill.params), skill.id).not.toThrow();
        }
    });

    it.each([
        ['unknown variant', { variant: 'weigh' }],
        ['segment longer than the ruler', { variant: 'ruler', unit: 'cm', lengthCm: 10, minMm: 20, maxMm: 120, startShift: 0 }],
        ['cm segment off the centimetre marks (min)', { variant: 'ruler', unit: 'cm', lengthCm: 15, minMm: 25, maxMm: 120, startShift: 0 }],
        ['cm segment off the centimetre marks (max)', { variant: 'ruler', unit: 'cm', lengthCm: 15, minMm: 20, maxMm: 125, startShift: 0 }],
        ['startShift above 1', { variant: 'ruler', unit: 'cm', lengthCm: 15, minMm: 20, maxMm: 120, startShift: 1.5 }],
        ['negative startShift', { variant: 'ruler', unit: 'mm', lengthCm: 10, minMm: 11, maxMm: 95, startShift: -0.1 }],
        ['min above max', { variant: 'ruler', unit: 'mm', lengthCm: 10, minMm: 50, maxMm: 20, startShift: 0 }],
        ['unknown unit', { variant: 'ruler', unit: 'm', lengthCm: 10, minMm: 20, maxMm: 50, startShift: 0 }],
        ['convert with maxM 1', { variant: 'convert', maxM: 1, cmStep: 10 }],
        ['convert with a cmStep that does not divide 100', { variant: 'convert', maxM: 5, cmStep: 30 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseLengthParams(params)).toThrow(TypeError);
    });
});
