import { describe, expect, it } from 'vitest';
import { generateSequence, parseSequenceParams } from '../src/core/tasks/generators/sequence';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skillOf = (params: Record<string, unknown>): SkillDef => ({ id: 'x.seq', stage: 'E2', step: 7, type: 'SEQUENCE', params, answer: 'keypad' });
// Terms of the sequence from the prompt: the part after the colon.
const terms = (prompt: string): (number | null)[] =>
    prompt.split(': ')[1].split(', ').map((t) => (t === '□' ? null : Number(t)));

describe('generateSequence', () => {
    it('max 100 step 10: one gap, constant step, terms in [0; 100], both directions, 1000 draws', () => {
        const seen = new Set<string>();
        const dirs = new Set<string>();
        forEachDraw(generateSequence, skillOf({ max: 100, steps: [10] }), { max: 100 }, (task, where) => {
            const t = terms(task.prompt);
            expect(t.length, where).toBe(4);
            expect(t.filter((x) => x === null).length, where).toBe(1);
            const gap = t.indexOf(null);
            const full = t.map((x, i) => (i === gap ? (task.answer as number) : x!));
            const diff = full[1] - full[0];
            dirs.add(diff > 0 ? 'up' : 'down');
            for (let i = 1; i < full.length; i += 1) expect(full[i] - full[i - 1], where).toBe(diff);
            expect(Math.abs(diff), where).toBe(10);
            for (const v of full) {
                expect(v, where).toBeGreaterThanOrEqual(0);
                expect(v, where).toBeLessThanOrEqual(100);
                expect(v % 10, where).toBe(0);
            }
            expect(task.hint.length, where).toBe(2);
            expect(task.hint[1].endsWith(`= ${String(task.answer)}`), where).toBe(true);
            seen.add(task.prompt);
        });
        expect(seen.size).toBeGreaterThanOrEqual(12);
        expect(dirs).toEqual(new Set(['up', 'down']));
    });

    it('down only, any start, small max: never a negative term', () => {
        forEachDraw(generateSequence, skillOf({ max: 12, steps: [3, 4], length: 4, start: 'any', directions: ['down'] }), { max: 12 }, (task, where) => {
            const t = terms(task.prompt);
            for (const v of t) if (v !== null) expect(v, where).toBeGreaterThanOrEqual(0);
            expect(task.answer as number, where).toBeGreaterThanOrEqual(0);
        });
    });

    it('rejects malformed params', () => {
        expect(() => parseSequenceParams({ max: 20, steps: [10], length: 4 })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [0] })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [] })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [10], length: 3 })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [10], length: 7 })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [10], directions: [] })).toThrow(TypeError);
        expect(parseSequenceParams({ max: 100, steps: [10] })).toEqual({ max: 100, steps: [10], length: 4, start: 'multiple', directions: ['up', 'down'], line: false });
    });
});

describe('generateSequence with a number line (S-14b)', () => {
    const LINE = skillOf({ max: 100, steps: [10], start: 'multiple', line: true });
    it('draws the given terms as labels and the gap as the box, which is the answer', () => {
        forEachDraw(generateSequence, LINE, { max: 100 }, (task, where) => {
            const v = task.visual;
            if (v?.kind !== 'numberLine') throw new Error(`no number line ${where}`);
            const t = terms(task.prompt);
            const given = t.filter((x): x is number => x !== null);
            expect(v.from, where).toBe(0);
            expect(v.to, where).toBe(100);
            expect(v.tick, where).toBe(10);
            expect([...v.labels].sort((a, b) => a - b), where).toEqual([...given].sort((a, b) => a - b));
            expect(v.labels, where).not.toContain(task.answer);
            expect(v.box, where).toBe(task.answer);
            expect(v.jumps, where).toEqual([]);
        });
    });
    it('the tick follows the chosen step', () => {
        const ticks = new Set<number>();
        forEachDraw(generateSequence, skillOf({ max: 20, steps: [2, 5], start: 'multiple', line: true }), { max: 20 }, (task) => {
            if (task.visual?.kind === 'numberLine') ticks.add(task.visual.tick);
        });
        expect(ticks).toEqual(new Set([2, 5]));
    });
    it('is off unless asked for', () => {
        forEachDraw(generateSequence, skillOf({ max: 100, steps: [10] }), { max: 100 }, (task, where) => {
            expect(task.visual, where).toBeUndefined();
        });
    });
    it('rejects a line that does not fit or does not sit on ticks', () => {
        expect(() => parseSequenceParams({ max: 100, steps: [2], line: true })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [10], start: 'any', line: true })).toThrow(TypeError);
        expect(() => parseSequenceParams({ max: 100, steps: [10], line: 'yes' })).toThrow(TypeError);
        expect(parseSequenceParams({ max: 100, steps: [10], line: true }).line).toBe(true);
    });
});

