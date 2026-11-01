import type { GameObjects, Scene } from 'phaser';
import { miniaturePieces } from './RoomView';
import { captureRoomMiniature } from './roomCapture';
import { neededMiniatureKeys } from '../../core/artPick';
import type { HouseCellView } from '../../core/houseCells';
import type { HouseGeometry, RoomState } from '../../core/types';
import { emptyRoomState } from '../../core/rooms';
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH, HOUSE_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ROOMS } from '../../data/rooms';

export type HouseCellMode = 'live' | 'drawn' | 'closed';

export interface HouseRenderOptions {
    /** The shell picture is loaded; else a code-drawn shell stands in. */
    shellReady: boolean;
    /** Rooms whose pictures are still loading: their cell is drawn from stand-ins until they arrive. */
    pending: ReadonlySet<string>;
}

const textureKey = (cellId: string): string => `house-cell-${cellId}`;

/**
 * The cross-section of the house (FR-038): the sky, the shell, one captured miniature per open cell (done or current room), the pack's closed
 * cell and "Wkrótce" for every other cell, and the frame around the room in renovation. Draw order as in the pack README: background, shell
 * (its cells are opaque #FFF5DF, so it must lie under them), cells, frame (by depth, HOUSE_LAYOUT.depth). Nothing moves (no tween). DESIGN-GAP (docs/design-gaps.md rows 185, 189, 190): the pack's sky is a CSS gradient, flat here;
 * the stand-in shell (picture missing) is ours.
 */
export class HouseView {
    private objects: GameObjects.GameObject[] = [];
    private readonly textures = new Set<string>();

    constructor(private readonly scene: Scene) {}

    render(cells: readonly HouseCellView[], geometry: HouseGeometry, rooms: Readonly<Record<string, RoomState>> | undefined, opts: HouseRenderOptions): Record<string, HouseCellMode> {
        this.clear();
        const { depth, standIn } = HOUSE_LAYOUT;
        const modes: Record<string, HouseCellMode> = {};
        const add = <T extends GameObjects.GameObject>(o: T): T => { this.objects.push(o); return o; };
        add(this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, geometry.background).setOrigin(0, 0).setDepth(depth.background));
        const exists = (key: string): boolean => this.scene.textures.exists(key);
        const teaserStyle = HOUSE_LAYOUT.teaser;
        const { teaser } = geometry;

        for (const cell of cells) {
            const rect = geometry.cells.find((c) => c.id === cell.id) ?? cell;
            const room = cell.room === null ? undefined : ROOMS[cell.room];
            if (cell.state === 'closed' || room === undefined || cell.room === null) {
                modes[cell.id] = 'closed';
                if (exists(geometry.cellClosed)) {
                    add(this.scene.add.image(rect.x, rect.y, geometry.cellClosed).setOrigin(0, 0).setDisplaySize(rect.width, rect.height).setDepth(depth.cells));
                } else {
                    add(this.scene.add.rectangle(rect.x, rect.y, rect.width, rect.height, standIn.closed).setOrigin(0, 0).setDepth(depth.cells));
                }
                add(this.scene.add.text(rect.x + rect.width / 2, rect.y + rect.height / 2, pl.room.done.teaser, {
                    fontFamily: FONT_FAMILY, fontSize: `${teaserStyle.size}px`, fontStyle: String(teaser.weight), color: teaser.color,
                    ...(teaser.shadow === null ? {} : { shadow: { offsetX: teaserStyle.shadowOffset, offsetY: teaserStyle.shadowOffset, color: teaser.shadow, blur: 0, fill: true } }),
                }).setOrigin(0.5).setDepth(depth.teaser));
                continue;
            }
            const state = rooms?.[cell.room] ?? emptyRoomState();
            // Every render makes the cell textures again (they are removed in clear()), which also covers a restored WebGL context.
            const key = textureKey(cell.id);
            const captured = captureRoomMiniature(this.scene, key, room, state, rect.width, rect.height);
            if (captured) this.textures.add(key);
            const needed = neededMiniatureKeys(miniaturePieces(room, state));
            modes[cell.id] = !opts.pending.has(cell.room) && needed.every(exists) ? 'live' : 'drawn';
            if (captured) add(this.scene.add.image(rect.x, rect.y, key).setOrigin(0, 0).setDisplaySize(rect.width, rect.height).setDepth(depth.cells));
        }

