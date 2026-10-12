import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { addSubHint, crossesTen, generateAddSub, hasCarry, MINUS, parseAddSubParams } from '../src/core/tasks/generators/addSub';
import { validateTask } from '../src/core/tasks/validate';
import type { SkillDef } from '../src/core/types';
import { matchesToken } from '../src/core/tasks/shapes';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { nouns } from '../src/data/nouns';

const skills: SkillDef[] = [...E3.steps, ...E4.steps].flatMap((step) => step.skills).filter((s) => s.type === 'ADD_SUB');

const evaluate = (prompt: string): { a: number; b: number; op: '+' | '-'; value: number } => {
    const m = /^(\d+) ([+−]) (\d+)$/.exec(prompt);
    if (!m) {
        throw new Error(`unexpected prompt ${prompt}`);
    }
    const a = Number(m[1]);
    const b = Number(m[3]);
    const op = m[2] === '+' ? '+' : '-';
    return { a, b, op, value: op === '+' ? a + b : a - b };
};

const SEEDS = 20;
const DRAWS_PER_SEED = 50;

describe('generateAddSub', () => {
    it('finds ADD_SUB skills in E3', () => {
        expect(skills.length).toBeGreaterThan(0);
    });

    for (const skill of skills) {
        const params = parseAddSubParams(skill.params);

        it(`${skill.id}: ${SEEDS * DRAWS_PER_SEED} draws stay within the contract`, () => {
            for (let seed = 1; seed <= SEEDS; seed += 1) {
                const rng = createRng(20261012 + seed);
                for (let i = 0; i < DRAWS_PER_SEED; i += 1) {
                    const task = generateAddSub(skill, rng);
                    const where = `${skill.id} seed=${seed} draw=${i} prompt="${task.prompt}"`;
                    const { a, b, op, value } = evaluate(task.prompt);
                    expect(task.skillId, where).toBe(skill.id);
                    expect(params.ops, where).toContain(op);
                    expect(a, where).toBeGreaterThanOrEqual(0);
                    expect(b, where).toBeGreaterThanOrEqual(0);
                    expect(a, where).toBeLessThanOrEqual(params.max);
                    expect(b, where).toBeLessThanOrEqual(params.max);
                    expect(value, where).toBeGreaterThanOrEqual(0);
                    expect(value, where).toBeLessThanOrEqual(params.max);
                    expect(task.answer, where).toBe(value);
                    if (params.bridge === 'ten') {
                        expect(crossesTen(a, b, op), where).toBe(true);
                    }
                    if (params.bridge === 'none') {
                        expect(hasCarry(a, b, op), where).toBe(false);
                    }
                    expect(a, where).toBeGreaterThanOrEqual(1);
                    expect(b, where).toBeGreaterThanOrEqual(1);
                    if (params.shapes) {
                        const fits = params.shapes.some((s) => s.op === op && matchesToken(a, s.left) && matchesToken(b, s.right));
                        expect(fits, `${where} shapes=${JSON.stringify(params.shapes)}`).toBe(true);
                    }
                    expect(task.hint.length, where).toBeGreaterThan(0);
                    for (const step of task.hint) {
                        expect(step, where).not.toMatch(/[+−] 0 =/);
                        const m = /^(\d+) ([+−]) (\d+) = (\d+)$/.exec(step);
                        expect(m, `${where} hint "${step}"`).not.toBeNull();
                        const [, x, o, y, r] = m!;
                        expect(Number(r), where).toBe(o === '+' ? Number(x) + Number(y) : Number(x) - Number(y));
                    }
                    expect(task.hint[task.hint.length - 1], where).toMatch(new RegExp(`= ${value}$`));
                    expect(validateTask(task, { max: params.max, nouns }), where).toEqual([]);
                }
            }
        });
    }

    it('is deterministic for the same seed', () => {
        const skill = skills[0];
        const first = generateAddSub(skill, createRng(99));
        const second = generateAddSub(skill, createRng(99));
        expect(first).toEqual(second);
    });

    it('writes hints with the typographic minus and ten-crossing steps', () => {
        const task = generateAddSub(
            { id: 'x', stage: 'E3', step: 2, type: 'ADD_SUB', params: { max: 20, ops: ['-'], bridge: 'ten' }, answer: 'keypad' },
            createRng(5),
        );
        expect(task.prompt).toContain(MINUS);
        expect(task.hint).toHaveLength(2);
        expect(task.hint[0]).toMatch(/= \d*0$/);
    });

    it('detects carries and borrows at any digit', () => {
        expect(hasCarry(193, 70, '+')).toBe(true);
        expect(hasCarry(224, 60, '+')).toBe(false);
        expect(hasCarry(553, 50, '-')).toBe(false);
        expect(hasCarry(553, 60, '-')).toBe(true);
        expect(hasCarry(35, 34, '+')).toBe(false);
        expect(hasCarry(38, 7, '+')).toBe(true);
        expect(hasCarry(47, 3, '+')).toBe(false);
        expect(hasCarry(50, 3, '-')).toBe(false);
        expect(hasCarry(52, 20, '+')).toBe(false);
        expect(hasCarry(72, 50, '-')).toBe(false);
        expect(hasCarry(530, 400, '+')).toBe(false);
        expect(hasCarry(40, 60, '+')).toBe(false);
        expect(hasCarry(45, 7, '-')).toBe(true);
        expect(hasCarry(370, 50, '+')).toBe(true);
    });

    it('defines crossing a ten by the units only', () => {
        expect(crossesTen(7, 6, '+')).toBe(true);
        expect(crossesTen(8, 2, '+')).toBe(false);
        expect(crossesTen(14, 13, '+')).toBe(false);
        expect(crossesTen(13, 6, '-')).toBe(true);
        expect(crossesTen(20, 7, '-')).toBe(false);
        expect(crossesTen(27, 15, '-')).toBe(false);
        expect(crossesTen(22, 6, '-')).toBe(true);
    });

    it('breaks two-digit operands into tens first', () => {
        expect(addSubHint(14, 13, '+')).toEqual(['14 + 10 = 24', '24 + 3 = 27']);
        expect(addSubHint(22, 15, '-')).toEqual([`22 ${MINUS} 10 = 12`, `12 ${MINUS} 2 = 10`, `10 ${MINUS} 3 = 7`]);
        expect(addSubHint(7, 6, '+')).toEqual(['7 + 3 = 10', '10 + 3 = 13']);
        expect(addSubHint(8, 2, '+')).toEqual(['8 + 2 = 10']);
        expect(addSubHint(20, 7, '-')).toEqual([`10 ${MINUS} 7 = 3`, '10 + 3 = 13']); // F12 supersedes the one-line hint
        expect(addSubHint(530, 400, '+')).toEqual(['530 + 400 = 930']);
    });

    it('derives ops from shapes and rejects contradicting ops', () => {
        expect(parseAddSubParams({ max: 100, shapes: ['DU+U', 'DT-U'], bridge: 'none' }).ops).toEqual(['+', '-']);
        expect(() => parseAddSubParams({ max: 100, shapes: ['DU+U'], ops: ['-'], bridge: 'none' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 100, shapes: [], bridge: 'none' })).toThrow(TypeError);
    });

    it('rejects malformed params', () => {
        expect(() => parseAddSubParams({ max: '20', ops: ['+'], bridge: 'any' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 20, ops: [], bridge: 'any' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 20, ops: ['+'], bridge: 'x' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 20, ops: ['*'], bridge: 'any' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 9, ops: ['+'], bridge: 'ten' })).toThrow(TypeError);
        expect(() => parseAddSubParams({ max: 30, shapes: ['DU+DU'], bridge: 'ten' })).toThrow(/DU\+DU has no solutions/);
        expect(() => parseAddSubParams({ max: 100, shapes: ['DT-U'], bridge: 'ten' })).toThrow(TypeError);
        expect(parseAddSubParams({ max: 100, shapes: ['DU+U'], bridge: 'ten' }).shapes).toHaveLength(1);
    });
});

