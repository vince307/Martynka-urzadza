import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { headingOf } from '../src/core/round/heading';
import { generateTask } from '../src/core/tasks/generateTask';
import { isExpression } from '../src/core/round/prompt';
import { stages } from '../src/data/curriculum';

describe('headingOf (PA-1)', () => {
    it.each([
        ['38 + 27', 38 + 27, 'calculate'],
        ['3 + 2 − 1', 4, 'calculate'],
        ['17 − 8 = □', 9, 'calculate'],
        ['3 + ? = 5', 2, 'calculate'],
        ['12 000 + 5 000', 17000, 'calculate'],
        ['21 □ 66', '<', 'sign'],
        ['2 + 6 □ 4 − 1', '>', 'sign'],
        ['6 □ 2 = 4', '+', 'sign'],
        ['2 + □ = 4', 2, 'fill'],
        ['4 + 1 = 1 + □', 4, 'fill'],
        ['81 = 80 + □', 1, 'fill'],
    ] as const)('prompt %s gives %s', (prompt, answer, kind) => {
        expect(headingOf({ prompt, answer })).toBe(kind);
    });

    it('gives no heading to a sentence', () => {
        expect(headingOf({ prompt: 'Ala ma 3 jabłka i dostaje 2 więcej.', answer: 5 })).toBeNull();
    });

    it('survey: sign only for the three sign types, and the survey is not vacuous', () => {
        const SIGN_TYPES = ['COMPARE_NUM', 'COMPARE_EXPR', 'MISSING_OP'];
        const signStages = new Set<string>();
        const fillStages = new Set<string>();
        for (const stage of Object.values(stages)) {
            for (const step of stage.steps) {
                for (const skill of step.skills) {
                    for (let seed = 1; seed <= 20; seed += 1) {
                        const task = generateTask(skill, createRng(900 + seed), { tileCount: 4 });
                        const kind = headingOf(task);
                        if (typeof task.answer === 'string' && isExpression(task.prompt)) {
                            expect(kind, `${skill.id} "${task.prompt}"`).toBe('sign');
                        }
                        if (kind === 'sign') {
                            expect(SIGN_TYPES, skill.id).toContain(skill.type);
                            signStages.add(stage.id);
                        }
                        if (kind === 'fill') fillStages.add(stage.id);
                    }
                }
            }
        }
        for (const id of ['E1', 'E2', 'E4', 'E6']) expect(signStages.has(id), `sign in ${id}`).toBe(true);
        for (const id of ['E1', 'E2']) expect(fillStages.has(id), `fill in ${id}`).toBe(true);
    });
});
