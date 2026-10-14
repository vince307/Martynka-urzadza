import type { GameObjects, Scene } from 'phaser';
import { MINIGAME_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';
import { textStyle } from './textStyle';

/** Pip positions of a die face on a 3 x 3 grid (column, row), one list per number of dots 1..6. */
const PIPS: Record<number, readonly (readonly [number, number])[]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

/** The sign between the dice is as wide as this many pixels of the row. */
const SIGN_WIDTH = 64;

/**
 * The two dice of "Zakrywanka" with the sign between them (kit .dice-expression). It draws the throw it is given
 * (a, the sign, b) and takes no input; the faces are drawn in code (DESIGN-GAP 86).
 */
export class Dice {
    private readonly graphics: GameObjects.Graphics;
    private readonly sign: GameObjects.Text;

    constructor(scene: Scene) {
        this.graphics = scene.add.graphics();
        this.sign = scene.add.text(0, 0, '', textStyle('diceSign')).setOrigin(0.5);
        this.hide();
    }

    show(throwed: { a: number; b: number; op: '+' | '-' }): void {
        const { top, size, gap, centerX } = MINIGAME_LAYOUT.dice;
        const total = 2 * size + 2 * gap + SIGN_WIDTH;
        const left = centerX - total / 2;
        this.graphics.setVisible(true).clear();
        this.face(left, top, throwed.a);
        this.face(left + size + gap + SIGN_WIDTH + gap, top, throwed.b);
        this.sign.setText(throwed.op === '+' ? '+' : '−').setPosition(left + size + gap + SIGN_WIDTH / 2, top + size / 2).setVisible(true);
    }

    hide(): void {
        this.graphics.setVisible(false);
        this.sign.setVisible(false);
    }

    private face(left: number, top: number, dots: number): void {
        const { size, radius, border, pip } = MINIGAME_LAYOUT.dice;
        this.graphics.fillStyle(PLACEHOLDER_COLORS.resultShadow, 1);
        this.graphics.fillRoundedRect(left, top + 7, size, size, radius);
        this.graphics.fillStyle(PLACEHOLDER_COLORS.dieFace, 1);
        this.graphics.fillRoundedRect(left, top, size, size, radius);
        this.graphics.lineStyle(border, PLACEHOLDER_COLORS.dieBorder, 1);
        this.graphics.strokeRoundedRect(left, top, size, size, radius);
        const inner = size * 0.24;
        const step = (size - 2 * inner) / 2;
        this.graphics.fillStyle(PLACEHOLDER_COLORS.diePip, 1);
        for (const [column, row] of PIPS[dots] ?? []) {
            this.graphics.fillCircle(left + inner + column * step, top + inner + row * step, pip);
        }
    }
}
