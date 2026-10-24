import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source guards for change salon-style phase 2: the drawn result is proven by the phase 6 e2e and the visual gate.
const read = (path: string): string => readFileSync(path, 'utf8');
const body = (src: string, head: string): string => {
    const start = src.indexOf(head);
    expect(start, `${head} exists`).toBeGreaterThan(-1);
    return src.slice(start, src.indexOf('\n    }\n', start));
};

describe('the worn salon wiring', () => {
    const view = read('src/ui/widgets/RoomView.ts');
    const scene = read('src/scenes/RoomScene.ts');
    const grade = read('src/ui/wornGrade.ts');

    it('RoomView draws no furnishings picture and grades the worn pieces and grounds the loose ones', () => {
        expect(view.slice(0, view.indexOf('/** One picture of the miniature'))).not.toContain('furnishings');
        expect(view).toContain('applyWornGrade(');
        expect(view).toContain('contactShadowPieces(');
        expect(view).toContain('wornPieces(');
    });

    it('applyWornGrade adds the soft matrix before the worn one', () => {
        expect(grade.indexOf('worn.soft')).toBeGreaterThan(-1);
        expect(grade.indexOf('worn.soft')).toBeLessThan(grade.indexOf('worn.grade'));
    });

    it('fadeStage returns first under reduced motion, ghosts the worn set and the shadows', () => {
        const fade = body(scene, 'private fadeStage(): void {');
        expect(fade.slice(0, fade.indexOf('}') + 1)).toContain('prefersReducedMotion()');
        expect(fade).toContain('buildWorn(');
        expect(fade).toContain('room.scene.shadows');
    });

    it('the ghosts are cleared on sleep and on shutdown', () => {
        const from = scene.indexOf('const onSleep = (): void => {');
        expect(from).toBeGreaterThan(-1);
        const sleep = scene.slice(from, scene.indexOf('\n        };', from));
        expect(sleep).toContain('this.clearGhosts()');
        const shutdown = scene.slice(scene.indexOf("this.events.once('shutdown'"));
        expect(shutdown.slice(0, shutdown.indexOf('});'))).toContain('this.clearGhosts()');
        const clear = body(scene, 'private clearGhosts(): void {');
        expect(clear).toContain('.stop()');
        expect(clear).toContain('.destroy()');
    });
});
