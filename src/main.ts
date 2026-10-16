import { AUTO, Game, Scale } from 'phaser';
import './style.css';
import { balance } from './data/balance';
import { GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND, REGISTRY_KEYS, SAVE_KEYS } from './data/layout';
import { createAutosaver, errorName, isTimeoutError, loadSave, withTimeLimit, type Autosaver, type LoadOutcome } from './core/autosave';
import { floorToCalendar } from './core/curriculum';
import { localDay } from './core/day';
import { repairCurrentRoom } from './core/rooms';
import { FIRST_ROOM, ROOMS } from './data/rooms';
import { freshSession, type SessionSave } from './core/save';
import type { SessionLearner } from './core/placement';
import type { Settings, VariantState } from './core/types';
import { stages } from './data/curriculum';
import { placementData } from './data/placement';
import { createIdbSaveStore, requestPersistence } from './storage/idb';
import { createWriterId } from './storage/writerId';
import { createInputSuspender, type InputSuspender } from './core/inputSuspend';
import { mountInstallHint } from './pwa/installHint';
import { detectPlatform, isStandalone } from './pwa/platform';
import type { SwStatus } from './core/swStatus';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BootScene } from './scenes/BootScene';
import { RoomScene } from './scenes/RoomScene';
import { TaskScene } from './scenes/TaskScene';
import { WelcomeScene } from './scenes/WelcomeScene';
import { UIScene } from './scenes/UIScene';
import { E2E_LOADER_TIMEOUT_MS, E2E_LOAD_TIMEOUT_MS, E2E_SLOWER_LOAD_TIMEOUT_MS, E2E_WRITE_TIMEOUT_MS, e2eArt, e2eDay, e2eFail, e2eMonth, e2eSave, e2eSaveStore, e2eSkills, e2eStars, e2eVariant, installE2EHook } from './testing/e2eHook';
import { installErrorBoundary } from './ui/dom/errorBoundary';
import { mountErrorCard } from './ui/dom/errorCard';
import { createRng } from './core/rng';
import { openParentGate } from './ui/dom/parentGate';
import { exportFileText } from './core/saveFile';
import { cardCopyFor, unreadableCode } from './core/saveHealth';
import { openSaveExportDialog } from './ui/dom/saveExportDialog';
import { pl } from './data/pl';
import { mountSaveFailedCard } from './ui/dom/saveFailedCard';
import { mountSaveRefusedCard } from './ui/dom/saveRefusedCard';
import { mountRotateOverlay } from './ui/dom/rotateOverlay';
import { createSoundService } from './ui/sound';
import { createStartCounter } from './storage/startCounter';
import { createSoundPrefStore, deviceStorage } from './storage/soundPrefs';
import type { SoundPrefs } from './core/sound';
import { createNarrator, type Narrator, type SynthLike, type UtteranceLike } from './ui/narrator';

