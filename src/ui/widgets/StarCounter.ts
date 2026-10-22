import type { GameObjects, Scene } from 'phaser';
import { ANIMATION, LIPS, PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { prefersReducedMotion } from '../motion';
import { ChunkyFace } from './chunky';
import { drawHudPill } from './hudPill';
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

/**
 * "★ N" pill in the top right corner; shows the session total, set by the UI overlay. A kit HUD pill (gradient face, border,
 * lip); its face is a container at the pill centre so a later pop scales it around the star, and it never presses.
 */
export class StarCounter {
    /** The pill face (pill, star, number) as one object: the thing that pops when a star lands. */
    readonly face: GameObjects.Container;
    private readonly text: GameObjects.Text;
    private readonly scene: Scene;

    constructor(scene: Scene, value: number) {
        this.scene = scene;
        const { left, top, width, height, radius, starRadius, starGap } = TASK_LAYOUT.starCounter;
        const graphics = scene.add.graphics();
        drawHudPill(graphics, { x: left, y: top, width, height }, { radius });
        const centerY = top + height / 2;
        drawStar(graphics, left + starGap + starRadius, centerY, starRadius, PLACEHOLDER_COLORS.butter);
        this.text = scene.add
            .text(left + width - starGap, centerY, '', textStyle('counter'))
            .setOrigin(1, 0.5);
        const chunky = new ChunkyFace(scene, { x: left, y: top, width, height }, LIPS.hud, radius);
        chunky.add(graphics, this.text);
        this.face = chunky.face;
        this.setValue(value);
    }

    setValue(value: number): void {
        this.text.setText(String(value));
    }

    /** A short grow-and-return when a star lands; the number is never delayed by it (setValue is synchronous). */
    pop(): void {
        if (prefersReducedMotion()) {
            return;
        }
        this.scene.tweens.killTweensOf(this.face);
        this.face.setScale(1);
        this.scene.tweens.add({ targets: this.face, scale: ANIMATION.counterPopScale, duration: ANIMATION.counterPopMs / 2, yoyo: true, ease: 'Sine.easeOut' });
    }

    /** Shown text, for the e2e hook. */
    value(): string {
        return this.text.text;
    }
}
