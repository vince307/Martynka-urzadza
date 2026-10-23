import type { GameObjects, Scene, Time, Tweens } from 'phaser';
import { summaryPopDelays } from '../../core/motion';
import type { SummaryView } from '../../core/round/summary';
import { ANIMATION, PLACEHOLDER_COLORS, ROOM_LAYOUT, SUMMARY_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { PageButton } from './PageButton';
import { prefersReducedMotion } from '../motion';
import { drawStar } from './StarCounter';
import { starBurst } from './starBurst';
import { textStyle } from './textStyle';

/**
 * The end-of-round page on the notebook (kit summary.png): "Brawo!", one star per task that paid
 * one, "star +N", the clean-round bonus line when there is one, and the two page buttons.
 * It draws a SummaryView from core and decides nothing.
 * DESIGN-GAP (docs/design-gaps.md row 9): the kit has no bonus line; ours sits under "+N", only with the bonus.
 * DESIGN-GAP (docs/design-gaps.md rows 18 and 19): the kit has 5 dots and 5 stars; the 6-task warm-up draws 6 of each, the stars centred.
 * DESIGN-GAP (docs/design-gaps.md row 11): the kit draws 5 full stars; ours are pale for a task that paid none.
 */
export class SummaryPanel {
    private readonly title: GameObjects.Text;
    private readonly stars: GameObjects.Graphics[] = [];
    private readonly tweens: Tweens.Tween[] = [];
    private readonly timers: Time.TimerEvent[] = [];
    private readonly earnedStar: GameObjects.Graphics;
    private readonly earned: GameObjects.Text;
    private readonly bonus: GameObjects.Text;
    private readonly nextRound: PageButton;
    private readonly toRoom: PageButton;

    constructor(private readonly scene: Scene, onNextRound: () => void, onToRoom: () => void) {
        this.title = scene.add.text(SUMMARY_LAYOUT.title.x, SUMMARY_LAYOUT.title.y, pl.round.correct, textStyle('summaryTitle')).setOrigin(0.5, 0);
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
        this.clearStars();
        const reduced = prefersReducedMotion();
        const delays = summaryPopDelays(view.stars.length, ANIMATION.summaryStarStepMs);
        // The row keeps the kit's left edge for the usual 5 stars and stays centred for any other count (the 6-task warm-up).
        const rowShift = ((stars.kitCount - view.stars.length) * (stars.size + stars.gap)) / 2;
        view.stars.forEach((paid, i) => {
            const x = stars.left + rowShift + stars.size / 2 + i * (stars.size + stars.gap);
            const star = this.scene.add.graphics().setPosition(x, stars.top + stars.size / 2);
            drawStar(star, 0, 0, stars.size / 2, paid ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.starEmpty, {
                color: PLACEHOLDER_COLORS.starOutline,
                width: stars.outline,
            });
            this.stars.push(star);
            this.pop(star, delays[i] ?? 0, reduced);
        });
        // "star +N" as one group centred on the page.
        this.earned.setText(pl.summary.earned(view.earned)).setVisible(true);
        const groupWidth = earned.starSize + earned.gap + this.earned.width;
        const left = earned.centerX - groupWidth / 2;
        const centerY = earned.top + this.earned.height / 2;
        this.earnedStar.setVisible(true).clear();
        drawStar(this.earnedStar, 0, 0, earned.starSize / 2, PLACEHOLDER_COLORS.butter, {
            color: PLACEHOLDER_COLORS.starOutline,
            width: stars.outline,
        });
        this.earned.setPosition(left + earned.starSize + earned.gap, centerY);
        const afterRow = view.stars.length * ANIMATION.summaryStarStepMs;
        this.pop(this.earnedStar, afterRow, reduced, { x: left + earned.starSize / 2, y: centerY });
        if (!reduced) {
            this.earned.setAlpha(0);
            this.timers.push(this.scene.time.delayedCall(afterRow, () => this.earned.setAlpha(1)));
            this.timers.push(
                this.scene.time.delayedCall(afterRow + ANIMATION.summaryStarPopMs, () => {
                    starBurst(this.scene, left + earned.starSize / 2, centerY, { count: ANIMATION.summaryBurstParticles, depth: ROOM_LAYOUT.depth.celebrate });
                }),
            );
        } else {
            this.earned.setAlpha(1);
        }
        this.bonus.setText(view.bonus > 0 ? pl.round.bonus(view.bonus) : '').setVisible(view.bonus > 0);
        this.nextRound.show(pl.summary.nextRound, buttons.left, buttons.top, 'primary');
        this.toRoom.show(pl.summary.toRoom, buttons.left + buttons.width + buttons.gap, buttons.top, 'secondary', view.roomHighlighted);
    }

    /** A star grows from nothing with a Back overshoot after `delayMs`; at once and full-size under reduced motion. Buttons never wait for it. */
    private pop(star: GameObjects.Graphics, delayMs: number, reduced: boolean, pivot?: { x: number; y: number }): void {
        if (pivot) {
            // The earned star is drawn around its own origin: the object sits at the star's centre.
            star.setPosition(pivot.x, pivot.y);
        }
        if (reduced) {
            star.setScale(1);
            return;
        }
        star.setScale(0);
        this.tweens.push(
            this.scene.tweens.add({ targets: star, scale: 1, delay: delayMs, duration: ANIMATION.summaryStarPopMs, ease: ANIMATION.beadEase }),
        );
    }

    private clearStars(): void {
        this.tweens.forEach((t) => t.remove());
        this.tweens.length = 0;
        this.timers.forEach((t) => t.remove(false));
        this.timers.length = 0;
        this.stars.forEach((s) => s.destroy());
        this.stars.length = 0;
    }

    hide(): void {
        this.clearStars();
        this.title.setVisible(false);
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
