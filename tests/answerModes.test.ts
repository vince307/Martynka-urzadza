import { describe, expect, it } from 'vitest';
import { canonicalInput } from '../src/core/round/canonicalInput';
import { pictureLayout } from '../src/core/round/pictureLayout';
import { playable } from '../src/core/round/pick';
import { validateTask } from '../src/core/tasks/validate';
import { ANSWER_MODES, type SkillDef } from '../src/core/types';
import { TASK_LAYOUT } from '../src/data/layout';

const skill = (answer: SkillDef['answer']): SkillDef => ({ id: 'T.1', stage: 'E1', step: 1, type: 'ADD_SUB', params: {}, answer });

describe('answer modes', () => {
    it('lists five modes, digits among them', () => {
        expect([...ANSWER_MODES].sort()).toEqual(['digits', 'drag', 'keypad', 'select', 'tiles']);
    });
    it('lets every answer mode into a round (the e2e helpers answer digits since S-14b phase 8)', () => {
        // An explicit oracle, not derived from `playable`.
        expect(ANSWER_MODES.filter((m) => playable(skill(m)))).toEqual(['tiles', 'keypad', 'drag', 'select', 'digits']);
    });
    it('gives digits its own layout, not the tiles one', () => {
        for (const solution of [false, true]) {
            const digits = pictureLayout(TASK_LAYOUT.picture, 'digits', solution, 'wide');
            const tiles = pictureLayout(TASK_LAYOUT.picture, 'tiles', solution, 'wide');
            expect(digits.picture).not.toEqual(tiles.picture);
        }
        expect(pictureLayout(TASK_LAYOUT.picture, 'digits', false, 'wide').picture).toEqual(TASK_LAYOUT.picture.digits.picture);
        expect(pictureLayout(TASK_LAYOUT.picture, 'digits', true, 'wide').lines).toEqual(TASK_LAYOUT.picture.digits.lines);
    });
    it('canonicalInput throws for a digits task without a column drawing', () => {
        expect(() => canonicalInput({ skillId: 'T.1', prompt: 'p', answer: 65, hint: ['h'], input: 'digits' })).toThrow(/digits needs a column drawing/);
    });
    it('canonicalInput types a column answer into the boxes from the ones; a digit count off the boxes throws', () => {
        const base = { skillId: 'T.1', prompt: 'p', hint: ['h'], input: 'digits' as const, visual: { kind: 'column', op: '+', a: 38, b: 27, columns: 2 } as const };
        expect(canonicalInput({ ...base, answer: 65 })).toBe(65);
        expect(() => canonicalInput({ ...base, answer: 165 })).toThrow(/digits/);
        expect(() => canonicalInput({ ...base, answer: 5 })).toThrow(/digits/);
        expect(() => canonicalInput({ ...base, answer: 'x' })).toThrow(/digits/);
    });
    it('the validator accepts digits with a column drawing and flags a number line that leaks its answer', () => {
        const column = { kind: 'column', op: '+', a: 38, b: 27, columns: 2 } as const;
        expect(validateTask({ skillId: 'T.1', prompt: 'p', answer: 65, hint: ['h'], input: 'digits', visual: column }, {})).toEqual([]);
        const line = (labels: number[], box: number | null) => ({ kind: 'numberLine', from: 0, to: 100, tick: 10, labels, box, jumps: [] }) as const;
        const task = (labels: number[], box: number | null) => ({ skillId: 'T.1', prompt: 'p', answer: 50, hint: ['h'], input: 'keypad' as const, visual: line(labels, box) });
        expect(validateTask(task([30, 40, 60], 50), {})).toEqual([]);
        expect(validateTask(task([30, 50, 60], null), {}).map((v) => v.rule)).toContain('visual');
        expect(validateTask(task([30, 40], 60), {}).map((v) => v.rule)).toContain('visual');
    });
    it('the validator reports a digits task without a column drawing as a mode violation', () => {
        const problems = validateTask({ skillId: 'T.1', prompt: 'p', answer: 65, hint: ['h'], input: 'digits' }, {});
        expect(problems.map((v) => v.rule)).toContain('mode');
    });
});

describe('written column layout (S-14b)', () => {
    it('the column area keeps the digits at least at their drawn size for three columns', () => {
        const { digits } = TASK_LAYOUT.picture;
        const W = TASK_LAYOUT.written;
        const widthUnits = 4 * W.colW;
        const heightUnits = W.markRow + 2 * W.row + W.ruleGap + W.box.height;
        expect(Math.min(digits.picture.width / widthUnits, digits.picture.height / heightUnits)).toBeGreaterThanOrEqual(1);
    });
    it('the result boxes are touch-sized squares of the digit', () => {
        expect(TASK_LAYOUT.written.box.width).toBeGreaterThanOrEqual(TASK_LAYOUT.written.colW * 0.8);
    });
});
