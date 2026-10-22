import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every file listed here starts a tween of its own; each must also ask prefersReducedMotion() before it does.
// The list grows with the notebook-polish phases (press, bounce, wobble, pop, beads, entrance).
const TWEENING_FILES = ['src/ui/widgets/chunky.ts', 'src/scenes/TaskScene.ts', 'src/ui/widgets/StarCounter.ts', 'src/ui/widgets/ProgressDots.ts'];

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

    it('the entrance in the chunky helper and the pop of the beads check the preference before the tween', () => {
        const chunky = readFileSync('src/ui/widgets/chunky.ts', 'utf8');
        const enter = chunky.slice(chunky.indexOf('enter(delayMs'), chunky.indexOf('press(): void'));
        expect(enter.indexOf('prefersReducedMotion()')).toBeGreaterThan(-1);
        expect(enter.indexOf('prefersReducedMotion()')).toBeLessThan(enter.indexOf('tweens.add'));
        const beads = readFileSync('src/ui/widgets/ProgressDots.ts', 'utf8');
        expect(beads.indexOf('prefersReducedMotion()')).toBeGreaterThan(-1);
        expect(beads.indexOf('prefersReducedMotion()')).toBeLessThan(beads.indexOf('tweens.add'));
    });

    it('tiles and keys stagger their entrance and a press settles the face first', () => {
        for (const file of ['src/ui/widgets/AnswerTiles.ts', 'src/ui/widgets/Keypad.ts']) {
            expect(readFileSync(file, 'utf8')).toMatch(/staggerDelays\(/);
        }
        const chunky = readFileSync('src/ui/widgets/chunky.ts', 'utf8');
        const press = chunky.slice(chunky.indexOf('press(): void'), chunky.indexOf('release(): void'));
        expect(press).toMatch(/this\.entering[\s\S]*this\.reset\(\)/);
    });
});
