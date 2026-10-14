// DESIGN-GAP 66 (docs/design-gaps.md): the kit has no stand-in for a drawing that failed to load.
import type { GameObjects, Scene } from 'phaser';
import { ART_STAND_IN } from '../../data/layout';
import { TASK_ART } from '../../data/taskArt';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

const SIZES = new Map(TASK_ART.map((entry) => [entry.key, entry]));

/**
 * One drawing of the art kit (a coin, a jug, an icon...) placed in a rectangle with its proportions kept. When the
 * texture is missing the image draws a plain box (never Phaser's `__MISSING`) with the Polish value from data, so money,
 * weights and jugs stay solvable; the text shrinks to fit the box. Created once and reused: `show` re-targets it, `hide` hides it.
 */
export class ArtImage {
    private readonly image: GameObjects.Image;
    private readonly box: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private current: { key: string; loaded: boolean; label: string | null } | null = null;

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
        this.current = { key, loaded, label: null };
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
        const text = size?.label ?? '';
        this.current.label = text;
        this.label.setText(text).setScale(1).setPosition(cx, cy).setVisible(text !== '');
        const room = Math.min((width - 2 * stand.padding) / this.label.width, (height - 2 * stand.padding) / this.label.height);
        if (room > 0 && room < 1) {
            this.label.setScale(room);
        }
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
    state(): { key: string; loaded: boolean; label: string | null } | null {
        if (!this.current) {
            return null;
        }
        if (this.image.visible && this.image.texture.key === this.current.key && this.image.displayWidth > 0 && this.image.displayHeight > 0) {
            return { key: this.image.texture.key, loaded: true, label: null };
        }
        if (this.box.visible && (this.label.visible || this.current.label === '')) {
            return { key: this.current.key, loaded: false, label: this.label.visible ? this.label.text : '' };
        }
        return null;
    }
}
