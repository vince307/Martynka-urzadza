import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { getGenerator } from '../src/core/tasks/registry';
import { validationBounds } from '../src/core/tasks/bounds';
import { validateTask } from '../src/core/tasks/validate';
import { playable } from '../src/core/round/pick';
import { stages } from '../src/data/curriculum';
import { nouns } from '../src/data/nouns';

/** Group 1 of ZADANIA.md section 7, complete after S-03 phases 1–5 (S-02 types plus BONDS … CHOOSE_OP), plus ARROW_TABLE and WRITTEN (S-14b). */
const GROUP_1 = ['ADD_SUB', 'MISSING', 'COMPLEMENT', 'ROUNDING', 'MULT', 'DIV', 'HALF', 'COMPARE_NUM', 'EVEN_ODD', 'NUMBER_WORDS', 'ROMAN', 'CALENDAR', 'WORD', 'COMPARE_DIFF', 'BONDS', 'CHAIN', 'MISSING_OP', 'COMPARE_EXPR', 'SEQUENCE', 'FACT_FAMILY', 'CHOOSE_OP', 'ARROW_TABLE', 'WRITTEN', 'INEQUALITY', 'ORDER_OPS', 'TIMES_MORE', 'PRICE', 'CLOCK_ELAPSED', 'TIME_UNITS'];
/** Types that need drawings or art (groups 2–3), or are textbook types outside ZADANIA.md section 7: allowed to have no skill yet. */
const LATER = ['CLOCK', 'MASS', 'DATA', 'PUZZLE_GRID', 'LENGTH', 'PLACE_VALUE', 'GRID', 'MULT_GROUPS', 'TEMPERATURE', 'MONEY_COUNT', 'MONEY_CHANGE', 'CAPACITY', 'PERIMETER', 'SHAPES', 'PATTERN', 'COMPARE_QTY', 'SPATIAL', 'SYMMETRY', 'COUNT', 'ORDINAL', 'MONEY_PAY', 'UNIT_CHOICE', 'MIX', 'LOGIC'];

describe('curriculum E1–E6', () => {
    for (const stage of Object.values(stages)) {
        for (const step of stage.steps) {
            it(`${stage.id}.${step.step} covers its group-1 types`, () => {
                for (const type of step.types) {
                    if (GROUP_1.includes(type)) {
                        expect(step.skills.some((s) => s.type === type), `${stage.id}.${step.step} ${type}`).toBe(true);
                    } else {
                        expect(LATER, `${stage.id}.${step.step} ${type} is neither group 1 nor a later type`).toContain(type);
                    }
                }
                for (const skill of step.skills) {
                    expect(skill.stage).toBe(stage.id);
                    expect(skill.step).toBe(step.step);
                    expect(skill.id.startsWith(`${stage.id}.${step.step}.`), skill.id).toBe(true);
                }
            });

            for (const skill of step.skills) {
                it(`${skill.id}: 200 draws without violations`, () => {
                    const generate = getGenerator(skill.type);
                    expect(generate, skill.type).toBeDefined();
                    for (let seed = 1; seed <= 4; seed += 1) {
                        const rng = createRng(777 + seed);
                        for (let i = 0; i < 50; i += 1) {
                            const task = generate!(skill, rng);
                            const where = `${skill.id} seed=${seed} draw=${i} "${task.prompt}"`;
                            expect(task.prompt.length, where).toBeGreaterThan(0);
                            expect(task.answer, where).toBeDefined();
                            if (task.choices) {
                                expect(task.choices.length, where).toBeGreaterThanOrEqual(2);
                                expect(task.choices.length, where).toBeLessThanOrEqual(6);
                            }
                            expect(validateTask(task, { ...validationBounds(skill), nouns }), where).toEqual([]);
                        }
                    }
                });
            }
        }
    }

    it('skill ids are unique across stages', () => {
        const ids = Object.values(stages).flatMap((s) => s.steps.flatMap((st) => st.skills.map((sk) => sk.id)));
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('child-facing step names', () => {
    for (const stage of Object.values(stages)) {
        const named = stage.steps.filter((step) => step.skills.some(playable));
        for (const step of named) {
            it(`${stage.id}.${step.step} has a short childName`, () => {
                const name = step.childName;
                expect(name, `${stage.id}.${step.step} childName`).toBeTruthy();
                expect(name!.length, name).toBeLessThanOrEqual(28);
                expect(name!, name).toMatch(/^\p{Lu}/u);
                expect(name!, name).not.toMatch(/\.$/);
            });
        }
        it(`${stage.id}: childNames are distinct and only on playable steps`, () => {
            const names = named.map((step) => step.childName);
            expect(new Set(names).size).toBe(names.length);
            for (const step of stage.steps.filter((s) => !s.skills.some(playable))) {
                expect(step.childName, `${stage.id}.${step.step}`).toBeUndefined();
            }
        });
    }
});
