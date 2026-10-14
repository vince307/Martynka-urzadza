import type { GameObjects, Scene } from 'phaser';
import { MINIGAME_LAYOUT, PLACEHOLDER_COLORS, SUMMARY_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { PageButton } from './PageButton';
import { drawStar } from './StarCounter';
import { textStyle } from './textStyle';

/**
 * The card at the end of a minigame (kit .success-card): "Brawo!", one line (the uncovered word), the stars earned,
 * "Kolejna runda" and "Do pokoju". Shared by both minigames; it draws what it is given and decides nothing.
 * DESIGN-GAP 82 (docs/design-gaps.md): the kit card has no star line; ours reuses the summary's "star +N".
 */
export class MinigameDoneCard {
    private readonly card: GameObjects.Graphics;
    private readonly star: GameObjects.Graphics;
    private readonly title: GameObjects.Text;
    private readonly line: GameObjects.Text;
    private readonly earned: GameObjects.Text;
    private readonly nextRound: PageButton;
    private readonly toRoom: PageButton;

    constructor(scene: Scene, onNextRound: () => void, onToRoom: () => void) {
        const { title, line } = MINIGAME_LAYOUT;
        this.card = scene.add.graphics();
        this.star = scene.add.graphics();
        this.title = scene.add.text(title.x, title.y, '', textStyle('summaryTitle')).setOrigin(0.5, 0);
        this.line = scene.add.text(line.x, line.y, '', { ...textStyle('doneWord'), align: 'center' }).setOrigin(0.5, 0);
        this.earned = scene.add.text(0, 0, '', textStyle('earned')).setOrigin(0, 0.5);
        this.nextRound = new PageButton(scene, onNextRound);
        this.toRoom = new PageButton(scene, onToRoom);
        this.hide();
    }

    show(view: { title: string; line: string; earned: number; roomHighlighted: boolean }): void {
        const { card, earned, buttons } = MINIGAME_LAYOUT;
        this.card.setVisible(true).clear();
        this.card.fillStyle(PLACEHOLDER_COLORS.unlockCard, 1);
        this.card.fillRoundedRect(card.left, card.top, card.width, card.height, card.radius);
        this.card.lineStyle(card.border, PLACEHOLDER_COLORS.unlockBorder, 1);
        this.card.strokeRoundedRect(card.left, card.top, card.width, card.height, card.radius);
        this.title.setText(view.title).setVisible(true);
        // A long line ("Wszystkie pola zakryte!") steps down to stay inside the card.
        this.line.setScale(1).setText(view.line).setVisible(true);
        this.line.setScale(Math.min(1, (card.width - 2 * card.border - 80) / this.line.width));
        this.earned.setText(pl.summary.earned(view.earned)).setVisible(true).setScale(earned.scale);
        const groupWidth = earned.starSize + earned.gap + this.earned.width * earned.scale;
        const left = earned.centerX - groupWidth / 2;
        const centerY = earned.centerY;
        this.star.setVisible(true).clear();
        drawStar(this.star, left + earned.starSize / 2, centerY, earned.starSize / 2, PLACEHOLDER_COLORS.butter, {
            color: PLACEHOLDER_COLORS.starOutline,
            width: SUMMARY_LAYOUT.stars.outline,
        });
        this.earned.setPosition(left + earned.starSize + earned.gap, centerY);
        this.nextRound.show(pl.summary.nextRound, buttons.left, buttons.top, 'primary', false, buttons);
        this.toRoom.show(pl.summary.toRoom, buttons.left + buttons.width + buttons.gap, buttons.top, 'secondary', view.roomHighlighted, buttons);
    }

    hide(): void {
        this.card.setVisible(false);
        this.star.setVisible(false);
        this.title.setVisible(false);
        this.line.setVisible(false);
        this.earned.setVisible(false);
        this.nextRound.hide();
        this.toRoom.hide();
    }

    targets(): { nextRound: { x: number; y: number } | null; toRoom: { x: number; y: number } | null } {
        return { nextRound: this.nextRound.target(), toRoom: this.toRoom.target() };
    }
}
