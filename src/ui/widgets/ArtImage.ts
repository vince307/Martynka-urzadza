// DESIGN-GAP 66 (docs/design-gaps.md): the kit has no stand-in for a drawing that failed to load.
import type { GameObjects, Scene } from 'phaser';
import { ART_STAND_IN } from '../../data/layout';
import { TASK_ART } from '../../data/taskArt';
import { UI_ART } from '../../data/uiArt';
import { standInLabelFit } from './artLayout';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

const SIZES = new Map([...TASK_ART, ...UI_ART].map((entry) => [entry.key, entry]));

/**
 * One drawing of the art kit (a coin, a jug, an icon...) placed in a rectangle with its proportions kept. When the
 * texture is missing the image draws a plain box (never Phaser's `__MISSING`) with the Polish value from data, so money,
 * weights and jugs stay solvable; the text shrinks to fit the box, broken onto two lines at its space when that keeps it larger. Created once and reused: `show` re-targets it, `hide` hides it.
 */
export class ArtImage {
    private readonly image: GameObjects.Image;
    private readonly box: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private current: { key: string; loaded: boolean; label: string | null } | null = null;

    constructor(private readonly scene: Scene) {
        this.image = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
        this.box = scene.add.graphics().setVisible(false);
        this.label = scene.add.text(0, 0, '', textStyle('artLabel')).setOrigin(0.5).setAlign('center').setVisible(false);
    }

    /**
     * Fits the drawing `key` inside `rect`, centred, keeping the proportions of the converted file. `standIn` is the part of the
     * image the box covers when the texture is missing (a jug's visible rectangle; default: the whole image), so boxes of
     * neighbouring drawings whose files have transparent margins do not overlap each other or the text under them.
     */
    show(key: string, rect: Rect, standIn?: Rect): void {
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
        const box = standIn ?? { x: cx - width / 2, y: cy - height / 2, width, height };
        this.box.setVisible(true).fillStyle(stand.fill, 1).fillRoundedRect(box.x, box.y, box.width, box.height, stand.radius);
        this.box.lineStyle(stand.borderWidth, stand.border, 1).strokeRoundedRect(box.x, box.y, box.width, box.height, stand.radius);
        const text = size?.label ?? '';
        this.current.label = text;
        const wrapped = text.includes(' ') ? text.replace(' ', '\n') : null;
        this.label.setScale(1).setText(text);
        const oneLine = { width: this.label.width, height: this.label.height };
        let twoLines: { width: number; height: number } | null = null;
        if (wrapped) {
            this.label.setText(wrapped);
            twoLines = { width: this.label.width, height: this.label.height };
        }
        const fit = standInLabelFit(box, oneLine, twoLines, stand);
        this.label
            .setText(fit.lines === 2 && wrapped ? wrapped : text)
            .setPosition(box.x + box.width / 2, box.y + box.height / 2)
            .setScale(fit.scale > 0 ? fit.scale : 1)
            .setVisible(text !== '');
    }

    /** Fades the picture or its stand-in; `show` leaves the value as it is. */
    setAlpha(alpha: number): void {
        this.image.setAlpha(alpha);
        this.box.setAlpha(alpha);
        this.label.setAlpha(alpha);
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
            return { key: this.current.key, loaded: false, label: this.label.visible ? this.label.text.replace('\n', ' ') : '' };
        }
        return null;
    }
}
