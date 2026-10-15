// DESIGN-GAP 62 (docs/design-gaps.md): the kit has no plate or box for MULT_GROUPS.
// DESIGN-GAP (docs/design-gaps.md row 102): the kit has no motion arrow for a picture story; it is drawn in code.
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
    private readonly arrow: GameObjects.Graphics;
    private readonly images: ArtImage[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        // Frames first: the icons are drawn over them.
        this.frames = scene.add.graphics().setVisible(false);
        this.arrow = scene.add.graphics().setVisible(false);
        this.images = Array.from({ length: MAX_ICONS }, () => new ArtImage(scene));
    }

    render(icon: IconId, groups: readonly number[], framed: boolean, rect: Rect, motion?: 'come' | 'go'): void {
        this.setVisible(false);
        this.area = rect;
        const look = TASK_LAYOUT.iconMotion;
        // A motion arrow takes a strip on the left; the two groups stand one under the other in the rest.
        const inner = motion ? { x: rect.x + look.strip, y: rect.y, width: rect.width - look.strip, height: rect.height } : rect;
        const layout = iconsLayout(groups, framed, inner, TASK_LAYOUT.icons);
        if (layout.frames.length > 0) {
            const frame = TASK_LAYOUT.icons;
            this.frames.setVisible(true).fillStyle(PLACEHOLDER_COLORS.tile, 1).lineStyle(frame.border, PLACEHOLDER_COLORS.deepTeal, 1);
            for (const f of layout.frames) {
                this.frames.fillRoundedRect(f.x, f.y, f.width, f.height, frame.radius).strokeRoundedRect(f.x, f.y, f.width, f.height, frame.radius);
            }
        }
        layout.icons.forEach((spot, i) => this.images[i]?.show(ART_KEYS.icon(icon), spot));
        const first = layout.icons[0];
        const second = layout.icons[groups[0] ?? 0];
        if (motion && first && second) {
            this.drawArrow(motion, rect.x + look.strip / 2, first.y + first.height / 2, second.y + second.height / 2);
        }
    }

    /** "come": a solid arrow from the second group up to the first; "go": a dashed arrow from the first group down and away. */
    private drawArrow(motion: 'come' | 'go', x: number, firstY: number, secondY: number): void {
        const look = TASK_LAYOUT.iconMotion;
        const g = this.arrow.setVisible(true).clear().fillStyle(PLACEHOLDER_COLORS.deepTeal, 1);
        const up = motion === 'come';
        const from = up ? secondY : firstY;
        const to = up ? firstY : secondY;
        const dir = Math.sign(to - from);
        const tip = to;
        const headBase = tip - dir * look.head;
        if (up) {
            g.fillRect(x - look.shaft / 2, Math.min(headBase, from), look.shaft, Math.abs(headBase - from));
        } else {
            for (let at = 0; at < Math.abs(headBase - from); at += look.dash + look.dashGap) {
                const len = Math.min(look.dash, Math.abs(headBase - from) - at);
                g.fillRect(x - look.shaft / 2, from + at, look.shaft, len);
            }
        }
        g.fillTriangle(x - look.head / 2, headBase, x + look.head / 2, headBase, x, tip);
    }

    setVisible(visible: boolean): void {
        if (!visible) {
            this.frames.clear().setVisible(false);
            this.arrow.clear().setVisible(false);
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
