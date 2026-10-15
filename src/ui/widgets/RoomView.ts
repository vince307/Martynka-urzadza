import type { GameObjects, Scene } from 'phaser';
import type { LayerDef, RoomDef, RoomState, SlotDef } from '../../core/types';
import { stagesDone } from '../../core/rooms';
import { slotBox, type Box } from '../../core/roomHit';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT } from '../../data/layout';
import { roomText } from '../../data/pl';
import { textStyle } from './textStyle';

export interface RoomPreview {
    slot: string;
    variant: 0 | 1 | 2;
}

const rectOf = (b: Box): { left: number; top: number; width: number; height: number } =>
    ({ left: b.left, top: b.top, width: b.right - b.left, height: b.bottom - b.top });

/** Scene rectangle of a fixed layer (lamp, plant, pouf): its picture's visible part. */
export const layerBox = (layer: LayerDef): Box => {
    const [l, t, w, h] = layer.visibleRect;
    return { left: layer.x + l, top: layer.y + t, right: layer.x + l + w, bottom: layer.y + t + h };
};

/**
 * The room (S-09, S-16a): the backdrop, then the furnished slots and the fixed decoration, each on its own depth `z` (0-99, below the
 * controls, see `ROOM_LAYOUT.depth`). Today every piece is a stand-in box with its Polish caption in the picture's visible rectangle;
 * it stays as the fallback for a missing texture. It takes no input.
 * DESIGN-GAP (docs/design-gaps.md): the room pictures arrive in the next phases; the stand-in is ours.
 */
export class RoomView {
    private readonly backdrop: GameObjects.Graphics;
    private readonly outline: GameObjects.Graphics;
    private pieces: GameObjects.GameObject[] = [];
    private room: RoomDef | null = null;

    constructor(private readonly scene: Scene) {
        this.backdrop = scene.add.graphics().setDepth(0);
        this.outline = scene.add.graphics().setDepth(ROOM_LAYOUT.depth.outline);
    }

    /**
     * A thick static outline around the slot under a holding finger, or none. No motion, so no reduced-motion branch.
     * DESIGN-GAP (docs/design-gaps.md row 37): the kit has no hold view; the outline is ours.
     */
    highlight(slotId: string | null): void {
        const g = this.outline;
        g.clear();
        const slot = this.room?.slots.find((s) => s.id === slotId);
        if (!slot) {
            return;
        }
        const { left, top, width, height } = rectOf(slotBox(slot));
        g.lineStyle(ROOM_LAYOUT.slot.holdOutline, PLACEHOLDER_COLORS.deepTeal, 1);
        g.strokeRoundedRect(left, top, width, height, ROOM_LAYOUT.slot.radius);
    }

    render(room: RoomDef, state: RoomState, preview: RoomPreview | null): void {
        this.room = room;
        const { scene: area, standIn } = ROOM_LAYOUT;
        const renovated = stagesDone(room, state) > 0;
        const g = this.backdrop;
        g.clear();
        g.fillStyle(renovated ? standIn.wallAfter : standIn.wallBefore, 1);
        g.fillRect(area.left, area.top, area.width, standIn.wallBottom - area.top);
        g.fillStyle(renovated ? standIn.floorAfter : standIn.floorBefore, 1);
        g.fillRect(area.left, standIn.wallBottom, area.width, area.top + area.height - standIn.wallBottom);
        this.pieces.forEach((piece) => piece.destroy());
        this.pieces = [];
        const chosen: Record<string, 0 | 1 | 2> = { ...state.chosen };
        if (preview) {
            chosen[preview.slot] = preview.variant;
        }
        if (renovated) {
            room.decor.forEach((layer) => this.standIn(layer.z, layerBox(layer), standIn.decorFill, roomText.decor(layer.id) ?? layer.id, standIn.decorAlpha));
        }
        room.slots.forEach((slot) => {
            const variant = chosen[slot.id];
            if (variant === undefined) {
                return;
            }
            const caption = [roomText.slot(slot.id) ?? slot.id, roomText.variant(slot.id, variant)].filter(Boolean).join('\n');
            this.standIn(slot.z, slotBox(slot), standIn.variantFills[variant], caption, 1);
        });
    }

    /** Centre of a slot in scene space, for the purchase animation. */
    slotCenter(room: RoomDef, slotId: string): { x: number; y: number } | null {
        const slot = room.slots.find((s) => s.id === slotId);
        if (!slot) {
            return null;
        }
        const b = slotBox(slot);
        return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 };
    }

    private standIn(depth: number, box: Box, fill: number, caption: string, alpha: number): void {
        const g = this.scene.add.graphics().setDepth(depth);
        drawStandIn(g, rectOf(box), fill, alpha);
        const text = this.scene.add.text((box.left + box.right) / 2, (box.top + box.bottom) / 2, caption, textStyle('caption')).setOrigin(0.5).setDepth(depth + 0.5);
        this.pieces.push(g, text);
    }
}

/** A stand-in for a piece of the room: a rounded box with the border of the art stand-in. `scale` thins the border for thumbnails. */
export function drawStandIn(
    g: GameObjects.Graphics, box: { left: number; top: number; width: number; height: number }, fill: number, alpha = 1, scale = 1, radius?: number,
): void {
    const { border, borderWidth, radius: r } = ROOM_LAYOUT.standIn;
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(box.left, box.top, box.width, box.height, radius ?? r);
    g.lineStyle(Math.max(1, borderWidth * scale), border, 1);
    g.strokeRoundedRect(box.left, box.top, box.width, box.height, radius ?? r);
}

/**
 * The room at a small scale: backdrop and the furnished slots by `z` (empty slots are left out), as stand-ins. `left`/`top` is where
 * the scene's corner lands; used by the "Pokój gotowy!" card for its list of rooms.
 */
export function drawRoomMiniature(g: GameObjects.Graphics, room: RoomDef, state: RoomState, left: number, top: number, scale: number): void {
    const { scene: area, standIn } = ROOM_LAYOUT;
    const renovated = stagesDone(room, state) > 0;
    const wall = (standIn.wallBottom - area.top) * scale;
    g.fillStyle(renovated ? standIn.wallAfter : standIn.wallBefore, 1);
    g.fillRect(left, top, area.width * scale, wall);
    g.fillStyle(renovated ? standIn.floorAfter : standIn.floorBefore, 1);
    g.fillRect(left, top + wall, area.width * scale, area.height * scale - wall);
    const place = (b: Box): { left: number; top: number; width: number; height: number } =>
        ({ left: left + (b.left - area.left) * scale, top: top + (b.top - area.top) * scale, width: (b.right - b.left) * scale, height: (b.bottom - b.top) * scale });
    const pieces: { z: number; box: Box; fill: number; alpha: number }[] = [];
    if (renovated) {
        room.decor.forEach((layer) => pieces.push({ z: layer.z, box: layerBox(layer), fill: standIn.decorFill, alpha: standIn.decorAlpha }));
    }
    room.slots.forEach((slot: SlotDef) => {
        const variant = state.chosen[slot.id];
        if (variant !== undefined) {
            pieces.push({ z: slot.z, box: slotBox(slot), fill: standIn.variantFills[variant], alpha: 1 });
        }
    });
    pieces.sort((a, b) => a.z - b.z).forEach((p) => drawStandIn(g, place(p.box), p.fill, p.alpha, scale, standIn.radius * scale));
}
