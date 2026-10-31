import { Loader, Scene, WEBGL } from 'phaser';
import { artCauses, artHealth, roomHealthOf, bootQueue, cutByTable, fontHealth, loadErrorLine, tableOf, wrongSizes, type ArtTable, type BootGroup, type LoadSeen } from '../core/artHealth';
import { bootLimitDue, bootLimitReached, bootLimitSchedule, bootLimitWait, endHidden, hiddenMsAt, noHidden, startHidden, type BootLimitSchedule, type HiddenSpan } from '../core/bootLimits';
import { checkBootLimits, type BootLimits, type BootLoadPhase } from '../core/bootLoad';
import { fileKeyCompleteEvent } from '../core/loaderEvent';
import { needsPlacement, type SessionLearner } from '../core/placement';
import { E2E_BOOT_LIMITS, E2E_FORCED_FAILURE, UI_MISSING_URL } from '../testing/e2eHook';
import { LoadingScreen } from '../ui/widgets/LoadingScreen';
import { cutLoad, pendingKeys } from './loaderCut';
import { balance } from '../data/balance';
import { bootRoomArt, ROOM_ART } from '../data/roomArt';
import { recordFallback } from '../ui/artFallbacks';
import { UI_ART, UI_ART_KEYS } from '../data/uiArt';
import { SOUNDS } from '../data/sounds';
import { allEffectKeys } from '../core/sound';
import type { SoundService } from '../ui/sound';
import { trimEffects } from '../ui/sound';
import { guardDecode } from '../ui/decodeSeam';
import { TASK_ART } from '../data/taskArt';
import { FONT_KEY, FONT_URL, FONT_WEIGHT_RANGE, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';

/**
 * Loads the task screen font from public/fonts and the task drawings from public/assets/tasks (precached, so
 * they also work offline) and hands over: to the welcome screen while `needsPlacement` says the
 * session has no learner, otherwise to the task scene. Nothing is drawn here.
 */
export class BootScene extends Scene {
    private loading: LoadingScreen | null = null;
    private phase: BootLoadPhase = 'loading';
    private cut: string[] = [];
    private creates = 0;
    // Wall-clock start of the boot load (performance.now): the limits and the recorded duration count real time, also while the tab is hidden (audit B-3).
    private startedAt = 0;
    // Time the tab was hidden during the boot load (audit H-1): the limits count visible time only, because the Phaser queue advances on scene updates, which stop in a hidden tab.
    private hidden: HiddenSpan = noHidden;
    // What the loader reported, per file key: the cause of a missing texture is read from these in create() (runtime only).
    private readonly loadedKeys = new Set<string>();
    private readonly failedKeys = new Map<string, number>();

    constructor() {
        super(SCENE_KEYS.boot);
    }

    /** The phase of the loading screen (read-only; the e2e hook reads it). */
    loadPhase(): BootLoadPhase {
        return this.phase;
    }

    /** Which loading pictures are on the screen (read-only; the e2e hook reads it). */
    loadingArt(): { background: boolean; emblem: boolean } {
        return this.loading?.artShown() ?? { background: false, emblem: false };
    }

    /** Whether the loading screen is still up. */
    isLoading(): boolean {
        return this.loading !== null;
    }

    preload(): void {
        // The loading screen is drawn first and removed in create(); a bar that fails to draw must not stop the game from starting.
        this.loading = new LoadingScreen(this);
        this.startedAt = performance.now();
        // A page that starts hidden opens the span at once; its first show closes it and arms the timers.
        this.hidden = document.hidden ? startHidden(noHidden, this.startedAt) : noHidden;
        const onProgress = (value: number): void => {
            try {
                this.loading?.progress(value);
            } catch (error) {
                console.warn('Loading bar failed', error);
            }
        };
        this.load.on('progress', onProgress);
        // Phaser gives every file its own xhr timeout of 0, which overrides the `loader.timeout` of the game config,
        // so the limit is copied onto each file as it is queued (this.load.xhr.timeout is the configured value).
        // Registered before ANY file is queued: Phaser emits ADD synchronously, so the loading pictures below get the limit too.
        const limitMs = this.load.xhr.timeout;
        let addWarned = false;
        this.load.on(Loader.Events.ADD, (_key: string, type: string, _loader: unknown, file: Loader.File) => {
            if (type === 'audio') {
                try {
                    guardDecode(file, (line) => console.warn(line));   // audit S-2: a sound that cannot be decoded is named with its key
                } catch (error) {
                    console.warn('Sound decode guard could not be set', error);
                }
            }
            try {
                if (typeof limitMs === 'number' && limitMs > 0) {
                    file.xhrSettings.timeout = limitMs;
                }
            } catch (error) {
                if (!addWarned) {
                    addWarned = true;
                    console.warn('Per-file load limit could not be set', error);
                }
            }
        });
        // The two loading pictures are queued FIRST (same queue, same limits) and drawn the moment each arrives; a file the cut ends never fires this.
        const artEvents: [string, () => void][] = [];
        let artWarned = false;
        for (const id of ['loadingBackground', 'loadingEmblem'] as const) {
            const art = UI_ART.find((entry) => entry.id === id);
            if (!art) {
                continue;
            }
            const event = fileKeyCompleteEvent(Loader.Events.FILE_KEY_COMPLETE, 'image', art.key);
            const show = (): void => {
                try {
                    this.loading?.showArt(id);
                } catch (error) {
                    if (!artWarned) {
                        artWarned = true;
                        console.warn('Loading art failed', error);
                    }
                }
            };
            artEvents.push([event, show]);
            this.load.on(event, show);
            this.load.image(art.key, art.url);
        }
        // One limit for the WHOLE boot load (audit A-1): the per-file limit above does not bound a loader with many
        // stalled files or a pending font promise. Past it every unfinished file ends as a load error and the game starts with what loaded.
        const seamEarly = __E2E_HOOK__ ? (this.registry.get(REGISTRY_KEYS.forcedArt) as string | null | undefined) : null;
        const limits: BootLimits = __E2E_HOOK__ && seamEarly === 'stallall' ? E2E_BOOT_LIMITS : balance.loader;
        checkBootLimits(limits);
        // After slowAfterMs a calm line appears under the bar (audit A-2); the rule decides, the widget draws.
        // Both limits run on window timers and the wall clock minus the hidden time (audits B-3, H-1): the game clock is smoothed and stops
        // with a hidden tab, so a game-time timer fires late, and the loader queue stands still while the tab is hidden, so hidden time
        // must not count toward the limits. A timer that fires a hair early waits for the rest; all timers end with the load or the scene.
        const schedule: BootLimitSchedule = bootLimitSchedule(limits, this.startedAt);
        const timers = new Set<number>();
        const arm = (at: number, onDue: () => void): void => {
            const id = window.setTimeout(() => {
                timers.delete(id);
                try {
                    const wall = performance.now();
                    if (!bootLimitReached(at, wall, hiddenMsAt(this.hidden, wall))) {
                        arm(at, onDue);
                        return;
                    }
                    onDue();
                } catch (error) {
                    // The slow line catches its own errors; what lands here is a failed cut, which would leave the loading screen
                    // up for good: rethrown so the error boundary shows the restart card, as the game-clock timer did before.
                    console.warn('Boot limit timer failed', error);
                    throw error;
                }
            }, bootLimitWait(at, performance.now(), hiddenMsAt(this.hidden, performance.now())));
            timers.add(id);
        };
        const clearTimers = (): void => {
            for (const id of timers) window.clearTimeout(id);
            timers.clear();
        };
        const cutNow = (): void => {
            const wall = performance.now();
            if (bootLimitDue(schedule, wall, hiddenMsAt(this.hidden, wall)) !== 'cut') {
                return;
            }
            // Recorded BEFORE the cut: failing the last file ends the load and runs create() synchronously inside cutLoad, and
            // create() reads this.cut for the cause of each missing picture (`cut`, not the `network` of the aborted request).
            this.cut = pendingKeys(this.load);
            cutLoad(this.load);
            this.phase = 'over';
            this.publish();
            console.warn(`Boot load cut after ${Math.round(performance.now() - this.startedAt)} ms (hidden ${Math.round(hiddenMsAt(this.hidden, performance.now()))} ms): ${this.cut.length} files: ${this.cut.join(', ')}`);
        };
        const armSlow = (): void => {
            arm(schedule.slowAt, () => {
                if (this.phase !== 'loading') {
                    return;
                }
                try {
                    this.loading?.slow();
                    this.phase = 'slow';
                } catch (error) {
                    console.warn('Loading line failed', error);
                }
            });
        };
        const armCut = (): void => {
            arm(schedule.cutAt, cutNow);
        };
        if (!document.hidden) {
            armSlow();
            armCut();
        }
        // Hide: stop both timers and open the span. Show: close it (only if one was open), clear first so at most one timer per limit
        // is pending, then re-arm by phase. After the load ended the listener is gone, so nothing is armed.
        const onVisibility = (): void => {
            const wall = performance.now();
            if (document.hidden) {
                this.hidden = startHidden(this.hidden, wall);
                clearTimers();
                return;
            }
            if (this.hidden.since === null) {
                return;
            }
            this.hidden = endHidden(this.hidden, wall);
            clearTimers();
            if (this.phase === 'loading') {
                armSlow();
            }
            if (this.phase !== 'over') {
                armCut();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        const dropListener = (): void => document.removeEventListener('visibilitychange', onVisibility);
        // Nothing may call into the loading screen after the load ends: a late file after the cut must not redraw a destroyed screen.
        this.load.once(Loader.Events.COMPLETE, () => {
            clearTimers();
            dropListener();
            this.load.off('progress', onProgress);
            for (const [event, show] of artEvents) {
                this.load.off(event, show);
            }
        });
        this.events.once('shutdown', () => {
            clearTimers();
            dropListener();
        });
        // A missing drawing is not fatal: create() records which ones are absent (rounds skip the tasks that need them,
        // the parent panel counts them) and ArtImage draws a Polish stand-in for any that still shows. The unit test keeps the table and files equal.
        // Phaser fires `loaderror` only for a failed fetch; a decode or font failure fires none (research.md), so create() reads the rest from the cache.
        this.load.on(Loader.Events.FILE_LOAD, (file: Loader.File) => {
            this.loadedKeys.add(file.key);
        });
        this.load.on('loaderror', (file: Loader.File) => {
            const status = file.xhrLoader?.status ?? 0;
            this.failedKeys.set(file.key, status);
            const table = tableOf(file.key, this.tables());
            console.warn(table ? loadErrorLine(table, file.key, file.src, status) : `Font failed to load: ${file.key}`);
        });
        // e2e build only (?e2eArt): 'missing' queues no drawing, 'corrupt' points the coins at a file that is no image ('room' and 'stall' do not touch this queue).
        const seam = __E2E_HOOK__ ? (this.registry.get(REGISTRY_KEYS.forcedArt) as string | null | undefined) : null;
        // Queue order (audit B-6, bootQueue): the pictures a child sees first, then the current room and the screens, the sounds last, so a slow
        // link cuts the quiet effects before a picture. The two loading pictures were queued above, before the limits.
        const queuers: Record<BootGroup, () => void> = {
            loadingArt: () => undefined,
            font: () => {
                this.load.font(FONT_KEY, FONT_URL, 'truetype', { weight: FONT_WEIGHT_RANGE });
            },
            task: () => {
                for (const art of TASK_ART) {
                    if (seam === 'missing') {
                        continue;
                    }
                    this.load.image(art.key, seam === 'corrupt' && art.key.startsWith('tasks/money/') ? FONT_URL : art.url);
                }
            },
            // The current room's pictures load the same way (other rooms load at runtime); a missing one is a stand-in box in the room (e2e build: ?e2eArt=room queues none).
            room: () => {
                for (const art of bootRoomArt(this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined)) {
                    if (seam === 'room') {
                        continue;
                    }
                    this.load.image(art.key, art.url);
                }
            },
            // The other screens' pictures (wallet, notebook, salon thumbnail); the two loading pictures were queued first.
            ui: () => {
                for (const art of UI_ART) {
                    if (art.id !== 'loadingBackground' && art.id !== 'loadingEmblem') this.load.image(art.key, seam === 'ui' ? UI_MISSING_URL : art.url);
                }
            },
            sound: () => this.queueSounds(),
        };
        for (const group of bootQueue(['loadingArt', 'font', 'task', 'room', 'ui', 'sound'])) {
            queuers[group]();
        }
    }

    /**
     * Sound effects join the same queue and the same limits. [m4a, ogg]: Phaser takes the first format the browser plays.
     * A decode failure fires no `loaderror` (Phaser ends it as a processed file), so health is read from the cache in create().
     * Without Web Audio there is no decoding at all and every effect stays missing.
     */
    private queueSounds(): void {
        for (const def of SOUNDS) {
            if (def.boot) {
                this.load.audio(def.key, [...def.urls]);
            }
        }
    }

    private tables(): Record<ArtTable, ReadonlySet<string>> {
        return {
            task: new Set(TASK_ART.map((art) => art.key)),
            room: new Set(ROOM_ART.map((art) => art.key)),
            ui: new Set(UI_ART.map((art) => art.key)),
            sound: new Set(SOUNDS.map((def) => def.key)),
        };
    }

    /** The record of a table plus the cause of each missing key and the textures whose size differs from the table (reported, never dropped). */
    private withCauses<T extends { key: string; width: number; height: number }>(
        label: string,
        entries: readonly T[],
        health: ReturnType<typeof artHealth>,
    ): ReturnType<typeof artHealth> {
        const seen: LoadSeen = { loaded: this.loadedKeys, failed: this.failedKeys, cut: new Set(this.cut) };
        const causes = artCauses(health.missing, seen);
        const wrongSize = wrongSizes(entries, (key) => {
            const image = this.textures.exists(key) ? this.textures.get(key).source[0] : undefined;
            return image ? { width: image.width, height: image.height } : undefined;
        });
        if (health.missing.length > 0) {
            console.warn(`${label} art causes: ${health.missing.map((key) => `${key}=${causes[key]}`).join(', ')}`);
        }
        if (wrongSize.length > 0) {
            console.warn(`${label} art with a size other than its table: ${wrongSize.join(', ')}`);
        }
        return { ...health, causes, wrongSize };
    }

    private publish(): void {
        this.registry.set(REGISTRY_KEYS.bootLoad, { cut: [...this.cut], cutByTable: cutByTable(this.cut, this.tables()), creates: this.creates, elapsedMs: Math.round(performance.now() - this.startedAt), hiddenMs: Math.round(hiddenMsAt(this.hidden, performance.now())) });
    }

    create(): void {
        this.creates += 1;
        this.publish();
        if (this.creates > 1) {
            console.warn('BootScene.create ran twice; the second run is ignored');
            return;
        }
        this.loading?.destroy();
        this.loading = null;
        try {
            console.info(this.sys.game.renderer.type === WEBGL ? 'Renderer: WebGL' : 'Renderer: Canvas (no filters: the worn salon look is off)');
        } catch (error) {
            console.warn('Renderer could not be read', error);
        }
        // Did the task font arrive? (A decode failure fires no loaderror, so the document's font set is read.)
        // A diagnostic only: a browser without an iterable document.fonts must still start the game (the record then says fallback).
        let faces: { family: string; status: string }[] = [];
        try {
            faces = [...document.fonts].map((face) => ({ family: face.family, status: face.status }));
        } catch (error) {
            console.warn('Font set could not be read', error);
        }
        const font = fontHealth(faces, FONT_KEY);
        this.registry.set(REGISTRY_KEYS.fontHealth, font);
        if (font === 'fallback') {
            console.warn(`Task font not loaded: ${FONT_KEY} (text is drawn in a system font)`);
        }
        // The one record of which drawings did not make it to a texture (a failed fetch and a failed decode alike).
        const health = this.withCauses('Task', TASK_ART, artHealth(TASK_ART, (key) => this.textures.exists(key)));
        this.registry.set(REGISTRY_KEYS.artHealth, health);
        if (health.missing.length > 0) {
            console.warn(`Task art missing: ${health.missing.length} of ${health.total}: ${health.missing.join(', ')}`);
        }
        const bootRoom = bootRoomArt(this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined);
        const roomHealth = this.withCauses('Room', bootRoom, roomHealthOf(bootRoom, (key) => this.textures.exists(key)));
        this.registry.set(REGISTRY_KEYS.roomArtHealth, roomHealth);
        if (roomHealth.missing.length > 0) {
            console.warn(`Room art missing: ${roomHealth.missing.length} of ${roomHealth.total}: ${roomHealth.missing.join(', ')}`);
        }
        const uiHealth = this.withCauses('Ui', UI_ART, artHealth(UI_ART.map((art) => ({ key: art.key, id: art.id })), (key) => this.textures.exists(key)));
        this.registry.set(REGISTRY_KEYS.uiArtHealth, uiHealth);
        if (!this.textures.exists(UI_ART_KEYS.loadingBackground) || !this.textures.exists(UI_ART_KEYS.loadingEmblem)) recordFallback(this, 'loading', 'drawn');
        if (uiHealth.missing.length > 0) {
            console.warn(`UI art missing: ${uiHealth.missing.length} of ${uiHealth.total}: ${uiHealth.missing.join(', ')}`);
        }
        // Sound effects: trim the encoder padding BEFORE the hand-over below, so no play meets an untrimmed buffer; then record what is missing.
        try {
            const untrimmed = trimEffects(this.game);
            const soundHealth = artHealth(
                SOUNDS.filter((def) => def.boot).map((def) => ({ key: def.key, id: def.id })),
                (key) => this.cache.audio.exists(key) && !untrimmed.includes(key),
            );
            this.registry.set(REGISTRY_KEYS.soundHealth, soundHealth);
            (this.registry.get(REGISTRY_KEYS.sound) as SoundService | undefined)?.setMissing(soundHealth.missing);
            if (soundHealth.missing.length > 0) {
                console.warn(`Sounds missing: ${soundHealth.missing.length} of ${soundHealth.total}: ${soundHealth.missing.join(', ')}`);
            }
        } catch (error) {
            console.warn('Sound setup failed; playing without effects', error);
            try {
                (this.registry.get(REGISTRY_KEYS.sound) as SoundService | undefined)?.setMissing(allEffectKeys(SOUNDS));   // the "Dźwięki" section says so
            } catch (inner) {
                console.warn('Sound setup failure could not be recorded', inner);
            }
        }
        if (__E2E_HOOK__ && this.registry.get(REGISTRY_KEYS.forcedFailure) === 'boot') {
            throw new Error(E2E_FORCED_FAILURE);   // e2e build only
        }
        // Hand over on the next loop step, outside the font promise: an exception of the start then reaches the error
        // boundary itself instead of being swallowed by the promise's catch and followed by a second error.
        this.time.delayedCall(0, () => {
            const learner = (this.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined) ?? null;
            this.scene.start(needsPlacement(learner) ? SCENE_KEYS.welcome : SCENE_KEYS.task);
        });
    }
}
