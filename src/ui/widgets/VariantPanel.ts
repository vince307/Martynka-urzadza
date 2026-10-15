import type { GameObjects, Scene } from 'phaser';
import type { SlotDef } from '../../core/types';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT } from '../../data/layout';
import { pl, roomText } from '../../data/pl';
import { drawStandIn } from './RoomView';
import { textStyle } from './textStyle';

type Point = { x: number; y: number };

/**
 * The variant tray of the room: three thumbnails (the slot's shape in scale, with the variant's colour and name),
 * "Wybieram" and "Zamknij". The chosen thumbnail lifts and gets a thick border. "Wybieram" is faded and silent until a
 * thumbnail is chosen. Every button fires on pointerup after a press that began on it.
 * DESIGN-GAP (docs/design-gaps.md): the kit has no variant panel; this look is ours.
 */
export class VariantPanel {
    private readonly graphics: GameObjects.Graphics;
    private readonly thumbGraphics: GameObjects.Graphics;
    private readonly chooseLabel: GameObjects.Text;
    private readonly closeLabel: GameObjects.Text;
    private readonly names: GameObjects.Text[];
    private readonly thumbZones: GameObjects.Zone[];
    private readonly chooseZone: GameObjects.Zone;
    private readonly closeZone: GameObjects.Zone;
    private pressed: 'thumb0' | 'thumb1' | 'thumb2' | 'choose' | 'close' | null = null;
    private shown = false;
    private armed = false;

    constructor(
        scene: Scene,
        private readonly onPick: (variant: 0 | 1 | 2) => void,
        private readonly onChoose: () => void,
        private readonly onClose: () => void,
    ) {
        const { thumbs, choose, close } = ROOM_LAYOUT;
        const depth = ROOM_LAYOUT.depth.panel;
        this.graphics = scene.add.graphics().setDepth(depth);
        this.thumbGraphics = scene.add.graphics().setDepth(depth + 1);
        this.names = [0, 1, 2].map((i) =>
            scene.add.text(thumbs.left + i * (thumbs.size + thumbs.gap) + thumbs.size / 2, thumbs.top + thumbs.size - thumbs.nameInset, '', textStyle('caption')).setOrigin(0.5).setDepth(depth + 2));
        this.chooseLabel = scene.add.text(choose.left + choose.width / 2, choose.top + choose.height / 2, pl.room.choose, textStyle('pageButton')).setOrigin(0.5).setDepth(depth + 2);
        this.closeLabel = scene.add.text(close.left + close.width / 2, close.top + close.height / 2, pl.room.close, textStyle('pageButton')).setOrigin(0.5).setDepth(depth + 2);
        const zone = (left: number, top: number, width: number, height: number, key: NonNullable<VariantPanel['pressed']>, fire: () => void): GameObjects.Zone => {
            const z = scene.add.zone(left + width / 2, top + height / 2, width, height).setInteractive().setDepth(depth + 3);
            z.on('pointerdown', () => {
                this.pressed = key;
            });
            z.on('pointerout', () => {
                this.pressed = null;
            });
            z.on('pointerup', () => {
                const tapped = this.pressed === key && this.shown;
                this.pressed = null;
                if (tapped) {
                    fire();
                }
            });
            return z;
        };
        this.thumbZones = ([0, 1, 2] as const).map((i) =>
            zone(thumbs.left + i * (thumbs.size + thumbs.gap), thumbs.top, thumbs.size, thumbs.size, `thumb${i}` as const, () => this.onPick(i)));
        this.chooseZone = zone(choose.left, choose.top, choose.width, choose.height, 'choose', () => {
            if (this.armed) {
                this.onChoose();
            }
        });
        this.closeZone = zone(close.left, close.top, close.width, close.height, 'close', () => this.onClose());
        this.hide();
    }

