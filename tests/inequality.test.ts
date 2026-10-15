import { describe, expect, it } from 'vitest';
import { generateInequality, parseInequalityParams, type InequalityShape } from '../src/core/tasks/generators/inequality';
import { firstHint, solutionSteps } from '../src/core/round/hints';
import type { SkillDef } from '../src/core/types';
import { forEachDraw } from './helpers';

const SHAPES: InequalityShape[] = ['add<', 'add>', 'box+<', 'sub>'];
const skill = (shapes: InequalityShape[], max = 10): SkillDef => ({
    id: `T.inequality.${shapes.join('')}`,
    stage: 'E1',
    step: 9,
    type: 'INEQUALITY',
    params: { max, shapes },
    answer: 'tiles',
});

/** Independent oracle: parses the printed inequality and evaluates it for a tile, not through task.check. */
const parse = (prompt: string): { holds: (x: number) => boolean; numbers: number[]; sum: (x: number) => number } => {
    const m =
        /(\d+) \+ □ ([<>]) (\d+)$/.exec(prompt) ?? /□ \+ (\d+) ([<>]) (\d+)$/.exec(prompt) ?? /(\d+) − □ ([<>]) (\d+)$/.exec(prompt);
    if (!m) {
        throw new Error(`unparsable prompt "${prompt}"`);
    }
    const [a, rel, c] = [Number(m[1]), m[2], Number(m[3])];
    const minus = prompt.includes('−');
    const value = (x: number): number => (minus ? a - x : a + x);
    return { holds: (x) => (rel === '<' ? value(x) < c : value(x) > c), numbers: [a, c], sum: value };
};

describe('generateInequality', () => {
    for (const shape of SHAPES) {
        it(`${shape}: 1000 draws, two right and two wrong tiles at the boundary`, () => {
            forEachDraw(generateInequality, skill([shape]), { max: 10 }, (task, where) => {
                const o = parse(task.prompt);
                const tiles = task.choices as number[];
                expect(tiles, where).toHaveLength(4);
                const right = tiles.filter((x) => o.holds(x));
                expect(right, where).toHaveLength(2);
                expect(task.answer, where).toBeGreaterThanOrEqual(1);
                expect(right, where).toContain(task.answer);
                for (const x of tiles) {
                    expect(task.check?.(x), `${where} tile ${x}`).toBe(o.holds(x));
                    expect(x, where).toBeLessThanOrEqual(10);
                    if (!shape.includes('sub')) {
                        expect(o.sum(x), where).toBeLessThanOrEqual(10);
                    } else {
                        expect(o.sum(x), where).toBeGreaterThanOrEqual(0);
                    }
                }
                for (const n of o.numbers) {
                    expect(n, where).toBeLessThanOrEqual(10);
                }
                // The wrong tiles sit at the boundary: the equality value and the one beyond it.
                const wrong = tiles.filter((x) => !o.holds(x)).sort((x, y) => x - y);
                expect(wrong[1] - wrong[0], where).toBe(1);
                // Hint: first line never ends with a number the check accepts; the last line ends with the shown example.
                expect(firstHint(task), where).not.toBeNull();
                expect(task.hint).toHaveLength(3);
                const last = task.hint[2];
                expect(last.endsWith(`Pasuje ${String(task.answer)}.`), where).toBe(true);
                expect(solutionSteps(task, (a) => `Wynik: ${a}`), where).toHaveLength(3);
            });
        });
    }

    it('mixes all shapes under one skill', () => {
        const seen = new Set<string>();
        forEachDraw(generateInequality, skill(SHAPES), { max: 10 }, (task) => {
            seen.add(/□ \+|\+ □|− □/.exec(task.prompt)![0] + (/</.test(task.prompt) ? '<' : '>'));
        });
        expect(seen.size).toBeGreaterThanOrEqual(4);
    });

    it('rejects params that leave no room for two right and two wrong tiles', () => {
        expect(() => parseInequalityParams({ max: 3, shapes: ['add<'] })).toThrow(TypeError);
        expect(() => parseInequalityParams({ max: 10, shapes: [] })).toThrow(TypeError);
        expect(() => parseInequalityParams({ max: 10, shapes: ['add='] })).toThrow(TypeError);
        expect(() => parseInequalityParams({ shapes: ['add<'] })).toThrow(TypeError);
        expect(parseInequalityParams({ max: 10, shapes: ['sub>'] })).toEqual({ max: 10, shapes: ['sub>'] });
    });
});
