import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { RoundView } from '../../core/round/view';

/**
 * One dot per task of the round (5, or 6 in the warm-up): finished green, current turquoise with a ring, future empty.
 * DESIGN-GAP (docs/design-gaps.md row 18): the kit draws 5 dots; the sixth is the same dot, the row stays centred.
 */
export class ProgressDots {
    private readonly graphics: GameObjects.Graphics;

    constructor(scene: Scene) {
        this.graphics = scene.add.graphics();
    }

    update(dots: RoundView['dots']): void {
        const { centerX, y, radius, gap, ringWidth } = TASK_LAYOUT.dots;
        const left = centerX - ((dots.length - 1) * gap) / 2;
        this.graphics.clear();
        dots.forEach((dot, i) => {
            const x = left + i * gap;
            if (dot.status === 'done') {
                this.graphics.fillStyle(PLACEHOLDER_COLORS.dotDone, 1);
                this.graphics.fillCircle(x, y, radius);
            } else if (dot.status === 'current') {
                this.graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
                this.graphics.fillCircle(x, y, radius + ringWidth * 2);
                this.graphics.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
                this.graphics.fillCircle(x, y, radius);
            } else {
                this.graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
                this.graphics.fillCircle(x, y, radius);
                this.graphics.lineStyle(ringWidth, PLACEHOLDER_COLORS.dotDone, 1);
                this.graphics.strokeCircle(x, y, radius);
            }
        });
    }
}
