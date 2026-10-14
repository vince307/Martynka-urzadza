// Origin: S-14b phase 4. The hint drawing (Task.hintVisual): a number line under the expression that shows the hint's jumps,
// appears from the second mistake, never labels the result, and stays out of the word minigame.
import { describe, expect, it } from 'vitest';
import { startLearning } from '../src/core/curriculum';
import { buildWordRound } from '../src/core/minigames/word';
import { createRng } from '../src/core/rng';
import { answer, startRound } from '../src/core/round';
import { hintPictureLayout, pictureLayout, type PictureRect } from '../src/core/round/pictureLayout';
import { roundView } from '../src/core/round/view';
import { addSubHint, addSubJumps, generateAddSub, parseAddSubParams } from '../src/core/tasks/generators/addSub';
import type { Task } from '../src/core/tasks/types';
import { validateTask } from '../src/core/tasks/validate';
import type { SkillDef, StageDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { MINIGAME_WORDS } from '../src/data/minigames';
import { placementData } from '../src/data/placement';
import { TASK_LAYOUT } from '../src/data/layout';
import { forEachDraw } from './helpers';

const lineSkill = (params: Record<string, unknown>, id = 'T.line'): SkillDef =>
    ({ id, stage: 'E2', step: 1, type: 'ADD_SUB', params: { max: 30, ops: ['+', '-'], bridge: 'any', line: true, ...params }, answer: 'keypad' });

describe('addSubJumps', () => {
    it('lands on the ten first when the units cross it', () => {
        expect(addSubJumps(7, '+', 6)).toEqual([{ from: 7, to: 10 }, { from: 10, to: 13 }]);
        expect(addSubJumps(13, '-', 6)).toEqual([{ from: 13, to: 10 }, { from: 10, to: 7 }]);
    });

    it('jumps whole tens of the second operand first, then the units', () => {
        expect(addSubJumps(25, '+', 13)).toEqual([{ from: 25, to: 35 }, { from: 35, to: 38 }]);
        expect(addSubJumps(8, '+', 2)).toEqual([{ from: 8, to: 10 }]);
    });

    it('chains: each jump starts where the last ended and the last ends on the result', () => {
        for (let a = 1; a <= 30; a += 1) {
            for (let b = 1; b <= 30; b += 1) {
                for (const op of ['+', '-'] as const) {
                    const result = op === '+' ? a + b : a - b;
                    if (result < 0 || result > 30) continue;
                    const jumps = addSubJumps(a, op, b);
                    expect(jumps[0].from, `${a}${op}${b}`).toBe(a);
                    jumps.forEach((j, i) => i > 0 && expect(j.from, `${a}${op}${b}`).toBe(jumps[i - 1].to));
                    expect(jumps.at(-1)!.to, `${a}${op}${b}`).toBe(result);
                    expect(jumps.length, `${a}${op}${b}`).toBeLessThanOrEqual(3);
                }
            }
        }
    });

    it('the hint lines are the same jumps (one source)', () => {
        for (const [a, op, b] of [[7, '+', 6], [13, '-', 6], [25, '+', 13], [8, '+', 2], [29, '-', 12]] as const) {
            const jumps = addSubJumps(a, op, b);
            const lines = addSubHint(a, b, op);
            expect(lines, `${a}${op}${b}`).toHaveLength(jumps.length);
            jumps.forEach((j, i) => expect(lines[i]).toMatch(new RegExp(`^${j.from} [+−] \\d+ = ${j.to}$`)));
        }
    });
});

describe('ADD_SUB with a number line', () => {
    it('rejects line above 30 and accepts 30', () => {
        expect(() => parseAddSubParams({ max: 31, ops: ['+'], bridge: 'any', line: true })).toThrow();
        expect(parseAddSubParams({ max: 30, ops: ['+'], bridge: 'any', line: true }).line).toBe(true);
        expect(() => parseAddSubParams({ max: 30, ops: ['+'], bridge: 'any', line: false })).toThrow();
    });

    it('does not draw anything without the option', () => {
        const task = generateAddSub(lineSkill({ line: undefined }), createRng(1));
        expect(task.hintVisual).toBeUndefined();
    });

    it('1000 draws: window up to 30, jumps match, the result is never labelled, the box is the landing', () => {
        forEachDraw(generateAddSub, lineSkill({}), { max: 30 }, (task, where) => {
            const v = task.hintVisual;
            expect(v?.kind, where).toBe('numberLine');
            if (v?.kind !== 'numberLine') return;
            const result = task.answer as number;
            expect(v.tick, where).toBe(1);
            expect(v.to - v.from, where).toBeLessThanOrEqual(30);
            expect(v.from % 10, where).toBe(0);
            expect(v.to % 10, where).toBe(0);
            expect(v.labels, where).not.toContain(result);
            expect(v.box, where).toBe(result);
            expect(v.jumps.at(-1)!.to, where).toBe(result);
            expect(v.labels, where).toContain(v.jumps[0].from);
            for (const j of v.jumps.slice(0, -1)) expect(v.labels, where).toContain(j.to);
            for (let n = v.from; n <= v.to; n += 1) if (n % 5 === 0 && n !== result) expect(v.labels, where).toContain(n);
            expect(Math.min(...v.jumps.map((j) => Math.min(j.from, j.to))), where).toBeGreaterThanOrEqual(v.from);
            expect(Math.max(...v.jumps.map((j) => Math.max(j.from, j.to))), where).toBeLessThanOrEqual(v.to);
            expect(validateTask({ ...task, input: 'keypad' }, { max: 30 }), where).toEqual([]);
        });
    });

    it('the jumps come from the same function as the hint lines', () => {
        forEachDraw(generateAddSub, lineSkill({}), { max: 30 }, (task, where) => {
            const m = /^(\d+) ([+−]) (\d+)$/.exec(task.prompt)!;
            const jumps = addSubJumps(Number(m[1]), m[2] === '+' ? '+' : '-', Number(m[3]));
            expect(task.hintVisual?.kind === 'numberLine' && task.hintVisual.jumps, where).toEqual(jumps);
            expect(task.hint, where).toHaveLength(jumps.length);
        });
    });
});

describe('validateTask and the hint drawing', () => {
    const base: Task = { skillId: 'T', prompt: '7 + 6', answer: 13, hint: ['7 + 3 = 10', '10 + 3 = 13'], input: 'keypad' };
    const line = (labels: number[], box: number | null) =>
        ({ kind: 'numberLine', from: 0, to: 20, tick: 1, labels, box, jumps: [{ from: 7, to: 10 }, { from: 10, to: 13 }] }) as const;

    it('rejects a hint line that labels the answer', () => {
        expect(validateTask({ ...base, hintVisual: line([7, 10, 13], 13) }, {}).map((v) => v.rule)).toContain('visual');
    });

    it('rejects a box that is not the answer', () => {
        expect(validateTask({ ...base, hintVisual: line([7, 10], 10) }, {}).map((v) => v.rule)).toContain('visual');
    });

    it('accepts a clean hint line with the box on the answer', () => {
        expect(validateTask({ ...base, hintVisual: line([7, 10], 13) }, {})).toEqual([]);
    });

    it('allows a hint drawing only with the keypad', () => {
        const tiles: Task = { ...base, input: 'tiles', choices: [12, 13, 14], hintVisual: line([7, 10], 13) };
        expect(validateTask(tiles, {}).map((v) => v.rule)).toContain('mode');
    });
});

describe('roundView hintPicture', () => {
    const drawing = { kind: 'numberLine', from: 0, to: 20, tick: 1, labels: [7, 10], box: 13, jumps: [{ from: 7, to: 10 }, { from: 10, to: 13 }] } as const;
    const withLine: Task = { skillId: 'T.1', prompt: '7 + 6', answer: 13, hint: ['7 + 3 = 10', '10 + 3 = 13'], input: 'keypad', hintVisual: drawing };
    const plain: Task = { ...withLine, hintVisual: undefined };
    const run = (task: Task) => startRound([task, ...Array.from({ length: 4 }, () => plain)], balance.round);
    const lineOf = (a: string) => `Wynik: ${a}`;

    it('is null on the first try and from the second mistake on shows the drawing through solution and retype', () => {
        const first = run(withLine);
        expect(roundView(first, lineOf).hintPicture).toBeNull();
        const second = answer(first, -1);
        expect(roundView(second, lineOf).hintPicture).toEqual(drawing);
        const solution = answer(second, -1);
        expect(roundView(solution, lineOf).bar.kind).toBe('solution');
        expect(roundView(solution, lineOf).hintPicture).toEqual(drawing);
    });

    it('is null in the done phase and for a task without the drawing', () => {
        expect(roundView(answer(run(withLine), 13), lineOf).hintPicture).toBeNull();
        expect(roundView(answer(run(plain), -1), lineOf).hintPicture).toBeNull();
    });
});

describe('hintPictureLayout', () => {
    const spec = TASK_LAYOUT.picture;
    const { notebook, keypad, bar } = TASK_LAYOUT;
    const page: PictureRect = { x: notebook.left, y: notebook.top, width: notebook.width, height: notebook.height };
    const keypadRect: PictureRect = { x: keypad.left, y: keypad.top, width: 3 * keypad.keyWidth + 2 * keypad.gap, height: 600 };
    const apart = (a: PictureRect, b: PictureRect): boolean =>
        a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
    const inside = (r: PictureRect, o: PictureRect): boolean =>
        r.x >= o.x && r.y >= o.y && r.x + r.width <= o.x + o.width && r.y + r.height <= o.y + o.height;

    it('puts the line under the expression and the solution lines under the line, off the keypad, above the bar', () => {
        const { picture, lines } = hintPictureLayout(spec, 'keypad');
        expect(picture.width).toBeGreaterThan(0);
        expect(picture.height).toBeGreaterThan(0);
        expect(lines.height).toBeGreaterThan(0);
        expect(picture.y).toBeGreaterThan(spec.promptY);
        expect(lines.y).toBeGreaterThanOrEqual(picture.y + picture.height);
        for (const r of [picture, lines]) {
            expect(inside(r, page)).toBe(true);
            expect(apart(r, keypadRect)).toBe(true);
            expect(r.y + r.height).toBeLessThanOrEqual(bar.bottom - bar.height);
        }
    });

    it('throws for every mode but the keypad', () => {
        for (const mode of ['tiles', 'drag', 'select', 'digits'] as const) {
            expect(() => hintPictureLayout(spec, mode)).toThrow();
        }
        expect(pictureLayout(spec, 'keypad', false, 'wide').picture).toBeDefined();
    });
});

describe('the word minigame and the hint drawing', () => {
    it('hands out tasks without hintVisual even for a skill that has a line', () => {
        const e2 = stages.E2!;
        const own: StageDef = { id: 'E2', steps: [{ ...e2.steps[0], step: 1, skills: [lineSkill({ max: 20 }, 'T.line20')] }] };
        const learner = startLearning(stages, 8, 9, placementData, balance.curriculum);
        const rules = { tiles: balance.variants.word.tiles, uniqueRetries: balance.round.uniqueRetries, words: MINIGAME_WORDS };
        const round = buildWordRound(own, undefined, { ...learner, unlockedStep: { ...learner.unlockedStep, E2: 1 } }, createRng(4), rules);
        expect(round).not.toBeNull();
        expect(round!.tasks.every((t) => t.skillId === 'T.line20')).toBe(true);
        for (const task of round!.tasks) {
            expect(task.hintVisual).toBeUndefined();
            expect(validateTask(task, {})).toEqual([]);
        }
    });
});
