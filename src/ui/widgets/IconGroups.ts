// DESIGN-GAP 62 (docs/design-gaps.md): the kit has no plate or box for MULT_GROUPS.
import type { GameObjects, Scene } from 'phaser';
import type { IconId } from '../../data/measures';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { ART_KEYS } from '../../data/taskArt';
import { ART_LIMITS } from '../../data/measures';
import { ArtImage } from './ArtImage';
import { iconsLayout } from './artLayout';
import type { Rect } from './geometry';

const MAX_ICONS = ART_LIMITS.icons;   // one pooled image per piece validateVisual allows

/** Icons of the art kit in one or more groups, each group optionally in a frame drawn in code (S-14). */
export class IconGroups {
    private readonly frames: GameObjects.Graphics;
    private readonly images: ArtImage[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        // Frames first: the icons are drawn over them.
        this.frames = scene.add.graphics().setVisible(false);
        this.images = Array.from({ length: MAX_ICONS }, () => new ArtImage(scene));
    }

    render(icon: IconId, groups: readonly number[], framed: boolean, rect: Rect): void {
        this.setVisible(false);
        this.area = rect;
        const layout = iconsLayout(groups, framed, rect, TASK_LAYOUT.icons);
        if (layout.frames.length > 0) {
            const look = TASK_LAYOUT.icons;
            this.frames.setVisible(true).fillStyle(PLACEHOLDER_COLORS.tile, 1).lineStyle(look.border, PLACEHOLDER_COLORS.deepTeal, 1);
            for (const f of layout.frames) {
                this.frames.fillRoundedRect(f.x, f.y, f.width, f.height, look.radius).strokeRoundedRect(f.x, f.y, f.width, f.height, look.radius);
            }
        }
        layout.icons.forEach((spot, i) => this.images[i]?.show(ART_KEYS.icon(icon), spot));
    }

    setVisible(visible: boolean): void {
        if (!visible) {
            this.frames.clear().setVisible(false);
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
