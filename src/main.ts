import { AUTO, Game, Scale } from 'phaser';
import './style.css';
import { balance } from './data/balance';
import { GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND, REGISTRY_KEYS } from './data/layout';
import { createInputSuspender, type InputSuspender } from './core/inputSuspend';
import { initialSettings } from './core/placement';
import { mountInstallHint } from './pwa/installHint';
import { detectPlatform, isStandalone } from './pwa/platform';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BootScene } from './scenes/BootScene';
import { RoomScene } from './scenes/RoomScene';
import { TaskScene } from './scenes/TaskScene';
import { WelcomeScene } from './scenes/WelcomeScene';
import { UIScene } from './scenes/UIScene';
import { emptyRoomState } from './core/rooms';
import { FIRST_ROOM } from './data/rooms';
import { e2eFail, e2eMonth, e2eStars, installE2EHook } from './testing/e2eHook';
import { installErrorBoundary } from './ui/dom/errorBoundary';
import { mountErrorCard } from './ui/dom/errorCard';
import { mountRotateOverlay } from './ui/dom/rotateOverlay';
import { createNarrator, type Narrator, type SynthLike, type UtteranceLike } from './ui/narrator';

// Single place for the Phaser game config. Scene size and colours come from
// src/data; scenes are listed in draw order (UIScene last, on top; TaskScene launches it).
const createGame = (parent: string, narrator: Narrator, month: number, forcedFailure: string | null, startStars: number): Game =>
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
        scene: [BootScene, WelcomeScene, TaskScene, RoomScene, UIScene],
        callbacks: {
            preBoot: (booting) => {
                booting.registry.set(REGISTRY_KEYS.narrator, narrator);
                booting.registry.set(REGISTRY_KEYS.month, month);
                booting.registry.set(REGISTRY_KEYS.settings, initialSettings());
                // Session state until the save arrives (S-11 replaces these values with the saved ones).
                // startStars is 0 in production; the e2e build may seed it with ?e2eStars=N (a seam, not a save).
                booting.registry.set(REGISTRY_KEYS.stars, startStars);
                booting.registry.set(REGISTRY_KEYS.rooms, { [FIRST_ROOM]: emptyRoomState() });
                booting.registry.set(REGISTRY_KEYS.currentRoom, FIRST_ROOM);
                if (__E2E_HOOK__) {
                    booting.registry.set(REGISTRY_KEYS.forcedFailure, forcedFailure);   // e2e build only; never set in production
                }
                // One input switch for the whole game. A touchend lost while input was off would leave the only
                // touch pointer active (every later touch finds no free pointer), so the release resets them all.
                booting.registry.set(
                    REGISTRY_KEYS.inputSuspender,
                    createInputSuspender(booting.input, () => booting.input.pointers.forEach((pointer) => pointer.reset())),
                );
            },
        },
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
// The month of the session decides the placement (age x month); scenes never call Date.
// The e2e build may pin it with ?e2eMonth=N so a spec does not depend on the day it runs.
const month = (__E2E_HOOK__ ? e2eMonth(window.location.search) : null) ?? new Date().getMonth();
// The error boundary goes up before the game exists (the game starts inside a font promise). When the game breaks
// the child sees a calm card; every step is guarded on its own so the handler itself can never throw.
const booted: { game?: Game } = {};   // filled once the game exists; the boundary reads it lazily
installErrorBoundary(window, () => {
    const attempt = (step: () => void): void => {
        try {
            step();
        } catch (failure) {
            console.error(failure);
        }
    };
    attempt(() => mountErrorCard(document.body, __BUILD_ID__, () => window.location.reload()));
    // The hold is never released: the card is final, a restart reloads the page.
    attempt(() => (booted.game?.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined)?.suspend());
    attempt(() => booted.game?.loop.sleep());
});
const startStars = (__E2E_HOOK__ ? e2eStars(window.location.search) : null) ?? 0;
const game = createGame('game-container', narrator, month, __E2E_HOOK__ ? e2eFail(window.location.search) : null, startStars);
booted.game = game;
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
// Android would open a context menu on a long press; the parent's long press must not.
container?.addEventListener('contextmenu', (event) => event.preventDefault());
const suspender = game.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
mountInstallHint(document.body, detectPlatform(navigator), isStandalone(window), suspender ? () => suspender.suspend() : undefined);
registerServiceWorker();
