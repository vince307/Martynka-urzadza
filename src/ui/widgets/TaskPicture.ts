import type { Scene } from 'phaser';
import type { TaskVisual } from '../../core/tasks/visual';
import { BarChart } from './BarChart';
import { BaseTenBlocks } from './BaseTenBlocks';
import { ClockFace } from './ClockFace';
import type { Rect } from './geometry';
import { Ruler } from './Ruler';

/** The drawing of a task: picks the widget of its kind and draws it in the given rectangle. */
export class TaskPicture {
    private readonly clock: ClockFace;
    private readonly ruler: Ruler;
    private readonly blocks: BaseTenBlocks;
    private readonly chart: BarChart;
    private area: Rect | null = null;

    constructor(scene: Scene) {
        this.clock = new ClockFace(scene);
        this.ruler = new Ruler(scene);
        this.blocks = new BaseTenBlocks(scene);
        this.chart = new BarChart(scene);
    }

    /** Draws `visual` in `rect`; null hides the picture. */
    render(visual: TaskVisual | null, rect: Rect): void {
        this.hide();
        if (!visual) {
            return;
        }
        this.area = rect;
        switch (visual.kind) {
            case 'clock':
                this.clock.render(visual.hour, visual.minute, rect);
                break;
            case 'ruler':
                this.ruler.render(visual.unit, visual.lengthCm, visual.fromMm, visual.toMm, rect);
                break;
            case 'blocks':
                this.blocks.render(visual.hundreds, visual.tens, visual.ones, rect);
                break;
            case 'bars':
                this.chart.render(visual.bars, visual.scaleMax, rect);
                break;
        }
    }

    hide(): void {
        this.area = null;
        this.clock.setVisible(false);
        this.ruler.setVisible(false);
        this.blocks.setVisible(false);
        this.chart.setVisible(false);
    }

    /** The rectangle the picture was drawn in, null while hidden (e2e hook). */
    bounds(): Rect | null {
        return this.area ? { ...this.area } : null;
    }
}
