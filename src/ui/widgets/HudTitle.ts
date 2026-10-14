import type { GameObjects, Scene } from 'phaser';
import type { HudTitleView } from '../../core/variants';
import { HUD_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';
import { drawStar } from './StarCounter';
import { textStyle } from './textStyle';

/**
 * Title of a round variant in the HUD: its name and, for the daily puzzle, a star drawn in code and the badge
 * ("Zagadka dnia ★ ×2"), centred where the progress dots of an ordinary round are (the task scene hides them in a variant).
 * Hidden for an ordinary round. Display only: no input.
 * DESIGN-GAP (docs/design-gaps.md rows 79 and 80): the kit has no daily-puzzle screen and no mark for doubled stars.
 */
export class HudTitle {
    private readonly name: GameObjects.Text;
    private readonly badge: GameObjects.Text;
    private readonly star: GameObjects.Graphics;
    private shown: string | null = null;

    constructor(scene: Scene) {
        const { y, starRadius } = HUD_LAYOUT.title;
        this.name = scene.add.text(0, y, '', textStyle('barButton')).setOrigin(0, 0.5);
        this.badge = scene.add.text(0, y, '', textStyle('barButton')).setOrigin(0, 0.5);
        this.star = scene.add.graphics();
        drawStar(this.star, 0, 0, starRadius, PLACEHOLDER_COLORS.butter);
        this.set(null);
    }

    set(view: HudTitleView | null): void {
        const { centerX, maxWidth, y, starRadius, gap } = HUD_LAYOUT.title;
        this.shown = view ? (view.badge ? `${view.text} ${view.badge}` : view.text) : null;
        this.name.setVisible(view !== null);
        this.badge.setVisible(view?.badge != null);
        this.star.setVisible(view?.badge != null);
        if (!view) {
            return;
        }
        this.name.setText(view.text).setScale(1);
        this.badge.setText(view.badge ?? '').setScale(1);
        const starWidth = view.badge ? 2 * starRadius + 2 * gap : 0;
        const natural = this.name.width + starWidth + (view.badge ? this.badge.width : 0);
        const scale = Math.min(1, maxWidth / natural);   // a long name shrinks to the room between "Do pokoju" and the speaker
        const left = centerX - (natural * scale) / 2;
        this.name.setScale(scale).setPosition(left, y);
        let x = left + this.name.width * scale;
        if (view.badge) {
            this.star.setPosition(x + gap * scale + starRadius * scale, y).setScale(scale);
            x += starWidth * scale;
            this.badge.setScale(scale).setPosition(x, y);
        }
    }

    /** The shown text, for the e2e hook; null while hidden. */
    text(): string | null {
        return this.shown;
    }
}
