import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { textStyle } from './textStyle';


/** Five-pointed star as a polygon, centred on (x, y). */
export const drawStar = (graphics: GameObjects.Graphics, x: number, y: number, radius: number, color: number, outline?: { color: number; width: number }): void => {
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? radius : radius * 0.45;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) {
            graphics.moveTo(px, py);
        } else {
            graphics.lineTo(px, py);
        }
    }
    graphics.closePath();
    graphics.fillPath();
    if (outline) {
        graphics.lineStyle(outline.width, outline.color, 1);
        graphics.strokePath();
    }
};

/** Centre of the counter in scene space: where the flying star lands. */
export const starCounterTarget = (): { x: number; y: number } => {
    const { left, top, width, height } = TASK_LAYOUT.starCounter;
    return { x: left + width / 2, y: top + height / 2 };
};

/** "★ N" pill in the top right corner; shows the session total, set by the UI overlay. */
export class StarCounter {
    private readonly text: GameObjects.Text;

    constructor(scene: Scene, value: number) {
        const { left, top, width, height, radius, border, starRadius, starGap } = TASK_LAYOUT.starCounter;
        const graphics = scene.add.graphics();
        graphics.fillStyle(PLACEHOLDER_COLORS.butter, 1);
        graphics.fillRoundedRect(left, top, width, height, radius);
        graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        graphics.fillRoundedRect(left + border, top + border, width - 2 * border, height - 2 * border, radius - border / 2);
        const centerY = top + height / 2;
        drawStar(graphics, left + starGap + starRadius, centerY, starRadius, PLACEHOLDER_COLORS.butter);
        this.text = scene.add
            .text(left + width - starGap, centerY, '', textStyle('counter'))
            .setOrigin(1, 0.5);
        this.setValue(value);
    }

    setValue(value: number): void {
        this.text.setText(String(value));
    }

    /** Shown text, for the e2e hook. */
    value(): string {
        return this.text.text;
    }
}
