import type { Scene } from 'phaser';
import type { TaskVisual } from '../../core/tasks/visual';
import { BalanceScale } from './BalanceScale';
import { BarChart } from './BarChart';
import { BaseTenBlocks } from './BaseTenBlocks';
import { ClockFace } from './ClockFace';
import type { Rect } from './geometry';
import { FigureGrid } from './FigureGrid';
import { IconGroups } from './IconGroups';
import { CoordGrid } from './CoordGrid';
import { Jugs } from './Jugs';
import { MoneyTable } from './MoneyTable';
import { NumberCells } from './NumberCells';
import { Ruler } from './Ruler';
import { Thermometer } from './Thermometer';

/** The drawing of a task: picks the widget of its kind and draws it in the given rectangle. */
export class TaskPicture {
    private readonly clock: ClockFace;
    private readonly ruler: Ruler;
    private readonly blocks: BaseTenBlocks;
    private readonly chart: BarChart;
    private readonly money: MoneyTable;
    private readonly scale: BalanceScale;
    private readonly jugs: Jugs;
    private readonly thermometer: Thermometer;
    private readonly icons: IconGroups;
    private readonly cells: NumberCells;
    private readonly coord: CoordGrid;
    private readonly figure: FigureGrid;
    private area: Rect | null = null;
    private drawn: { shown(): boolean; art?(): { key: string; loaded: boolean }[] } | null = null;

    constructor(scene: Scene) {
        this.clock = new ClockFace(scene);
        this.ruler = new Ruler(scene);
        this.blocks = new BaseTenBlocks(scene);
        this.chart = new BarChart(scene);
        this.money = new MoneyTable(scene);
        this.scale = new BalanceScale(scene);
        this.jugs = new Jugs(scene);
        this.thermometer = new Thermometer(scene);
        this.icons = new IconGroups(scene);
        this.cells = new NumberCells(scene);
        this.coord = new CoordGrid(scene);
        this.figure = new FigureGrid(scene);
    }

    /** Draws `visual` in `rect`; null hides the picture. */
    render(visual: TaskVisual | null, rect: Rect): void {
        this.hide();
        if (!visual) {
            return;
        }
        this.area = rect;
        const widgets: Partial<Record<TaskVisual['kind'], { shown(): boolean; art?(): { key: string; loaded: boolean }[] }>> = {
            clock: this.clock,
            ruler: this.ruler,
            blocks: this.blocks,
            bars: this.chart,
            money: this.money,
            scale: this.scale,
            jugs: this.jugs,
            thermometer: this.thermometer,
            icons: this.icons,
            cells: this.cells,
            grid: this.coord,
            figure: this.figure,
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
                this.jugs.render(visual.jugs, rect);
                break;
            case 'thermometer':
                this.thermometer.render(visual.celsius, rect);
                break;
            case 'icons':
                this.icons.render(visual.icon, visual.groups, visual.framed, rect);
                break;
            case 'cells':
                this.cells.render(visual.layout, visual.values, rect);
                break;
            case 'grid':
                this.coord.render(visual.columns, visual.rows, visual.items, rect);
                break;
            case 'figure':
                this.figure.render(visual, rect);
                break;
            case 'column':
            case 'numberLine':
                throw new Error(`no widget for the ${visual.kind} drawing yet`);
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
        this.jugs.setVisible(false);
        this.thermometer.setVisible(false);
        this.icons.setVisible(false);
        this.cells.setVisible(false);
        this.coord.setVisible(false);
        this.figure.setVisible(false);
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
