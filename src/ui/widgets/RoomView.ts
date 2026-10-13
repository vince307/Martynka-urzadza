import type { GameObjects, Scene } from 'phaser';
import type { RoomDef, RoomState } from '../../core/types';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { SALON_PLACEHOLDERS, type Look } from '../../data/rooms';
import { textStyle } from './textStyle';

export interface RoomPreview {
    slot: string;
    variant: 0 | 1 | 2;
}

export interface Box { left: number; top: number; width: number; height: number }

/**
 * The room drawn in code: walls above `wallBottom`, floor below, then the slots by depth. An empty slot is a dashed
 * outline with its name; a furnished one (or one shown in the preview) is a rounded shape with colour, pattern and name.
 * It takes no input.
 * DESIGN-GAP (docs/design-gaps.md): the kit's room.png is a finished room and has no slots; this is a placeholder until S-16.
 */
export class RoomView {
    private readonly graphics: GameObjects.Graphics;
    private captions: GameObjects.Text[] = [];

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics();
    }

    render(room: RoomDef, state: RoomState, preview: RoomPreview | null): void {
        const { area, wallBottom } = ROOM_LAYOUT;
        const g = this.graphics;
        g.clear();
        this.captions.forEach((text) => text.destroy());
        this.captions = [];
        g.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        g.fillRect(area.left, area.top, area.width, wallBottom - area.top);
        g.fillStyle(PLACEHOLDER_COLORS.tile, 1);
        g.fillRect(area.left, wallBottom, area.width, area.top + area.height - wallBottom);
        const chosen: Record<string, 0 | 1 | 2> = { ...state.chosen };
        if (preview) {
            chosen[preview.slot] = preview.variant;
        }
        [...room.slots].sort((a, b) => a.depth - b.depth).forEach((slot) => {
            const size = SALON_PLACEHOLDERS[slot.id];
            if (!size) {
                return;
            }
            const box: Box = { left: slot.x - size.width / 2, top: slot.y - size.height / 2, width: size.width, height: size.height };
            const variant = chosen[slot.id];
            const caption = (pl.room.slots as Record<string, string>)[slot.id] ?? slot.id;
            if (variant === undefined) {
                this.drawDashed(box);
            } else {
                drawLook(this.graphics, box, size.variants[variant]);
            }
            this.captions.push(this.scene.add.text(slot.x, slot.y, caption, textStyle('caption')).setOrigin(0.5));
        });
    }

    /** Centre of a slot in scene space, for the purchase animation. */
    slotCenter(room: RoomDef, slotId: string): { x: number; y: number } | null {
        const slot = room.slots.find((s) => s.id === slotId);
        return slot ? { x: slot.x, y: slot.y } : null;
    }

    private drawDashed(box: Box): void {
        const { dash, gap, outline } = ROOM_LAYOUT.slot;
        const g = this.graphics;
        g.lineStyle(outline, PLACEHOLDER_COLORS.pageButtonSecondaryBorder, 1);
        const run = (x0: number, y0: number, dx: number, dy: number, length: number): void => {
            for (let at = 0; at < length; at += dash + gap) {
                const end = Math.min(at + dash, length);
                g.lineBetween(x0 + dx * at, y0 + dy * at, x0 + dx * end, y0 + dy * end);
            }
        };
        run(box.left, box.top, 1, 0, box.width);
        run(box.left, box.top + box.height, 1, 0, box.width);
        run(box.left, box.top, 0, 1, box.height);
        run(box.left + box.width, box.top, 0, 1, box.height);
    }
}

/** A placeholder piece of furniture: colour with a pattern. `scale` shrinks the pattern for thumbnails. */
export function drawLook(g: GameObjects.Graphics, box: Box, look: Look, scale = 1, radiusOverride?: number): void {
    const { radius, patternInset, stripeWidth, stripeStep, dotRadius, dotStep, patternAlpha } = ROOM_LAYOUT.slot;
    g.fillStyle(PLACEHOLDER_COLORS[look.fill], 1);
    g.fillRoundedRect(box.left, box.top, box.width, box.height, radiusOverride ?? radius);
    g.fillStyle(PLACEHOLDER_COLORS.deepTeal, patternAlpha);
    const inset = patternInset * scale;
    const inner = { left: box.left + inset, top: box.top + inset, width: box.width - 2 * inset, height: box.height - 2 * inset };
    if (look.pattern === 'stripes') {
        for (let x = 0; x + stripeWidth * scale <= inner.width; x += stripeStep * scale) {
            g.fillRect(inner.left + x, inner.top, stripeWidth * scale, inner.height);
        }
    } else if (look.pattern === 'dots') {
        const r = dotRadius * scale;
        for (let x = r; x + r <= inner.width; x += dotStep * scale) {
            for (let y = r; y + r <= inner.height; y += dotStep * scale) {
                g.fillCircle(inner.left + x, inner.top + y, r);
            }
        }
    }
}
