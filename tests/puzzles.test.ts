import { describe, expect, it } from 'vitest';
import { puzzlePool, puzzleTask, type PuzzleKind } from '../src/core/puzzles';
import { firstHint, solutionSteps } from '../src/core/round/hints';
import { validateTask } from '../src/core/tasks/validate';
import { nouns } from '../src/data/nouns';
import { PUZZLES } from '../src/data/puzzles';

const sentences = (text: string): number => text.split(/[.?!]+(?:\s|$)/).filter((s) => s.trim() !== '').length;

describe('LOGIC puzzle pool', () => {
    it('has 10-15 entries with unique ids and at least two of every kind', () => {
        expect(PUZZLES.length).toBeGreaterThanOrEqual(10);
        expect(PUZZLES.length).toBeLessThanOrEqual(15);
        expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
        const kinds: PuzzleKind[] = ['floors', 'train', 'number', 'scale', 'water'];
        for (const kind of kinds) {
            expect(PUZZLES.filter((p) => p.kind === kind).length, kind).toBeGreaterThanOrEqual(2);
        }
    });

    it.each(PUZZLES.map((p) => [p.id, p] as const))('%s is a valid task with a teaching first hint', (_id, def) => {
        const task = puzzleTask(def);
        expect(task.skillId).toBe(`PUZZLE.${def.id}`);
        expect(validateTask(task, { max: 100, nouns })).toEqual([]);
        expect(firstHint(task), 'first hint must not give the answer').not.toBeNull();
        const steps = solutionSteps(task, (a) => `Wynik: ${a}`);
        expect(steps).toEqual([...def.hint]);
        expect(sentences(def.prompt)).toBeLessThanOrEqual(3);
        expect(def.stage === 'E3' ? def.answer <= 30 : true).toBe(true);
        if (def.choices) {
            expect(task.input).toBe('tiles');
            expect(def.choices.filter((c) => c === def.answer)).toHaveLength(1);
            expect(task.choices).toEqual([...def.choices]);
        } else {
            expect(task.input).toBe('keypad');
        }
    });

    it('keeps the nouns the puzzles count in the dictionary, so agreement is checked', () => {
        for (const noun of ['piętro', 'wagon', 'osoba', 'paczka', 'śliwka', 'litr', 'jabłko', 'dziesiątka']) {
            expect(nouns[noun], noun).toBeDefined();
        }
    });

    it('gives a stage the puzzles of its own and earlier allowed stages only', () => {
        const allowed = ['E3', 'E4'] as const;
        const e3 = puzzlePool('E3', PUZZLES, allowed);
        const e4 = puzzlePool('E4', PUZZLES, allowed);
        expect(e3.length).toBeGreaterThan(0);
        expect(e3.every((p) => p.stage === 'E3')).toBe(true);
        expect(e4).toHaveLength(PUZZLES.length);
        expect(puzzlePool('E2', PUZZLES, allowed)).toEqual([]);
        expect(puzzlePool('E6', PUZZLES, allowed)).toHaveLength(PUZZLES.length);
    });
});
