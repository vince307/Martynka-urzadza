// DESIGN-GAP 59 (docs/design-gaps.md): the kit has coins and notes but no table layout and no relative scale.
import type { Scene } from 'phaser';
import type { MoneyId } from '../../data/measures';
import { TASK_LAYOUT } from '../../data/layout';
import { ART_KEYS } from '../../data/taskArt';
import { ArtImage } from './ArtImage';
import { moneyLayout } from './artLayout';
import type { Rect } from './geometry';

const MAX_ITEMS = 10;

/** Coins and notes lying on a table: notes above, coins below, each one the kit's drawing (S-14). */
export class MoneyTable {
    private readonly images: ArtImage[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        this.images = Array.from({ length: MAX_ITEMS }, () => new ArtImage(scene));
    }

    render(items: readonly MoneyId[], rect: Rect): void {
        this.setVisible(false);
        this.area = rect;
        moneyLayout(items, rect, TASK_LAYOUT.money).forEach((placed, i) => this.images[i]?.show(ART_KEYS.money(placed.id), placed.rect));
    }

    setVisible(visible: boolean): void {
        if (!visible) {
            this.images.forEach((image) => image.hide());
        }
    }

    /** True while at least one drawing is on screen (the e2e hook reads it, not the rectangle). */
    shown(): boolean {
        return this.art().length > 0;
    }

    /** The images on screen: texture key and whether it is loaded. */
    art(): { key: string; loaded: boolean }[] {
        return this.images.flatMap((image) => image.state() ?? []);
    }

    bounds(): Rect {
        return this.area;
    }
}
