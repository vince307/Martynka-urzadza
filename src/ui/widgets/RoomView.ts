import type { GameObjects, Scene } from 'phaser';
import type { LayerDef, RoomDef, RoomState, SlotDef } from '../../core/types';
import { roomDone, stagesDone } from '../../core/rooms';
import { slotBox, type Box } from '../../core/roomHit';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT } from '../../data/layout';
import { roomText } from '../../data/pl';
import { SCENE_SIZE } from '../../data/roomArt';
import { RoomLayer } from './RoomLayer';

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
 * The room (S-09, S-16a): the art pack's pictures in the 1920x1080 scene. Before the renovation stage: the neglected room and its
 * furnishings; after it: the renovated room, the decoration and every bought piece, each on its own depth `z` (0-99, below the controls,
 * see `ROOM_LAYOUT.depth`); the shadows come with the finished room. A picture whose texture is missing is a stand-in box with its
 * Polish caption (a missing scene picture: the coloured backdrop). It takes no input.
 * DESIGN-GAP (docs/design-gaps.md): the stand-in is ours; the kit has none for a room picture.
 */
export class RoomView {
    private readonly backdrop: GameObjects.Graphics;
    private readonly outline: GameObjects.Graphics;
    private readonly layers = new Map<string, RoomLayer>();
    private room: RoomDef | null = null;

    constructor(private readonly scene: Scene) {
        this.backdrop = scene.add.graphics().setDepth(ROOM_LAYOUT.depth.scene);
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
        const { depth, standIn } = ROOM_LAYOUT;
        const renovated = stagesDone(room, state) > 0;
        const wanted = new Set<string>();
        const layer = (id: string): RoomLayer => {
            wanted.add(id);
            let l = this.layers.get(id);
            if (!l) {
                l = new RoomLayer(this.scene);
                this.layers.set(id, l);
            }
            return l;
        };
        const whole = { x: 0, y: 0, width: SCENE_SIZE.width, height: SCENE_SIZE.height, anchor: [0, 0] } as const;
        const backgroundKey = renovated ? room.scene.after : room.scene.before;
        layer('scene').show(backgroundKey, whole, depth.scene, null);
        this.drawBackdrop(renovated, !this.scene.textures.exists(backgroundKey));
        if (!renovated) {
            layer('furnishings').show(room.scene.furnishingsBefore, whole, depth.furnishingsBefore, null);
        }
        if (roomDone(room, state)) {
            layer('shadows').show(room.scene.shadows, whole, depth.shadows, null);
        }
        const chosen: Record<string, 0 | 1 | 2> = { ...state.chosen };
        if (preview) {
            chosen[preview.slot] = preview.variant;
        }
        if (renovated) {
            room.decor.forEach((art) => {
                const caption = roomText.decor(art.id) ?? art.id;
                layer(`decor:${art.id}`).show(art.key, art, art.z, { box: layerBox(art), fill: standIn.decorFill, alpha: standIn.decorAlpha, caption });
            });
        }
        room.slots.forEach((slot) => {
            const variant = chosen[slot.id];
            if (variant === undefined) {
                return;
            }
            const caption = [roomText.slot(slot.id) ?? slot.id, roomText.variant(slot.id, variant)].filter(Boolean).join('\n');
            layer(`slot:${slot.id}`).show(slot.variants[variant], slot, slot.z, { box: slotBox(slot), fill: standIn.variantFills[variant], alpha: 1, caption });
        });
        this.layers.forEach((l, id) => {
            if (!wanted.has(id)) {
                l.hide();
            }
        });
    }

    /** The coloured backdrop, only while the scene picture of the moment is missing. */
    private drawBackdrop(renovated: boolean, missing: boolean): void {
        const g = this.backdrop;
        g.clear();
        if (!missing) {
            return;
        }
        const { scene: area, standIn } = ROOM_LAYOUT;
        g.fillStyle(renovated ? standIn.wallAfter : standIn.wallBefore, 1);
        g.fillRect(area.left, area.top, area.width, standIn.wallBottom - area.top);
        g.fillStyle(renovated ? standIn.floorAfter : standIn.floorBefore, 1);
        g.fillRect(area.left, standIn.wallBottom, area.width, area.top + area.height - standIn.wallBottom);
    }

