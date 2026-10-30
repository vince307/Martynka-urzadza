import type { GameObjects, Scene } from 'phaser';
import { miniatureMode, neededMiniatureKeys, type MiniatureMode } from '../../core/artPick';
import { emptyRoomState, type RoomListItem } from '../../core/rooms';
import type { RoomDef, RoomState } from '../../core/types';
import { PLACEHOLDER_COLORS, ROOM_DONE_LAYOUT, ROOM_LAYOUT } from '../../data/layout';
import { pl, roomText } from '../../data/pl';
import { recordFallback } from '../artFallbacks';
import { PageButton } from './PageButton';
import { drawRoomMiniature, miniaturePieces } from './RoomView';
import { textStyle } from './textStyle';

/**
 * The "Pokój gotowy!" card over the finished room: the title, the list of rooms (a tile with a miniature and a check mark for a room,
 * a faded dashed tile "Wkrótce" for the next one, with a padlock while it is locked) and "Dalej". The tiles are not buttons.
 * It draws what it is given and decides nothing.
 * DESIGN-GAP (docs/design-gaps.md rows 39 and 40): the kit has no room-done card nor room list; the look follows the unlock card. The miniature is the room's own pictures in scale; when a piece texture is missing it is the room's pack thumbnail (`RoomDef.thumbnail`), and drawn stand-ins only when that is missing too (docs/design-gaps.md row 108).
 */
export class RoomDoneCard {
    private readonly graphics: GameObjects.Graphics;
    private readonly title: GameObjects.Text;
    private captions: GameObjects.Text[] = [];
    private pictures: GameObjects.Image[] = [];
    private mode: MiniatureMode | null = null;
    private readonly next: PageButton;

    constructor(private readonly scene: Scene, onNext: () => void) {
        this.graphics = scene.add.graphics().setDepth(ROOM_LAYOUT.depth.card);
        this.title = scene.add.text(ROOM_DONE_LAYOUT.title.x, ROOM_DONE_LAYOUT.title.y, pl.room.done.title, textStyle('unlockTitle')).setOrigin(0.5, 0).setDepth(ROOM_LAYOUT.depth.card + 1);
        this.next = new PageButton(scene, onNext).setDepth(ROOM_LAYOUT.depth.card + 1);
        this.hide();
    }

    show(items: readonly RoomListItem[], catalogue: Readonly<Record<string, RoomDef>>, states: Readonly<Record<string, RoomState>>, current: string): void {
        const { card, tiles, button } = ROOM_DONE_LAYOUT;
        const g = this.graphics.setVisible(true);
        g.clear();
        this.clearCaptions();
        g.fillStyle(PLACEHOLDER_COLORS.unlockCard, 1);
        g.fillRoundedRect(card.left, card.top, card.width, card.height, card.radius);
        g.lineStyle(card.border, PLACEHOLDER_COLORS.unlockBorder, 1);
        g.strokeRoundedRect(card.left, card.top, card.width, card.height, card.radius);
        this.title.setVisible(true);
        const total = items.length * tiles.width + (items.length - 1) * tiles.gap;
        const first = card.left + card.width / 2 - total / 2;
        items.forEach((item, index) => {
            const left = first + index * (tiles.width + tiles.gap);
            const room = item.kind === 'room' && item.id !== null && Object.prototype.hasOwnProperty.call(catalogue, item.id) ? catalogue[item.id] : null;
            if (item.kind === 'room' && room !== null) {
                const state = Object.prototype.hasOwnProperty.call(states, room.id) ? states[room.id] : emptyRoomState();
                this.drawRoomTile(left, room, state, item.done, room.id === current);
            } else {
                this.drawTeaserTile(left, !item.unlocked);
            }
        });
        this.next.show(pl.unlock.next, button.left, button.top, 'primary', false, button);
    }

    hide(): void {
        this.graphics.setVisible(false);
        this.title.setVisible(false);
        this.clearCaptions();
        this.mode = null;
        this.next.hide();
    }

    /** Which miniature the tile shows, for the e2e hook; null while the card is hidden. */
    miniature(): MiniatureMode | null {
        return this.mode;
    }

