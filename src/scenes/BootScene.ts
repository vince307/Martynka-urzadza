import { Scene } from 'phaser';
import {
    FONT_SIZES,
    GAME_HEIGHT,
    GAME_WIDTH,
    MIN_TOUCH_TARGET,
    PLACEHOLDER_COLORS,
    PLACEHOLDER_FRAME,
} from '../data/layout';
import { pl } from '../data/pl';

/** Converts a 0xRRGGBB number from the palette to the CSS string Text expects. */
const toCssColor = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

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
        const { width: frameWidth, margin } = PLACEHOLDER_FRAME;
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

        const textColor = toCssColor(PLACEHOLDER_COLORS.deepTeal);
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, pl.title, {
                fontFamily: 'sans-serif',
                fontSize: `${FONT_SIZES.title}px`,
                color: textColor,
            })
            .setOrigin(0.5);
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + FONT_SIZES.title, pl.bootPlaceholder, {
                fontFamily: 'sans-serif',
                fontSize: `${FONT_SIZES.subtitle}px`,
                color: textColor,
            })
            .setOrigin(0.5);

        // Build id in the corner: the only way to see on a tablet that a silent
        // PWA update has landed. Technical identifier, not player-facing text.
        this.add
            .text(margin, GAME_HEIGHT - margin, __BUILD_ID__, {
                fontFamily: 'sans-serif',
                fontSize: `${FONT_SIZES.caption}px`,
                color: textColor,
            })
            .setOrigin(0, 1);
    }
}
