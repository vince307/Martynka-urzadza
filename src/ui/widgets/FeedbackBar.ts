import type { GameObjects, Scene } from 'phaser';
import type { RoundView } from '../../core/round/view';
import { FONT_FAMILY, FONT_SIZES, PLACEHOLDER_COLORS, TASK_LAYOUT, TEXT_COLOR } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';


/**
 * The strip at the bottom of the notebook: yellow for a hint or the result to
 * retype, pale green for "Brawo!" with "Dalej". Never red, never a cross.
 */
// DESIGN-GAP: the kit has a "Podpowiedź" button before the first mistake; the plan shows the hint automatically
// after it, the solution after the second mistake, and "Spróbuj jeszcze raz" alone when the hint line gives the
// result away (docs/design-gaps.md rows 1-3, 5).
export class FeedbackBar {
    private readonly graphics: GameObjects.Graphics;
    private readonly text: GameObjects.Text;
    private readonly button: ActionButton;

    constructor(scene: Scene, onNext: () => void) {
        this.graphics = scene.add.graphics();
        this.text = scene.add.text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZES.bar}px`, color: TEXT_COLOR, align: 'center' }).setOrigin(0.5);
        this.button = new ActionButton(scene, onNext);
        this.update({ kind: 'none' }, 'tiles');
    }

    update(bar: RoundView['bar'], input: 'tiles' | 'keypad'): void {
        const span = TASK_LAYOUT.barSpan[input === 'tiles' ? 'tiles' : 'keypad'];
        const { height, bottom, radius, padding } = TASK_LAYOUT.bar;
        const top = bottom - height;
        const centerY = top + height / 2;
        this.graphics.clear();
        this.button.hide();
        this.text.setVisible(false);
        if (bar.kind === 'none' || bar.kind === 'solution') {
            return;
        }
        const good = bar.kind === 'correct' || bar.kind === 'roundEnd';
        this.graphics.fillStyle(good ? PLACEHOLDER_COLORS.correct : PLACEHOLDER_COLORS.hint, 1);
        this.graphics.fillRoundedRect(span.x, top, span.width, height, radius);

        const withButton = bar.kind === 'correct' || bar.kind === 'roundEnd';   // "Dalej" also starts the next round
        const right = span.x + span.width - padding;
        if (withButton) {
            this.button.show(pl.round.next, right, centerY, PLACEHOLDER_COLORS.turquoise);
        }
        const buttonLeft = this.button.bounds()?.x ?? right;
        const room = withButton ? buttonLeft - span.x - 2 * padding : span.width - 2 * padding;
        this.text
            .setText(this.textOf(bar))
            .setScale(1)
            .setWordWrapWidth(room)
            .setPosition(span.x + padding + room / 2, centerY)
            .setVisible(true);
        const fit = Math.min(1, (height - 8) / this.text.height);
        this.text.setScale(fit);
    }

    /** Centre of the "Dalej" button for the e2e hook, null while hidden. */
    nextTarget(): { x: number; y: number } | null {
        return this.button.target();
    }

    private textOf(bar: RoundView['bar']): string {
        switch (bar.kind) {
            case 'hint':
                return bar.line === null ? pl.round.tryAgain : `${pl.round.tryAgain}\n${bar.line}`;
            case 'retype':
                return bar.line;
            case 'correct':
                return bar.star ? pl.round.correctStar : pl.round.correct;
            case 'roundEnd':
                return bar.bonus > 0 ? pl.round.bonus(bar.bonus) : pl.round.correct;
            default:
                return '';
        }
    }
}
