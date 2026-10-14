// DESIGN-GAP 66 (docs/design-gaps.md): the kit has no stand-in for a drawing that failed to load.
import type { GameObjects, Scene } from 'phaser';
import { ART_STAND_IN } from '../../data/layout';
import { TASK_ART } from '../../data/taskArt';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

const SIZES = new Map(TASK_ART.map((entry) => [entry.key, entry]));

/**
 * One drawing of the art kit (a coin, a jug, an icon...) placed in a rectangle with its proportions kept. When the
 * texture is missing the image draws a plain box with the id instead (never Phaser's `__MISSING`), so a failed load
 * leaves the task playable. Created once and reused: `show` re-targets it, `hide` hides it.
 */
export class ArtImage {
    private readonly image: GameObjects.Image;
    private readonly box: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private current: { key: string; loaded: boolean } | null = null;

    constructor(private readonly scene: Scene) {
        this.image = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
        this.box = scene.add.graphics().setVisible(false);
        this.label = scene.add.text(0, 0, '', textStyle('artLabel')).setOrigin(0.5).setVisible(false);
    }

    /** Fits the drawing `key` inside `rect`, centred, keeping the proportions of the converted file. */
    show(key: string, rect: Rect): void {
        const size = SIZES.get(key);
        const ratio = size ? size.width / size.height : 1;
        const width = Math.min(rect.width, rect.height * ratio);
        const height = width / ratio;
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        const loaded = this.scene.textures.exists(key);
        this.current = { key, loaded };
        this.image.setVisible(false);
        this.box.clear().setVisible(false);
        this.label.setVisible(false);
        if (loaded) {
            this.image.setTexture(key).setPosition(cx, cy).setDisplaySize(width, height).setVisible(true);
            return;
        }
        const stand = ART_STAND_IN;
        this.box.setVisible(true).fillStyle(stand.fill, 1).fillRoundedRect(cx - width / 2, cy - height / 2, width, height, stand.radius);
        this.box.lineStyle(stand.borderWidth, stand.border, 1).strokeRoundedRect(cx - width / 2, cy - height / 2, width, height, stand.radius);
        this.label.setText(key.split('/').pop() ?? key).setPosition(cx, cy).setVisible(true);
    }

    hide(): void {
        this.current = null;
        this.image.setVisible(false);
        this.box.setVisible(false);
        this.label.setVisible(false);
    }

    /**
     * What is on screen now, read from the game objects themselves (not from what `show` was asked): the key of a visible
     * image whose texture is loaded, `loaded: false` for the visible stand-in box, null while nothing is shown.
     */
    state(): { key: string; loaded: boolean } | null {
        if (!this.current) {
            return null;
        }
        if (this.image.visible && this.image.texture.key === this.current.key && this.image.displayWidth > 0 && this.image.displayHeight > 0) {
            return { key: this.image.texture.key, loaded: true };
        }
        if (this.box.visible && this.label.visible) {
            return { key: this.current.key, loaded: false };
        }
        return null;
    }
}