    /** The picture of a furnished slot (for the pop of the next phase); null for a stand-in or an empty slot. */
    objectOf(slotId: string): GameObjects.Image | null {
        return this.layers.get(`slot:${slotId}`)?.object() ?? null;
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

/** One picture of the miniature: the texture key and its rectangle in scene space, with the stand-in look for a missing texture. */
export interface MiniaturePiece {
    key: string;
    placement: { x: number; y: number; width: number; height: number };
    box: Box;
    fill: number;
    alpha: number;
}

/**
 * The pictures of the room's miniature, back to front: the scene, the neglected furnishings until the stage, the shadows of a
 * finished room, the decoration after the stage, then the furnished slots by `z` (empty slots are left out). The same layers as `RoomView.render`.
 */
export function miniaturePieces(room: RoomDef, state: RoomState): MiniaturePiece[] {
    const { standIn } = ROOM_LAYOUT;
    const renovated = stagesDone(room, state) > 0;
    const whole = { x: 0, y: 0, width: SCENE_SIZE.width, height: SCENE_SIZE.height };
    const wholeBox: Box = { left: 0, top: 0, right: SCENE_SIZE.width, bottom: SCENE_SIZE.height };
    const pieces: MiniaturePiece[] = [{ key: renovated ? room.scene.after : room.scene.before, placement: whole, box: wholeBox, fill: renovated ? standIn.wallAfter : standIn.wallBefore, alpha: 1 }];
    if (!renovated) {
        pieces.push({ key: room.scene.furnishingsBefore, placement: whole, box: wholeBox, fill: standIn.decorFill, alpha: 0 });
    }
    if (roomDone(room, state)) {
        pieces.push({ key: room.scene.shadows, placement: whole, box: wholeBox, fill: standIn.decorFill, alpha: 0 });
    }
    const placed: { z: number; piece: MiniaturePiece }[] = [];
    const at = (a: { x: number; y: number; width: number; height: number }): { x: number; y: number; width: number; height: number } => ({ x: a.x, y: a.y, width: a.width, height: a.height });
    if (renovated) {
        room.decor.forEach((layer) => placed.push({ z: layer.z, piece: { key: layer.key, placement: at(layer), box: layerBox(layer), fill: standIn.decorFill, alpha: standIn.decorAlpha } }));
    }
    room.slots.forEach((slot: SlotDef) => {
        const variant = state.chosen[slot.id];
        if (variant !== undefined) {
            placed.push({ z: slot.z, piece: { key: slot.variants[variant], placement: at(slot), box: slotBox(slot), fill: standIn.variantFills[variant], alpha: 1 } });
        }
    });
    return [...pieces, ...placed.sort((a, b) => a.z - b.z).map((p) => p.piece)];
}

/**
 * The room at a small scale from the same pictures as the room itself. `left`/`top` is where the scene's corner lands. A piece whose
 * texture is missing is a stand-in box on `g` (the coloured backdrop for the scene picture, nothing for a full-scene overlay).
 * Returns the images it added, in order, from `depth` up, so the caller can destroy them; used by the "Pokój gotowy!" card.
 */
export function drawRoomMiniature(
    scene: Scene, g: GameObjects.Graphics, room: RoomDef, state: RoomState, left: number, top: number, scale: number, depth: number,
): GameObjects.Image[] {
    const { scene: area, standIn } = ROOM_LAYOUT;
    const images: GameObjects.Image[] = [];
    miniaturePieces(room, state).forEach((piece, index) => {
        const { x, y, width, height } = piece.placement;
        if (scene.textures.exists(piece.key)) {
            images.push(scene.add.image(left + x * scale, top + y * scale, piece.key).setOrigin(0, 0).setDisplaySize(width * scale, height * scale).setDepth(depth + index / 1000));
            return;
        }
        if (piece.alpha === 0) {
            return;
        }
        if (index === 0) {
            const wall = (standIn.wallBottom - area.top) * scale;
            g.fillStyle(piece.fill, 1);
            g.fillRect(left, top, area.width * scale, wall);
            g.fillStyle(piece.fill === standIn.wallAfter ? standIn.floorAfter : standIn.floorBefore, 1);
            g.fillRect(left, top + wall, area.width * scale, area.height * scale - wall);
            return;
        }
        const b = piece.box;
        drawStandIn(g, { left: left + (b.left - area.left) * scale, top: top + (b.top - area.top) * scale, width: (b.right - b.left) * scale, height: (b.bottom - b.top) * scale }, piece.fill, piece.alpha, scale, standIn.radius * scale);
    });
    return images;
}
