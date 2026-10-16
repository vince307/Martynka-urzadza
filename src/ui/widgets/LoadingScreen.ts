import type { GameObjects, Scene } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LOADING_LAYOUT, PAGE_BACKGROUND, PLACEHOLDER_COLORS } from '../../data/layout';
import { UI_ART_KEYS } from '../../data/uiArt';
import { pl } from '../../data/pl';
import { textStyle } from './textStyle';

/**
 * The screen shown while BootScene loads the font and the pictures: the page colour, the title and a progress bar.
 * It draws a value 0-1 it is given and decides nothing; `destroy` removes it when loading is over.
 * The pack's background and emblem join through `showArt` as their files arrive (S-16c, gap 105 closed); until then, or when a
 * file never arrives, the drawn screen stays. The title uses the fallback font until the task font has loaded.
 */
export class LoadingScreen {
    private readonly back: GameObjects.Rectangle;
    private readonly title: GameObjects.Text;
    private readonly bar: GameObjects.Graphics;
    private note: GameObjects.Text | null = null;
    private background: GameObjects.Image | null = null;
    private emblem: GameObjects.Image | null = null;
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
        if (this.background) {
            this.note.setStroke(PAGE_BACKGROUND, LOADING_LAYOUT.textStroke.slow);
        }
    }

    /**
     * Draws a loading picture once its texture exists (a second call or a missing texture changes nothing). The background fills the
     * canvas and hides the page-colour rectangle; both sit behind the title and the bar.
     */
    showArt(id: 'loadingBackground' | 'loadingEmblem'): void {
        const key = UI_ART_KEYS[id];
        if (!this.scene.textures.exists(key)) {
            return;
        }
        if (id === 'loadingBackground' && !this.background) {
            const { background } = LOADING_LAYOUT;
            this.background = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setDisplaySize(background.width, background.height).setDepth(-2);
            this.back.setVisible(false);
            // Over the busy background the texts get an ivory outline, as the pack's title has; the drawn screen keeps plain text.
            this.title.setStroke(PAGE_BACKGROUND, LOADING_LAYOUT.textStroke.title);
            this.note?.setStroke(PAGE_BACKGROUND, LOADING_LAYOUT.textStroke.slow);
        } else if (id === 'loadingEmblem' && !this.emblem) {
            const { emblem } = LOADING_LAYOUT;
            this.emblem = this.scene.add.image(emblem.x, emblem.y, key).setDisplaySize(emblem.size, emblem.size).setDepth(-1);
        }
    }

    /** Which pictures are on the screen (read-only; the e2e hook reads it). */
    artShown(): { background: boolean; emblem: boolean } {
        return { background: this.background !== null, emblem: this.emblem !== null };
    }

    destroy(): void {
        this.background?.destroy();
        this.emblem?.destroy();
        this.background = null;
        this.emblem = null;
        this.note?.destroy();
        this.note = null;
        this.back.destroy();
        this.title.destroy();
        this.bar.destroy();
    }
}
