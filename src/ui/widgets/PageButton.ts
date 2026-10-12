import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, SUMMARY_LAYOUT } from '../../data/layout';
import { textStyle } from './textStyle';

export type PageButtonKind = 'primary' | 'secondary';

/**
 * Wide button of the summary page (kit .page-button, 450 x 128). It fires on pointerup, so a tap
 * on it can start speech (a touch end is a user activation) - but only when the press began on it:
 * the "Dalej" tap that opens the summary releases over this zone and must not trigger it.
 */
export class PageButton {
    private readonly graphics: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private readonly zone: GameObjects.Zone;
    private pressed = false;
    private shown = false;
    private rect = { x: 0, y: 0 };

    constructor(
        scene: Scene,
        private readonly onTap: () => void,
    ) {
        const { width, height } = SUMMARY_LAYOUT.buttons;
        this.graphics = scene.add.graphics();
        this.label = scene.add.text(0, 0, '', textStyle('pageButton')).setOrigin(0.5);
        this.zone = scene.add.zone(0, 0, width, height).setInteractive();
        this.zone.on('pointerdown', () => {
            this.pressed = true;
        });
        this.zone.on('pointerout', () => {
            this.pressed = false;
        });
        this.zone.on('pointerup', () => {
            const tapped = this.pressed && this.shown;
            this.pressed = false;
            if (tapped) {
                this.onTap();
            }
        });
        this.hide();
    }

    show(text: string, left: number, top: number, kind: PageButtonKind, highlighted = false): void {
        const { width, height, radius, border, highlightBorder } = SUMMARY_LAYOUT.buttons;
        this.rect = { x: left, y: top };
        this.shown = true;
        this.pressed = false;
        const primary = kind === 'primary';
        this.graphics.setVisible(true).clear();
        this.graphics.fillStyle(primary ? PLACEHOLDER_COLORS.pageButton : PLACEHOLDER_COLORS.pageButtonSecondary, 1);
        this.graphics.fillRoundedRect(left, top, width, height, radius);
        const borderColor = highlighted
            ? PLACEHOLDER_COLORS.pageButtonHighlight
            : primary ? PLACEHOLDER_COLORS.nextBorder : PLACEHOLDER_COLORS.pageButtonSecondaryBorder;
        this.graphics.lineStyle(highlighted ? highlightBorder : border, borderColor, 1);
        this.graphics.strokeRoundedRect(left, top, width, height, radius);
        this.label.setText(text).setVisible(true).setPosition(left + width / 2, top + height / 2);
        this.zone.setPosition(left + width / 2, top + height / 2);
        if (this.zone.input) {
            this.zone.input.enabled = true;
        }
    }

    hide(): void {
        this.shown = false;
        this.pressed = false;
        this.graphics.setVisible(false);
        this.label.setVisible(false);
        if (this.zone.input) {
            this.zone.input.enabled = false;
        }
    }

    /** Centre of the button in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        const { width, height } = SUMMARY_LAYOUT.buttons;
        return this.shown ? { x: this.rect.x + width / 2, y: this.rect.y + height / 2 } : null;
    }
}
