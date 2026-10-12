import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { textStyle } from './textStyle';


/** A rounded button of the bar (96 px high, at least 220 wide); the tap fires in pointerdown. */
export class ActionButton {
    private readonly graphics: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private readonly zone: GameObjects.Zone;
    private fill: number = PLACEHOLDER_COLORS.button;
    private border: number = PLACEHOLDER_COLORS.buttonBorder;
    private rect = { x: 0, y: 0, width: 0, height: 0 };
    private shown = false;

    constructor(
        scene: Scene,
        private readonly onTap: () => void,
    ) {
        this.graphics = scene.add.graphics();
        this.label = scene.add.text(0, 0, '', textStyle('barButton')).setOrigin(0.5);
        this.zone = scene.add.zone(0, 0, 10, 10).setInteractive();
        this.zone.on('pointerdown', () => {
            if (this.shown) {
                this.onTap();
            }
        });
        this.hide();
    }

    /** Shows the button with its right edge at `right`, centred on `centerY`. */
    show(text: string, right: number, centerY: number, fill: number = PLACEHOLDER_COLORS.button, border: number = PLACEHOLDER_COLORS.buttonBorder): void {
        this.label.setText(text);
        const { bar } = TASK_LAYOUT;
        const width = Math.max(bar.minWidth, this.label.width + 2 * bar.padding);
        this.place(right - width, centerY, width, fill, border);
    }

    /** Shows the button centred on `centerX`. */
    showCentered(text: string, centerX: number, centerY: number, fill: number = PLACEHOLDER_COLORS.button, border: number = PLACEHOLDER_COLORS.buttonBorder): void {
        this.label.setText(text);
        const { bar } = TASK_LAYOUT;
        const width = Math.max(bar.minWidth, this.label.width + 2 * bar.padding);
        this.place(centerX - width / 2, centerY, width, fill, border);
    }

    hide(): void {
        this.shown = false;
        this.graphics.setVisible(false);
        this.label.setVisible(false);
        if (this.zone.input) {
            this.zone.input.enabled = false;
        }
    }

    /** Centre of the button in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        return this.shown ? { x: this.rect.x + this.rect.width / 2, y: this.rect.y + this.rect.height / 2 } : null;
    }

    /** Left edge and width while shown, null while hidden. */
    bounds(): { x: number; width: number } | null {
        return this.shown ? { x: this.rect.x, width: this.rect.width } : null;
    }

    private place(x: number, centerY: number, width: number, fill: number, border: number): void {
        const { bar } = TASK_LAYOUT;
        this.rect = { x, y: centerY - bar.height / 2, width, height: bar.height };
        this.fill = fill;
        this.border = border;
        this.shown = true;
        this.graphics.setVisible(true);
        this.label.setVisible(true).setPosition(x + width / 2, centerY);
        this.zone.setPosition(x + width / 2, centerY).setSize(width, bar.height);
        if (this.zone.input) {
            this.zone.input.enabled = true;
        }
        this.graphics.clear();
        this.graphics.fillStyle(this.fill, 1);
        this.graphics.fillRoundedRect(x, this.rect.y, width, bar.height, bar.radius);
        this.graphics.lineStyle(bar.border, this.border, 1);
        this.graphics.strokeRoundedRect(x, this.rect.y, width, bar.height, bar.radius);
    }
}
