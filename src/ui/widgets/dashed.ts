import type { GameObjects } from 'phaser';

/** Strokes a dashed rectangle (already styled with `lineStyle`) on `g`. */
export const dashedRect = (g: GameObjects.Graphics, x: number, y: number, width: number, height: number, dash: number): void => {
    const edge = (x0: number, y0: number, dx: number, dy: number, length: number): void => {
        for (let d = 0; d < length; d += dash * 2) {
            const e = Math.min(d + dash, length);
            g.lineBetween(x0 + dx * d, y0 + dy * d, x0 + dx * e, y0 + dy * e);
        }
    };
    edge(x, y, 1, 0, width);
    edge(x, y + height, 1, 0, width);
    edge(x, y, 0, 1, height);
    edge(x + width, y, 0, 1, height);
};
