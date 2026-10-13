import type { GameObjects, Scene } from 'phaser';
import { HUD_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';
import { pl } from '../../data/pl';
import { textStyle } from './textStyle';

/**
 * HUD button "Do pokoju", shown between tasks only (FR-011). Same look as the speaker; the house
 * icon is drawn in code. It fires on pointerup and only when the press began on it, so the tap that
 * made it appear (an answer tile, far away) can never count.
 * DESIGN-GAP (docs/design-gaps.md row 4): the kit draws it always; FR-011 hides it while a task is being solved.
 */
export class RoomSwitchButton {
    private readonly graphics: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private readonly zone: GameObjects.Zone;
    private shown = false;
    private pressed = false;

    constructor(scene: Scene, onTap: () => void) {
        const { left, top, width, height } = HUD_LAYOUT.roomSwitch;
        this.graphics = scene.add.graphics();
        this.label = scene.add.text(0, 0, pl.summary.toRoom, textStyle('barButton')).setOrigin(0, 0.5);
        this.zone = scene.add.zone(left + width / 2, top + height / 2, width, height).setInteractive();
        this.zone.on('pointerdown', () => {
            this.pressed = true;
            this.draw(true);
        });
        this.zone.on('pointerout', () => {
            this.pressed = false;
            this.draw(false);
        });
        this.zone.on('pointerup', () => {
            const tapped = this.pressed && this.shown;
            this.pressed = false;
            this.draw(false);
            if (tapped) {
                onTap();
            }
        });
        this.setVisible(false);
    }

    setVisible(on: boolean): void {
        this.shown = on;
        this.pressed = false;
        this.graphics.setVisible(on);
        this.label.setVisible(on);
        if (this.zone.input) {
            this.zone.input.enabled = on;
        }
        if (on) {
            this.draw(false);
        }
    }

    /** Centre of the button in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        const { left, top, width, height } = HUD_LAYOUT.roomSwitch;
        return this.shown ? { x: left + width / 2, y: top + height / 2 } : null;
    }

    private draw(pressed: boolean): void {
        const { left, top, width, height, radius, border, iconSize, iconGap, iconStroke } = HUD_LAYOUT.roomSwitch;
        const { fill, pressed: pressedFill, borderColor } = HUD_LAYOUT.speaker;
        const g = this.graphics;
        g.clear();
        g.fillStyle(pressed ? pressedFill : fill, 1);
        g.fillRoundedRect(left, top, width, height, radius);
        g.lineStyle(border, borderColor, 1);
        g.strokeRoundedRect(left, top, width, height, radius);
        // Content (icon + label) centred in the button.
        const contentWidth = iconSize + iconGap + this.label.width;
        const iconX = left + (width - contentWidth) / 2;
        const iconY = top + (height - iconSize) / 2;
        this.label.setPosition(iconX + iconSize + iconGap, top + height / 2);
        // House: roof triangle over a body with a door, in a 56 px box.
        const u = iconSize / 56;
        g.lineStyle(iconStroke * u, PLACEHOLDER_COLORS.deepTeal, 1);
        g.beginPath();
        g.moveTo(iconX + 4 * u, iconY + 28 * u);
        g.lineTo(iconX + 28 * u, iconY + 6 * u);
        g.lineTo(iconX + 52 * u, iconY + 28 * u);
        g.strokePath();
        g.beginPath();
        g.moveTo(iconX + 10 * u, iconY + 26 * u);
        g.lineTo(iconX + 10 * u, iconY + 50 * u);
        g.lineTo(iconX + 46 * u, iconY + 50 * u);
        g.lineTo(iconX + 46 * u, iconY + 26 * u);
        g.strokePath();
        g.strokeRect(iconX + 23 * u, iconY + 34 * u, 10 * u, 16 * u);
    }
}
