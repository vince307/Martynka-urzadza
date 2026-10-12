import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, WELCOME_LAYOUT } from '../../data/layout';
import { textStyle } from './textStyle';

/**
 * One age button of the welcome screen (kit .age-button, 218 x 190). It fires on pointerup and only
 * when the press began on it, like PageButton, so a touch that merely slides over it does nothing.
 */
export class AgeButton {
    private readonly graphics: GameObjects.Graphics;
    private pressed = false;
    private readonly center: { x: number; y: number };

    constructor(
        scene: Scene,
        label: string,
        left: number,
        top: number,
        private readonly onTap: () => void,
    ) {
        const { width, height } = WELCOME_LAYOUT.ages;
        this.center = { x: left + width / 2, y: top + height / 2 };
        this.graphics = scene.add.graphics();
        scene.add.text(this.center.x, this.center.y, label, textStyle('ageDigit')).setOrigin(0.5);
        const zone = scene.add.zone(this.center.x, this.center.y, width, height).setInteractive();
        this.draw(left, top, false);
        zone.on('pointerdown', () => {
            this.pressed = true;
            this.draw(left, top, true);
        });
        zone.on('pointerout', () => {
            this.pressed = false;
            this.draw(left, top, false);
        });
        zone.on('pointerup', () => {
            const tapped = this.pressed;
            this.pressed = false;
            this.draw(left, top, false);
            if (tapped) {
                this.onTap();
            }
        });
    }

    private draw(left: number, top: number, pressed: boolean): void {
        const { width, height, radius, border, shadow } = WELCOME_LAYOUT.ages;
        this.graphics.clear();
        this.graphics.fillStyle(PLACEHOLDER_COLORS.ageButtonShadow, 1);
        this.graphics.fillRoundedRect(left, top + shadow, width, height, radius);
        this.graphics.fillStyle(pressed ? PLACEHOLDER_COLORS.pressed : PLACEHOLDER_COLORS.ageButton, 1);
        this.graphics.fillRoundedRect(left, top, width, height, radius);
        this.graphics.lineStyle(border, PLACEHOLDER_COLORS.ageButtonBorder, 1);
        this.graphics.strokeRoundedRect(left, top, width, height, radius);
    }

    /** Centre of the button in scene space, for the e2e hook. */
    target(): { x: number; y: number } {
        return this.center;
    }
}
