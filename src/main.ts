import { AUTO, Game, Scale } from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND } from './data/layout';
import { mountInstallHint } from './pwa/installHint';
import { detectPlatform, isStandalone } from './pwa/platform';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BootScene } from './scenes/BootScene';
import { TaskScene } from './scenes/TaskScene';
import { UIScene } from './scenes/UIScene';
import { installE2EHook } from './testing/e2eHook';
import { mountRotateOverlay } from './ui/dom/rotateOverlay';

// Single place for the Phaser game config. Scene size and colours come from
// src/data; scenes are listed in boot order.
const createGame = (parent: string): Game =>
    new Game({
        type: AUTO,
        parent,
        backgroundColor: PAGE_BACKGROUND,
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
        },
        scene: [BootScene, TaskScene, UIScene],
    });

// Module scripts run after the document is parsed, so the container exists.
// data-build exposes the build id (drawn on the canvas) to e2e tests; invisible to the child.
document.getElementById('game-container')?.setAttribute('data-build', __BUILD_ID__);
const game = createGame('game-container');
if (__E2E_HOOK__) {
    installE2EHook(game);   // e2e build only: stripped from production, checked by vite/e2eHookGuard.mjs
}
mountRotateOverlay(document.body);
mountInstallHint(document.body, detectPlatform(navigator), isStandalone(window));
registerServiceWorker();
