// DESIGN-GAP (docs/design-gaps.md row 102): the kit has no row of icons with a start mark; the flag is drawn in code.
import type { GameObjects, Scene } from 'phaser';
import type { IconId } from '../../data/measures';
import { ART_LIMITS } from '../../data/measures';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { ART_KEYS } from '../../data/taskArt';
import { assertPool } from '../../core/tasks/visual';
import { ArtImage } from './ArtImage';
import { rowLayout } from './artLayout';
import type { Rect } from './geometry';

/** Different icons in a row with a start flag on the left; the child counts the place from the flag. */
export class IconRow {
    private readonly flag: GameObjects.Graphics;
    private readonly images: ArtImage[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        this.flag = scene.add.graphics().setVisible(false);
        this.images = Array.from({ length: ART_LIMITS.rowIcons }, () => new ArtImage(scene));
    }

    render(icons: readonly IconId[], rect: Rect): void {
        this.setVisible(false);
        this.area = rect;
        assertPool(icons.length, ART_LIMITS.rowIcons, 'icon row');
        const look = TASK_LAYOUT.iconRow;
        const layout = rowLayout(icons.length, rect, look);
        const m = layout.mark;
        const poleX = m.x + m.width * 0.3;
        const flagSize = layout.icon * look.flag;
        this.flag.setVisible(true).fillStyle(PLACEHOLDER_COLORS.deepTeal, 1).fillRect(poleX - look.pole / 2, m.y, look.pole, m.height);
        this.flag.fillStyle(PLACEHOLDER_COLORS.butter, 1).lineStyle(look.pole / 2, PLACEHOLDER_COLORS.deepTeal, 1);
        const top = m.y + look.pole;
        this.flag.fillTriangle(poleX + look.pole / 2, top, poleX + look.pole / 2 + flagSize, top + flagSize / 2, poleX + look.pole / 2, top + flagSize);
        icons.forEach((id, i) => {
            this.images[i].show(ART_KEYS.icon(id), layout.icons[i]);
        });
    }

    setVisible(visible: boolean): void {
        if (!visible) {
            this.flag.clear().setVisible(false);
            this.images.forEach((image) => image.hide());
        }
    }

    shown(): boolean {
        return this.art().length > 0;
    }

    art(): { key: string; loaded: boolean }[] {
        return this.images.flatMap((image) => image.state() ?? []);
    }

    bounds(): Rect {
        return this.area;
    }
}