        if (opts.shellReady && exists(geometry.shell)) {
            add(this.scene.add.image(0, 0, geometry.shell).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(depth.shell));
        } else {
            this.standInShell(geometry, add);
        }

        const current = cells.find((c) => c.state === 'current');
        if (current) {
            const inset = geometry.frameInset;
            if (opts.shellReady && exists(geometry.cellFrame)) {
                add(this.scene.add.image(current.x - inset, current.y - inset, geometry.cellFrame).setOrigin(0, 0)
                    .setDisplaySize(current.width + inset * 2, current.height + inset * 2).setDepth(depth.frame));
            } else {
                const g = add(this.scene.add.graphics().setDepth(depth.frame));
                g.lineStyle(standIn.frameWidth, standIn.frame, 1);
                g.strokeRoundedRect(current.x - inset / 2, current.y - inset / 2, current.width + inset, current.height + inset, inset);
            }
        }
        return modes;
    }

    /** One pixel from the middle of a cell texture (e2e hook only): WebGL reads it back, Canvas reads the texture's own 2D context. */
    pixel(cellId: string): [number, number, number, number] | null {
        const key = textureKey(cellId);
        if (!this.textures.has(key) || !this.scene.textures.exists(key)) return null;
        const dt = this.scene.textures.get(key) as unknown as {
            width: number; height: number; context: CanvasRenderingContext2D | null;
            snapshotPixel(x: number, y: number, cb: (c: unknown) => void): void;
        };
        const x = Math.floor(dt.width / 2);
        const y = Math.floor(dt.height / 2);
        if (dt.context) {
            const d = dt.context.getImageData(x, y, 1, 1).data;
            return [d[0], d[1], d[2], d[3]];
        }
        let out: [number, number, number, number] | null = null;
        dt.snapshotPixel(x, y, (color) => {
            const c = color as { red?: number; green: number; blue: number; alpha: number };
            if (c.red !== undefined) out = [c.red, c.green, c.blue, c.alpha];
        });
        return out;
    }

    destroy(): void {
        this.clear();
    }

    /** The shell drawn in code: an outline around the cells, a roof line and the stairwell. */
    private standInShell(geometry: HouseGeometry, add: <T extends GameObjects.GameObject>(o: T) => T): void {
        const { standIn, depth } = HOUSE_LAYOUT;
        const g = add(this.scene.add.graphics().setDepth(depth.shell));
        const left = Math.min(...geometry.cells.map((c) => c.x));
        const right = Math.max(...geometry.cells.map((c) => c.x + c.width));
        const top = Math.min(...geometry.cells.map((c) => c.y));
        const bottom = Math.max(...geometry.cells.map((c) => c.y + c.height));
        const margin = standIn.margin;
        const { stairwell } = geometry;
        g.fillStyle(geometry.cellFill, 1);
        g.fillRect(stairwell.x, stairwell.y, stairwell.width, stairwell.height);
        g.lineStyle(standIn.outlineWidth, standIn.outline, 1);
        g.strokeRect(left - margin, top - margin, right - left + margin * 2, bottom - top + margin * 2);
        g.strokeRect(stairwell.x, stairwell.y, stairwell.width, stairwell.height);
        if (geometry.standInRoof) {
            g.fillStyle(standIn.roof, 1);
            g.fillTriangle(left - margin * 2, top - margin, (left + right) / 2, standIn.apexY, right + margin * 2, top - margin);
            g.strokeTriangle(left - margin * 2, top - margin, (left + right) / 2, standIn.apexY, right + margin * 2, top - margin);
        }
    }

    private clear(): void {
        this.objects.forEach((o) => o.destroy());
        this.objects = [];
        for (const key of this.textures) {
            if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        }
        this.textures.clear();
    }
}
