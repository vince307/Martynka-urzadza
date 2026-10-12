// Round hint policy on tasks from the real generators and the real curriculum.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { FIRST_HINT_EXEMPT_TYPES, firstHint, solutionSteps } from '../src/core/round/hints';
import { generateTask } from '../src/core/tasks/generateTask';
import type { Task } from '../src/core/tasks/types';
import { NUMBER_SOURCE, parseNumber } from '../src/core/text/formatNumber';
import { stages } from '../src/data/curriculum';
import type { SkillDef } from '../src/core/types';
import { skillsOfType } from './helpers';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { E1 } from '../src/data/curriculum/E1';

const answerLine = (answer: string): string => `Wynik: ${answer}`;
const typeOf = (skill: SkillDef): string => skill.type;
const lastNumber = (line: string): number | undefined => {
    const all = line.match(new RegExp(NUMBER_SOURCE, 'g'));
    return all ? parseNumber(all[all.length - 1]) : undefined;
};
const draw = (skill: SkillDef, seed: number): Task => generateTask(skill, createRng(900 + seed), { tileCount: 4 });
const allSkills = Object.values(stages).flatMap((stage) => (stage ? stage.steps.flatMap((step) => step.skills) : []));

describe('firstHint', () => {
    it('is null for single-line hints (HALF has two lines but line 0 is the result)', () => {
        const half = [...skillsOfType(E3, 'HALF'), ...skillsOfType(E4, 'HALF'), ...skillsOfType(E1, 'HALF')];
        expect(half.length).toBeGreaterThan(0);
        for (const skill of half) {
            for (let seed = 0; seed < 30; seed += 1) {
                expect(firstHint(draw(skill, seed)), `${skill.id} seed ${seed}`).toBeNull();
            }
        }
    });

    it('shows the interval line for ROUNDING even when it ends with the answer', () => {
        expect(FIRST_HINT_EXEMPT_TYPES).toContain('ROUNDING');
        const skills = skillsOfType(E4, 'ROUNDING');
        expect(skills.length).toBeGreaterThan(0);
        for (const skill of skills) {
            for (let seed = 0; seed < 30; seed += 1) {
                const task = draw(skill, seed);
                expect(firstHint(task), `${skill.id} seed ${seed}`).toBe(task.hint[0]);
            }
        }
    });

    it('MISSING: operand slots give the inverse operation without the result, result slot gives null', () => {
        const skills = [...skillsOfType(E3, 'MISSING'), ...skillsOfType(E4, 'MISSING')];
        let operand = 0;
        let result = 0;
        for (const skill of skills) {
            for (let seed = 0; seed < 40; seed += 1) {
                const task = draw(skill, seed);
                const where = `${skill.id} seed ${seed} "${task.prompt}"`;
                const hidesResult = /□$/.test(task.prompt);
                if (hidesResult) {
                    result += 1;
                    expect(task.hint, where).toHaveLength(1);
                    expect(firstHint(task), where).toBeNull();
                } else {
                    operand += 1;
                    expect(task.hint, where).toHaveLength(2);
                    expect(task.hint[0], where).not.toContain('=');
                    expect(task.hint[0], where).toMatch(/\d+ [+−·:] \d+$/);
                    expect(task.hint[1], where).toMatch(/=/);
                    expect(lastNumber(task.hint[1]), where).toBe(task.answer);
                    expect(firstHint(task), where).toBe(task.hint[0]);
                }
            }
        }
        expect(operand).toBeGreaterThan(0);
        expect(result).toBeGreaterThan(0);
    });

    it('never leaks a numeric answer as the last number of the first hint line (all stages)', () => {
        let shown = 0;
        for (const skill of allSkills) {
            if (skill.type === 'ROMAN') {
                continue;
            }
            for (let seed = 0; seed < 12; seed += 1) {
                let task: Task;
                try {
                    task = draw(skill, seed);
                } catch {
                    continue;
                }
                const first = firstHint(task);
                if (first === null) {
                    continue;
                }
                shown += 1;
                const openExpression = !first.includes('=') && /[+−·:] \S+$/.test(first);
                if (typeof task.answer === 'number' && !openExpression && !FIRST_HINT_EXEMPT_TYPES.includes(typeOf(skill))) {
                    expect(lastNumber(first), `${skill.id} seed ${seed} "${task.prompt}" hint "${first}"`).not.toBe(task.answer);
                }
            }
        }
        expect(shown).toBeGreaterThan(100);
    });

    it('a number equal to the answer in the middle of the line does not block the hint (CHAIN, ADD_SUB)', () => {
        const task: Task = { skillId: 'E3.1.chain_x', prompt: 'p', answer: 10, hint: ['10 − 4 = 6', '6 + 4 = 10'] };
        expect(firstHint(task)).toBe('10 − 4 = 6');
    });

    it('an open expression whose last operand equals the answer is not a leak (9 + □ = 18)', () => {
        const task: Task = { skillId: 'E3.2.missing_20', prompt: '9 + □ = 18', answer: 9, hint: ['Policz w drugą stronę: 18 − 9', '18 − 9 = 9'] };
        expect(firstHint(task)).toBe('Policz w drugą stronę: 18 − 9');
        expect(firstHint({ ...task, hint: ['18 − 9 = 9', 'x'] })).toBeNull();
    });

    it('string answers are never judged as leaks', () => {
        expect(firstHint({ skillId: 'E3.1.compare_num_x', prompt: 'p', answer: '<', hint: ['3 < 5', 'x'] })).toBe('3 < 5');
        expect(firstHint({ skillId: 'E3.1.compare_num_x', prompt: 'p', answer: '<', hint: ['3 < 5'] })).toBeNull();
    });
});

describe('solutionSteps', () => {
    it('ends with the answer for every skill of every stage', () => {
        for (const skill of allSkills) {
            for (let seed = 0; seed < 8; seed += 1) {
                let task: Task;
                try {
                    task = draw(skill, seed);
                } catch {
                    continue;
                }
                const steps = solutionSteps(task, answerLine);
                const where = `${skill.id} seed ${seed} "${task.prompt}" steps ${JSON.stringify(steps)}`;
                expect(steps.length, where).toBeGreaterThanOrEqual(task.hint.length);
                expect(steps.slice(0, task.hint.length), where).toEqual(task.hint);
                const last = steps[steps.length - 1];
                if (typeof task.answer === 'number') {
                    expect(lastNumber(last), where).toBe(task.answer);
                } else if (typeof task.answer === 'string') {
                    expect(last, where).toContain(task.answer);
                }
            }
        }
    });

    it('adds the answer line only when the hint does not end with the result', () => {
        const done: Task = { skillId: 's', prompt: 'p', answer: 13, hint: ['7 + 6 = 13'] };
        expect(solutionSteps(done, answerLine)).toEqual(['7 + 6 = 13']);
        const open: Task = { skillId: 's', prompt: 'p', answer: 13, hint: ['7 + 6'] };
        expect(solutionSteps(open, answerLine)).toEqual(['7 + 6', 'Wynik: 13']);
        const text: Task = { skillId: 's', prompt: 'p', answer: '<', hint: ['3 < 5'] };
        expect(solutionSteps(text, answerLine)).toEqual(['3 < 5']);
    });
});
