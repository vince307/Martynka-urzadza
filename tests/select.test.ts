import { describe, expect, it } from 'vitest';
import { taskKey } from '../src/core/round/unique';
import { selectionAnswer, toggleSelected } from '../src/core/round/select';

const choices = [14, 7, 20, 3, 8, 11];

describe('toggleSelected', () => {
    it('marks an unmarked tile', () => {
        expect(toggleSelected([], 20, choices)).toEqual([20]);
    });

    it('unmarks a marked tile', () => {
        expect(toggleSelected([20, 8], 20, choices)).toEqual([8]);
    });

    it('keeps the order of the tiles, not of the taps', () => {
        const afterTaps = toggleSelected(toggleSelected(toggleSelected([], 8, choices), 14, choices), 20, choices);
        expect(afterTaps).toEqual([14, 20, 8]);
    });

    it('ignores a value that is not a tile', () => {
        expect(toggleSelected([14], 99, choices)).toEqual([14]);
    });
});

describe('selectionAnswer', () => {
    it('is the marked numbers, ascending', () => {
        expect(selectionAnswer([20, 8, 14])).toEqual([8, 14, 20]);
    });

    it('is empty for nothing marked', () => {
        expect(selectionAnswer([])).toEqual([]);
    });
});

describe('taskKey', () => {
    const task = (input: 'select' | 'tiles', choices: number[]) => ({ skillId: 's', prompt: 'Zaznacz.', answer: 1, hint: ['x'], input, choices });

    it('tells apart multi-select tasks that share a prompt by their tiles', () => {
        expect(taskKey(task('select', [1, 2, 3]))).not.toBe(taskKey(task('select', [4, 5, 6])));
    });

    it('ignores the random distractors of a single-answer task', () => {
        expect(taskKey(task('tiles', [1, 2, 3]))).toBe(taskKey(task('tiles', [4, 5, 6])));
    });
});

describe('selectionAnswer with faces (S-14d)', () => {
    const faces = ['shape:circle:red:big', 'shape:square:blue:big', 'shape:circle:green:small', 'shape:triangle:red:small'];

    it('hands the marked faces on, in the order of the tiles', () => {
        const marked = toggleSelected(toggleSelected([], faces[2], faces), faces[0], faces);
        expect(selectionAnswer(marked)).toEqual([faces[0], faces[2]]);
    });

    it('keeps an empty set empty', () => {
        expect(selectionAnswer([])).toEqual([]);
    });

    it('still sorts numbers ascending', () => {
        expect(selectionAnswer([20, 8, 14])).toEqual([8, 14, 20]);
    });
});

