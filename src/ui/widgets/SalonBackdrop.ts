import { WEBGL, type GameObjects, type Scene, type Textures } from 'phaser';
import { backdropMode, type BackdropMode } from '../../core/backdrop';
import type { RoomState } from '../../core/types';
import { BACKDROP, GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND } from '../../data/layout';
import { FIRST_ROOM, ROOMS } from '../../data/rooms';
import { hexToNumber } from './kitDraw';
import { drawRoomMiniature } from './RoomView';

let serial = 0;

/** What the backdrop drew, not only what was asked (audit B-2). Runtime only, read by the e2e hook. `captures` counts every non-plain render, restores included; `redraws` only the restores. */
export interface BackdropSnapshot {
    readonly mode: BackdropMode;
    readonly captures: number;
    readonly drawn: boolean;
    readonly blurred: boolean;
    readonly renderer: 'webgl' | 'canvas';
    readonly redraws: number;
    /** Worn images that carried a grade filter in the last capture (0 under Canvas or after the stage). */
    readonly graded: number;
}

export type BackdropCause = 'capture' | 'restore';

/** The record of a scene that has no backdrop yet (nothing drawn); one shape for every owner. */
export const plainBackdropSnapshot = (scene: Scene): BackdropSnapshot => Object.freeze({
    mode: 'plain', captures: 0, drawn: false, blurred: false, renderer: scene.sys.game.renderer.type === WEBGL ? 'webgl' : 'canvas', redraws: 0, graded: 0,
});

/**
 * The child's own salon, blurred and washed ivory, behind the notebook. The room is captured ONCE into a small texture (a quarter
 * of the scene) and shown as one image; nothing is filtered per frame. When the salon picture is missing, nothing is drawn and the
 * page colour of the game shows, like before.
 * DESIGN-GAP 155: the kit blurs a static room picture; the game blurs the child's own salon; plain page colour when the salon picture is missing.
 */
export class SalonBackdrop {
    private texture: Textures.DynamicTexture | null = null;
    private image: GameObjects.Image | null = null;
    private wash: GameObjects.Rectangle | null = null;
    private currentMode: BackdropMode = 'plain';
    private captureCount = 0;
    private redrawCount = 0;
    private wasDrawn = false;
    private wasBlurred = false;
    private gradedCount = 0;

    constructor(private readonly scene: Scene) {}

    snapshot(): BackdropSnapshot {
        return Object.freeze({
            mode: this.currentMode,
            captures: this.captureCount,
            drawn: this.wasDrawn,
            blurred: this.wasBlurred,
            renderer: this.scene.sys.game.renderer.type === WEBGL ? 'webgl' : 'canvas',
            redraws: this.redrawCount,
            graded: this.gradedCount,
        });
    }

    /**
     * One texture pixel from the middle of the backdrop; null without a texture, under Canvas (async snapshot) or when the read did not run at once.
     * For the e2e hook only: the WebGL read takes over the renderer's one snapshot slot and rebinds the texture framebuffer between frames.
     */
    pixel(): [number, number, number, number] | null {
        if (!this.texture || this.scene.sys.game.renderer.type !== WEBGL) return null;
        let out: [number, number, number, number] | null = null;
        this.texture.snapshotPixel(Math.floor(this.texture.width / 2), Math.floor(this.texture.height / 2), (color) => {
            if ('red' in color) out = [color.red, color.green, color.blue, color.alpha];
        });
        return out;
    }

    render(rooms: Record<string, RoomState> | undefined, currentRoom: string | undefined, cause: BackdropCause = 'capture'): void {
        if (cause === 'restore') {
            this.redrawCount += 1;
            console.warn(`Salon backdrop redrawn after a WebGL context restore (${this.scene.sys.settings.key}, redraw ${this.redrawCount})`);
        }
        this.clear();
        this.wasDrawn = false;
        this.wasBlurred = false;
        this.gradedCount = 0;
        const id = currentRoom && ROOMS[currentRoom] ? currentRoom : FIRST_ROOM;
        const room = ROOMS[id];
        const state = rooms?.[id] ?? { tasksDone: 0, chosen: {} };
        this.currentMode = backdropMode(room, state, (key) => this.scene.textures.exists(key));
        if (this.currentMode === 'plain') return;
        this.captureCount += 1;
        const { scale } = BACKDROP;
        // Never on the display list: a stand-in box for a missing slot picture is not drawn, the piece is simply left out.
        const g = this.scene.make.graphics({}, false);
        const images = drawRoomMiniature(this.scene, g, room, state, 0, 0, scale, 0);
        this.gradedCount = images.filter((i) => (i.filters?.internal.list.length ?? 0) > 0).length;
        const holder = this.scene.make.container({ x: 0, y: 0 }, false);
        holder.add(images);   // leaves the display list at once, so nothing flashes on screen
        // `enableFilters` does nothing under the Canvas renderer (no `filters`), and there the upscale alone softens the picture.
        if (this.scene.sys.game.renderer.type === WEBGL) {
            const { quality, x, y, strength, steps } = BACKDROP.blur;
            this.wasBlurred = holder.enableFilters().filters?.internal.addBlur(quality, x, y, strength, 0xffffff, steps) !== undefined;
        }
        const key = `salon-backdrop-${(serial += 1)}`;
        const dt = this.scene.textures.addDynamicTexture(key, Math.round(GAME_WIDTH * scale), Math.round(GAME_HEIGHT * scale));
        if (dt) {
            // No x/y: only (0, 0) is the same on both renderers. v4 queues the draw, `render` runs it (the filter step included).
            dt.draw(holder);
            dt.render();
            this.texture = dt;
            this.wasDrawn = true;
            this.image = this.scene.add.image(0, 0, key).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(BACKDROP.depth).setScrollFactor(0);
            this.wash = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexToNumber(PAGE_BACKGROUND), BACKDROP.washAlpha)
                .setOrigin(0, 0).setDepth(BACKDROP.depth + 1).setScrollFactor(0);
        }
        holder.destroy(true);   // GameObject.destroy also destroys its filterCamera in Phaser 4.2.1 (pinned in tests/phaserLoaderPin.test.ts)
        g.destroy();
    }

    destroy(): void {
        this.clear();
    }

    private clear(): void {
        this.image?.destroy();
        this.wash?.destroy();
        if (this.texture) this.scene.textures.remove(this.texture);
        this.image = null;
        this.wash = null;
        this.texture = null;
    }
}
