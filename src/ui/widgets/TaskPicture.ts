import type { Scene } from 'phaser';
import type { TaskVisual } from '../../core/tasks/visual';
import { BalanceScale } from './BalanceScale';
import { BarChart } from './BarChart';
import { BaseTenBlocks } from './BaseTenBlocks';
import { ClockFace } from './ClockFace';
import type { Rect } from './geometry';
import { MoneyTable } from './MoneyTable';
import { Ruler } from './Ruler';

/** The drawing of a task: picks the widget of its kind and draws it in the given rectangle. */
export class TaskPicture {
    private readonly clock: ClockFace;
    private readonly ruler: Ruler;
    private readonly blocks: BaseTenBlocks;
    private readonly chart: BarChart;
    private readonly money: MoneyTable;
    private readonly scale: BalanceScale;
    private area: Rect | null = null;
    private drawn: { shown(): boolean; art?(): { key: string; loaded: boolean }[] } | null = null;

    constructor(scene: Scene) {
        this.clock = new ClockFace(scene);
        this.ruler = new Ruler(scene);
        this.blocks = new BaseTenBlocks(scene);
        this.chart = new BarChart(scene);
        this.money = new MoneyTable(scene);
        this.scale = new BalanceScale(scene);
    }

    /** Draws `visual` in `rect`; null hides the picture. */
    render(visual: TaskVisual | null, rect: Rect): void {
        this.hide();
        if (!visual) {
            return;
        }
        this.area = rect;
        // Jugs, thermometer and icons get their widgets in S-14 phases 6-7.
        const widgets: Partial<Record<TaskVisual['kind'], { shown(): boolean; art?(): { key: string; loaded: boolean }[] }>> = {
            clock: this.clock,
            ruler: this.ruler,
            blocks: this.blocks,
            bars: this.chart,
            money: this.money,
            scale: this.scale,
        };
        this.drawn = widgets[visual.kind] ?? null;
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
            case 'money':
                this.money.render(visual.items, rect);
                break;
            case 'scale':
                this.scale.render(visual.item, visual.weights, rect);
                break;
            case 'jugs':
            case 'thermometer':
            case 'icons':
                break;
            default: {
                const unreachable: never = visual;
                throw new Error(`unknown visual ${JSON.stringify(unreachable)}`);
            }
        }
    }

    hide(): void {
        this.area = null;
        this.drawn = null;
        this.clock.setVisible(false);
        this.ruler.setVisible(false);
        this.blocks.setVisible(false);
        this.chart.setVisible(false);
        this.money.setVisible(false);
        this.scale.setVisible(false);
    }

    /** The art images on screen now (texture key and whether loaded), from the widget's own objects; [] while hidden or for a drawing without art. */
    art(): { key: string; loaded: boolean }[] {
        return this.drawn?.shown() ? (this.drawn.art?.() ?? []) : [];
    }

    /** The rectangle the picture was drawn in, null while hidden or while its widget is not on screen (e2e hook). */
    bounds(): Rect | null {
        return this.area && this.drawn?.shown() ? { ...this.area } : null;
    }
}