describe('ADD_SUB: rare a − a (E1)', () => {
    const share = (params: Record<string, unknown>): { same: number; top: number } => {
        const skill: SkillDef = { id: 'x.addsub', stage: 'E1', step: 1, type: 'ADD_SUB', params, answer: 'keypad' };
        const rng = createRng(7);
        let subs = 0;
        let same = 0;
        const counts = new Map<string, number>();
        for (let i = 0; i < 1000; i += 1) {
            const task = generateAddSub(skill, rng);
            counts.set(task.prompt, (counts.get(task.prompt) ?? 0) + 1);
            const m = /^(\d+) − (\d+)$/.exec(task.prompt);
            if (m) {
                subs += 1;
                same += m[1] === m[2] ? 1 : 0;
            }
        }
        return { same: same / subs, top: Math.max(...counts.values()) / 1000 };
    };

    for (const params of [
        { max: 5, ops: ['+', '-'], bridge: 'any' },
        { max: 10, ops: ['+', '-'], bridge: 'any' },
        { max: 100, shapes: ['DT+DT', 'DT-DT'], bridge: 'none' },
    ]) {
        it(`${JSON.stringify(params)}: a − a is rare and no task dominates`, () => {
            const { same, top } = share(params);
            expect(same).toBeGreaterThan(0);
            expect(same).toBeLessThanOrEqual(0.1);
            expect(top).toBeLessThanOrEqual(0.15);
        });
    }

    it('teaches DT − U by breaking one ten: 70 − 9 = 60 + (10 − 9) (F12, impl-review S-03)', () => {
        expect(addSubHint(70, 9, '-')).toEqual([`10 ${MINUS} 9 = 1`, '60 + 1 = 61']);
        expect(addSubHint(20, 7, '-')).toEqual([`10 ${MINUS} 7 = 3`, '10 + 3 = 13']);
        expect(addSubHint(90, 4, '-')).toEqual([`10 ${MINUS} 4 = 6`, '80 + 6 = 86']);
        expect(addSubHint(10, 3, '-')).toEqual([`10 ${MINUS} 3 = 7`]);
    });
});
