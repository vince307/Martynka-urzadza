import type { GameObjects, Scene } from 'phaser';
import { letterRow } from '../../core/minigames/word';
import { MINIGAME_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';
import { pl } from '../../data/pl';
import { textStyle } from './textStyle';

/**
 * The row of letter boxes of "Hasło z wyników" (kit .letters / .letter): a letter not uncovered yet is a dot on ivory, an
 * uncovered one is on green. It draws what it is given (core/minigames/word `revealed`) and takes no input.
 */
export class LetterTiles {
    private readonly graphics: GameObjects.Graphics;
    private labels: GameObjects.Text[] = [];
    private shown: (string | null)[] = [];

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics();
        this.hide();
    }

    show(entries: readonly (string | null)[]): void {
        const { top, width, height, gap, radius, border, centerX } = MINIGAME_LAYOUT.letters;
        this.shown = [...entries];
        this.graphics.setVisible(true).clear();
        this.labels.forEach((l) => l.destroy());
        const lefts = letterRow(entries.length, { width, gap }, centerX);
        this.labels = entries.map((letter, i) => {
            const left = lefts[i];
            this.graphics.fillStyle(letter === null ? PLACEHOLDER_COLORS.letterHidden : PLACEHOLDER_COLORS.letterRevealed, 1);
            this.graphics.fillRoundedRect(left, top, width, height, radius);
            this.graphics.lineStyle(border, letter === null ? PLACEHOLDER_COLORS.letterHiddenBorder : PLACEHOLDER_COLORS.letterRevealedBorder, 1);
            this.graphics.strokeRoundedRect(left, top, width, height, radius);
            return this.scene.add.text(left + width / 2, top + height / 2, letter ?? pl.minigames.hiddenLetter, textStyle('letter')).setOrigin(0.5);
        });
    }

    hide(): void {
        this.graphics.setVisible(false);
        this.labels.forEach((l) => l.destroy());
        this.labels = [];
        this.shown = [];
    }

    /** What is drawn, per box: the letter or null; for the e2e hook. */
    letters(): (string | null)[] {
        return [...this.shown];
    }
}
