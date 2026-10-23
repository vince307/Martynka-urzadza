import type { GameObjects } from 'phaser';
import type { Rect } from './geometry';

/**
 * Kit drawing primitives shared by the notebook and the chunky controls.
 *
 * `fillPaper` fills a flat face with the midpoint of the two kit colours: the kit tints differ by a few RGB units, and
 * Phaser 4's WebGL path fill cannot give a clean top-to-bottom gradient (the tint corners go to triangle vertices in
 * turn, Canvas ignores the command), while two bands left a visible seam. A flat face behaves the same under both renderers.
 */
export const fillPaper = (g: GameObjects.Graphics, rect: Rect, radius: number, top: number, bottom: number): void => {
    const mid = (((((top >> 16) & 255) + ((bottom >> 16) & 255)) >> 1) << 16) | (((((top >> 8) & 255) + ((bottom >> 8) & 255)) >> 1) << 8) | (((top & 255) + (bottom & 255)) >> 1);
    g.fillStyle(mid, 1);
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
};

export interface Lip { offset: number; color: string | number; alpha: number }

const toNumber = (color: string | number): number => (typeof color === 'number' ? color : parseInt(color.replace('#', ''), 16));

/** The darker lip under a control: the same rounded rect, `offset` lower. */
export const drawLip = (g: GameObjects.Graphics, rect: Rect, radius: number, lip: Lip): void => {
    g.fillStyle(toNumber(lip.color), lip.alpha);
    g.fillRoundedRect(rect.x, rect.y + lip.offset, rect.width, rect.height, radius);
};

export const hexToNumber = toNumber;
