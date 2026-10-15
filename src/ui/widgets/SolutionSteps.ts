import type { GameObjects, Scene } from 'phaser';
import type { RoundView } from '../../core/round/view';
import { keepTogether } from '../../core/text/nowrap';
import { TASK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';
import { textStyle } from './textStyle';

type SolutionBar = Extract<RoundView['bar'], { kind: 'solution' }>;

/** Solution walk-through: the lines revealed so far and one "Następny krok" / "Już wiem" button. */
export class SolutionSteps {
    private readonly text: GameObjects.Text;
    private readonly button: ActionButton;

    constructor(scene: Scene, onStep: () => void) {
        this.text = scene.add
            .text(0, 0, '', { ...textStyle('solutionLine'), align: 'center' })
            .setOrigin(0.5, 0)
            .setLineSpacing(TASK_LAYOUT.solution.lineGap)
            .setVisible(false);
        this.button = new ActionButton(scene, onStep);
    }

    /**
     * `top` is the first free y under the prompt; lines wrap at `maxWidth` so a long step (the months in order)
     * stays inside the notebook. The button sits in the bar zone, centred on `centerX`.
     * `limit` is the lowest y the lines may reach (a drawing's lines rectangle); by default the bar zone.
     */
    show(bar: SolutionBar, centerX: number, top: number, maxWidth: number, limit?: number): void {
        const { bottom, height } = TASK_LAYOUT.bar;
        const buttonCenterY = bottom - height / 2;
        const scale = Math.max(TASK_LAYOUT.solution.minScale, Math.min(1, this.room(top, limit) / this.measure(bar, maxWidth)));
        this.text.setPosition(centerX, top).setVisible(true).setScale(scale);
        this.button.showCentered(bar.button === 'next' ? pl.round.nextStep : pl.round.gotIt, centerX, buttonCenterY);
    }

    /**
     * Whether the lines fit between `top` and `limit` at no less than the smallest scale; the scene steps a long prompt
     * down until they do (visual gate S-15: a puzzle's last line ran under "Już wiem" or behind the answer tiles).
     */
    fits(bar: SolutionBar, top: number, maxWidth: number, limit?: number): boolean {
        return this.room(top, limit) >= TASK_LAYOUT.solution.minScale * this.measure(bar, maxWidth);
    }

    /** Height of the lines at scale 1, wrapped at `maxWidth` (the text keeps them, ready to be placed). */
    private measure(bar: SolutionBar, maxWidth: number): number {
        this.text.setScale(1).setWordWrapWidth(maxWidth, true).setText(bar.lines.map(keepTogether).join('\n'));   // an equation never breaks (visual gate S-14b)
        return this.text.height;
    }

    private room(top: number, limit?: number): number {
        const { bottom, height } = TASK_LAYOUT.bar;
        return (limit ?? bottom - height - TASK_LAYOUT.solution.bottomGap) - top;
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
