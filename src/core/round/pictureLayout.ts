// DESIGN-GAP 65 (docs/design-gaps.md): the thermometer is tall: it takes a column on the left in every phase, the answers and the bar move right of it (rev. of rows 52 and 57).
// Where a task's drawing and its solution lines go (S-13; S-14b adds the written column `digits` and the hint drawing under the expression): pure rectangles in the 1920x1080 scene space.
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
    /** A pictured `select` task: the drawing sits above the tiles (STUB). */
    select: { picture: PictureRect; solution: { picture: PictureRect; lines: PictureRect } };
    /** A clock to set (`drag`): the drawing takes the mat, the solution lines the tray's place. */
    drag: { picture: PictureRect; lines: PictureRect };
    /** A written column (`digits`): the column stays in one place in every phase, the solution lines beside it. */
    digits: { picture: PictureRect; lines: PictureRect };
    /** The hint drawing (a number line under the expression, keypad only): the drawing and the solution lines under it. */
    hint: { keypad: { picture: PictureRect; lines: PictureRect } };
    /** Smallest height a drawing keeps under a long prompt. */
    minHeight: number;
    /** A tall drawing (thermometer): a column in every phase; the tiles row and the bar move right of it. */
    tall: { tiles: TallSpec; keypad: TallSpec };
    /** A long drawing (a number line) in a tiles task: the notebook's full width, the solution lines under it, both above the tiles. */
    long: { tiles: PictureRect; tilesSolution: { picture: PictureRect; lines: PictureRect } };
}

/** A horizontal span (x, width) in scene pixels. */
export interface Span {
    x: number;
    width: number;
}

export interface TallSpec {
    picture: PictureRect;
    lines: PictureRect;
    bar: Span;
    /** The row the answer tiles centre in (tiles mode only). */
    answers?: Span;
}

const forSkill = (skillId?: string): string => (skillId ? ` (skill ${skillId})` : '');

const tallOf = (spec: PictureSpec, input: AnswerMode, skillId?: string): TallSpec => {
    switch (input) {
        case 'keypad': return spec.tall.keypad;
        case 'tiles': return spec.tall.tiles;
        case 'drag': case 'select': case 'digits': throw new Error(`no tall drawing for the ${input} mode${forSkill(skillId)}`);
        default: { const _exhaustive: never = input; return _exhaustive; }
    }
};

/**
 * The drawing rectangle and, while the solution steps are shown, the rectangle of their lines.
 * `lines: null` means the lines keep their place for a task without a drawing (under the prompt).
 * A pictured `select` task keeps its drawing above the select tiles; a `drag` drawing (the clock to set) takes the mat; a long drawing
 * (a number line) of a tiles task takes the full width; beside the keypad it keeps the wide rectangles.
 */
export const pictureLayout = (
    spec: PictureSpec,
    input: AnswerMode,
    solution: boolean,
    shape: VisualShape,
    skillId?: string,
): { picture: PictureRect; lines: PictureRect | null } => {
    if (shape === 'tall') {
        const tall = tallOf(spec, input, skillId);
        return { picture: tall.picture, lines: solution ? tall.lines : null };
    }
    if (shape === 'long' && input === 'tiles') {
        return solution ? spec.long.tilesSolution : { picture: spec.long.tiles, lines: null };
    }
    switch (input) {
        case 'drag': return { picture: spec.drag.picture, lines: solution ? spec.drag.lines : null };
        case 'select': return solution ? spec.select.solution : { picture: spec.select.picture, lines: null };
        case 'keypad': return solution ? spec.keypadSolution : { picture: spec.keypad, lines: null };
        case 'tiles': return solution ? spec.tilesSolution : { picture: spec.tiles, lines: null };
        case 'digits': return { picture: spec.digits.picture, lines: solution ? spec.digits.lines : null };
        default: { const _exhaustive: never = input; return _exhaustive; }
    }
};

/**
 * Where the answers and the bar go beside a drawing: null keeps the default (the notebook's tiles row, `TASK_LAYOUT.barSpan`).
 * A tall drawing moves the tiles row and the bar right of its column.
 */
export const answerSpans = (spec: PictureSpec, input: AnswerMode, shape: VisualShape, skillId?: string): { tiles: Span | null; bar: Span | null } => {
    switch (input) {
        case 'tiles': case 'keypad': {
            if (shape !== 'tall') return { tiles: null, bar: null };
            const tall = tallOf(spec, input, skillId);
            return { tiles: tall.answers ?? null, bar: tall.bar };
        }
        case 'drag': case 'select': case 'digits': return { tiles: null, bar: null };
        default: { const _exhaustive: never = input; return _exhaustive; }
    }
};

/**
 * The drawing rectangle kept under the prompt: its top moves down to `promptBottom + gap` when a long prompt ends below it,
 * its bottom stays (the drawing then scales down into what is left). Height never goes below `minHeight` (the drawing may then overlap the prompt's last line rather than vanish).
 */
export const belowPrompt = (rect: PictureRect, promptBottom: number, gap: number, minHeight: number): PictureRect => {
    const bottom = rect.y + rect.height;
    const top = Math.min(Math.max(rect.y, promptBottom + gap), bottom - minHeight);
    return { x: rect.x, y: top, width: rect.width, height: bottom - top };
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

export interface DialSpec { outer: number; border: number; hourLength: number; minuteLength: number }
export interface ClockSetLayout {
    centre: { x: number; y: number };
    scale: number;
    hourLength: number;
    minuteLength: number;
    ok: Rect;
    lines: Rect;
}

/** Where the dial of a clock to set sits (same scale rule as the ClockFace widget) and what shares the screen with it. */
export const clockSetLayout = (drag: { mat: Rect; ok: Rect; solutionLines: Rect }, dial: DialSpec): ClockSetLayout => {
    const scale = Math.min(drag.mat.width, drag.mat.height) / (2 * dial.outer + dial.border);
    return {
        centre: { x: drag.mat.x + drag.mat.width / 2, y: drag.mat.y + drag.mat.height / 2 },
        scale,
        hourLength: dial.hourLength * scale,
        minuteLength: dial.minuteLength * scale,
        ok: drag.ok,
        lines: drag.solutionLines,
    };
};

/** The hint number line and the solution lines under it; only the keypad task has room for them. */
export const hintPictureLayout = (spec: PictureSpec, input: AnswerMode, skillId?: string): { picture: PictureRect; lines: PictureRect } => {
    switch (input) {
        case 'keypad': return spec.hint.keypad;
        case 'tiles': case 'drag': case 'select': case 'digits': throw new Error(`no hint drawing for the ${input} mode${forSkill(skillId)}`);
        default: { const _exhaustive: never = input; return _exhaustive; }
    }
};
