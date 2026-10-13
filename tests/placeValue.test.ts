import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { generatePlaceValue, parsePlaceValueParams } from '../src/core/tasks/generators/placeValue';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>, answer: SkillDef['answer'] = 'keypad'): SkillDef => ({ id, stage: 'E3', step: 6, type: 'PLACE_VALUE', params, answer });

const READ_30 = skill('E3.6.place_read_30', { variant: 'read', min: 11, max: 30 });
const TENS_30 = skill('E3.6.place_tens_30', { variant: 'tens', min: 11, max: 30 });
const READ_100 = skill('E4.1.place_read_100', { variant: 'read', min: 20, max: 99 });
const DECOMPOSE = skill('E4.1.place_decompose_100', { variant: 'decompose', min: 21, max: 99 });
const READ_1000 = skill('E4.8.place_read_1000', { variant: 'read', min: 100, max: 999 });
const BUILD = skill('E4.8.place_build_100', { variant: 'build', min: 11, max: 99 }, 'drag');

// The oracle works from the drawing (visual) fields, never from task.answer.
const blocksOf = (task: { visual?: { kind: string } }, where: string): { hundreds: number; tens: number; ones: number } => {
    const v = task.visual as { kind: string; hundreds: number; tens: number; ones: number } | undefined;
    if (v?.kind !== 'blocks') throw new Error(`no blocks drawing ${where}`);
    return v;
};

describe('generatePlaceValue', () => {
    for (const s of [READ_30, READ_100, READ_1000]) {
        it(`${s.id}: 1000 draws read the number off the blocks, inside min..max`, () => {
            const { min, max } = s.params as { min: number; max: number };
            const hundreds = new Set<number>();
            let zeroOnes = 0;
            let zeroTens = 0;
            forEachDraw(generatePlaceValue, s, { max }, (task, where) => {
                const b = blocksOf(task, where);
                expect(task.answer, where).toBe(100 * b.hundreds + 10 * b.tens + b.ones);
                expect(task.answer as number, where).toBeGreaterThanOrEqual(min);
                expect(task.answer as number, where).toBeLessThanOrEqual(max);
                hundreds.add(b.hundreds);
                if (b.ones === 0) zeroOnes += 1;
                if (b.tens === 0 && b.hundreds > 0) zeroTens += 1;
                expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
                expect(firstHint(task), where).not.toBeNull();
                expect(task.hint[0], where).not.toMatch(/\d/);
                expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
            });
            expect(zeroOnes, 'draws with zero ones').toBeGreaterThan(0);
            if (max >= 100) {
                expect(zeroTens, 'draws with zero tens').toBeGreaterThan(0);
                expect(hundreds.size).toBeGreaterThan(5);
            }
        });
    }

    it('tens: asks how many tens the blocks show; the answer is the tens count of the drawing', () => {
        const seen = new Set<number>();
        forEachDraw(generatePlaceValue, TENS_30, { max: 30 }, (task, where) => {
            const b = blocksOf(task, where);
            expect(b.hundreds, where).toBe(0);
            expect(task.answer, where).toBe(b.tens);
            expect(b.tens, where).toBeGreaterThanOrEqual(1);
            expect(task.prompt, where).toMatch(/dziesiątek/);
            seen.add(b.tens);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect([...seen].sort()).toEqual([1, 2, 3]);
    });

    it('decompose: "47 = 40 + □" has no drawing and the answer completes the sum', () => {
        forEachDraw(generatePlaceValue, DECOMPOSE, { max: 99 }, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            const m = /^(\d+) = (\d+) \+ □$/.exec(task.prompt);
            if (!m) throw new Error(`prompt shape ${where}`);
            const [n, rest] = [Number(m[1]), Number(m[2])];
            expect(rest % 10, where).toBe(0);
            expect(rest + (task.answer as number), where).toBe(n);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(1);
            expect(task.answer as number, where).toBeLessThanOrEqual(9);
            expect(n, where).toBeGreaterThanOrEqual(21);
            expect(n, where).toBeLessThanOrEqual(99);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
    });

    it('build: names the number to build, has no drawing, answer within min..max, the mat starts empty', () => {
        const seen = new Set<number>();
        forEachDraw(generatePlaceValue, BUILD, { max: 99 }, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            expect(task.choices, where).toBeUndefined();
            const m = /^Zbuduj z klocków liczbę (\d+)\.$/.exec(task.prompt);
            if (!m) throw new Error(`prompt shape ${where}`);
            expect(task.answer, where).toBe(Number(m[1]));
            expect(task.answer as number, where).toBeGreaterThanOrEqual(11);
            expect(task.answer as number, where).toBeLessThanOrEqual(99);
            seen.add(task.answer as number);
            expect(task.hint.length, where).toBeGreaterThanOrEqual(2);
            expect(task.hint[task.hint.length - 1], where).toContain(String(task.answer));
        });
        expect(seen.size).toBeGreaterThan(60);
    });

    it('hint lines agree in number: 1 dziesiątka, 2 dziesiątki, 5 jedności', () => {
        const task = generatePlaceValue(skill('x', { variant: 'build', min: 21, max: 21 }), createRng(1));
        expect(task.hint.join(' ')).toContain('2 dziesiątki');
        expect(task.hint.join(' ')).toContain('1 jedność');
        const ten = generatePlaceValue(skill('x', { variant: 'build', min: 15, max: 15 }), createRng(1));
        expect(ten.hint.join(' ')).toContain('1 dziesiątka');
        expect(ten.hint.join(' ')).toContain('5 jedności');
    });
});

describe('parsePlaceValueParams', () => {
    it('accepts the planned parameter sets', () => {
        for (const s of [READ_30, TENS_30, READ_100, DECOMPOSE, READ_1000, BUILD]) {
            expect(() => parsePlaceValueParams(s.params), s.id).not.toThrow();
        }
    });

    it.each([
        ['unknown variant', { variant: 'compare', min: 11, max: 30 }],
        ['max above 999', { variant: 'read', min: 100, max: 1000 }],
        ['min above max', { variant: 'read', min: 50, max: 40 }],
        ['min below 1', { variant: 'read', min: 0, max: 40 }],
        ['fractional bound', { variant: 'read', min: 11, max: 30.5 }],
        ['build with max 150', { variant: 'build', min: 11, max: 150 }],
        ['tens above 99', { variant: 'tens', min: 11, max: 120 }],
        ['tens below 10', { variant: 'tens', min: 5, max: 30 }],
        ['decompose with no number off a full ten', { variant: 'decompose', min: 20, max: 20 }],
        ['missing bounds', { variant: 'read' }],
    ])('rejects %s', (_name, params) => {
        expect(() => parsePlaceValueParams(params)).toThrow(TypeError);
    });
});
