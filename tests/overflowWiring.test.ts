// WNA-04: solution lines that overflow even at the smallest scale raise a signal (a warning once per skill and an e2e hook flag) instead of hiding.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('solution overflow signal', () => {
    it('SolutionSteps records the overflow against the smallest scale', () => {
        const src = read('src/ui/widgets/SolutionSteps.ts');
        expect(src).toMatch(/overflowed\(\): boolean/);
        expect(src).toMatch(/this\.overflow = this\.room\(top, limit\) < TASK_LAYOUT\.solution\.minScale \* measured/);
    });
    it('TaskScene warns once per skill and exposes the flag in its snapshot', () => {
        const src = read('src/scenes/TaskScene.ts');
        expect(src).toMatch(/overflowWarned\.has\(task\.skillId\)/);
        expect(src).toMatch(/console\.warn\(`Solution lines overflow[^`]*\$\{task\.skillId\}`\)/);
        expect(src).toMatch(/solutionOverflow: this\.steps\.overflowed\(\)/);
    });
    it('the widgets read the shared scale helpers, not their own copy', () => {
        expect(read('src/ui/widgets/NumberCells.ts')).toMatch(/cellsScale\(rect, c\)/);
        expect(read('src/ui/widgets/CoordGrid.ts')).toMatch(/coordScale\(columns, rows, rect, c\)/);
    });
});