    /** Centre of "Dalej" in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        return this.next.target();
    }

    private clearCaptions(): void {
        this.captions.forEach((text) => text.destroy());
        this.captions = [];
        this.pictures.forEach((image) => image.destroy());
        this.pictures = [];
    }

    private caption(text: string, x: number, y: number, alpha = 1): void {
        this.captions.push(this.scene.add.text(x, y, text, textStyle('bar')).setOrigin(0.5).setDepth(ROOM_LAYOUT.depth.card + 1).setAlpha(alpha));
    }

    private drawRoomTile(left: number, room: RoomDef, state: RoomState, done: boolean, isCurrent: boolean): void {
        const { tiles } = ROOM_DONE_LAYOUT;
        const g = this.graphics;
        const top = tiles.top;
        g.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        g.fillRoundedRect(left, top, tiles.width, tiles.height, tiles.radius);
        g.lineStyle(tiles.border, PLACEHOLDER_COLORS.nextBorder, 1);
        g.strokeRoundedRect(left, top, tiles.width, tiles.height, tiles.radius);
        const thumbWidth = ROOM_LAYOUT.scene.width * tiles.thumbScale;
        const exists = (key: string): boolean => this.scene.textures.exists(key);
        const mode = miniatureMode(neededMiniatureKeys(miniaturePieces(room, state)), exists, room.thumbnail);
        if (isCurrent) this.mode = mode;
        if (mode !== 'live') recordFallback(this.scene, 'miniature', mode);
        const thumbLeft = left + (tiles.width - thumbWidth) / 2;
        if (mode === 'thumbnail' && room.thumbnail !== undefined) {
            this.pictures.push(
                this.scene.add.image(thumbLeft, top + tiles.thumbTop, room.thumbnail).setOrigin(0, 0)
                    .setDisplaySize(thumbWidth, ROOM_LAYOUT.scene.height * tiles.thumbScale).setDepth(ROOM_LAYOUT.depth.card + 1),
            );
        } else {
            this.pictures.push(...drawRoomMiniature(this.scene, g, room, state, thumbLeft, top + tiles.thumbTop, tiles.thumbScale, ROOM_LAYOUT.depth.card + 1));
        }
        this.caption(roomText.name(room.id) ?? room.id, left + tiles.width / 2, top + tiles.captionY);
        if (done) {
            // A check mark in a circle: the "done" sign is a shape, not only a colour.
            const cx = left + tiles.width - tiles.markInset;
            const cy = top + tiles.markInset;
            const r = tiles.markRadius;
            g.fillStyle(PLACEHOLDER_COLORS.nextBorder, 1);
            g.fillCircle(cx, cy, r);
            const { mark } = tiles;
            g.lineStyle(mark.stroke, PLACEHOLDER_COLORS.ivory, 1);
            g.beginPath();
            g.moveTo(cx + r * mark.startX, cy);
            g.lineTo(cx + r * mark.bendX, cy + r * mark.bendY);
            g.lineTo(cx + r * mark.endX, cy + r * mark.endY);
            g.strokePath();
        }
    }

    private drawTeaserTile(left: number, locked: boolean): void {
        const { tiles } = ROOM_DONE_LAYOUT;
        const g = this.graphics;
        const top = tiles.top;
        const border = PLACEHOLDER_COLORS.pageButtonSecondaryBorder;
        g.fillStyle(PLACEHOLDER_COLORS.ivory, 0.5);
        g.fillRoundedRect(left, top, tiles.width, tiles.height, tiles.radius);
        g.lineStyle(tiles.border, border, 0.8);
        const run = (x0: number, y0: number, dx: number, dy: number, length: number): void => {
            for (let at = 0; at < length; at += tiles.dash + tiles.dashGap) {
                const end = Math.min(at + tiles.dash, length);
                g.lineBetween(x0 + dx * at, y0 + dy * at, x0 + dx * end, y0 + dy * end);
            }
        };
        run(left, top, 1, 0, tiles.width);
        run(left, top + tiles.height, 1, 0, tiles.width);
        run(left, top, 0, 1, tiles.height);
        run(left + tiles.width, top, 0, 1, tiles.height);
        if (locked) {
            // A padlock: body and shackle.
            const cx = left + tiles.width / 2;
            const { lock } = tiles;
            const cy = top + lock.centerY;
            g.fillStyle(border, lock.alpha);
            g.fillRoundedRect(cx - lock.bodyHalfWidth, cy - lock.bodyTop, lock.bodyWidth, lock.bodyHeight, lock.bodyRadius);
            g.lineStyle(lock.stroke, border, lock.alpha);
            g.beginPath();
            g.arc(cx, cy - lock.bodyTop, lock.shackleRadius, Math.PI, 0, false);
            g.strokePath();
        }
        this.caption(pl.room.done.teaser, left + tiles.width / 2, top + tiles.captionY, 0.8);
    }
}
