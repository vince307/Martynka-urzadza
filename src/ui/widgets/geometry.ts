// Touch-target rectangles of the task screen in the 1920x1080 scene space.
// Pure functions (no Phaser) so the same rectangles feed the widgets and the tests.
import type { Rect } from '../../core/geometry';
import type { KeypadKey } from '../../core/round/keypad';

export type { Rect };

export interface TileSpec {
    width: number;
    height: number;
    gap: number;
}

export interface KeypadSpec {
    left: number;
    top: number;
    keyWidth: number;
    keyHeight: number;
    gap: number;
    rowGap: number;
    fieldHeight: number;
}

/** `count` tiles in one row, centred horizontally in `area`, top-aligned to it. */
export const tileRow = (count: number, area: Rect, spec: TileSpec): Rect[] => {
    const total = count * spec.width + Math.max(0, count - 1) * spec.gap;
    const left = area.x + (area.width - total) / 2;
    return Array.from({ length: count }, (_, i) => ({
        x: left + i * (spec.width + spec.gap),
        y: area.y,
        width: spec.width,
        height: spec.height,
    }));
};

const KEY_ROWS: KeypadKey[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['delete', '0', 'ok'],
];

export interface KeypadGrid {
    field: Rect;
    keys: { key: KeypadKey; rect: Rect }[];
}

/** Entry field above a 3-column grid: 1-9, then kasuj, 0, OK. */
export const keypadGrid = (spec: KeypadSpec): KeypadGrid => {
    const width = 3 * spec.keyWidth + 2 * spec.gap;
    const keysTop = spec.top + spec.fieldHeight + spec.rowGap;
    return {
        field: { x: spec.left, y: spec.top, width, height: spec.fieldHeight },
        keys: KEY_ROWS.flatMap((row, r) =>
            row.map((key, c) => ({
                key,
                rect: {
                    x: spec.left + c * (spec.keyWidth + spec.gap),
                    y: keysTop + r * (spec.keyHeight + spec.rowGap),
                    width: spec.keyWidth,
                    height: spec.keyHeight,
                },
            })),
        ),
    };
};
