import type { GameObjects, Scene } from 'phaser';
import { LIPS, PLACEHOLDER_COLORS, SUMMARY_LAYOUT } from '../../data/layout';
import { ChunkyFace } from './chunky';
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
    private readonly chunky: ChunkyFace;
    private pressed = false;
    private shown = false;
    private rect = { x: 0, y: 0 };
    private size: { width: number; height: number } = SUMMARY_LAYOUT.buttons;

    constructor(
        scene: Scene,
        private readonly onTap: () => void,
    ) {
        const { width, height } = SUMMARY_LAYOUT.buttons;
        this.graphics = scene.add.graphics();
        this.label = scene.add.text(0, 0, '', textStyle('pageButton')).setOrigin(0.5);
        this.zone = scene.add.zone(0, 0, width, height).setInteractive();
        this.chunky = new ChunkyFace(scene, { x: 0, y: 0, width, height }, LIPS.page, SUMMARY_LAYOUT.buttons.radius);
        this.chunky.add(this.graphics, this.label);
        this.zone.on('pointerdown', () => {
            this.pressed = true;
            if (this.shown) {
                this.chunky.press();
            }
        });
        this.zone.on('pointerout', () => {
            this.pressed = false;
            if (this.shown) {
                this.chunky.release();
            }
        });
        this.zone.on('pointerup', () => {
            const tapped = this.pressed && this.shown;
            this.pressed = false;
            if (this.shown) {
                this.chunky.release();
            }
            if (tapped) {
                this.onTap();
            }
        });
        this.hide();
    }

    show(
        text: string,
        left: number,
        top: number,
        kind: PageButtonKind,
        highlighted = false,
        size: { width: number; height: number; radius: number; border: number } = SUMMARY_LAYOUT.buttons,
    ): void {
        const { width, height, radius, border } = size;
        const { highlightBorder } = SUMMARY_LAYOUT.buttons;
        this.size = { width, height };
        this.rect = { x: left, y: top };
        this.shown = true;
        this.pressed = false;
        const primary = kind === 'primary';
        this.chunky.place({ x: left, y: top, width, height });
        this.chunky.setVisible(true);
        this.graphics.clear();
        this.graphics.fillStyle(primary ? PLACEHOLDER_COLORS.pageButton : PLACEHOLDER_COLORS.pageButtonSecondary, 1);
        this.graphics.fillRoundedRect(left, top, width, height, radius);
        const borderColor = highlighted
            ? PLACEHOLDER_COLORS.pageButtonHighlight
            : primary ? PLACEHOLDER_COLORS.nextBorder : PLACEHOLDER_COLORS.pageButtonSecondaryBorder;
        this.graphics.lineStyle(highlighted ? highlightBorder : border, borderColor, 1);
        this.graphics.strokeRoundedRect(left, top, width, height, radius);
        this.label.setText(text).setPosition(left + width / 2, top + height / 2);
        this.zone.setPosition(left + width / 2, top + height / 2);
        this.zone.setSize(width, height);
        if (this.zone.input) {
            this.zone.input.enabled = true;
        }
    }

    /** Draw order, for a button that sits over other layers of its scene (the "Pokój gotowy!" card). */
    setDepth(depth: number): this {
        this.chunky.setDepth(depth);
        this.zone.setDepth(depth + 2);
        return this;
    }

    hide(): void {
        this.shown = false;
        this.pressed = false;
        this.chunky.reset();
        this.chunky.setVisible(false);
        if (this.zone.input) {
            this.zone.input.enabled = false;
        }
    }

    /** Centre of the button in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        const { width, height } = this.size;
        return this.shown ? { x: this.rect.x + width / 2, y: this.rect.y + height / 2 } : null;
    }

    /** The label as drawn, for the e2e hook; null while hidden. */
    text(): string | null {
        return this.shown ? this.label.text : null;
    }
}
