// DESIGN-GAP 65 (docs/design-gaps.md): the thermometer is tall: beside the keypad, in the solution phase, it needs a column (rev. of rows 52 and 57).
// Where a task's drawing and its solution lines go (S-13): pure rectangles in the 1920x1080 scene space.
// The numbers come in as data (TASK_LAYOUT.picture); this file only decides which rectangle applies.
import type { Rect } from '../geometry';
import type { AnswerMode, VisualShape } from '../tasks/visual';

export type PictureRect = Rect;

export interface PictureSpec {
    promptY: number;
    tiles: PictureRect;
    tilesSolution: { picture: PictureRect; lines: PictureRect };
    keypad: PictureRect;
    keypadSolution: { picture: PictureRect; lines: PictureRect };
    /** A tall drawing (thermometer) beside the keypad solution: the drawing in a narrow column, the lines next to it. */
    keypadBeside: { picture: PictureRect; lines: PictureRect };
}

/**
 * The drawing rectangle and, while the solution steps are shown, the rectangle of their lines.
 * `lines: null` means the lines keep their place for a task without a drawing (under the prompt).
 * `select` and `drag` tasks carry no drawing today and fall back to the tiles area; that area overlaps the select tiles
 * (`TASK_LAYOUT.select.top`), so a pictured select or drag task needs its own area first.
 */
export const pictureLayout = (
    spec: PictureSpec,
    input: AnswerMode,
    solution: boolean,
    shape: VisualShape,
): { picture: PictureRect; lines: PictureRect | null } => {
    if (input === 'keypad') {
        if (solution && shape === 'tall') {
            return spec.keypadBeside;
        }
        return solution ? spec.keypadSolution : { picture: spec.keypad, lines: null };
    }
    return solution ? spec.tilesSolution : { picture: spec.tiles, lines: null };
};

/**
 * The drawing rectangle kept under the prompt: its top moves down to `promptBottom + gap` when a long prompt ends below it,
 * its bottom stays (the drawing then scales down into what is left). Height never goes below 0.
 */
export const belowPrompt = (rect: PictureRect, promptBottom: number, gap: number): PictureRect => {
    const top = Math.max(rect.y, promptBottom + gap);
    return { x: rect.x, y: top, width: rect.width, height: Math.max(0, rect.y + rect.height - top) };
};

/** The largest size from `max` down to `min` in `step`s for which `fits(size)` holds; `min` when none does. */
export const fitSize = (max: number, min: number, step: number, fits: (size: number) => boolean): number => {
    for (let size = max; size > min; size -= step) {
        if (fits(size)) {
            return size;
        }
    }
    return min;
};

/** Hand angles of a 12-hour dial in degrees clockwise from 12; the hour hand moves with the minutes. */
export const clockHandAngles = (hour: number, minute: number): { hour: number; minute: number } => ({
    hour: (((hour % 12) + minute / 60) * 30) % 360,
    minute: minute * 6,
});
