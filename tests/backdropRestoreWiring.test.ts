import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source guards: the on-screen redraw after a context restore is proven by the e2e spec backdrop-restore.spec.ts.
const OWNERS = ['src/scenes/TaskScene.ts', 'src/scenes/WelcomeScene.ts'];

const sources = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(`${dir}/${e.name}`) : e.name.endsWith('.ts') ? [`${dir}/${e.name}`] : []));

describe('backdrop redraw on a WebGL context restore', () => {
    for (const file of OWNERS) {
        const text = readFileSync(file, 'utf8');
        it(`${file} listens with the Phaser constant and removes the listener on shutdown`, () => {
            expect(text.match(/renderer\.on\(Renderer\.Events\.RESTORE_WEBGL/g)).toHaveLength(1);
            const off = text.match(/renderer\.off\(Renderer\.Events\.RESTORE_WEBGL/g);
            expect(off, 'remove the listener in the shutdown block').toHaveLength(1);
            // The off call sits inside an events.once('shutdown') block (no closing brace between the block's opening and the call).
            expect(text, 'the off call must sit in an events.once shutdown block').toMatch(/events\.once\('shutdown', \(\) => \{[^}]*renderer\.off\(Renderer\.Events\.RESTORE_WEBGL, onRestore\)/);
        });
        it(`${file} redraws at once, with no timer or wake on the way`, () => {
            const m = /const onRestore = \(\): void => ([^;]*);/.exec(text);
            expect(m, 'onRestore handler').not.toBeNull();
            expect(m![1]).toContain("this.refreshBackdrop('restore')");
            expect(m![1]).not.toMatch(/delayedCall|requestAnimationFrame|wake/);
        });
    }
    it('only SalonBackdrop reads a pixel and only the two scenes own a backdrop', () => {
        const files = sources('src');
        expect(files.filter((f) => readFileSync(f, 'utf8').includes('snapshotPixel('))).toEqual(['src/ui/widgets/SalonBackdrop.ts']);
        expect(files.filter((f) => readFileSync(f, 'utf8').includes('new SalonBackdrop(')).sort()).toEqual([...OWNERS].sort());
    });
    it('never spells the event as a string in src', () => {
        expect(sources('src').filter((f) => readFileSync(f, 'utf8').includes('restorewebgl'))).toEqual([]);
    });
});