// Single place for the Phaser game config. Scene size and colours come from
// src/data; scenes are listed in draw order (UIScene last, on top; TaskScene launches it).
const createGame = (parent: string, narrator: Narrator, month: number, forcedFailure: string | null, forcedSkillIds: string[] | null, forcedArt: string | null, forcedVariant: string | null, today: () => string, start: SessionSave, soundPrefs: SoundPrefs): Game =>
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
        loader: __E2E_HOOK__ && forcedArt === 'stall'
            ? { timeout: E2E_LOADER_TIMEOUT_MS, maxRetries: 0 }   // e2e build only (?e2eArt=stall)
            : __E2E_HOOK__ && forcedArt === 'stallall'
                ? { timeout: 0, maxRetries: 0 }   // e2e build only (?e2eArt=stallall): no limit per file, only the total limit can end the load
            : { timeout: balance.loader.timeoutMs, maxRetries: balance.loader.maxRetries },
        scene: [BootScene, WelcomeScene, TaskScene, RoomScene, UIScene],
        callbacks: {
            preBoot: (booting) => {
                booting.registry.set(REGISTRY_KEYS.narrator, narrator);
                booting.registry.set(REGISTRY_KEYS.month, month);
                // The device sound preference (outside the save) and the one sound service; game.sound is created after preBoot, so the service reads it lazily.
                booting.registry.set(REGISTRY_KEYS.soundPrefs, soundPrefs);
                booting.registry.set(REGISTRY_KEYS.sound, createSoundService(booting, soundPrefs));
                // Session state: the saved one, or the fresh one (start is built in start() from the load outcome).
                booting.registry.set(REGISTRY_KEYS.settings, start.settings);
                booting.registry.set(REGISTRY_KEYS.stars, start.stars);
                booting.registry.set(REGISTRY_KEYS.rooms, start.rooms);
                booting.registry.set(REGISTRY_KEYS.currentRoom, start.currentRoom);
                booting.registry.set(REGISTRY_KEYS.variants, start.variants);
                booting.registry.set(REGISTRY_KEYS.today, today);   // read at each round start: a tablet left open past midnight sees the new day
                if (start.learner) {
                    booting.registry.set(REGISTRY_KEYS.learner, start.learner);   // absent until the welcome when there is none
                }
                if (__E2E_HOOK__) {
                    booting.registry.set(REGISTRY_KEYS.forcedFailure, forcedFailure);   // e2e build only; never set in production
                    booting.registry.set(REGISTRY_KEYS.forcedSkills, forcedSkillIds);   // e2e build only (?e2eSkills)
                    booting.registry.set(REGISTRY_KEYS.forcedArt, forcedArt);   // e2e build only (?e2eArt)
                    booting.registry.set(REGISTRY_KEYS.forcedVariant, forcedVariant);   // e2e build only (?e2eVariant)
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
installErrorBoundary(window, (error) => {
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
    attempt(() => booted.saver?.block('fatal', errorName(error)));
});

// The game starts only after the save is read: the first frame already shows the saved state, and nothing is
// written before the read has an outcome (a failed read must never end in an overwrite with an empty game).
const start = async (): Promise<void> => {
    // The e2e build may start with an in-memory store (?e2eSave=unreadable|corrupt|unavailable|hang|writefail|writehang|v1|backupfail|backuphang|slow); never IndexedDB.
    const seam = __E2E_HOOK__ ? e2eSave(window.location.search) : null;
    // One writer id per page load that also knows this tab's earlier documents (T-3); the store tells the saver when an older build wrote here (T-1).
    const writerId = createWriterId();
    const store =
        __E2E_HOOK__ && seam
            ? e2eSaveStore(seam)
            : createIdbSaveStore({ writer: writerId.writer, endedWriters: writerId.endedWriters, onOlderWriter: () => booted.saver?.noteOlderWriter() });
    const timers = { setTimeout: (fn: () => void, ms: number) => window.setTimeout(fn, ms), clearTimeout: (id: unknown) => window.clearTimeout(id as number) };
    const first = await loadSave(store, {
        timers,
        timeoutMs: __E2E_HOOK__ && (seam === 'hang' || seam === 'slow') ? E2E_LOAD_TIMEOUT_MS : balance.save.loadTimeoutMs,
    });
    // A read that timed out gets a card with "Poczekaj dłużej" (the same read, a longer limit). One `settled` flag decides
    // the card: "Graj dalej" starts the game on the first outcome (saver blocked), and a late read after it is only logged;
    // it never changes the outcome or unblocks the saver, or a fresh 0-star session would overwrite a healthy save.
    const slowCard = (slow: LoadOutcome & { kind: 'unavailable' }): Promise<LoadOutcome> =>
        new Promise<LoadOutcome>((resolve) => {
            let settled = false;
            const card = mountSaveFailedCard(document.body, {
                copy: pl.saveSlow,
                detail: pl.saveFailed.detail(slow.error, __BUILD_ID__),
                onContinue: () => {
                    if (settled) return;
                    settled = true;
                    card.remove();
                    resolve(slow);
                },
                onWait: async () => {
                    const late = await slow.waitLonger!(__E2E_HOOK__ && (seam === 'hang' || seam === 'slow') ? E2E_SLOWER_LOAD_TIMEOUT_MS : balance.save.slowLoadTimeoutMs);
                    if (settled) {
                        console.warn(`save: late read ignored (${late.kind})`);
                        return 'loaded';
                    }
                    if (late.kind === 'unavailable') return 'still-slow';
                    settled = true;
                    card.remove();
                    resolve(late);
                    return 'loaded';
                },
            });
        });
    const outcome = first.kind === 'unavailable' && first.waitLonger ? await slowCard(first) : first;
    // SRR-08: a refused read (not a timeout) counts consecutive starts on this device; a read that worked starts again from zero.
    const startCounter = createStartCounter(deviceStorage());
    let unavailableStarts = 0;
    if (outcome.kind === 'unavailable') {
        if (!isTimeoutError(outcome.error)) unavailableStarts = startCounter.bump();
    } else if (outcome.kind === 'loaded' || outcome.kind === 'fresh') {
        startCounter.reset();
    }
    const playedOnFirst = outcome === first && first.kind === 'unavailable' && first.waitLonger !== undefined;
    if (outcome.kind === 'unavailable') {
        console.warn(`Save unavailable (${outcome.error}); playing without saving this session`);
    }
    if ((outcome.kind === 'unreadable' || outcome.kind === 'unavailable') && !playedOnFirst) {
        // Either way the game starts only on "Graj dalej", in a fresh session with the saver blocked. Only an
        // unreadable save exists to be kept: the parent may export it (behind the adult check). An unavailable store has none.
        const raw = outcome.kind === 'unreadable' ? outcome.raw : null;
        const reason = outcome.kind === 'unreadable' ? outcome.reason : null;
        // The code is a field name or a step number only (never a value).
        const code = outcome.kind === 'unreadable' ? unreadableCode(outcome) : null;
        const cardCopies = { future: pl.saveFuture, migrationFailed: pl.saveMigrationFailed, failed: pl.saveFailed, unavailable: pl.saveUnavailable, slow: pl.saveSlow };
        await new Promise<void>((resolve) => {
            const card = mountSaveFailedCard(document.body, {
                copy: cardCopies[cardCopyFor(outcome.kind, reason, outcome.kind === 'unavailable' ? outcome.error : null, outcome.kind === 'unreadable' ? outcome.from : null)],
                // DESIGN-GAP 69: unreadable shows its reason, unavailable the error name (Kod: timeout / Kod: UnknownError).
                detail: pl.saveFailed.detail(code ?? (outcome.kind === 'unavailable' ? outcome.error : ''), __BUILD_ID__),
                onExport:
                    raw === null
                        ? undefined
                        : () => {
                              openParentGate({
                                  rng: createRng(Math.floor(Math.random() * 0x100000000)),
                                  onPass: () =>
                                      openSaveExportDialog({
                                          file: (now) => ({
                                              text: exportFileText({ kind: 'raw', build: __BUILD_ID__, exportedAt: now.toISOString(), reason: reason ?? 'unknown', raw }),
                                              fileName: pl.saveFailed.fileName(now.toISOString().slice(0, 10)),
                                          }),
                                          onClose: () => undefined,
                                      }),
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
    let roomRepaired = false;
    if (outcome.kind === 'loaded') {
        const learner = outcome.session.learner
            ? floorToCalendar(outcome.session.learner, stages, month, placementData, balance.curriculum)
            : null;
        const repaired = repairCurrentRoom({ ...outcome.session, learner }, Object.keys(ROOMS), FIRST_ROOM);
        // The old salon was carried over by MIGRATIONS[2] inside decodeSave: the session here is already at the current save version.
        session = repaired.session;
        if (outcome.migratedFrom !== null) {
            console.warn(`Save migrated from v${outcome.migratedFrom}`);
        }
        if (repaired.repairedFrom !== null) {
            roomRepaired = true;
            console.warn(`Save names an unknown room (${repaired.repairedFrom}); starting in ${FIRST_ROOM}`);
        }
    } else {
        // ?e2eStars seeds the balance of a fresh start only (a seam, not a save); a loaded save keeps its own.
        const seeded = outcome.kind === 'fresh' ? (__E2E_HOOK__ ? e2eStars(window.location.search) : null) : null;
        session = freshSession(FIRST_ROOM, seeded ?? 0);
        if (outcome.kind === 'unreadable') {
            console.warn(`Save unreadable (${unreadableCode(outcome)}); playing without saving this session`);
        }
    }
    // What became of an earlier launch's copy of an older save: shown in "Zapis gry" (SVB-01). Display only, so a failed or slow read is just no line.
    const backupRecord =
        outcome.kind === 'loaded' || outcome.kind === 'fresh'
            ? await withTimeLimit(store.backupRecord(), timers, balance.save.writeTimeoutMs).catch((e: unknown) => {
                  console.error('backup record not read', e);
                  return null;
              })
            : null;
    // The calendar day of the daily puzzle: local fields, read at each round start. The e2e build may pin it with ?e2eDay=YYYY-MM-DD.
    const pinnedDay = __E2E_HOOK__ ? e2eDay(window.location.search) : null;
    const today = (): string => pinnedDay ?? localDay(new Date());
    const game = createGame('game-container', narrator, month, __E2E_HOOK__ ? e2eFail(window.location.search) : null, __E2E_HOOK__ ? e2eSkills(window.location.search) : null, __E2E_HOOK__ ? e2eArt(window.location.search) : null, __E2E_HOOK__ ? e2eVariant(window.location.search) : null, today, session, createSoundPrefStore(deviceStorage()).read());
    booted.game = game;
    swTarget = game;
    if (lastSwStatus) game.registry.set(REGISTRY_KEYS.swStatus, lastSwStatus);
    let refusedCardUp = false;
    // DESIGN-GAP 43 (docs/design-gaps.md): the child sees no save indicator; the parent's settings panel shows the saver's health (saveHealthView).
    const saver = createAutosaver({
        store,
        snapshot: () => ({
            stars: (game.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0,
            rooms: game.registry.get(REGISTRY_KEYS.rooms) as SessionSave['rooms'],
            currentRoom: game.registry.get(REGISTRY_KEYS.currentRoom) as string,
            settings: game.registry.get(REGISTRY_KEYS.settings) as Settings,
            learner: (game.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined) ?? null,
            variants: (game.registry.get(REGISTRY_KEYS.variants) as VariantState | undefined) ?? session.variants,
        }),
        timers,
        delayMs: balance.save.debounceMs,
        backupAttempts: balance.save.backupAttempts,
        writeTimeoutMs: __E2E_HOOK__ && (seam === 'writehang' || seam === 'backuphang') ? E2E_WRITE_TIMEOUT_MS : balance.save.writeTimeoutMs,
        load: outcome.kind,
        blockedBy: outcome.kind === 'unreadable' || outcome.kind === 'unavailable' ? outcome.kind : null,
        now: () => Date.now(),
        migrated: outcome.kind === 'loaded' && outcome.migratedFrom !== null ? { from: outcome.migratedFrom, raw: outcome.raw } : undefined,
        backupRecord,
        loadError: outcome.kind === 'unavailable' ? outcome.error : undefined,
        loadReason: outcome.kind === 'unreadable' ? outcome.reason : undefined,
        loadFrom: outcome.kind === 'unreadable' ? outcome.from : undefined,
        unavailableStarts,
        log: (...args) => console.error(...args),
        onFirstWrite: requestPersistence,
        // A write refused by a newer version or another window: one calm card per page load (load blocks have their own cards).
        onBlocked: () => {
            if (refusedCardUp) return;
            refusedCardUp = true;
            mountSaveRefusedCard(document.body, () => window.location.reload(), game.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined);
        },
    });
    booted.saver = saver;
    game.registry.set(REGISTRY_KEYS.saver, saver);
    // A repaired current room is written too (a migrated save is written by the autosaver itself).
    if (roomRepaired) saver.markDirty();
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
    window.addEventListener('pagehide', () => {
        void saver.flush('hidden');
        writerId.end();
    });
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
// The status may arrive before the game exists: keep the last one and hand it over when `start` has built the game.
let lastSwStatus: SwStatus | null = null;
let swTarget: Game | null = null;
registerServiceWorker((status) => {
    lastSwStatus = status;
    swTarget?.registry.set(REGISTRY_KEYS.swStatus, status);
});

void start();   // a rejected start is a real startup failure: the error boundary shows the card
