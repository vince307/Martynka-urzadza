import { Loader, Scene } from 'phaser';
import { artHealth } from '../core/artHealth';
import { needsPlacement, type SessionLearner } from '../core/placement';
import { E2E_FORCED_FAILURE } from '../testing/e2eHook';
import { LoadingScreen } from '../ui/widgets/LoadingScreen';
import { ROOM_ART } from '../data/roomArt';
import { TASK_ART } from '../data/taskArt';
import { FONT_KEY, FONT_URL, FONT_WEIGHT_RANGE, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';

/**
 * Loads the task screen font from public/fonts and the task drawings from public/assets/tasks (precached, so
 * they also work offline) and hands over: to the welcome screen while `needsPlacement` says the
 * session has no learner, otherwise to the task scene. Nothing is drawn here.
 */
export class BootScene extends Scene {
    private loading: LoadingScreen | null = null;

    constructor() {
        super(SCENE_KEYS.boot);
    }

    preload(): void {
        // The loading screen is drawn first and removed in create(); a bar that fails to draw must not stop the game from starting.
        this.loading = new LoadingScreen(this);
        this.load.on('progress', (value: number) => {
            try {
                this.loading?.progress(value);
            } catch (error) {
                console.warn('Loading bar failed', error);
            }
        });
        // Phaser gives every file its own xhr timeout of 0, which overrides the `loader.timeout` of the game config,
        // so the limit is copied onto each file as it is queued (this.load.xhr.timeout is the configured value).
        const limitMs = this.load.xhr.timeout;
        this.load.on(Loader.Events.ADD, (_key: string, _type: string, _loader: unknown, file: Loader.File) => {
            if (typeof limitMs === 'number' && limitMs > 0) {
                file.xhrSettings.timeout = limitMs;
            }
        });
        this.load.font(FONT_KEY, FONT_URL, 'truetype', { weight: FONT_WEIGHT_RANGE });
        // A missing drawing is not fatal: create() records which ones are absent (rounds skip the tasks that need them,
        // the parent panel counts them) and ArtImage draws a Polish stand-in for any that still shows. The unit test keeps the table and files equal.
        this.load.on('loaderror', (file: { key: string; type?: string }) => {
            console.warn(file.type === 'font' ? `Task font failed to load: ${file.key}` : `Task art failed to load: ${file.key}`);
        });
        // e2e build only (?e2eArt): 'missing' queues no drawing, 'corrupt' points the coins at a file that is no image ('room' and 'stall' do not touch this queue).
        const seam = __E2E_HOOK__ ? (this.registry.get(REGISTRY_KEYS.forcedArt) as string | null | undefined) : null;
        for (const art of TASK_ART) {
            if (seam === 'missing') {
                continue;
            }
            this.load.image(art.key, seam === 'corrupt' && art.key.startsWith('tasks/money/') ? FONT_URL : art.url);
        }
        // The salon pictures load the same way; a missing one is a stand-in box in the room (e2e build: ?e2eArt=room queues none).
        for (const art of ROOM_ART) {
            if (seam === 'room') {
                continue;
            }
            this.load.image(art.key, art.url);
        }
    }

    create(): void {
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
