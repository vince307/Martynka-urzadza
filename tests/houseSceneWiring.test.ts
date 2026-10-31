import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source guards for the house scene (S-23): the browser proof is the e2e spec of phase 6.
const scene = readFileSync('src/scenes/HouseScene.ts', 'utf8');
const view = readFileSync('src/ui/widgets/HouseView.ts', 'utf8');
const capture = readFileSync('src/ui/widgets/roomCapture.ts', 'utf8');

describe('HouseScene wiring', () => {
    it('redraws on wake and on a WebGL context restore, and removes both listeners on shutdown', () => {
        expect(scene).toMatch(/events\.on\('wake', onWake\)/);
        expect(scene).toMatch(/renderer\.on\(Renderer\.Events\.RESTORE_WEBGL, onRestore\)/);
        expect(scene).toMatch(/events\.once\('shutdown', \(\) => \{[^}]*events\.off\('wake', onWake\)/);
        expect(scene).toMatch(/events\.once\('shutdown', \(\) => \{[\s\S]*?renderer\.off\(Renderer\.Events\.RESTORE_WEBGL, onRestore\)/);
        const restore = /const onRestore = \(\): void => ([^;]*);/.exec(scene);
        expect(restore, 'onRestore handler').not.toBeNull();
        expect(restore![1]).toContain('this.render()');
        expect(restore![1]).not.toMatch(/delayedCall|requestAnimationFrame|wake/);
    });
    it('hands the HUD over in the one show() that both create and wake run', () => {
        const show = /private show\(\): void \{([\s\S]*?)\n {4}\}/.exec(scene);
        expect(show).not.toBeNull();
        expect(show![1]).toContain('REGISTRY_KEYS.narration, null');
        expect(show![1]).toContain('REGISTRY_KEYS.roomSwitch, false');
        expect(show![1]).toContain('REGISTRY_KEYS.hudTitle, null');
        expect(scene).toMatch(/const onWake = \(\): void => this\.show\(\)/);
        expect(scene).toMatch(/\n {8}this\.show\(\);\n {4}\}/);
    });
    it('never writes the room, the stars or the current room, and never tweens', () => {
        for (const text of [scene, view, capture]) {
            expect(text).not.toMatch(/registry\.set\(REGISTRY_KEYS\.(currentRoom|rooms|stars|house)\b/);
            expect(text).not.toMatch(/\btweens\b/);
        }
    });
    it('visits a room only through scene.switch with data, and returns to the room in renovation without data', () => {
        expect(scene).toContain('this.scene.switch(SCENE_KEYS.room, { visit: tap.visit })');
        expect(scene).toContain('this.scene.switch(SCENE_KEYS.room);');
    });
    it('reads the e2e seam from the registry, never from src/testing', () => {
        expect(scene).toContain('REGISTRY_KEYS.forcedArt');
        expect(scene).not.toMatch(/from '\.\.\/testing/);
    });
    it('is listed before UIScene in main.ts and not loaded by BootScene', () => {
        const main = readFileSync('src/main.ts', 'utf8');
        expect(main.indexOf('HouseScene,')).toBeGreaterThan(-1);
        expect(main.indexOf('HouseScene,')).toBeLessThan(main.indexOf('UIScene]'));
        expect(readFileSync('src/scenes/BootScene.ts', 'utf8')).not.toMatch(/HOUSE_ART|HouseScene/);
    });
});
