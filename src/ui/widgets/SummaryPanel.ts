import type { GameObjects, Scene } from 'phaser';
import type { SummaryView } from '../../core/round/summary';
import { PLACEHOLDER_COLORS, SUMMARY_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { PageButton } from './PageButton';
import { drawStar } from './StarCounter';
import { textStyle } from './textStyle';

/**
 * The end-of-round page on the notebook (kit summary.png): "Brawo!", one star per task that paid
 * one, "star +N", the clean-round bonus line when there is one, and the two page buttons.
 * It draws a SummaryView from core and decides nothing.
 */
export class SummaryPanel {
    private readonly title: GameObjects.Text;
    private readonly row: GameObjects.Graphics;
    private readonly earnedStar: GameObjects.Graphics;
    private readonly earned: GameObjects.Text;
    private readonly bonus: GameObjects.Text;
    private readonly nextRound: PageButton;
    private readonly toRoom: PageButton;

    constructor(scene: Scene, onNextRound: () => void, onToRoom: () => void) {
        this.title = scene.add.text(SUMMARY_LAYOUT.title.x, SUMMARY_LAYOUT.title.y, pl.round.correct, textStyle('summaryTitle')).setOrigin(0.5, 0);
        this.row = scene.add.graphics();
        this.earnedStar = scene.add.graphics();
        this.earned = scene.add.text(0, 0, '', textStyle('earned')).setOrigin(0, 0.5);
        this.bonus = scene.add.text(SUMMARY_LAYOUT.bonus.x, SUMMARY_LAYOUT.bonus.y, '', textStyle('bonusLine')).setOrigin(0.5, 0);
        this.nextRound = new PageButton(scene, onNextRound);
        this.toRoom = new PageButton(scene, onToRoom);
        this.hide();
    }

    show(view: SummaryView): void {
        const { stars, earned, buttons } = SUMMARY_LAYOUT;
        this.title.setVisible(true);
        this.row.setVisible(true).clear();
        view.stars.forEach((paid, i) => {
            const x = stars.left + stars.size / 2 + i * (stars.size + stars.gap);
            drawStar(this.row, x, stars.top + stars.size / 2, stars.size / 2, paid ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.starEmpty, {
                color: PLACEHOLDER_COLORS.starOutline,
                width: stars.outline,
            });
        });
        // "star +N" as one group centred on the page.
        this.earned.setText(pl.summary.earned(view.earned)).setVisible(true);
        const groupWidth = earned.starSize + earned.gap + this.earned.width;
        const left = earned.centerX - groupWidth / 2;
        const centerY = earned.top + this.earned.height / 2;
        this.earnedStar.setVisible(true).clear();
        drawStar(this.earnedStar, left + earned.starSize / 2, centerY, earned.starSize / 2, PLACEHOLDER_COLORS.butter, {
            color: PLACEHOLDER_COLORS.starOutline,
            width: stars.outline,
        });
        this.earned.setPosition(left + earned.starSize + earned.gap, centerY);
        this.bonus.setText(view.bonus > 0 ? pl.round.bonus(view.bonus) : '').setVisible(view.bonus > 0);
        this.nextRound.show(pl.summary.nextRound, buttons.left, buttons.top, 'primary');
        this.toRoom.show(pl.summary.toRoom, buttons.left + buttons.width + buttons.gap, buttons.top, 'secondary', view.roomHighlighted);
    }

    hide(): void {
        this.title.setVisible(false);
        this.row.setVisible(false);
        this.earnedStar.setVisible(false);
        this.earned.setVisible(false);
        this.bonus.setVisible(false);
        this.nextRound.hide();
        this.toRoom.hide();
    }

    targets(): { nextRound: { x: number; y: number } | null; toRoom: { x: number; y: number } | null } {
        return { nextRound: this.nextRound.target(), toRoom: this.toRoom.target() };
    }
}
