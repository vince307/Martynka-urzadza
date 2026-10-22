import type { GameObjects, Scene, Tweens } from 'phaser';
import { ANIMATION, type LIPS } from '../../data/layout';
import { prefersReducedMotion } from '../motion';
import { drawLip } from './kitDraw';
import type { Rect } from './geometry';

export type LipToken = (typeof LIPS)[keyof typeof LIPS];

/**
 * The kit's chunky control: a static darker lip under a face that sinks onto it while pressed.
 *
 * Two containers: an outer one at the rect centre (scale, rotation and the press `y` pivot there) holding an inner one at
 * minus the centre, so a widget's Graphics and Text keep drawing at their absolute scene coordinates. The Zone of the
 * widget stays outside and never moves, so hit areas and the e2e hook rects are unchanged. Under `prefersReducedMotion()`
 * the press moves the face at once instead of tweening it.
 */
export class ChunkyFace {
    readonly face: GameObjects.Container;
    private readonly inner: GameObjects.Container;
    private readonly lipGraphics: GameObjects.Graphics;
    private baseY: number;
    private pressTween: Tweens.Tween | null = null;

    constructor(
        private readonly scene: Scene,
        rect: Rect,
        private readonly lip: LipToken,
        private readonly radius: number,
    ) {
        this.lipGraphics = scene.add.graphics();
        this.inner = scene.add.container(0, 0);
        this.face = scene.add.container(0, 0, [this.inner]);
        this.baseY = 0;
        this.place(rect);
    }

    /** Puts objects (Graphics, Text) on the face; they keep their absolute scene coordinates. */
    add(...objects: GameObjects.GameObject[]): void {
        this.inner.add(objects);
    }

    /** Moves the face and the lip to a new rect (a button whose rect changes per call). */
    place(rect: Rect): void {
        this.reset();
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        this.baseY = cy;
        this.face.setPosition(cx, cy);
        this.inner.setPosition(-cx, -cy);
        this.lipGraphics.clear();
        drawLip(this.lipGraphics, rect, this.radius, this.lip);
    }

    press(): void {
        this.moveTo(this.baseY + this.lip.offset, ANIMATION.pressDownMs, ANIMATION.pressEase);
    }

    release(): void {
        this.moveTo(this.baseY, ANIMATION.pressUpMs, ANIMATION.releaseEase);
    }

    /** Stops every tween and returns the face to rest. */
    reset(): void {
        this.pressTween = null;
        this.scene.tweens.killTweensOf(this.face);
        this.face.setPosition(this.face.x, this.baseY).setScale(1).setAngle(0);
    }

    setDepth(depth: number): void {
        this.lipGraphics.setDepth(depth);
        this.face.setDepth(depth);
    }

    setVisible(visible: boolean): void {
        this.lipGraphics.setVisible(visible);
        this.face.setVisible(visible);
    }

    destroy(): void {
        this.scene.tweens.killTweensOf(this.face);
        this.lipGraphics.destroy();
        this.face.destroy();
    }

    private moveTo(y: number, duration: number, ease: string): void {
        // Only the press tween is stopped: a bounce or a wobble running on the same face (scale, angle, x) goes on.
        this.pressTween?.stop();
        this.pressTween = null;
        if (prefersReducedMotion()) {
            this.face.setY(y);
            return;
        }
        this.pressTween = this.scene.tweens.add({ targets: this.face, y, duration, ease });
    }
}
