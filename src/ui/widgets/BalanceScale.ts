// DESIGN-GAP 60 (docs/design-gaps.md): the kit scale has no tilt and no gram weights: beam and pans are separate pieces, there is no 1 g, 5 dag or tonne weight.
import type { Scene } from 'phaser';
import type { IconId, WeightId } from '../../data/measures';
import { TASK_LAYOUT } from '../../data/layout';
import { ART_KEYS } from '../../data/taskArt';
import { ART_LIMITS } from '../../data/measures';
import { ArtImage } from './ArtImage';
import { scaleLayout } from './artLayout';
import type { Rect } from './geometry';

const MAX_WEIGHTS = ART_LIMITS.weights;   // one pooled image per piece validateVisual allows

/** A balance scale in balance: the item in the left pan, the weights in the right one (S-14). */
export class BalanceScale {
    private readonly base: ArtImage;
    private readonly item: ArtImage;
    private readonly weights: ArtImage[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        // Created in drawing order: the scale first, the things lie on it.
        this.base = new ArtImage(scene);
        this.item = new ArtImage(scene);
        this.weights = Array.from({ length: MAX_WEIGHTS }, () => new ArtImage(scene));
    }

    render(item: IconId, weights: readonly WeightId[], rect: Rect): void {
        this.setVisible(false);
        this.area = rect;
        const layout = scaleLayout(weights.length, rect, TASK_LAYOUT.scale);
        this.base.show(ART_KEYS.scale, layout.scale);
        this.item.show(ART_KEYS.icon(item), layout.item);
        weights.forEach((id, i) => {
            const spot = layout.weights[i];
            // The first row is drawn last (on top of the row behind it).
            if (spot) this.weights[MAX_WEIGHTS - 1 - i]?.show(ART_KEYS.measuring(id), spot, layout.uncovered[i]);
        });
    }

    setVisible(visible: boolean): void {
        if (!visible) {
            [this.base, this.item, ...this.weights].forEach((image) => image.hide());
        }
    }

    shown(): boolean {
        return this.art().length > 0;
    }

    art(): { key: string; loaded: boolean }[] {
        return [this.base, this.item, ...this.weights].flatMap((image) => image.state() ?? []);
    }

    bounds(): Rect {
        return this.area;
    }
}
