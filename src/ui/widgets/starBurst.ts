import type { GameObjects, Scene } from 'phaser';
import { ANIMATION, PLACEHOLDER_COLORS } from '../../data/layout';
import { drawStar } from './StarCounter';

/** Key of the particle texture, made once per texture manager. */
export const BURST_STAR_TEXTURE = 'purchase-star';

/**
 * A burst of small stars from one point: the purchase in the room and the end of a round.
 * The texture is drawn in code the first time; the emitter removes itself after the particles die (a caller may stop it earlier: destroy is safe twice).
 */
export const starBurst = (scene: Scene, x: number, y: number, opts: { count: number; depth: number; speed?: { min: number; max: number }; scale?: number }): GameObjects.Particles.ParticleEmitter => {
    if (!scene.textures.exists(BURST_STAR_TEXTURE)) {
        const g = scene.make.graphics({}, false);
        drawStar(g, 24, 24, 22, PLACEHOLDER_COLORS.butter, { color: PLACEHOLDER_COLORS.nextBorder, width: 3 });
        g.generateTexture(BURST_STAR_TEXTURE, 48, 48);
        g.destroy();
    }
    const emitter = scene.add.particles(x, y, BURST_STAR_TEXTURE, {
        speed: opts.speed ?? { min: 180, max: 420 },
        angle: { min: 0, max: 360 },
        lifespan: ANIMATION.purchaseParticleMs,
        scale: { start: opts.scale ?? 0.9, end: 0 },
        emitting: false,
    }).setDepth(opts.depth);
    emitter.explode(opts.count);
    scene.time.delayedCall(ANIMATION.purchaseParticleMs + 100, () => emitter.destroy());
    return emitter;
};
