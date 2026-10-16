// Whether a drawn grid keeps its cells readable in the rectangle a mode gives it (audit GRD-04): pure geometry shared by the widgets and the tests.
// The floor is TASK_LAYOUT.figure.minCell, read here only; a drawing below it is a layout bug, never a reason to lower the floor.
import { TASK_LAYOUT } from '../../data/layout';
import type { Rect } from '../geometry';
import type { TaskVisual } from '../tasks/visual';
import { figureLayout } from './figureLayout';

export type CellsLayout = 'square3' | 'pyramid3';

/** Position of every cell in cell units (x, y of the top-left corner), in value order: row-major for the square, top then middle then base for the pyramid. */
export const cellPositions = (layout: CellsLayout): readonly { x: number; y: number }[] => {
    if (layout === 'square3') {
        return Array.from({ length: 9 }, (_, i) => ({ x: i % 3, y: Math.floor(i / 3) }));
    }
    return [
        { x: 1, y: 0 },
        { x: 0.5, y: 1 },
        { x: 1.5, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
    ];
};

/** Scale of the 3 x 3 block of number cells in `rect`. */
export const cellsScale = (rect: Rect, look: { cell: number; maxScale: number }): number =>
    Math.min(rect.width / (3 * look.cell), rect.height / (3 * look.cell), look.maxScale);

/** Scale of a coordinate grid of `columns` x `rows` with its label strips in `rect`. */
export const coordScale = (columns: number, rows: number, rect: Rect, look: { cell: number; labelInset: number; labelDrop: number; maxScale: number }): number =>
    Math.min(rect.width / (look.labelInset + columns * look.cell), rect.height / (look.labelDrop + rows * look.cell), look.maxScale);

type FitLayout = Pick<typeof TASK_LAYOUT, 'cells' | 'coord' | 'figure'>;

/**
 * A lattice figure is drawn on cells, so its cell must reach the floor. A free figure has no cells (its unit is only a scale), so its
 * thinnest side must reach the floor: a 2 x 4 rectangle at 27 px per unit is a 55 x 110 px shape, readable, while a 1-unit-thin one is not.
 */
const figureFits = (figure: Extract<TaskVisual, { kind: 'figure' }>, rect: Rect, look: FitLayout['figure']): boolean => {
    const { cell } = figureLayout(figure, rect, look);
    if (figure.lattice) {
        return cell >= look.minCell;
    }
    const xs = figure.vertices.map((v) => v[0]);
    const ys = figure.vertices.map((v) => v[1]);
    const thin = Math.min(Math.max(1, Math.max(...xs) - Math.min(...xs)), Math.max(1, Math.max(...ys) - Math.min(...ys)));
    return thin * cell >= look.minCell;
};

/** True when every cell of the drawing is at least `figure.minCell` pixels in `rect`; kinds without cells are always true. */
export const drawingFit = (visual: TaskVisual, rect: Rect, layout: FitLayout = TASK_LAYOUT): boolean => {
    const floor = layout.figure.minCell;
    switch (visual.kind) {
        case 'cells': return cellsScale(rect, layout.cells) * layout.cells.cell >= floor;
        case 'grid': return coordScale(visual.columns, visual.rows, rect, layout.coord) * layout.coord.cell >= floor;
        case 'figure': return figureFits(visual, rect, layout.figure);
        case 'clock': case 'ruler': case 'blocks': case 'bars': case 'money': case 'scale': case 'jugs': case 'thermometer':
        case 'icons': case 'row': case 'column': case 'numberLine': case 'pattern': case 'arrows':
            return true;
        default: { const _exhaustive: never = visual; return _exhaustive; }
    }
};
