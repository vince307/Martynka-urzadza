// SHAPES (S-14d, teacher read of phase 2): a square is a rectangle, so a task that asks for the rectangle
// (or whose odd one is decided by the figure) never puts a square beside a rectangle.
import { describe, expect, it } from 'vitest';
import { parseFace } from '../src/core/tasks/faces';
import { generateShapes } from '../src/core/tasks/generators/shapes';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const skill = (variant: string): SkillDef => ({
    id: `E1.1.shapes_${variant}`,
    stage: 'E1',
    step: 1,
    type: 'SHAPES',
    params: { variants: [variant], figures: ['circle', 'square', 'rectangle', 'triangle'] },
    answer: variant === 'all' ? 'select' : 'tiles',
});

const figuresOf = (values: readonly (string | number)[]): string[] => values.map((v) => parseFace(v)?.figure ?? '?');

describe('SHAPES never pairs a rectangle with a square', () => {
    it('name: a rectangle target has no square tile', () => {
        let rectangleTargets = 0;
        forEachDraw(generateShapes, skill('name'), {}, (task, where) => {
            const target = parseFace(task.answer)?.figure;
            if (target !== 'rectangle') return;
            rectangleTargets += 1;
            expect(figuresOf(task.choices ?? []), where).not.toContain('square');
        });
        expect(rectangleTargets).toBeGreaterThan(50);
    });

    it('all: rectangles to mark have no square among the tiles', () => {
        let rectangleTargets = 0;
        forEachDraw(generateShapes, skill('all'), {}, (task, where) => {
            if (figuresOf(task.answer as string[])[0] !== 'rectangle') return;
            rectangleTargets += 1;
            expect(figuresOf(task.choices ?? []), where).not.toContain('square');
        });
        expect(rectangleTargets).toBeGreaterThan(50);
    });

    it('odd by figure: the tiles never hold both a square and a rectangle', () => {
        let byFigure = 0;
        forEachDraw(generateShapes, skill('odd'), {}, (task, where) => {
            if (!task.hint[2]?.startsWith('Tylko jedna figura to')) return;
            byFigure += 1;
            const figures = figuresOf(task.choices ?? []);
            expect(figures.includes('square') && figures.includes('rectangle'), where).toBe(false);
        });
        expect(byFigure).toBeGreaterThan(50);
    });
});
