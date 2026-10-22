import type { GameObjects } from 'phaser';
import type { Rect } from './geometry';

/**
 * Kit drawing primitives shared by the notebook and the chunky controls.
 *
 * `fillPaper` is a two-band "gradient": Phaser 4's WebGL path fill gives the three tint corners to the vertices of each
 * triangle in turn (not by position), so `fillGradientStyle` on a rounded rectangle would not be a clean top-to-bottom
 * gradient, and Canvas ignores the command. The bands behave the same under both renderers.
 */
export const fillPaper = (g: GameObjects.Graphics, rect: Rect, radius: number, top: number, bottom: number): void => {
    g.fillStyle(bottom, 1);
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    g.fillStyle(top, 1);
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height / 2, { tl: radius, tr: radius, bl: 0, br: 0 });
};

export interface Lip { offset: number; color: string | number; alpha: number }

const toNumber = (color: string | number): number => (typeof color === 'number' ? color : parseInt(color.replace('#', ''), 16));

/** The darker lip under a control: the same rounded rect, `offset` lower. */
export const drawLip = (g: GameObjects.Graphics, rect: Rect, radius: number, lip: Lip): void => {
    g.fillStyle(toNumber(lip.color), lip.alpha);
    g.fillRoundedRect(rect.x, rect.y + lip.offset, rect.width, rect.height, radius);
};

export const hexToNumber = toNumber;
