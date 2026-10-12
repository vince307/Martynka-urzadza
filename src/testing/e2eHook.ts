import type { Game } from 'phaser';
import { SCENE_KEYS } from '../data/layout';
import type { TaskScene } from '../scenes/TaskScene';

/**
 * Read-only window onto the running round for the e2e build (E2E_HOOK=1). Only
 * main.ts, inside `if (__E2E_HOOK__)`, imports this module, and the production
 * build fails when its marker shows up in a bundle (vite/e2eHookGuard.mjs).
 * No module-level code beyond declarations: importing it changes nothing.
 */
export const installE2EHook = (game: Game): void => {
    const scene = (): TaskScene => game.scene.getScene(SCENE_KEYS.task) as TaskScene;
    Object.defineProperty(window, '__martynkaE2E', {
        value: Object.freeze({
            get snapshot() {
                return scene().snapshot();
            },
            get targets() {
                return scene().targets();
            },
        }),
        enumerable: false,
    });
};
