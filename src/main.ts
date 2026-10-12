import { AUTO, Game, Scale } from 'phaser';
import './style.css';
import { balance } from './data/balance';
import { GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND, REGISTRY_KEYS } from './data/layout';
import { mountInstallHint } from './pwa/installHint';
import { detectPlatform, isStandalone } from './pwa/platform';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BootScene } from './scenes/BootScene';
import { RoomScene } from './scenes/RoomScene';
import { TaskScene } from './scenes/TaskScene';
import { UIScene } from './scenes/UIScene';
import { installE2EHook } from './testing/e2eHook';
import { mountRotateOverlay } from './ui/dom/rotateOverlay';
import { createNarrator, type Narrator, type SynthLike, type UtteranceLike } from './ui/narrator';

// Single place for the Phaser game config. Scene size and colours come from
// src/data; scenes are listed in draw order (UIScene last, on top; TaskScene launches it).
const createGame = (parent: string, narrator: Narrator): Game =>
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
        scene: [BootScene, TaskScene, RoomScene, UIScene],
        callbacks: { preBoot: (booting) => booting.registry.set(REGISTRY_KEYS.narrator, narrator) },
    });

// Module scripts run after the document is parsed, so the container exists.
// data-build exposes the build id (drawn on the canvas) to e2e tests; invisible to the child.
document.getElementById('game-container')?.setAttribute('data-build', __BUILD_ID__);
// The one narrator of the game: the system speech synthesizer when the browser has one (FR-009).
// Without a Polish voice it reports itself unavailable and the speaker button stays hidden.
const narrator = createNarrator(
    'speechSynthesis' in window ? (window.speechSynthesis as unknown as SynthLike) : undefined,
    (text) => new SpeechSynthesisUtterance(text) as unknown as UtteranceLike,
    {
        setTimeout: (fn, ms) => window.setTimeout(fn, ms),
        clearTimeout: (handle) => window.clearTimeout(handle as number),
        setInterval: (fn, ms) => window.setInterval(fn, ms),
        clearInterval: (handle) => window.clearInterval(handle as number),
    },
    balance.narrator,
);
const game = createGame('game-container', narrator);
// Speech needs a user gesture: the first tap or touch after a Polish voice is known unlocks it
// for the session (voices may load after the first tap, so the listeners stay until then).
const container = document.getElementById('game-container');
const unlockSpeech = (): void => {
    if (!narrator.unlock()) {
        return;
    }
    container?.removeEventListener('pointerup', unlockSpeech);
    container?.removeEventListener('touchend', unlockSpeech);
};
container?.addEventListener('pointerup', unlockSpeech);
container?.addEventListener('touchend', unlockSpeech);
// A hidden page must not keep talking.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        narrator.cancel();
    }
});
if (__E2E_HOOK__) {
    installE2EHook(game);   // e2e build only: stripped from production, checked by vite/e2eHookGuard.mjs
}
mountRotateOverlay(document.body);
mountInstallHint(document.body, detectPlatform(navigator), isStandalone(window));
registerServiceWorker();
