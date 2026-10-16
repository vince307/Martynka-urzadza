// GRD-04: a drawn grid never falls below the smallest readable cell; every skill's real drawing fits the rectangle its mode gives it.
import { describe, expect, it } from 'vitest';
import { cellPositions, cellsScale, coordScale, drawingFit } from '../src/core/round/drawingFit';
import { pictureLayout } from '../src/core/round/pictureLayout';
import { createRng } from '../src/core/rng';
import { generateTask } from '../src/core/tasks/generateTask';
import { getGenerator } from '../src/core/tasks/registry';
import { visualShape, type TaskVisual } from '../src/core/tasks/visual';
import type { SkillDef } from '../src/core/types';
import { stages } from '../src/data/curriculum';
import { TASK_LAYOUT } from '../src/data/layout';

const SEEDS = 5;
const DRAWS = 30;
const skills = (): SkillDef[] => Object.values(stages).flatMap((st) => st.steps.flatMap((step) => step.skills));
const minCell = TASK_LAYOUT.figure.minCell;

/** Skills whose real drawing does not fit yet, each with a reason and a follow-up (Trigger: visual gate of child-flow-guards). Never lower minCell. */
const KNOWN_SMALL: Readonly<Record<string, string>> = {};

describe('cellPositions', () => {
    it('gives 9 row-major spots for the square and 6 for the pyramid', () => {
        expect(cellPositions('square3')).toHaveLength(9);
        expect(cellPositions('square3')[4]).toEqual({ x: 1, y: 1 });
        expect(cellPositions('pyramid3')).toHaveLength(6);
        expect(cellPositions('pyramid3')[1]).toEqual({ x: 0.5, y: 1 });
    });
});

describe('scales', () => {
    it('cellsScale is the tightest side, capped at maxScale', () => {
        const look = TASK_LAYOUT.cells;
        expect(cellsScale({ x: 0, y: 0, width: 2000, height: 2000 }, look)).toBe(look.maxScale);
        expect(cellsScale({ x: 0, y: 0, width: 288, height: 144 }, look)).toBeCloseTo(0.5);
    });
    it('coordScale counts the label strips', () => {
        const look = TASK_LAYOUT.coord;
        const s = coordScale(6, 5, { x: 0, y: 0, width: 10000, height: 10 * (look.labelDrop + 5 * look.cell) }, look);
        expect(s).toBe(look.maxScale);
        expect(coordScale(6, 5, { x: 0, y: 0, width: 10000, height: look.labelDrop + 5 * look.cell }, look)).toBeCloseTo(1);
    });
});

describe('drawingFit', () => {
    const cells: TaskVisual = { kind: 'cells', layout: 'square3', values: [1, 2, 3, 4, 5, 6, 7, 8, null] };
    const grid: TaskVisual = { kind: 'grid', columns: 6, rows: 5, items: [] };
    const figure: TaskVisual = { kind: 'figure', lattice: true, vertices: [[0, 0], [4, 0], [4, 3], [0, 3]], sides: [4, 3, 4, 3] };
    const big = { x: 0, y: 0, width: 1000, height: 1000 };
    const tiny = { x: 0, y: 0, width: 1000, height: 60 };
    it.each([['cells', cells], ['grid', grid], ['figure', figure]] as const)('%s fits a roomy rectangle and not a thin one', (_name, v) => {
        expect(drawingFit(v, big)).toBe(true);
        expect(drawingFit(v, tiny)).toBe(false);
    });
    it('a free figure is judged by its thinnest side, a lattice figure by its cell', () => {
        const strip = { x: 0, y: 0, width: 1000, height: 190 };
        const thin: TaskVisual = { kind: 'figure', lattice: false, vertices: [[0, 0], [1, 0], [1, 9], [0, 9]], sides: [null, null, null, null] };
        expect(drawingFit(thin, strip)).toBe(false);
        const stairs: TaskVisual = { kind: 'figure', lattice: true, vertices: [[0, 0], [1, 0], [1, 9], [0, 9]], sides: [null, null, null, null] };
        expect(drawingFit(stairs, strip)).toBe(false);
    });
    it('a kind drawn without cells is always true', () => {
        expect(drawingFit({ kind: 'thermometer', celsius: 3 }, tiny)).toBe(true);
    });
});

describe('every skill drawing keeps its cells at minCell or more', () => {
    for (const skill of skills().filter((s) => getGenerator(s.type))) {
        it(`${skill.id}`, () => {
            const bad: string[] = [];
            for (let seed = 1; seed <= SEEDS; seed += 1) {
                const rng = createRng(20261016 + seed);
                for (let i = 0; i < DRAWS; i += 1) {
                    const task = generateTask(skill, rng, { tileCount: 4 });
                    const v = task.visual;
                    if (!v) continue;
                    const input = task.input ?? (task.choices ? 'tiles' : 'keypad');
                    for (const solution of [false, true]) {
                        const rect = pictureLayout(TASK_LAYOUT.picture, input, solution, visualShape(v), task.skillId).picture;
                        if (!drawingFit(v, rect)) bad.push(`seed=${seed} draw=${i} solution=${solution} ${v.kind}`);
                    }
                }
            }
            if (KNOWN_SMALL[skill.id]) {
                expect(bad.length, `${skill.id} is listed in KNOWN_SMALL but fits now: ${KNOWN_SMALL[skill.id]}`).toBeGreaterThan(0);
                return;
            }
            expect(bad.slice(0, 3), `${skill.id}: a drawn cell under ${minCell}px`).toEqual([]);
        });
    }
});
