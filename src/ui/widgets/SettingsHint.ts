import type { GameObjects, Scene } from 'phaser';
import { HUD_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { textStyle } from './textStyle';

/**
 * The bubble above the parent's gear that answers a short tap ("Przytrzymaj, żeby otworzyć ustawienia rodzica").
 * Display only: it has no zone, so it never blocks a touch and never holds the input switch.
 * DESIGN-GAP (docs/design-gaps.md row 151): the kit has no hint for a tap on the settings icon.
 */
export class SettingsHint {
    private readonly box: GameObjects.Graphics;
    private readonly label: GameObjects.Text;

    constructor(scene: Scene) {
        const { right, bottom, width, padding, radius, border, fill, borderColor } = HUD_LAYOUT.settingsHint;
        // The box is added first so the label draws over it (display order = creation order).
        this.box = scene.add.graphics();
        this.label = scene.add.text(0, 0, pl.settings.hint, { ...textStyle('settingsHint'), wordWrap: { width: width - 2 * padding } });
        const height = this.label.height + 2 * padding;
        const left = right - width;
        const top = bottom - height;
        this.box.fillStyle(fill, 1);
        this.box.fillRoundedRect(left, top, width, height, radius);
        this.box.lineStyle(border, borderColor, 1);
        this.box.strokeRoundedRect(left, top, width, height, radius);
        this.label.setPosition(left + padding, top + padding);
        this.hide();
    }

    show(): void {
        this.box.setVisible(true);
        this.label.setVisible(true);
    }

    hide(): void {
        this.box.setVisible(false);
        this.label.setVisible(false);
    }

    visible(): boolean {
        return this.box.visible;
    }
}
