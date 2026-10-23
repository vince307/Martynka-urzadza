import type { GameObjects, Scene } from 'phaser';
import { ANIMATION, BEADS, TASK_LAYOUT } from '../../data/layout';
import { newlyDone } from '../../core/motion';
import { prefersReducedMotion } from '../motion';
import { hexToNumber } from './kitDraw';
import type { RoundView } from '../../core/round/view';

interface Bead {
    container: GameObjects.Container;
    graphics: GameObjects.Graphics;
}

/**
 * One bead per task of the round (5, or 6 in the warm-up), drawn in the kit's colours: finished green, current turquoise
 * with a thicker dark ring, future pale. A bead that just turned done pops (scale up and back with a Back overshoot);
 * a new round, or reduced motion, pops nothing.
 * DESIGN-GAP (docs/design-gaps.md rows 18, 161): the kit draws 5 beads; the sixth is the same bead, the row stays centred.
 */
export class ProgressDots {
    private beads: Bead[] = [];
    private previous: RoundView['dots'] | null = null;

    constructor(private readonly scene: Scene) {}

    update(dots: RoundView['dots']): void {
        if (dots.length !== this.beads.length) {
            this.clearBeads();
            const { centerX, y } = TASK_LAYOUT.dots;
            const left = centerX - ((dots.length - 1) * BEADS.gap) / 2;
            this.beads = dots.map((_, i) => {
                const graphics = this.scene.add.graphics();
                const container = this.scene.add.container(left + i * BEADS.gap, y, [graphics]);
                return { container, graphics };
            });
        }
        dots.forEach((dot, i) => this.draw(this.beads[i].graphics, dot.status));
        if (!prefersReducedMotion()) {
            for (const i of newlyDone(this.previous, dots)) {
                const { container } = this.beads[i];
                this.scene.tweens.killTweensOf(container);
                container.setScale(1);
                this.scene.tweens.add({ targets: container, scale: ANIMATION.beadPopScale, duration: ANIMATION.beadPopMs / 2, yoyo: true, ease: ANIMATION.beadEase });
            }
        }
        this.previous = dots;
    }

    private draw(g: GameObjects.Graphics, status: RoundView['dots'][number]['status']): void {
        const look = status === 'done' ? BEADS.done : status === 'current' ? BEADS.current : BEADS.future;
        const ring = status === 'current' ? BEADS.currentRing : BEADS.ring;
        g.clear();
        g.fillStyle(hexToNumber(look.fill), 1);
        g.fillCircle(0, 0, BEADS.radius);
        g.lineStyle(ring, hexToNumber(look.ring), 1);
        g.strokeCircle(0, 0, BEADS.radius - ring / 2);
    }

    private clearBeads(): void {
        this.beads.forEach((b) => {
            this.scene.tweens.killTweensOf(b.container);
            b.container.destroy();
        });
        this.beads = [];
        this.previous = null;
    }
}
