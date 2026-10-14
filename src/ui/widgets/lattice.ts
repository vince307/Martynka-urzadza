import type { GameObjects } from 'phaser';

/** Straight grid lines of `columns` x `rows` square cells; the outer edges only when `edges` is true. Caller sets the line style. */
export const drawLattice = (g: GameObjects.Graphics, x: number, y: number, columns: number, rows: number, cell: number, edges: boolean): void => {
    const from = edges ? 0 : 1;
    for (let i = from; i < (edges ? columns + 1 : columns); i++) {
        g.lineBetween(x + i * cell, y, x + i * cell, y + rows * cell);
    }
    for (let j = from; j < (edges ? rows + 1 : rows); j++) {
        g.lineBetween(x, y + j * cell, x + columns * cell, y + j * cell);
    }
};
