// Every skill of every stage must be solvable in its own answer mode through the round state machine (S13-01..04):
// the right answer, as the answer widget can produce it, reaches `done`; a retype never strands the child.
import { describe, expect, it } from 'vitest';
import { answer, startRound } from '../src/core/round';
import { canonicalInput } from '../src/core/round/canonicalInput';
import { createRng } from '../src/core/rng';
import { generateTask } from '../src/core/tasks/generateTask';
import { dragMode } from '../src/core/tasks/dragMode';
import { getGenerator } from '../src/core/tasks/registry';
import type { Task } from '../src/core/tasks/types';
import { validateTask } from '../src/core/tasks/validate';
import { validationBounds } from '../src/core/tasks/bounds';
import type { SkillDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { nouns } from '../src/data/nouns';

const SEEDS = 20;
const DRAWS = 50;
const skills = (): SkillDef[] => Object.values(stages).flatMap((st) => st.steps.flatMap((step) => step.skills));
const base: Task = { skillId: 'T.1', prompt: 'p', answer: 1, hint: ['h'] };

describe('every skill is solvable in its answer mode', () => {
    for (const skill of skills().filter((s) => getGenerator(s.type))) {
        it(`${skill.id} (${skill.answer})`, () => {
            for (let seed = 1; seed <= SEEDS; seed += 1) {
                const rng = createRng(20261014 + seed);
                for (let i = 0; i < DRAWS; i += 1) {
                    const task = generateTask(skill, rng, { tileCount: 4 });
                    const where = `${skill.id} seed=${seed} draw=${i}`;
                    expect(validateTask(task, { nouns, allowNegative: validationBounds(skill).allowNegative }), where).toEqual([]);
                    const s = answer(startRound([task], balance.round), canonicalInput(task));
                    expect(s.phase, where).toBe('done');
                    expect(s.outcomes[0], where).toBe('first');
                }
            }
        });
    }
});

describe('dragMode', () => {
    it('picks the clock branch from the drawing, not from the answer type', () => {
        expect(dragMode({ ...base, answer: '3.00', visual: { kind: 'clock', hour: 9, minute: 0 } })).toBe('clock');
    });
    it('keeps blocks for no drawing or a blocks drawing', () => {
        expect(dragMode({ ...base, answer: 42 })).toBe('blocks');
        expect(dragMode({ ...base, answer: 42, visual: { kind: 'blocks', hundreds: 0, tens: 4, ones: 2 } })).toBe('blocks');
    });
    it('throws for a drawing that has no drag branch, naming the kind', () => {
        expect(() => dragMode({ ...base, visual: { kind: 'thermometer', celsius: 3 } })).toThrow(/thermometer/);
    });
});

describe('validateTask is aware of the answer mode', () => {
    it('flags a select answer that is not a subset of the choices', () => {
        const t: Task = { ...base, input: 'select', answer: [1, 9], choices: [1, 2, 3], hint: ['h'] };
        expect(validateTask(t).map((v) => v.rule)).toContain('choices');
    });
    it('flags a drag task whose drawing has no drag branch', () => {
        const t: Task = { ...base, input: 'drag', visual: { kind: 'thermometer', celsius: 3 } };
        expect(validateTask(t).map((v) => v.rule)).toContain('mode');
    });
    it('accepts a drag task with a blocks drawing', () => {
        const t: Task = { ...base, input: 'drag', answer: 42, visual: { kind: 'blocks', hundreds: 0, tens: 4, ones: 2 } };
        expect(validateTask(t)).toEqual([]);
    });
});

describe('a select answer is a set', () => {
    it('is right in any order when the task has no check', () => {
        const t: Task = { ...base, input: 'select', answer: [1, 3], choices: [1, 2, 3, 4] };
        expect(answer(startRound([t], balance.round), [3, 1]).phase).toBe('done');
        expect(answer(startRound([t], balance.round), [3]).phase).toBe('second');
    });
});

describe('generateTask names the skill in a generator failure', () => {
    it('wraps a parser error with the skill id and keeps the cause', () => {
        const skill: SkillDef = { id: 'E9.9.bad_params', stage: 'E1', step: 1, type: 'ADD_SUB', params: { nonsense: true }, answer: 'tiles' };
        let caught: unknown;
        try {
            generateTask(skill, createRng(1), { tileCount: 4 });
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(Error);
        expect((caught as Error).message).toContain('E9.9.bad_params');
        expect((caught as Error & { cause?: unknown }).cause).toBeInstanceOf(Error);
    });
});
