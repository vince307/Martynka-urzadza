import type { GameObjects, Scene } from 'phaser';
import type { TaskButtonView } from '../../core/rooms';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT } from '../../data/layout';
import { pl, roomText } from '../../data/pl';
import { drawStar } from './StarCounter';
import { textStyle } from './textStyle';

/**
 * Button of the current renovation task: label, star and cost. Affordable = the primary page-button look;
 * short of stars = faded, with "masz X/Y" underneath. It fires on pointerup after a press that began on it (like PageButton).
 * DESIGN-GAP (docs/design-gaps.md): the kit has no task button; this look is ours.
 */
export class RoomTaskButton {
    private readonly graphics: GameObjects.Graphics;
    private readonly label: GameObjects.Text;
    private readonly cost: GameObjects.Text;
    private readonly sub: GameObjects.Text;
    private readonly zone: GameObjects.Zone;
    private pressed = false;
    private shown = false;
    private affordable = false;

    constructor(
        scene: Scene,
        private readonly onTap: (affordable: boolean) => void,
    ) {
        const { left, top, width, height } = ROOM_LAYOUT.taskButton;
        const depth = ROOM_LAYOUT.depth.controls;
        this.graphics = scene.add.graphics().setDepth(depth);
        this.label = scene.add.text(0, 0, '', textStyle('pageButton')).setOrigin(0, 0.5).setDepth(depth + 1);
        this.cost = scene.add.text(0, 0, '', textStyle('pageButton')).setOrigin(0, 0.5).setDepth(depth + 1);
        this.sub = scene.add.text(0, 0, '', textStyle('bar')).setOrigin(0.5).setDepth(depth + 1);
        this.zone = scene.add.zone(left + width / 2, top + height / 2, width, height).setInteractive().setDepth(depth + 2);
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
                this.onTap(this.affordable);
            }
        });
        this.show(null);
    }

    show(view: TaskButtonView | null): void {
        const { left, top, width, height, radius, border, textInset, costWidth, starRadius } = ROOM_LAYOUT.taskButton;
        this.pressed = false;
        this.shown = view !== null;
        this.graphics.clear();
        this.graphics.setVisible(view !== null);
        this.label.setVisible(view !== null);
        this.cost.setVisible(view !== null);
        this.sub.setVisible(false);
        if (this.zone.input) {
            this.zone.input.enabled = view !== null;
        }
        if (!view) {
            return;
        }
        this.affordable = view.affordable;
        const g = this.graphics;
        g.fillStyle(view.affordable ? PLACEHOLDER_COLORS.pageButton : PLACEHOLDER_COLORS.pageButtonSecondary, view.affordable ? 1 : 0.7);
        g.fillRoundedRect(left, top, width, height, radius);
        g.lineStyle(border, view.affordable ? PLACEHOLDER_COLORS.nextBorder : PLACEHOLDER_COLORS.pageButtonSecondaryBorder, 1);
        g.strokeRoundedRect(left, top, width, height, radius);
        const rowY = view.affordable ? top + height / 2 : top + height * 0.38;
        const text = roomText.task(view.label) ?? view.label;
        this.label.setText(text).setScale(1).setPosition(left + textInset, rowY).setAlpha(view.affordable ? 1 : 0.8);
        const room = width - 2 * textInset - costWidth;
        if (this.label.width > room) {
            this.label.setScale(room / this.label.width);
        }
        const starX = left + width - textInset - costWidth + starRadius;
        drawStar(g, starX, rowY, starRadius, PLACEHOLDER_COLORS.butter, { color: PLACEHOLDER_COLORS.nextBorder, width: 3 });
        this.cost.setText(String(view.cost)).setPosition(starX + starRadius + 12, rowY).setAlpha(view.affordable ? 1 : 0.8);
        if (!view.affordable) {
            this.sub.setText(pl.room.short(view.have, view.need)).setPosition(left + width / 2, top + height * 0.76).setVisible(true);
        }
    }

    /** Centre of the button in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        const { left, top, width, height } = ROOM_LAYOUT.taskButton;
        return this.shown ? { x: left + width / 2, y: top + height / 2 } : null;
    }

    /** Text the button shows now, for the e2e hook. */
    text(): string {
        return this.shown ? `${this.label.text} ${this.cost.text}${this.sub.visible ? ` ${this.sub.text}` : ''}` : '';
    }
}
