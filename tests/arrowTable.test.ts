// ARROW_TABLE (S-14b): the rule is recomputed here from the drawing, never read back from the generator's hint lines.
import { describe, expect, it } from 'vitest';
import { firstHint } from '../src/core/round/hints';
import { generateArrowTable, parseArrowTableParams } from '../src/core/tasks/generators/arrowTable';
import { generators, parsers } from '../src/core/tasks/registry';
import type { Task } from '../src/core/tasks/types';
import type { TaskVisual } from '../src/core/tasks/visual';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

type Arrows = Extract<TaskVisual, { kind: 'arrows' }>;

const skill = (variants: string[], max = 20, n: [number, number] = [2, 10]): SkillDef => ({
    id: `E2.6.arrows_${variants.join('_')}`, stage: 'E2', step: 6, type: 'ARROW_TABLE', params: { variants, max, n }, answer: 'keypad',
});
const arrows = (task: Task, where: string): Arrows => {
    if (task.visual?.kind !== 'arrows') throw new Error(`no arrows drawing ${where}`);
    return task.visual;
};
const apply = (x: number, op: '+' | '−', n: number): number => (op === '+' ? x + n : x - n);
const SIGN = { '+': '+', '−': '−' } as const;

describe('ARROW_TABLE registration and params', () => {
    it('is registered next to its parser', () => {
        expect(Object.keys(generators).sort()).toEqual(Object.keys(parsers).sort());
        expect(generators.ARROW_TABLE).toBe(generateArrowTable);
    });
    it('rejects params with no solutions', () => {
        expect(() => parseArrowTableParams({ variants: [], max: 20, n: [2, 10] })).toThrow(TypeError);
        expect(() => parseArrowTableParams({ variants: ['pie'], max: 20, n: [2, 10] })).toThrow(TypeError);
        expect(() => parseArrowTableParams({ variants: ['table'], max: 21, n: [2, 10] })).toThrow(TypeError);
        expect(() => parseArrowTableParams({ variants: ['table'], max: 20, n: [0, 10] })).toThrow(TypeError);
        expect(() => parseArrowTableParams({ variants: ['table'], max: 20, n: [10, 2] })).toThrow(TypeError);
        expect(() => parseArrowTableParams({ variants: ['table'], max: 3, n: [2, 10] })).toThrow(TypeError);
        expect(parseArrowTableParams({ variants: ['graphOut', 'table'], max: 20, n: [2, 10] })).toEqual({ variants: ['graphOut', 'table'], max: 20, n: [2, 10] });
    });
});

describe('ARROW_TABLE tasks', () => {
    it('graphOut: the output is empty and is input op n; the hint states the rule first, then the line of the field', () => {
        const ops = new Set<string>();
        forEachDraw(generateArrowTable, skill(['graphOut']), {}, (task, where) => {
            const v = arrows(task, where);
            expect(v.layout, where).toBe('graph');
            if (v.layout !== 'graph') return;
            ops.add(v.op);
            expect(v.output, where).toBeNull();
            expect(v.input, where).not.toBeNull();
            expect(task.answer, where).toBe(apply(v.input as number, v.op, v.n));
            expect(task.answer as number, where).toBeGreaterThanOrEqual(0);
            expect(task.answer as number, where).toBeLessThanOrEqual(20);
            expect(task.input ?? 'keypad', where).toBe('keypad');
            expect(task.prompt, where).toBe('Uzupełnij graf.');
            expect(task.hint[0], where).not.toContain('=');
            expect(task.hint[task.hint.length - 1], where).toBe(`${v.input} ${SIGN[v.op]} ${v.n} = ${String(task.answer)}`);
            // The rule line names the step; when the step equals the answer, firstHint rightly withholds it.
            expect(firstHint(task), where).toBe(task.answer === v.n ? null : task.hint[0]);
        });
        expect(ops).toEqual(new Set(['+', '−']));
    });

    it('graphIn: the input is empty; the line of the field is the inverse operation', () => {
        forEachDraw(generateArrowTable, skill(['graphIn']), {}, (task, where) => {
            const v = arrows(task, where);
            if (v.layout !== 'graph') throw new Error(where);
            expect(v.input, where).toBeNull();
            expect(v.output, where).not.toBeNull();
            expect(apply(task.answer as number, v.op, v.n), where).toBe(v.output);
            const inverse = v.op === '+' ? '−' : '+';
            expect(task.hint[task.hint.length - 1], where).toBe(`${v.output} ${SIGN[inverse]} ${v.n} = ${String(task.answer)}`);
            expect(task.hint[0], where).not.toContain('=');
        });
    });

    it('table: 3-4 different inputs, one rule, exactly one empty output, which is the answer', () => {
        const sizes = new Set<number>();
        forEachDraw(generateArrowTable, skill(['table']), {}, (task, where) => {
            const v = arrows(task, where);
            if (v.layout !== 'table') throw new Error(where);
            sizes.add(v.inputs.length);
            expect(v.inputs.length, where).toBeGreaterThanOrEqual(3);
            expect(v.inputs.length, where).toBeLessThanOrEqual(4);
            expect(new Set(v.inputs).size, where).toBe(v.inputs.length);
            expect(v.outputs.length, where).toBe(v.inputs.length);
            expect(v.outputs.filter((o) => o === null).length, where).toBe(1);
            const empty = v.outputs.indexOf(null);
            v.inputs.forEach((x, i) => {
                const want = apply(x, v.op, v.n);
                expect(want, where).toBeGreaterThanOrEqual(0);
                expect(want, where).toBeLessThanOrEqual(20);
                if (i === empty) expect(task.answer, where).toBe(want);
                else expect(v.outputs[i], where).toBe(want);
            });
            expect(task.prompt, where).toBe('Uzupełnij tabelkę.');
            expect(task.hint[0], where).not.toContain('=');
            expect(task.hint[task.hint.length - 1], where).toBe(`${v.inputs[empty]} ${SIGN[v.op]} ${v.n} = ${String(task.answer)}`);
        });
        expect(sizes).toEqual(new Set([3, 4]));
    });

    it('mixed variants all appear', () => {
        const seen = new Set<string>();
        forEachDraw(generateArrowTable, skill(['graphOut', 'graphIn', 'table']), {}, (task) => {
            const v = task.visual as Arrows;
            seen.add(v.layout === 'table' ? 'table' : v.output === null ? 'graphOut' : 'graphIn');
        });
        expect(seen).toEqual(new Set(['graphOut', 'graphIn', 'table']));
    });
});
