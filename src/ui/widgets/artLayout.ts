// Placement of the art drawings of a task (S-14): pure rectangles, so the widgets and the tests share them.
import type { MoneyId } from '../../data/measures';
import type { Rect } from './geometry';

export interface MoneyLayoutSpec {
    noteWidth: number;
    noteHeight: number;
    gap: number;
    rowGap: number;
    coinPerMm: number;
    maxScale: number;
    coinMm: Readonly<Record<string, number>>;
}

export interface Placed {
    id: MoneyId;
    rect: Rect;
}

const isNote = (id: MoneyId): boolean => id.startsWith('note-');

/** Notes in the upper row, coins in the lower one, each row centred; the whole table fits `area`, never above `maxScale`. */
export const moneyLayout = (items: readonly MoneyId[], area: Rect, spec: MoneyLayoutSpec): Placed[] => {
    const notes = items.filter(isNote);
    const coins = items.filter((id) => !isNote(id));
    const size = (id: MoneyId): { width: number; height: number } => {
        if (isNote(id)) return { width: spec.noteWidth, height: spec.noteHeight };
        const d = (spec.coinMm[id] ?? 20) * spec.coinPerMm;
        return { width: d, height: d };
    };
    const rows = [notes, coins].filter((row) => row.length > 0);
    const rowWidth = (row: readonly MoneyId[]): number => row.reduce((sum, id) => sum + size(id).width, 0) + (row.length - 1) * spec.gap;
    const rowHeight = (row: readonly MoneyId[]): number => Math.max(...row.map((id) => size(id).height));
    const widthUnits = Math.max(...rows.map(rowWidth));
    const heightUnits = rows.reduce((sum, row) => sum + rowHeight(row), 0) + (rows.length - 1) * spec.rowGap;
    const s = Math.min(area.width / widthUnits, area.height / heightUnits, spec.maxScale);
    let y = area.y + (area.height - heightUnits * s) / 2;
    const out: Placed[] = [];
    for (const row of rows) {
        const h = rowHeight(row) * s;
        let x = area.x + (area.width - rowWidth(row) * s) / 2;
        for (const id of row) {
            const { width, height } = size(id);
            out.push({ id, rect: { x, y: y + (h - height * s) / 2, width: width * s, height: height * s } });
            x += (width + spec.gap) * s;
        }
        y += h + spec.rowGap * s;
    }
    return out;
};

export interface ScaleLayoutSpec {
    imageWidth: number;
    imageHeight: number;
    panLeft: { x: number; y: number };
    panRight: { x: number; y: number };
    itemSize: number;
    weightSize: number;
    weightGap: number;
    perRow: number;
    rowLift: number;
}

export interface ScaleLayout {
    scale: Rect;
    item: Rect;
    weights: Rect[];
}

/** The scale image fitted in `area`; the item stands on the left pan, `weightCount` weights on the right one (rows of `perRow`, rising). */
export const scaleLayout = (weightCount: number, area: Rect, spec: ScaleLayoutSpec): ScaleLayout => {
    const s = Math.min(area.width / spec.imageWidth, area.height / spec.imageHeight);
    const left = area.x + (area.width - spec.imageWidth * s) / 2;
    const top = area.y + (area.height - spec.imageHeight * s) / 2;
    const at = (x: number, y: number): { x: number; y: number } => ({ x: left + x * s, y: top + y * s });
    const sq = (centreX: number, bottom: number, size: number): Rect => {
        const p = at(centreX, bottom);
        return { x: p.x - (size * s) / 2, y: p.y - size * s, width: size * s, height: size * s };
    };
    const weights: Rect[] = [];
    for (let i = 0; i < weightCount; i += 1) {
        const row = Math.floor(i / spec.perRow);
        const inRow = Math.min(spec.perRow, weightCount - row * spec.perRow);
        const col = i - row * spec.perRow;
        const rowWidth = inRow * spec.weightSize + (inRow - 1) * spec.weightGap;
        const centreX = spec.panRight.x - rowWidth / 2 + spec.weightSize / 2 + col * (spec.weightSize + spec.weightGap);
        weights.push(sq(centreX, spec.panRight.y - row * spec.rowLift, spec.weightSize));
    }
    return {
        scale: { x: left, y: top, width: spec.imageWidth * s, height: spec.imageHeight * s },
        item: sq(spec.panLeft.x, spec.panLeft.y, spec.itemSize),
        weights,
    };
};

export interface JugsLayoutSpec {
    imageSize: number;
    visible: { x: number; y: number; width: number; height: number };
    gap: number;
    rowGap: number;
    maxPerRow: number;
    maxScale: number;
}

export interface JugsLayout {
    /** The square image rectangle of each jug. */
    images: Rect[];
    /** The part of each image that holds the jug (the shared visible rectangle), which is what must stay apart and inside the area. */
    jugs: Rect[];
}

/** Jugs in a row (two rows from `maxPerRow` + 1 jugs), each row centred; the visible part of every jug fits `area`. */
export const jugsLayout = (count: number, area: Rect, spec: JugsLayoutSpec): JugsLayout => {
    const rows = Math.ceil(count / spec.maxPerRow);
    const perRow = Math.ceil(count / rows);
    const v = spec.visible;
    const widthUnits = perRow * v.width + (perRow - 1) * spec.gap;
    const heightUnits = rows * v.height + (rows - 1) * spec.rowGap;
    const s = Math.min(area.width / widthUnits, area.height / heightUnits, spec.maxScale);
    const top = area.y + (area.height - heightUnits * s) / 2;
    const images: Rect[] = [];
    const jugs: Rect[] = [];
    for (let i = 0; i < count; i += 1) {
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, count - row * perRow);
        const col = i - row * perRow;
        const rowWidth = (inRow * v.width + (inRow - 1) * spec.gap) * s;
        const x = area.x + (area.width - rowWidth) / 2 + col * (v.width + spec.gap) * s;
        const y = top + row * (v.height + spec.rowGap) * s;
        jugs.push({ x, y, width: v.width * s, height: v.height * s });
        images.push({ x: x - v.x * s, y: y - v.y * s, width: spec.imageSize * s, height: spec.imageSize * s });
    }
    return { images, jugs };
};

export interface ThermometerLayoutSpec {
    frameWidth: number;
    frameHeight: number;
}

/** The thermometer housing fitted in `area` with its proportions kept; `scale` maps the 512 x 1536 face units to the screen. */
export const thermometerLayout = (area: Rect, spec: ThermometerLayoutSpec): { frame: Rect; scale: number } => {
    const scale = Math.min(area.width / spec.frameWidth, area.height / spec.frameHeight);
    const width = spec.frameWidth * scale;
    const height = spec.frameHeight * scale;
    return { frame: { x: area.x + (area.width - width) / 2, y: area.y + (area.height - height) / 2, width, height }, scale };
};

export interface ThermometerMark {
    value: number;
    kind: 'major' | 'five' | 'minor';
}

/**
 * The marks of the scale: every ten is major, every five a medium one, and a single degree gets a mark only when two marks
 * are at least `minGapPx` apart on screen (otherwise every second degree, a multiple of five always stays).
 */
export const thermometerMarks = (min: number, max: number, pxPerDegree: number, minGapPx: number): ThermometerMark[] => {
    const every = pxPerDegree >= minGapPx ? 1 : 2;
    const out: ThermometerMark[] = [];
    for (let value = min; value <= max; value += 1) {
        const kind = value % 10 === 0 ? 'major' : value % 5 === 0 ? 'five' : 'minor';
        if (kind !== 'minor' || value % every === 0) out.push({ value, kind });
    }
    return out;
};
