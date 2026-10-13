import type { GameObjects, Scene } from 'phaser';
import type { RoomListItem } from '../../core/rooms';
import type { RoomDef, RoomState } from '../../core/types';
import { PLACEHOLDER_COLORS, ROOM_DONE_LAYOUT, ROOM_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { PageButton } from './PageButton';
import { drawRoomMiniature } from './RoomView';
import { textStyle } from './textStyle';

/**
 * The "Pokój gotowy!" card over the finished room: the title, the list of rooms (a tile with a miniature and a check mark for a room,
 * a faded dashed tile "Wkrótce" for the next one, with a padlock while it is locked) and "Dalej". The tiles are not buttons.
 * It draws what it is given and decides nothing.
 * DESIGN-GAP (docs/design-gaps.md rows 39 and 40): the kit has no room-done card nor room list; the look follows the unlock card and the art waits for S-16.
 */
export class RoomDoneCard {
    private readonly graphics: GameObjects.Graphics;
    private readonly title: GameObjects.Text;
    private captions: GameObjects.Text[] = [];
    private readonly next: PageButton;

    constructor(private readonly scene: Scene, onNext: () => void) {
        this.graphics = scene.add.graphics().setDepth(5);
        this.title = scene.add.text(ROOM_DONE_LAYOUT.title.x, ROOM_DONE_LAYOUT.title.y, pl.room.done.title, textStyle('unlockTitle')).setOrigin(0.5, 0).setDepth(5);
        this.next = new PageButton(scene, onNext).setDepth(5);
        this.hide();
    }

    show(items: readonly RoomListItem[], room: RoomDef, state: RoomState): void {
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
            if (item.kind === 'room') {
                this.drawRoomTile(left, room, state, item.done);
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
        this.next.hide();
    }

    /** Centre of "Dalej" in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        return this.next.target();
    }

    private clearCaptions(): void {
        this.captions.forEach((text) => text.destroy());
        this.captions = [];
    }

    private caption(text: string, x: number, y: number, alpha = 1): void {
        this.captions.push(this.scene.add.text(x, y, text, textStyle('bar')).setOrigin(0.5).setDepth(5).setAlpha(alpha));
    }

    private drawRoomTile(left: number, room: RoomDef, state: RoomState, done: boolean): void {
        const { tiles } = ROOM_DONE_LAYOUT;
        const g = this.graphics;
        const top = tiles.top;
        g.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        g.fillRoundedRect(left, top, tiles.width, tiles.height, tiles.radius);
        g.lineStyle(tiles.border, PLACEHOLDER_COLORS.nextBorder, 1);
        g.strokeRoundedRect(left, top, tiles.width, tiles.height, tiles.radius);
        const thumbWidth = ROOM_LAYOUT.area.width * tiles.thumbScale;
        drawRoomMiniature(g, room, state, left + (tiles.width - thumbWidth) / 2, top + tiles.thumbTop, tiles.thumbScale);
        this.caption(pl.room.name, left + tiles.width / 2, top + tiles.captionY);
        if (done) {
            // A check mark in a circle: the "done" sign is a shape, not only a colour.
            const cx = left + tiles.width - tiles.markInset;
            const cy = top + tiles.markInset;
            const r = tiles.markRadius;
            g.fillStyle(PLACEHOLDER_COLORS.nextBorder, 1);
            g.fillCircle(cx, cy, r);
            g.lineStyle(7, PLACEHOLDER_COLORS.ivory, 1);
            g.beginPath();
            g.moveTo(cx - r * 0.5, cy);
            g.lineTo(cx - r * 0.1, cy + r * 0.4);
            g.lineTo(cx + r * 0.5, cy - r * 0.35);
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
            const cy = top + 70;
            g.fillStyle(border, 0.9);
            g.fillRoundedRect(cx - 28, cy - 4, 56, 44, 8);
            g.lineStyle(8, border, 0.9);
            g.beginPath();
            g.arc(cx, cy - 4, 18, Math.PI, 0, false);
            g.strokePath();
        }
        this.caption(pl.room.done.teaser, left + tiles.width / 2, top + tiles.captionY, 0.8);
    }
}
