import type { GameObjects, Scene } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LOADING_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';
import { pl } from '../../data/pl';
import { textStyle } from './textStyle';

/**
 * The screen shown while BootScene loads the font and the pictures: the page colour, the title and a progress bar.
 * It draws a value 0-1 it is given and decides nothing; `destroy` removes it when loading is over.
 * DESIGN-GAP (docs/design-gaps.md, designer brief P2.2): the brand's loading art does not exist yet, so this is drawn in code;
 * the title uses the fallback font until the task font has loaded.
 */
export class LoadingScreen {
    private readonly back: GameObjects.Rectangle;
    private readonly title: GameObjects.Text;
    private readonly bar: GameObjects.Graphics;
    private note: GameObjects.Text | null = null;
    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        const { title } = LOADING_LAYOUT;
        this.back = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PLACEHOLDER_COLORS.ivory, 1);
        this.title = scene.add.text(title.x, title.y, pl.loading.title, textStyle('expression')).setOrigin(0.5);
        this.bar = scene.add.graphics();
        this.progress(0);
    }

    /** Redraws the bar for `value` (0-1, clamped). */
    progress(value: number): void {
        const { bar } = LOADING_LAYOUT;
        const done = Math.min(1, Math.max(0, value));
        this.bar.clear();
        this.bar.fillStyle(PLACEHOLDER_COLORS.tile, 1);
        this.bar.fillRoundedRect(bar.left, bar.top, bar.width, bar.height, bar.radius);
        if (done > 0) {
            this.bar.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
            this.bar.fillRoundedRect(bar.left, bar.top, Math.max(bar.height, bar.width * done), bar.height, bar.radius);
        }
        this.bar.lineStyle(bar.border, PLACEHOLDER_COLORS.deepTeal, 1);
        this.bar.strokeRoundedRect(bar.left, bar.top, bar.width, bar.height, bar.radius);
    }

    /**
     * Draws the calm "still loading" line under the bar once (a second call changes nothing).
     * DESIGN-GAP 112 (docs/design-gaps.md): the kit has no line for a slow start; the text is ours: centred under the bar like the title,
     * at the bar-text size and wrapped within the bar width so it never runs off the canvas.
     */
    slow(): void {
        if (this.note) {
            return;
        }
        const { slow } = LOADING_LAYOUT;
        this.note = this.scene.add
            .text(slow.x, slow.y, pl.loading.slow, { ...textStyle('bar'), align: 'center', wordWrap: { width: slow.maxWidth } })
            .setOrigin(0.5, 0);
    }

    destroy(): void {
        this.note?.destroy();
        this.note = null;
        this.back.destroy();
        this.title.destroy();
        this.bar.destroy();
    }
}
