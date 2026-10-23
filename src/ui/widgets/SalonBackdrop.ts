import { WEBGL, type GameObjects, type Scene, type Textures } from 'phaser';
import { backdropMode, type BackdropMode } from '../../core/backdrop';
import type { RoomState } from '../../core/types';
import { BACKDROP, GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND } from '../../data/layout';
import { FIRST_ROOM, ROOMS } from '../../data/rooms';
import { hexToNumber } from './kitDraw';
import { drawRoomMiniature } from './RoomView';

let serial = 0;

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

    constructor(private readonly scene: Scene) {}

    get mode(): BackdropMode {
        return this.currentMode;
    }

    get captures(): number {
        return this.captureCount;
    }

    render(rooms: Record<string, RoomState> | undefined, currentRoom: string | undefined): void {
        this.clear();
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
        const holder = this.scene.make.container({ x: 0, y: 0 }, false);
        holder.add(images);   // leaves the display list at once, so nothing flashes on screen
        // `enableFilters` does nothing under the Canvas renderer (no `filters`), and there the upscale alone softens the picture.
        if (this.scene.sys.game.renderer.type === WEBGL) {
            const { quality, x, y, strength, steps } = BACKDROP.blur;
            holder.enableFilters().filters?.internal.addBlur(quality, x, y, strength, 0xffffff, steps);
        }
        const key = `salon-backdrop-${(serial += 1)}`;
        const dt = this.scene.textures.addDynamicTexture(key, Math.round(GAME_WIDTH * scale), Math.round(GAME_HEIGHT * scale));
        if (dt) {
            // No x/y: only (0, 0) is the same on both renderers. v4 queues the draw, `render` runs it (the filter step included).
            dt.draw(holder);
            dt.render();
            this.texture = dt;
            this.image = this.scene.add.image(0, 0, key).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(BACKDROP.depth).setScrollFactor(0);
            this.wash = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hexToNumber(PAGE_BACKGROUND), BACKDROP.washAlpha)
                .setOrigin(0, 0).setDepth(BACKDROP.depth + 1).setScrollFactor(0);
        }
        holder.destroy(true);
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
