import type { GameObjects } from 'phaser';
import type { Rect } from '../../core/round/dragLayout';
import { TASK_LAYOUT } from '../../data/layout';

/** A dashed outline of `r` on `g` (the mat of the blocks, the wallet of the coins); dash sizes come from TASK_LAYOUT.drag. */
export const dashedRect = (g: GameObjects.Graphics, r: Rect, color: number): void => {
    const { dash, dashGap, dashWidth } = TASK_LAYOUT.drag;
    g.lineStyle(dashWidth, color, 1);
    const edge = (x1: number, y1: number, x2: number, y2: number): void => {
        const length = Math.hypot(x2 - x1, y2 - y1);
        const ux = (x2 - x1) / length;
        const uy = (y2 - y1) / length;
        for (let at = 0; at < length; at += dash + dashGap) {
            const end = Math.min(at + dash, length);
            g.lineBetween(x1 + ux * at, y1 + uy * at, x1 + ux * end, y1 + uy * end);
        }
    };
    edge(r.x, r.y, r.x + r.width, r.y);
    edge(r.x + r.width, r.y, r.x + r.width, r.y + r.height);
    edge(r.x + r.width, r.y + r.height, r.x, r.y + r.height);
    edge(r.x, r.y + r.height, r.x, r.y);
};
