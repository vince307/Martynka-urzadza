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
    /** The part of each weight that no row in front of it covers (the whole weight in the front row): where a stand-in box and its label go. */
    uncovered: Rect[];
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
    const uncovered: Rect[] = [];
    for (let i = 0; i < weightCount; i += 1) {
        const row = Math.floor(i / spec.perRow);
        const inRow = Math.min(spec.perRow, weightCount - row * spec.perRow);
        const col = i - row * spec.perRow;
        const rowWidth = inRow * spec.weightSize + (inRow - 1) * spec.weightGap;
        const centreX = spec.panRight.x - rowWidth / 2 + spec.weightSize / 2 + col * (spec.weightSize + spec.weightGap);
        const weight = sq(centreX, spec.panRight.y - row * spec.rowLift, spec.weightSize);
        weights.push(weight);
        // A row stands `rowLift` above the one in front of it, which hides its lower part.
        uncovered.push(row === 0 ? weight : { ...weight, height: Math.min(spec.weightSize, spec.rowLift) * s });
    }
    return {
        scale: { x: left, y: top, width: spec.imageWidth * s, height: spec.imageHeight * s },
        item: sq(spec.panLeft.x, spec.panLeft.y, spec.itemSize),
        weights,
        uncovered,
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

export interface IconsLayoutSpec {
    /** Gap of two icons in a group, in icon sizes. */
    gap: number;
    /** Most icons in a row of a group; more go to further rows. */
    maxPerRow: number;
    /** Padding between a group frame and its icons, in icon sizes. */
    framePad: number;
    /** Gap between two group frames (or the rows of frames), in icon sizes. */
    frameGap: number;
    /** The largest icon on screen, in scene pixels. */
    maxIcon: number;
}

export interface IconsLayout {
    icons: Rect[];
    /** One rectangle per group when `framed`, else empty. */
    frames: Rect[];
    /** The side of one icon in scene pixels. */
    icon: number;
}

/**
 * Icons of a counting or multiplication drawing in `area`. One group is a grid (rows of up to `maxPerRow`); `[10, k]` puts the ten in one row
 * and the rest left-aligned under it; framed groups stand in a frame each, shaped (1-3 rows of icons, frames per line) for the largest icon.
 * The whole picture fits `area`, never above `maxIcon`.
 */
export const iconsLayout = (groups: readonly number[], framed: boolean, area: Rect, spec: IconsLayoutSpec): IconsLayout => {
    const pad = framed ? spec.framePad : 0;
    type Block = { count: number; cols: number; rows: number; width: number; height: number };
    const block = (count: number, rows: number): Block => {
        const cols = Math.ceil(count / rows);
        return { count, cols, rows, width: cols + (cols - 1) * spec.gap + 2 * pad, height: rows + (rows - 1) * spec.gap + 2 * pad };
    };
    const arrange = (blocks: Block[], perLine: number) => {
        const lines: Block[][] = [];
        for (let i = 0; i < blocks.length; i += perLine) lines.push(blocks.slice(i, i + perLine));
        const lineWidth = (line: Block[]): number => line.reduce((sum, b) => sum + b.width, 0) + (line.length - 1) * spec.frameGap;
        const lineHeight = (line: Block[]): number => Math.max(...line.map((b) => b.height));
        const widthUnits = Math.max(...lines.map(lineWidth));
        const heightUnits = lines.reduce((sum, line) => sum + lineHeight(line), 0) + (lines.length - 1) * spec.frameGap;
        return { lines, lineWidth, lineHeight, widthUnits, heightUnits, icon: Math.min(area.width / widthUnits, area.height / heightUnits, spec.maxIcon) };
    };
    let best: ReturnType<typeof arrange>;
    if (framed) {
        // Visual gate S-14: every group in one row of icons left the icons small; the group shape (rows per frame, the same for every
        // group) and the frames per line are the ones that give the largest icon (ties keep fewer rows and more frames per line).
        best = arrange(groups.map((count) => block(count, 1)), groups.length <= 3 ? groups.length : Math.ceil(groups.length / 2));
        const most = Math.max(...groups);
        for (let rows = 1; rows <= Math.min(3, most); rows += 1) {
            for (let perLine = groups.length; perLine >= 1; perLine -= 1) {
                const candidate = arrange(groups.map((count) => block(count, Math.min(rows, count))), perLine);
                if (candidate.icon > best.icon + 1e-9) best = candidate;
            }
        }
    } else {
        // One group is a grid of rows of up to maxPerRow; [10, k] keeps the ten in one row and the rest under it.
        const stacked = groups.length > 1;
        best = arrange(groups.map((count) => (stacked ? block(count, 1) : block(count, Math.ceil(count / spec.maxPerRow)))), 1);
    }
    const { lines, lineWidth, lineHeight, widthUnits, heightUnits, icon } = best;
    const left = area.x + (area.width - widthUnits * icon) / 2;
    let y = area.y + (area.height - heightUnits * icon) / 2;
    const icons: Rect[] = [];
    const frames: Rect[] = [];
    for (const line of lines) {
        let x = framed ? area.x + (area.width - lineWidth(line) * icon) / 2 : left;
        for (const b of line) {
            if (framed) frames.push({ x, y, width: b.width * icon, height: b.height * icon });
            for (let i = 0; i < b.count; i += 1) {
                const row = Math.floor(i / b.cols);
                const col = i - row * b.cols;
                icons.push({ x: x + (pad + col * (1 + spec.gap)) * icon, y: y + (pad + row * (1 + spec.gap)) * icon, width: icon, height: icon });
            }
            x += (b.width + spec.frameGap) * icon;
        }
        y += (lineHeight(line) + spec.frameGap) * icon;
    }
    return { icons, frames, icon };
};

export interface StandInLabelFit {
    /** 1 = the label on one line, 2 = broken at its space ("10" over "dag"). */
    lines: 1 | 2;
    /** Scale of the label text, at most 1 (the text never grows). */
    scale: number;
}

/**
 * How the label of a stand-in box fits the box (visual gate, impl-review F1): one line, or two when the label has a space and two
 * lines keep it larger. `oneLine`/`twoLines` are the label's size at scale 1; `padding` stays free on every side, narrowed to
 * `paddingShare` of the box's shorter side in a small box (a weight beside the keypad), where every pixel goes to the text.
 */
export const standInLabelFit = (
    box: { width: number; height: number },
    oneLine: { width: number; height: number },
    twoLines: { width: number; height: number } | null,
    spacing: { padding: number; paddingShare: number },
): StandInLabelFit => {
    const padding = Math.min(spacing.padding, spacing.paddingShare * Math.min(box.width, box.height));
    const room = (text: { width: number; height: number }): number =>
        Math.min(1, (box.width - 2 * padding) / text.width, (box.height - 2 * padding) / text.height);
    const one = room(oneLine);
    if (one >= 1 || !twoLines) {
        return { lines: 1, scale: Math.max(0, one) };
    }
    const two = room(twoLines);
    return two > one ? { lines: 2, scale: Math.max(0, two) } : { lines: 1, scale: Math.max(0, one) };
};
