import type { GameObjects, Scene } from 'phaser';
import type { RoundView } from '../../core/round/view';
import type { AnswerMode } from '../../core/tasks/visual';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';
import { textStyle } from './textStyle';


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
        this.text = scene.add.text(0, 0, '', { ...textStyle('bar'), align: 'center' }).setOrigin(0.5);
        this.button = new ActionButton(scene, onNext);
        this.update({ kind: 'none' }, 'tiles');
    }

    /** `at` moves the bar's span (a tall drawing beside it); by default the bar spans under the tiles or left of the keypad. */
    update(bar: RoundView['bar'], input: AnswerMode, at?: { x: number; width: number }): void {
        const span = at ?? TASK_LAYOUT.barSpan[input === 'keypad' ? 'keypad' : 'tiles'];
        const { height, bottom, radius, padding, hintBorder } = TASK_LAYOUT.bar;
        const top = bottom - height;
        const centerY = top + height / 2;
        this.graphics.clear();
        this.button.hide();
        this.text.setVisible(false);
        if (bar.kind === 'none' || bar.kind === 'solution') {
            return;
        }
        const good = bar.kind === 'correct';
        this.graphics.fillStyle(good ? PLACEHOLDER_COLORS.correct : PLACEHOLDER_COLORS.hint, 1);
        this.graphics.fillRoundedRect(span.x, top, span.width, height, radius);
        if (!good) {
            this.graphics.lineStyle(hintBorder, PLACEHOLDER_COLORS.hintBorder, 1);
            this.graphics.strokeRoundedRect(span.x, top, span.width, height, radius);
        }

        const withButton = bar.kind === 'correct';
        const right = span.x + span.width - padding;
        if (withButton) {
            this.button.show(pl.round.next, right, centerY, PLACEHOLDER_COLORS.next, PLACEHOLDER_COLORS.nextBorder);
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
            default:
                return '';
        }
    }
}
