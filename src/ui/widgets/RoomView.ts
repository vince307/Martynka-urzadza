import type { GameObjects, Scene } from 'phaser';
import type { LayerDef, RoomDef, RoomState, SlotDef } from '../../core/types';
import { contactShadowPieces, roomDone, sceneKey, shownVariants, stagesDone, wornPieces } from '../../core/rooms';
import { slotBox, type Box } from '../../core/roomHit';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT } from '../../data/layout';
import { roomText } from '../../data/pl';
import { SCENE_SIZE } from '../../data/roomArt';
import { applyWornGrade } from '../wornGrade';
import { RoomLayer } from './RoomLayer';

/** The graded images of the worn salon (change salon-style) and what they report to the e2e hook. */
export interface WornBuild {
    images: GameObjects.Image[];
    keys: string[];
    /** At least one image was drawn and every drawn image carries the worn filter (false under the Canvas renderer). */
    graded: boolean;
}

/**
 * The worn set of `wornPieces(room, state)` as images at `depth + z / 1000`, each through `applyWornGrade`. A piece whose texture is
 * missing is skipped: it has no stand-in (DESIGN-GAP row 172). Shared by `RoomView.render` and the stage cross-fade of `RoomScene`.
 */
export function buildWorn(scene: Scene, room: RoomDef, state: RoomState, depth: number): WornBuild {
    const out: WornBuild = { images: [], keys: [], graded: false };
    let allGraded = true;
    wornPieces(room, state).forEach((piece) => {
        if (!scene.textures.exists(piece.key)) {
            return;
        }
        const art = room.slots.find((s) => s.id === piece.id) ?? room.decor.find((d) => d.id === piece.id);
        const anchor = art?.anchor ?? [0, 0];
        const image = scene.add.image(piece.x + anchor[0], piece.y + anchor[1], piece.key)
            .setOrigin(anchor[0] / piece.width, anchor[1] / piece.height)
            .setDisplaySize(piece.width, piece.height)
            .setDepth(depth + piece.z / 1000);
        allGraded = applyWornGrade(scene, image, piece.soft) && allGraded;
        out.images.push(image);
        out.keys.push(piece.id);
    });
    out.graded = out.images.length > 0 && allGraded;
    return out;
}

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
 * The room (S-09, S-16a): the art pack's pictures in the 1920x1080 scene. Before the renovation stage: the neglected room with the after pieces
 * under a worn grade (DESIGN-GAP rows 169 and 171); after it: the renovated room, the decoration and every bought piece, each on its own depth `z` (0-99, below the controls,
 * see `ROOM_LAYOUT.depth`); the floor shadows show before the stage and with the finished room, in between the loose pieces stand on contact shadows. A picture whose texture is missing is a stand-in box with its
 * Polish caption (a missing scene picture: the coloured backdrop). It takes no input.
 * DESIGN-GAP (docs/design-gaps.md): the stand-in is ours; the kit has none for a room picture.
 */
export class RoomView {
    private readonly backdrop: GameObjects.Graphics;
    private readonly outline: GameObjects.Graphics;
    private readonly layers = new Map<string, RoomLayer>();
    private room: RoomDef | null = null;
    private shownNow: Record<string, 0 | 1 | 2> = {};
    private wornImages: GameObjects.Image[] = [];
    private wornWash: GameObjects.Rectangle | null = null;
    private readonly contact: GameObjects.Graphics;
    private wornDrawn: WornBuild = { images: [], keys: [], graded: false };
    private contactDrawn: string[] = [];

    constructor(private readonly scene: Scene) {
        this.backdrop = scene.add.graphics().setDepth(ROOM_LAYOUT.depth.scene);
        this.outline = scene.add.graphics().setDepth(ROOM_LAYOUT.depth.outline);
        this.contact = scene.add.graphics().setDepth(ROOM_LAYOUT.depth.shadows);
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
        const backgroundKey = sceneKey(room, state);
        layer('scene').show(backgroundKey, whole, depth.scene, null);
        this.drawBackdrop(renovated, !this.scene.textures.exists(backgroundKey));
        // The neglected room is the after furniture under a worn grade on the floor shadows; the renovated room is grounded by
        // contact shadows under the loose pieces until the finished room brings the whole shadows layer (change salon-style).
        if (!renovated || roomDone(room, state)) {
            layer('shadows').show(room.scene.shadows, whole, depth.shadows, null);
        }
        this.drawWorn(room, state);
        this.drawContactShadows(room, state);
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
        const shown = shownVariants(room, { ...state, chosen });
        this.shownNow = {};
        room.slots.forEach((slot) => {
            const variant = shown[slot.id];
            if (variant === undefined) {
                return;
            }
            this.shownNow[slot.id] = variant;
            const caption = [roomText.slot(slot.id) ?? slot.id, roomText.variant(slot.id, variant)].filter(Boolean).join('\n');
            layer(`slot:${slot.id}`).show(slot.variants[variant], slot, slot.z, { box: slotBox(slot), fill: standIn.variantFills[variant], alpha: 1, caption });
        });
        this.layers.forEach((l, id) => {
            if (!wanted.has(id)) {
                l.hide();
            }
        });
    }

