import type { GameObjects, Scene } from 'phaser';
import type { RoundView } from '../../core/round/view';
import { FONT_FAMILY, FONT_SIZES, TASK_LAYOUT, TEXT_COLOR } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';

type SolutionBar = Extract<RoundView['bar'], { kind: 'solution' }>;

/** Solution walk-through: the lines revealed so far and one "Następny krok" / "Już wiem" button. */
export class SolutionSteps {
    private readonly text: GameObjects.Text;
    private readonly button: ActionButton;

    constructor(scene: Scene, onStep: () => void) {
        this.text = scene.add
            .text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZES.solutionLine}px`, color: TEXT_COLOR, align: 'center' })
            .setOrigin(0.5, 0)
            .setLineSpacing(TASK_LAYOUT.solution.lineGap)
            .setVisible(false);
        this.button = new ActionButton(scene, onStep);
    }

    /** `top` is the first free y under the prompt; the button sits in the bar zone, centred on `centerX`. */
    show(bar: SolutionBar, centerX: number, top: number): void {
        const { bottom, height } = TASK_LAYOUT.bar;
        const buttonCenterY = bottom - height / 2;
        const room = bottom - height - TASK_LAYOUT.solution.bottomGap - top;
        this.text.setText(bar.lines.join('\n')).setScale(1).setPosition(centerX, top).setVisible(true);
        const scale = Math.max(TASK_LAYOUT.solution.minScale, Math.min(1, room / this.text.height));
        this.text.setScale(scale);
        this.button.showCentered(bar.button === 'next' ? pl.round.nextStep : pl.round.gotIt, centerX, buttonCenterY);
    }

    hide(): void {
        this.text.setVisible(false);
        this.button.hide();
    }

    /** Centre of the step button for the e2e hook, null while hidden. */
    stepTarget(): { x: number; y: number } | null {
        return this.button.target();
    }
}
