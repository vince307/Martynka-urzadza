import { AUTO, Game, Scale } from 'phaser';
import './style.css';
import { balance } from './data/balance';
import { GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND, REGISTRY_KEYS, SAVE_KEYS } from './data/layout';
import { createAutosaver, loadSave, type Autosaver } from './core/autosave';
import { floorToCalendar } from './core/curriculum';
import type { SessionSave } from './core/save';
import type { SessionLearner } from './core/placement';
import type { Settings } from './core/types';
import { stages } from './data/curriculum';
import { placementData } from './data/placement';
import { createIdbSaveStore, requestPersistence } from './storage/idb';
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
import { e2eFail, e2eMonth, e2eSave, e2eSaveStore, e2eStars, installE2EHook } from './testing/e2eHook';
import { installErrorBoundary } from './ui/dom/errorBoundary';
import { mountErrorCard } from './ui/dom/errorCard';
import { createRng } from './core/rng';
import { openParentGate } from './ui/dom/parentGate';
import { exportRawSave } from './ui/dom/saveExport';
import { mountSaveFailedCard } from './ui/dom/saveFailedCard';
import { mountRotateOverlay } from './ui/dom/rotateOverlay';
import { createNarrator, type Narrator, type SynthLike, type UtteranceLike } from './ui/narrator';

// Single place for the Phaser game config. Scene size and colours come from
// src/data; scenes are listed in draw order (UIScene last, on top; TaskScene launches it).
const createGame = (parent: string, narrator: Narrator, month: number, forcedFailure: string | null, start: SessionSave): Game =>
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
                // Session state: the saved one, or the fresh one (start is built in start() from the load outcome).
                booting.registry.set(REGISTRY_KEYS.settings, start.settings);
                booting.registry.set(REGISTRY_KEYS.stars, start.stars);
                booting.registry.set(REGISTRY_KEYS.rooms, start.rooms);
                booting.registry.set(REGISTRY_KEYS.currentRoom, start.currentRoom);
                if (start.learner) {
                    booting.registry.set(REGISTRY_KEYS.learner, start.learner);   // absent until the welcome when there is none
                }
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
const booted: { game?: Game; saver?: Autosaver; failed?: boolean } = {};   // filled once the game exists; the boundary reads it lazily
installErrorBoundary(window, () => {
    booted.failed = true;   // a failure while the save is read (or the unreadable card is up) means the game never starts
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
    // The state at the moment of an exception is uncertain: never save it (a bad save would bring the card back at every start).
    attempt(() => booted.saver?.block('fatal'));
});
const freshSession = (stars: number): SessionSave => ({
    stars,
    rooms: { [FIRST_ROOM]: emptyRoomState() },
    currentRoom: FIRST_ROOM,
    settings: initialSettings(),
    learner: null,
});

// The game starts only after the save is read: the first frame already shows the saved state, and nothing is
// written before the read has an outcome (a failed read must never end in an overwrite with an empty game).
const start = async (): Promise<void> => {
    // The e2e build may start with an in-memory store holding an unreadable save (?e2eSave=unreadable); never IndexedDB.
    const store = __E2E_HOOK__ && e2eSave(window.location.search) === 'unreadable' ? e2eSaveStore() : createIdbSaveStore();
    const outcome = await loadSave(store);
    if (outcome.kind === 'unreadable') {
        // The old save stays untouched. The parent may keep a copy (behind the adult check); the game starts only on "Graj dalej".
        const raw = outcome.raw;
        await new Promise<void>((resolve) => {
            const card = mountSaveFailedCard(document.body, {
                onExport: () => {
                    openParentGate({
                        rng: createRng(Math.floor(Math.random() * 0x100000000)),
                        onPass: () => void exportRawSave(raw),
                        onCancel: () => undefined,
                    });
                },
                onContinue: () => {
                    card.remove();
                    resolve();
                },
            });
        });
    }
    // The error card is final: a game started under it would run (and save) a state nobody can see.
    if (booted.failed) {
        return;
    }
    let session: SessionSave;
    if (outcome.kind === 'loaded') {
        const learner = outcome.session.learner
            ? floorToCalendar(outcome.session.learner, stages, month, placementData, balance.curriculum)
            : null;
        session = { ...outcome.session, learner };
    } else {
        // ?e2eStars seeds the balance of a fresh start only (a seam, not a save); a loaded save keeps its own.
        const seeded = outcome.kind === 'fresh' ? (__E2E_HOOK__ ? e2eStars(window.location.search) : null) : null;
        session = freshSession(seeded ?? 0);
        if (outcome.kind === 'unreadable') {
            console.warn(`Save unreadable (${outcome.reason}); playing without saving this session`);
        }
    }
    const game = createGame('game-container', narrator, month, __E2E_HOOK__ ? e2eFail(window.location.search) : null, session);
    booted.game = game;
    // DESIGN-GAP 43 (docs/design-gaps.md): the kit does not say the child or a parent sees that the game saves; nothing is shown.
    const saver = createAutosaver({
        store,
        snapshot: () => ({
            stars: (game.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0,
            rooms: game.registry.get(REGISTRY_KEYS.rooms) as SessionSave['rooms'],
            currentRoom: game.registry.get(REGISTRY_KEYS.currentRoom) as string,
            settings: game.registry.get(REGISTRY_KEYS.settings) as Settings,
            learner: (game.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined) ?? null,
        }),
        timers: { setTimeout: (fn, ms) => window.setTimeout(fn, ms), clearTimeout: (id) => window.clearTimeout(id as number) },
        delayMs: balance.save.debounceMs,
        load: outcome.kind,
        blocked: outcome.kind === 'unreadable' || outcome.kind === 'unavailable',
        log: (...args) => console.error(...args),
        onFirstWrite: requestPersistence,
    });
    booted.saver = saver;
    game.registry.set(REGISTRY_KEYS.saver, saver);
    // The general events, not changedata-<key>: the first set of a key (the learner at the welcome) emits only setdata.
    const saveKeys: readonly string[] = SAVE_KEYS;
    const onChange = (_parent: unknown, key: string): void => {
        if (saveKeys.includes(key)) {
            saver.markDirty();
        }
    };
    game.registry.events.on('changedata', onChange);
    game.registry.events.on('setdata', onChange);
    // A hidden page must not keep talking, and it is the last sure signal before the system may kill the app.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            narrator.cancel();
            void saver.flush('hidden');
        }
    });
    window.addEventListener('pagehide', () => void saver.flush('hidden'));
    if (__E2E_HOOK__) {
        installE2EHook(game);   // e2e build only: stripped from production, checked by vite/e2eHookGuard.mjs
    }
    const suspender = game.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
    mountInstallHint(document.body, detectPlatform(navigator), isStandalone(window), suspender ? () => suspender.suspend() : undefined);
};

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
mountRotateOverlay(document.body);
// Android would open a context menu on a long press; the parent's long press must not.
container?.addEventListener('contextmenu', (event) => event.preventDefault());
registerServiceWorker();

void start();   // a rejected start is a real startup failure: the error boundary shows the card
