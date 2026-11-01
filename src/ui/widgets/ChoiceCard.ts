import type { GameObjects, Scene } from 'phaser';
import { LIPS, PLACEHOLDER_COLORS, WELCOME_LAYOUT } from '../../data/layout';
import { ChunkyFace } from './chunky';
import { textStyle } from './textStyle';

/**
 * One building card of the first-building choice (S-28): the picture over a label band, on a chunky face. Like AgeButton it
 * fires on pointerup and only when the press began on it. A missing texture draws a stand-in box with the label (DESIGN-GAP, docs/design-gaps.md row 197), and
 * `drawn` tells the scene so it can record the fallback. The only motion is the ChunkyFace press (it obeys reduced motion).
 */
export class ChoiceCard {
    readonly drawn: boolean;
    private readonly graphics: GameObjects.Graphics;
    private readonly chunky: ChunkyFace;
    private pressed = false;
    private readonly center: { x: number; y: number };

    constructor(
        scene: Scene,
        label: string,
        textureKey: string,
        left: number,
        top: number,
        private readonly onTap: () => void,
    ) {
        const { pictureWidth, pictureHeight, labelHeight, radius, border } = WELCOME_LAYOUT.choice.cards;
        const width = pictureWidth;
        const height = pictureHeight + labelHeight;
        this.center = { x: left + width / 2, y: top + height / 2 };
        this.drawn = !scene.textures.exists(textureKey);
        this.graphics = scene.add.graphics();
        this.graphics.fillStyle(PLACEHOLDER_COLORS.ageButton, 1);
        this.graphics.fillRoundedRect(left, top, width, height, radius);
        this.graphics.lineStyle(border, PLACEHOLDER_COLORS.ageButtonBorder, 1);
        this.graphics.strokeRoundedRect(left, top, width, height, radius);
        const parts: GameObjects.GameObject[] = [this.graphics];
        const inset = border * 2;
        const box = { x: left + inset, y: top + inset, width: width - 2 * inset, height: pictureHeight - inset };
        if (this.drawn) {
            const stand = scene.add.graphics();
            stand.fillStyle(PLACEHOLDER_COLORS.paleLeaf, 1);
            stand.fillRoundedRect(box.x, box.y, box.width, box.height, radius / 2);
            parts.push(stand);
        } else {
            const image = scene.add.image(box.x + box.width / 2, box.y + box.height / 2, textureKey);
            const scale = Math.min(box.width / image.width, box.height / image.height);
            image.setScale(scale);
            parts.push(image);
        }
        const text = scene.add.text(this.center.x, top + pictureHeight + labelHeight / 2, label, textStyle('pageButton')).setOrigin(0.5);
        parts.push(text);
        this.chunky = new ChunkyFace(scene, { x: left, y: top, width, height }, LIPS.age, radius);
        this.chunky.add(...parts);
        const zone = scene.add.zone(this.center.x, this.center.y, width, height).setInteractive();
        zone.on('pointerdown', () => {
            this.pressed = true;
            this.chunky.press();
        });
        zone.on('pointerout', () => {
            this.pressed = false;
            this.chunky.release();
        });
        zone.on('pointerup', () => {
            const tapped = this.pressed;
            this.pressed = false;
            this.chunky.release();
            if (tapped) {
                this.onTap();
            }
        });
    }

    /** Centre of the card in scene space, for the e2e hook. */
    target(): { x: number; y: number } {
        return this.center;
    }
}
