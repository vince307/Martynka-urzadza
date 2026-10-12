import type { Game } from 'phaser';
import { SCENE_KEYS } from '../data/layout';
import type { RoomScene } from '../scenes/RoomScene';
import type { TaskScene } from '../scenes/TaskScene';
import type { UIScene } from '../scenes/UIScene';

/**
 * Read-only window onto the running game for the e2e build (E2E_HOOK=1). Only
 * main.ts, inside `if (__E2E_HOOK__)`, imports this module, and the production
 * build fails when its marker shows up in a bundle (vite/e2eHookGuard.mjs).
 * No module-level code beyond declarations: importing it changes nothing.
 * Getters only; every value is a frozen copy. The scenes never import this file.
 */
export const installE2EHook = (game: Game): void => {
    const task = (): TaskScene => game.scene.getScene(SCENE_KEYS.task) as TaskScene;
    const ui = (): UIScene => game.scene.getScene(SCENE_KEYS.ui) as UIScene;
    const room = (): RoomScene => game.scene.getScene(SCENE_KEYS.room) as RoomScene;
    Object.defineProperty(window, '__martynkaE2E', {
        value: Object.freeze({
            get snapshot() {
                const round = task().snapshot();
                const screen = game.scene.isActive(SCENE_KEYS.room) ? 'room' : round.summary ? 'summary' : 'task';
                const speaker = ui().speakerTarget();
                return Object.freeze({ ...round, screen, counterText: ui().counterText(), speakerVisible: speaker !== null });
            },
            get targets() {
                return Object.freeze({
                    ...task().targets(),
                    resume: game.scene.isActive(SCENE_KEYS.room) ? room().resumeTarget() : null,
                    speaker: ui().speakerTarget(),
                    roomSwitch: ui().roomSwitchTarget(),
                });
            },
        }),
        enumerable: false,
    });
};
