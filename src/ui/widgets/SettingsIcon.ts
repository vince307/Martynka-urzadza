import type { GameObjects, Input, Scene } from 'phaser';
import { HUD_LAYOUT } from '../../data/layout';
import { drawHudPill } from './hudPill';

export interface SettingsIconHandlers {
    down: (pointer: { id: number; x: number; y: number }) => void;
    up: (pointer: { id: number; wasCanceled: boolean }) => void;
    out: () => void;
}

/**
 * The parent's gear in the HUD corner: full colour like the speaker button, label-free, no feedback while pressed (the hold is meant
 * for adults, a child should not be drawn to it). It only reports pointer events; the hold rule lives in
 * core/longPress and the UI scene drives it.
 * DESIGN-GAP (docs/design-gaps.md rows 25, 28 and 151): the kit has no settings icon and no hold feedback; the gear is ours.
 */
export class SettingsIcon {
    private readonly zone: GameObjects.Zone;

    constructor(scene: Scene, handlers: SettingsIconHandlers) {
        const { left, top, width, height } = HUD_LAYOUT.settings;
        this.draw(scene.add.graphics());
        this.zone = scene.add.zone(left + width / 2, top + height / 2, width, height).setInteractive();
        this.zone.on('pointerdown', (pointer: Input.Pointer) => handlers.down({ id: pointer.id, x: pointer.x, y: pointer.y }));
        this.zone.on('pointerup', (pointer: Input.Pointer) => handlers.up({ id: pointer.id, wasCanceled: pointer.wasCanceled }));
        this.zone.on('pointerout', () => handlers.out());
    }

    /** Centre of the icon in scene space, for the e2e hook. */
    target(): { x: number; y: number } {
        const { left, top, width, height } = HUD_LAYOUT.settings;
        return { x: left + width / 2, y: top + height / 2 };
    }

    private draw(g: GameObjects.Graphics): void {
        const { left, top, width, height, radius, iconColor, alpha, gearRadius, gearTooth, gearTeeth, gearHole, gearStroke } = HUD_LAYOUT.settings;
        drawHudPill(g, { x: left, y: top, width, height }, { lip: true, radius });
        // Gear outline: alternating tooth tips and roots around the centre.
        const cx = left + width / 2;
        const cy = top + height / 2;
        const steps = gearTeeth * 4;
        g.lineStyle(gearStroke, iconColor, alpha);
        g.beginPath();
        for (let i = 0; i < steps; i++) {
            const outer = i % 4 === 1 || i % 4 === 2;
            const r = outer ? gearRadius + gearTooth : gearRadius;
            const angle = (i / steps) * Math.PI * 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) {
                g.moveTo(x, y);
            } else {
                g.lineTo(x, y);
            }
        }
        g.closePath();
        g.strokePath();
        g.strokeCircle(cx, cy, gearHole);
    }
}