    private drawWorn(room: RoomDef, state: RoomState): void {
        this.wornImages.forEach((image) => image.destroy());
        this.wornWash?.destroy();
        this.wornWash = null;
        this.wornDrawn = buildWorn(this.scene, room, state, ROOM_LAYOUT.depth.worn);
        this.wornImages = this.wornDrawn.images;
        if (this.wornImages.length > 0 && !this.wornDrawn.graded) {
            // The Canvas renderer has no filters: one translucent wash stands in for the grade.
            const { colour, alpha } = ROOM_LAYOUT.worn.canvasWash;
            this.wornWash = this.scene.add.rectangle(0, 0, SCENE_SIZE.width, SCENE_SIZE.height, colour, alpha).setOrigin(0, 0).setDepth(ROOM_LAYOUT.depth.worn + 0.5);
        }
    }

    /** Soft ellipses under the loose pieces, concentric so the middle is darkest; the same on both renderers. DESIGN-GAP row 171. */
    private drawContactShadows(room: RoomDef, state: RoomState): void {
        const { colour, alpha, rings, heightRatio } = ROOM_LAYOUT.contactShadow;
        const pieces = contactShadowPieces(room, state, heightRatio);
        const g = this.contact;
        g.clear();
        g.fillStyle(colour, alpha / rings);
        pieces.forEach((p) => {
            for (let i = 0; i < rings; i++) {
                const f = 1 - i / rings;
                g.fillEllipse(p.cx, p.cy, p.width * f, p.height * f);
            }
        });
        this.contactDrawn = pieces.map((p) => p.id);
    }

    /** What the worn set drew at the last `render`, for the e2e hook. */
    wornState(): { keys: string[]; graded: boolean } {
        return { keys: [...this.wornDrawn.keys], graded: this.wornDrawn.graded };
    }

    /** The pieces that stood on a contact shadow at the last `render`, for the e2e hook. */
    contactShadowIds(): string[] {
        return [...this.contactDrawn];
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

    /** The variant each slot showed at the last `render` (bought, previewed or the default look), for the e2e hook. */
    shown(): Readonly<Record<string, 0 | 1 | 2>> {
        return { ...this.shownNow };
    }

    /** The picture of a furnished slot (for the purchase pop); null for a stand-in or an empty slot. */
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
    /** A piece of the graded worn set: drawn through `applyWornGrade` (WebGL only). */
    worn?: { soft: boolean };
}

/**
 * The pictures of the room's miniature, back to front: the scene, the shadows and the graded worn set until the stage, the shadows of a
 * finished room, the decoration after the stage, then the furnished slots by `z` (empty slots are left out). The same layers as `RoomView.render`.
 */
export function miniaturePieces(room: RoomDef, state: RoomState): MiniaturePiece[] {
    const { standIn } = ROOM_LAYOUT;
    const renovated = stagesDone(room, state) > 0;
    const whole = { x: 0, y: 0, width: SCENE_SIZE.width, height: SCENE_SIZE.height };
    const wholeBox: Box = { left: 0, top: 0, right: SCENE_SIZE.width, bottom: SCENE_SIZE.height };
    const pieces: MiniaturePiece[] = [{ key: sceneKey(room, state), placement: whole, box: wholeBox, fill: renovated ? standIn.wallAfter : standIn.wallBefore, alpha: 1 }];
    if (!renovated) {
        pieces.push({ key: room.scene.shadows, placement: whole, box: wholeBox, fill: standIn.decorFill, alpha: 0 });
        wornPieces(room, state).forEach((w) => pieces.push({
            key: w.key, placement: { x: w.x, y: w.y, width: w.width, height: w.height }, box: { left: w.x, top: w.y, right: w.x + w.width, bottom: w.y + w.height },
            fill: standIn.decorFill, alpha: 0, worn: { soft: w.soft },
        }));
    }
    if (roomDone(room, state)) {
        pieces.push({ key: room.scene.shadows, placement: whole, box: wholeBox, fill: standIn.decorFill, alpha: 0 });
    }
    const placed: { z: number; piece: MiniaturePiece }[] = [];
    const at = (a: { x: number; y: number; width: number; height: number }): { x: number; y: number; width: number; height: number } => ({ x: a.x, y: a.y, width: a.width, height: a.height });
    if (renovated) {
        room.decor.forEach((layer) => placed.push({ z: layer.z, piece: { key: layer.key, placement: at(layer), box: layerBox(layer), fill: standIn.decorFill, alpha: standIn.decorAlpha } }));
    }
    const shown = shownVariants(room, state);
    room.slots.forEach((slot: SlotDef) => {
        const variant = shown[slot.id];
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
            const image = scene.add.image(left + x * scale, top + y * scale, piece.key).setOrigin(0, 0).setDisplaySize(width * scale, height * scale).setDepth(depth + index / 1000);
            if (piece.worn) {
                applyWornGrade(scene, image, piece.worn.soft);
            }
            images.push(image);
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
