import type { Scene, GameObjects } from 'phaser';
import { GUIDE_ART, type GuidePose } from '../../core/guide';
import { guideRect } from '../../core/guideLayout';
import type { Rect } from '../../core/geometry';
import { ANIMATION, GUIDE } from '../../data/layout';
import { UI_ART_KEYS } from '../../data/uiArt';
import { prefersReducedMotion } from '../motion';

export interface GuideSnapshot {
    readonly pose: GuidePose | null;
    readonly visible: boolean;
    readonly rect: Rect;
    readonly interactive: boolean;
    readonly pops: number;
}

/**
 * The fox guide in the corner of the task notebook (PRD FR-037). Decorative only: it never takes input.
 * DESIGN-GAP 165 (place and size), 166 (pop, none under reduced motion), 167 (screens), 168 (a missing pose shows no fox).
 */
export class GuideFox {
    private readonly image: GameObjects.Image;
    private pose: GuidePose | null = null;
    private baseScale = 1;
    private pops = 0;

    constructor(private readonly scene: Scene) {
        this.image = scene.add.image(GUIDE.anchor.x, GUIDE.anchor.y, UI_ART_KEYS.guideIdle).setOrigin(GUIDE.origin.x, GUIDE.origin.y).setVisible(false);
    }

    /** `null` hides the fox. A pose whose texture is missing hides it too (no stand-in box). */
    show(pose: GuidePose | null): void {
        const key = pose === null ? null : UI_ART_KEYS[GUIDE_ART[pose]];
        if (pose === null || key === null || !this.scene.textures.exists(key)) {
            this.scene.tweens.killTweensOf(this.image);
            this.pose = null;
            this.image.setVisible(false);
            return;
        }
        const changed = this.image.visible && this.pose !== pose;
        const was = this.pose;
        if (was === pose && this.image.visible) return;
        this.scene.tweens.killTweensOf(this.image);
        // setDisplaySize stores a scale relative to the current frame, so it is applied after every setTexture (never on a missing texture).
        this.image.setTexture(key).setDisplaySize(GUIDE.displaySize, GUIDE.displaySize);
        this.baseScale = this.image.scaleX;
        this.image.setScale(this.baseScale).setVisible(true);
        this.pose = pose;
        if (!changed || prefersReducedMotion()) return;
        this.pops += 1;
        this.scene.tweens.add({
            targets: this.image,
            scaleX: this.baseScale * ANIMATION.guidePopScale,
            scaleY: this.baseScale * ANIMATION.guidePopScale,
            duration: ANIMATION.guidePoseMs / 2,
            yoyo: true,
            ease: ANIMATION.guideEase,
        });
    }

    snapshot(): GuideSnapshot {
        return Object.freeze({ pose: this.pose, visible: this.image.visible, rect: guideRect(), interactive: this.image.input != null, pops: this.pops });
    }
}
