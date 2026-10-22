import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every file listed here starts a tween of its own; each must also ask prefersReducedMotion() before it does.
// The list grows with the notebook-polish phases (press, bounce, wobble, pop, beads, entrance).
const TWEENING_FILES = ['src/ui/widgets/chunky.ts'];

describe('reduced motion wiring', () => {
    for (const file of TWEENING_FILES) {
        it(`${file} adds tweens only behind prefersReducedMotion()`, () => {
            const source = readFileSync(file, 'utf8');
            expect(source).toMatch(/tweens\.(add|chain)\(/);
            expect(source).toMatch(/prefersReducedMotion\(\)/);
        });
    }

    it('the press in the chunky helper checks the preference before the tween', () => {
        const source = readFileSync('src/ui/widgets/chunky.ts', 'utf8');
        const body = source.slice(source.indexOf('private moveTo'));
        expect(body.indexOf('prefersReducedMotion()')).toBeGreaterThan(-1);
        expect(body.indexOf('prefersReducedMotion()')).toBeLessThan(body.indexOf('tweens.add'));
    });
});
