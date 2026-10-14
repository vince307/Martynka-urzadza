import type { Scene } from 'phaser';
import type { JugId } from '../../data/measures';
import { JUG_VISIBLE_RECT } from '../../data/measures';
import { TASK_LAYOUT } from '../../data/layout';
import { ART_KEYS } from '../../data/taskArt';
import { ArtImage } from './ArtImage';
import { jugsLayout } from './artLayout';
import type { Rect } from './geometry';

const MAX_JUGS = 10;

/** A row of jugs (1 l, 1/2 l, 1/4 l) of the art kit, two rows from six jugs (S-14). */
export class Jugs {
    private readonly images: ArtImage[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        this.images = Array.from({ length: MAX_JUGS }, () => new ArtImage(scene));
    }

    render(jugs: readonly JugId[], rect: Rect): void {
        this.setVisible(false);
        this.area = rect;
        const layout = jugsLayout(jugs.length, rect, { ...TASK_LAYOUT.jugs, imageSize: 512, visible: JUG_VISIBLE_RECT });
        jugs.forEach((id, i) => {
            const spot = layout.images[i];
            if (spot) this.images[i]?.show(ART_KEYS.measuring(id), spot);
        });
    }

    setVisible(visible: boolean): void {
        if (!visible) {
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
