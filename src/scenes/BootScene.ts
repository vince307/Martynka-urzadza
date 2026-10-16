import { Loader, Scene, type Time } from 'phaser';
import { artHealth } from '../core/artHealth';
import { bootLoadPhase, checkBootLimits, type BootLimits, type BootLoadPhase } from '../core/bootLoad';
import { fileKeyCompleteEvent } from '../core/loaderEvent';
import { needsPlacement, type SessionLearner } from '../core/placement';
import { E2E_BOOT_LIMITS, E2E_FORCED_FAILURE } from '../testing/e2eHook';
import { LoadingScreen } from '../ui/widgets/LoadingScreen';
import { cutLoad } from './loaderCut';
import { balance } from '../data/balance';
import { ROOM_ART } from '../data/roomArt';
import { UI_ART } from '../data/uiArt';
import { SOUNDS } from '../data/sounds';
import type { SoundService } from '../ui/sound';
import { trimEffects } from '../ui/sound';
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
        const startedAt = this.time.now;
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
        this.load.on(Loader.Events.ADD, (_key: string, _type: string, _loader: unknown, file: Loader.File) => {
            if (typeof limitMs === 'number' && limitMs > 0) {
                file.xhrSettings.timeout = limitMs;
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
        // The phase is decided from the time that really passed since preload began (impl-review F3); a timer that fires a hair early waits for the rest.
        const armSlow = (waitMs: number): Time.TimerEvent =>
            this.time.delayedCall(waitMs, () => {
                if (this.phase !== 'loading') {
                    return;
                }
                const elapsed = this.time.now - startedAt;
                const decided = bootLoadPhase(elapsed, limits);
                if (decided === 'loading') {
                    slowTimer = armSlow(Math.max(1, limits.slowAfterMs - elapsed));
                    return;
                }
                try {
                    this.loading?.slow();
                    this.phase = 'slow';
                } catch (error) {
                    console.warn('Loading line failed', error);
                }
            });
        let slowTimer = armSlow(limits.slowAfterMs);
        const cutTimer = this.time.delayedCall(limits.totalMs, () => {
            this.cut = cutLoad(this.load);
            this.phase = 'over';
            this.publish();
            console.warn(`Boot load cut after ${limits.totalMs} ms: ${this.cut.length} files: ${this.cut.join(', ')}`);
        });
        // Nothing may call into the loading screen after the load ends: a late file after the cut must not redraw a destroyed screen.
        this.load.once(Loader.Events.COMPLETE, () => {
            slowTimer.remove(false);
            cutTimer.remove(false);
            this.load.off('progress', onProgress);
            for (const [event, show] of artEvents) {
                this.load.off(event, show);
            }
        });
        this.load.font(FONT_KEY, FONT_URL, 'truetype', { weight: FONT_WEIGHT_RANGE });
        // A missing drawing is not fatal: create() records which ones are absent (rounds skip the tasks that need them,
        // the parent panel counts them) and ArtImage draws a Polish stand-in for any that still shows. The unit test keeps the table and files equal.
        this.load.on('loaderror', (file: { key: string; type?: string }) => {
            console.warn(file.type === 'font' ? `Task font failed to load: ${file.key}` : file.type === 'audio' ? `Sound failed to load: ${file.key}` : `Task art failed to load: ${file.key}`);
        });
        // e2e build only (?e2eArt): 'missing' queues no drawing, 'corrupt' points the coins at a file that is no image ('room' and 'stall' do not touch this queue).
        const seam = __E2E_HOOK__ ? (this.registry.get(REGISTRY_KEYS.forcedArt) as string | null | undefined) : null;
        for (const art of TASK_ART) {
            if (seam === 'missing') {
                continue;
            }
            this.load.image(art.key, seam === 'corrupt' && art.key.startsWith('tasks/money/') ? FONT_URL : art.url);
        }
        this.queueSounds();
        // The salon pictures load the same way; a missing one is a stand-in box in the room (e2e build: ?e2eArt=room queues none).
        for (const art of ROOM_ART) {
            if (seam === 'room') {
                continue;
            }
            this.load.image(art.key, art.url);
        }
        // The other screens' pictures (wallet, notebook, salon thumbnail) join the queue after the salon; the two loading pictures are queued first by the loading screen (phase 5).
        for (const art of UI_ART) {
            if (art.id !== 'loadingBackground' && art.id !== 'loadingEmblem') this.load.image(art.key, art.url);
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

    private publish(): void {
        this.registry.set(REGISTRY_KEYS.bootLoad, { cut: [...this.cut], creates: this.creates });
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
        // The one record of which drawings did not make it to a texture (a failed fetch and a failed decode alike).
        const health = artHealth(TASK_ART, (key) => this.textures.exists(key));
        this.registry.set(REGISTRY_KEYS.artHealth, health);
        if (health.missing.length > 0) {
            console.warn(`Task art missing: ${health.missing.length} of ${health.total}: ${health.missing.join(', ')}`);
        }
        const roomHealth = artHealth(ROOM_ART.map((art) => ({ key: art.key, id: art.key })), (key) => this.textures.exists(key));
        this.registry.set(REGISTRY_KEYS.roomArtHealth, roomHealth);
        if (roomHealth.missing.length > 0) {
            console.warn(`Room art missing: ${roomHealth.missing.length} of ${roomHealth.total}: ${roomHealth.missing.join(', ')}`);
        }
        const uiHealth = artHealth(UI_ART.map((art) => ({ key: art.key, id: art.id })), (key) => this.textures.exists(key));
        this.registry.set(REGISTRY_KEYS.uiArtHealth, uiHealth);
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
