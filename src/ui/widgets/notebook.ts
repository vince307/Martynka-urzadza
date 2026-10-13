import type { Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';

/** The turquoise-framed ivory notebook page that task, summary and welcome screens are drawn on. */
export const drawNotebook = (scene: Scene): void => {
    const { left, top, width, height, border, radius } = TASK_LAYOUT.notebook;
    const graphics = scene.add.graphics();
    graphics.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
    graphics.fillRoundedRect(left, top, width, height, radius);
    graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
    graphics.fillRoundedRect(left + border, top + border, width - 2 * border, height - 2 * border, radius - border / 2);
};