    /** `slot` gives every thumbnail the shape of its furniture (at least `thumbs.minAspect` high); the stand-in colour and the name tell the variants apart. */
    show(slot: SlotDef, preview: 0 | 1 | 2 | null): void {
        const { tray, thumbs, choose, close, standIn } = ROOM_LAYOUT;
        this.shown = true;
        this.armed = preview !== null;
        this.pressed = null;
        const g = this.graphics;
        g.setVisible(true).clear();
        g.fillStyle(PLACEHOLDER_COLORS.unlockCard, 1);
        g.fillRoundedRect(tray.left, tray.top, tray.width, tray.height, 40);
        g.lineStyle(6, PLACEHOLDER_COLORS.unlockBorder, 1);
        g.strokeRoundedRect(tray.left, tray.top, tray.width, tray.height, 40);
        const t = this.thumbGraphics;
        t.setVisible(true).clear();
        const [, , visibleWidth, visibleHeight] = slot.visibleRect;
        ([0, 1, 2] as const).forEach((i) => {
            const selected = preview === i;
            const left = thumbs.left + i * (thumbs.size + thumbs.gap);
            const top = thumbs.top - (selected ? thumbs.lift : 0);
            t.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
            t.fillRoundedRect(left, top, thumbs.size, thumbs.size, thumbs.radius);
            const room = thumbs.size - 2 * thumbs.inset;
            const scale = Math.min(room / visibleWidth, (room - thumbs.nameHeight) / visibleHeight);
            const w = visibleWidth * scale;
            const h = Math.max(visibleHeight * scale, w * thumbs.minAspect);
            drawStandIn(t, { left: left + (thumbs.size - w) / 2, top: top + thumbs.inset + (room - thumbs.nameHeight - h) / 2, width: w, height: h }, standIn.variantFills[i], 1, scale, 10);
            t.lineStyle(selected ? thumbs.selectedBorder : thumbs.border, selected ? PLACEHOLDER_COLORS.deepTeal : PLACEHOLDER_COLORS.pageButtonSecondaryBorder, 1);
            t.strokeRoundedRect(left, top, thumbs.size, thumbs.size, thumbs.radius);
            this.names[i].setText(roomText.variant(slot.id, i) ?? '').setY(top + thumbs.size - thumbs.nameInset).setVisible(true);
        });
        g.fillStyle(PLACEHOLDER_COLORS.pageButton, this.armed ? 1 : 0.45);
        g.fillRoundedRect(choose.left, choose.top, choose.width, choose.height, choose.radius);
        g.lineStyle(choose.border, PLACEHOLDER_COLORS.nextBorder, this.armed ? 1 : 0.45);
        g.strokeRoundedRect(choose.left, choose.top, choose.width, choose.height, choose.radius);
        g.fillStyle(PLACEHOLDER_COLORS.pageButtonSecondary, 1);
        g.fillRoundedRect(close.left, close.top, close.width, close.height, close.radius);
        g.lineStyle(close.border, PLACEHOLDER_COLORS.pageButtonSecondaryBorder, 1);
        g.strokeRoundedRect(close.left, close.top, close.width, close.height, close.radius);
        this.chooseLabel.setVisible(true).setAlpha(this.armed ? 1 : 0.55);
        this.closeLabel.setVisible(true);
        [...this.thumbZones, this.chooseZone, this.closeZone].forEach((z) => {
            if (z.input) z.input.enabled = true;
        });
    }

    hide(): void {
        this.shown = false;
        this.armed = false;
        this.pressed = null;
        this.graphics.setVisible(false);
        this.thumbGraphics.setVisible(false);
        this.chooseLabel.setVisible(false);
        this.closeLabel.setVisible(false);
        this.names.forEach((name) => name.setVisible(false));
        [...this.thumbZones, this.chooseZone, this.closeZone].forEach((z) => {
            if (z.input) z.input.enabled = false;
        });
    }

    thumbTargets(): Point[] {
        if (!this.shown) return [];
        const { thumbs } = ROOM_LAYOUT;
        return [0, 1, 2].map((i) => ({ x: thumbs.left + i * (thumbs.size + thumbs.gap) + thumbs.size / 2, y: thumbs.top + thumbs.size / 2 }));
    }

    chooseTarget(): Point | null {
        const { choose } = ROOM_LAYOUT;
        return this.shown ? { x: choose.left + choose.width / 2, y: choose.top + choose.height / 2 } : null;
    }

    closeTarget(): Point | null {
        const { close } = ROOM_LAYOUT;
        return this.shown ? { x: close.left + close.width / 2, y: close.top + close.height / 2 } : null;
    }
}
