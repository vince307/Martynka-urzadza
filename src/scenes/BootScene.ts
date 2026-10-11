import { Scene } from 'phaser';
import {
    GAME_HEIGHT,
    GAME_WIDTH,
    MIN_TOUCH_TARGET,
    PLACEHOLDER_COLORS,
} from '../data/layout';
import { pl } from '../data/pl';

/**
 * Empty boot scene for milestone M0. It only proves that scaling works:
 * a frame on the scene edge shows the letterbox and centering, a square in
 * the corner shows the minimum touch target, the title sits in the middle.
 * Everything is drawn in code; no assets are loaded yet.
 */
export class BootScene extends Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        const frameWidth = 8;
        const margin = frameWidth * 3;
        const graphics = this.add.graphics();

        graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        graphics.lineStyle(frameWidth, PLACEHOLDER_COLORS.turquoise, 1);
        graphics.strokeRect(
            frameWidth / 2,
            frameWidth / 2,
            GAME_WIDTH - frameWidth,
            GAME_HEIGHT - frameWidth,
        );

        // Minimum touch target reference in the bottom-right corner.
        graphics.fillStyle(PLACEHOLDER_COLORS.butter, 1);
        graphics.fillRect(
            GAME_WIDTH - margin - MIN_TOUCH_TARGET,
            GAME_HEIGHT - margin - MIN_TOUCH_TARGET,
            MIN_TOUCH_TARGET,
            MIN_TOUCH_TARGET,
        );

        const textColor = `#${PLACEHOLDER_COLORS.deepTeal.toString(16).padStart(6, '0')}`;
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, pl.title, {
                fontFamily: 'sans-serif',
                fontSize: '112px',
                color: textColor,
            })
            .setOrigin(0.5);
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 112, pl.bootPlaceholder, {
                fontFamily: 'sans-serif',
                fontSize: '48px',
                color: textColor,
            })
            .setOrigin(0.5);
    }
}
