import type { GameObjects, Scene } from 'phaser';
import type { Box } from '../../core/roomHit';
import { ROOM_LAYOUT } from '../../data/layout';
import { textStyle } from './textStyle';

/** Where a picture sits in the scene (the manifest's geometry): top-left corner, size and the foot of the object inside it. */
export interface LayerPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
    anchor: readonly [number, number];
}

/** What a missing texture is drawn as: a box over the picture's visible rectangle with a Polish caption. */
export interface LayerStandIn {
    box: Box;
    fill: number;
    alpha: number;
    caption: string;
}

/**
 * One picture of the room (a scene layer, a piece of decoration, a furniture variant) on its own depth. When the texture is
 * missing it draws the stand-in box with its caption instead (never Phaser's `__MISSING`), or nothing when there is none
 * (a full-scene layer: the room then keeps its coloured backdrop). Created once and reused: `show` re-targets it, `hide` hides it.
 * The image's origin is the object's `anchor`, so a scale tween grows it from the foot of the object (S-16a phase 7).
 * DESIGN-GAP (docs/design-gaps.md): the stand-in is ours; the kit has none for a room picture.
 */
export class RoomLayer {
    private readonly image: GameObjects.Image;
    private readonly box: GameObjects.Graphics;
    private readonly text: GameObjects.Text;
    private loaded = false;

    constructor(private readonly scene: Scene) {
        this.image = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
        this.box = scene.add.graphics().setVisible(false);
        this.text = scene.add.text(0, 0, '', textStyle('caption')).setOrigin(0.5).setVisible(false);
    }

    /** Shows texture `key` at `at` on `depth`; `standIn` is what to draw if the texture is not loaded (null: nothing). */
    show(key: string, at: LayerPlacement, depth: number, standIn: LayerStandIn | null): void {
        this.hide();
        this.loaded = this.scene.textures.exists(key);
        if (this.loaded) {
            this.image
                .setTexture(key)
                .setOrigin(at.anchor[0] / at.width, at.anchor[1] / at.height)
                .setPosition(at.x + at.anchor[0], at.y + at.anchor[1])
                .setDisplaySize(at.width, at.height)
                .setDepth(depth)
                .setVisible(true);
            return;
        }
        if (!standIn) {
            return;
        }
        const { box } = standIn;
        const { border, borderWidth, radius } = ROOM_LAYOUT.standIn;
        const [w, h] = [box.right - box.left, box.bottom - box.top];
        this.box.setDepth(depth).setVisible(true).fillStyle(standIn.fill, standIn.alpha).fillRoundedRect(box.left, box.top, w, h, radius);
        this.box.lineStyle(borderWidth, border, 1).strokeRoundedRect(box.left, box.top, w, h, radius);
        this.text.setText(standIn.caption).setPosition(box.left + w / 2, box.top + h / 2).setDepth(depth + 0.5).setVisible(true);
    }

    hide(): void {
        this.image.setVisible(false);
        this.box.clear().setVisible(false);
        this.text.setVisible(false);
    }

    /** True while the real picture (not the stand-in) is on screen. */
    showsPicture(): boolean {
        return this.loaded && this.image.visible;
    }

    /** The picture's image while it is on screen, for the purchase pop; null for a stand-in or when hidden. */
    object(): GameObjects.Image | null {
        return this.showsPicture() ? this.image : null;
    }

    destroy(): void {
        this.image.destroy();
        this.box.destroy();
        this.text.destroy();
    }
}
