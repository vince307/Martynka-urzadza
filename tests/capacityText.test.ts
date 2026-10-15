// S-14c phase 6: CAPACITY in words (half and quarter litre glasses), no drawing, both directions. Oracles parse the prompt.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { firstHint } from '../src/core/round/hints';
import { screenBound } from '../src/core/tasks/bounds';
import { generateCapacity, parseCapacityParams } from '../src/core/tasks/generators/capacity';
import { inflect } from '../src/core/text/plural';
import type { SkillDef } from '../src/core/types';
import { nouns } from '../src/data/nouns';
import { forEachDraw } from './helpers';

const skill = (id: string, params: Record<string, unknown>): SkillDef => ({ id, stage: 'E5', step: 5, type: 'CAPACITY', params, answer: 'keypad' });

const TEXT = skill('E5.5.capacity_half_l_e5', { variant: 'text', glasses: ['half', 'quarter'], maxLitres: 5 });
const HALF_ONLY = skill('test.half', { variant: 'text', glasses: ['half'], maxLitres: 5 });

const litre = (n: number): string => `${n} ${inflect(n, nouns.litr)}`;
const glasses = (n: number): string => `${n} ${inflect(n, nouns.szklanka)}`;
const FORWARD = /^W dzbanku jest (\d+) (litr|litry|litrów) (soku|wody|mleka|kompotu)\. Ile szklanek po (½|¼) l możesz z niego nalać\?$/;
const BACKWARD = /^(\d+) (szklanka|szklanki|szklanek) po (½|¼) l to ile litrów\?$/;

describe('generateCapacity text', () => {
    it('1000 draws: litres to glasses and glasses to litres, ½ l and ¼ l, whole litres, no drawing', () => {
        let forward = 0;
        let backward = 0;
        const sizes = new Set<string>();
        const answers = new Set<number>();
        forEachDraw(generateCapacity, TEXT, {}, (task, where) => {
            expect(task.visual, where).toBeUndefined();
            const f = FORWARD.exec(task.prompt);
            const b = BACKWARD.exec(task.prompt);
            expect(f ?? b, where).not.toBeNull();
            // The narrator spells the fractions out.
            expect(task.speak, where).toBeDefined();
            expect(task.speak, where).not.toMatch(/[½¼]/);
            expect(task.speak, where).toMatch(/pół litra|ćwierć litra/);
            if (f) {
                forward += 1;
                const [litres, size] = [Number(f[1]), f[4]];
                const per = size === '½' ? 2 : 4;
                sizes.add(size);
                expect(f[2], where).toBe(inflect(litres, nouns.litr));
                expect(litres, where).toBeGreaterThanOrEqual(1);
                expect(litres, where).toBeLessThanOrEqual(5);
                expect(task.answer, where).toBe(litres * per);
                expect(task.hint, where).toContain(`${litres} · ${per} = ${litres * per}`);
                expect(task.hint[task.hint.length - 1], where).toBe(`To razem ${glasses(litres * per)}.`);
            } else {
                backward += 1;
                const [n, size] = [Number(b![1]), b![3]];
                const per = size === '½' ? 2 : 4;
                sizes.add(size);
                expect(b![2], where).toBe(inflect(n, nouns.szklanka));
                expect(n % per, `${where} glasses do not fill whole litres`).toBe(0);
                expect(n / per, where).toBeGreaterThanOrEqual(1);
                expect(n / per, where).toBeLessThanOrEqual(5);
                expect(task.answer, where).toBe(n / per);
                expect(task.hint, where).toContain(`${n} : ${per} = ${n / per}`);
                expect(task.hint[task.hint.length - 1], where).toBe(`To razem ${litre(n / per)}.`);
            }
            answers.add(Number(task.answer));
            expect(firstHint(task), where).toBe(task.hint[0]);
            expect(task.hint[0], where).toMatch(/^(Dwie szklanki po ½ l|Cztery szklanki po ¼ l) to razem litr\.$/);
            expect(task.hint[0], where).not.toMatch(/\d/);
            expect(task.tileRange, where).toBeUndefined();
        });
        expect(forward, 'litres to glasses').toBeGreaterThan(300);
        expect(backward, 'glasses to litres').toBeGreaterThan(300);
        expect([...sizes].sort()).toEqual(['¼', '½']);
        expect(answers.size, 'different answers').toBeGreaterThanOrEqual(10);
    });

    it('a half-litre-only skill never mentions a quarter', () => {
        forEachDraw(generateCapacity, HALF_ONLY, {}, (task, where) => {
            expect(task.prompt, where).not.toContain('¼');
            expect(task.prompt, where).toContain('½');
            expect(Number(task.answer), where).toBeLessThanOrEqual(10);
        });
    });

    it('the screen bound counts glasses per litre (20 with quarters, 10 with halves only)', () => {
        expect(screenBound(TEXT)).toBe(20);
        expect(screenBound(HALF_ONLY)).toBe(10);
    });

    it('E5.5 text skill: at least 12 different tasks, none above 15 %', () => {
        const seen = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateCapacity(TEXT, createRng(910_000 + i));
            seen.set(task.prompt, (seen.get(task.prompt) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(Math.max(...seen.values()) / 1000).toBeLessThanOrEqual(0.15);
    });
});

describe('parseCapacityParams text variant', () => {
    it('accepts the planned parameter set and keeps the jug variants working', () => {
        expect(() => parseCapacityParams(TEXT.params)).not.toThrow();
        expect(() => parseCapacityParams({ jugs: ['container-1l'], variant: 'toLitres', maxLitres: 3 })).not.toThrow();
    });

    it.each([
        ['no glasses', { variant: 'text', glasses: [], maxLitres: 5 }],
        ['an unknown glass', { variant: 'text', glasses: ['third'], maxLitres: 5 }],
        ['a duplicated glass', { variant: 'text', glasses: ['half', 'half'], maxLitres: 5 }],
        ['a fractional maxLitres', { variant: 'text', glasses: ['half'], maxLitres: 2.5 }],
        ['maxLitres 0', { variant: 'text', glasses: ['half'], maxLitres: 0 }],
        ['missing glasses', { variant: 'text', maxLitres: 5 }],
    ])('rejects %s', (_name, params) => {
        expect(() => parseCapacityParams(params)).toThrow(TypeError);
    });
});
