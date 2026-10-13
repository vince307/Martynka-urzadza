// Where a task's drawing and its solution lines go (S-13): pure rectangles in the 1920x1080 scene space.
// The numbers come in as data (TASK_LAYOUT.picture); this file only decides which rectangle applies.
import type { AnswerMode } from '../tasks/visual';

export interface PictureRect {
    x: number;       // left
    y: number;       // top
    width: number;
    height: number;
}

export interface PictureSpec {
    promptY: number;
    tiles: PictureRect;
    tilesSolution: { picture: PictureRect; lines: PictureRect };
    keypad: PictureRect;
    keypadSolution: { picture: PictureRect; lines: PictureRect };
}

/**
 * The drawing rectangle and, while the solution steps are shown, the rectangle of their lines.
 * `lines: null` means the lines keep their place for a task without a drawing (under the prompt).
 * The modes without an area of their own (`select`, `drag`) share the tiles area until phases 7 and 9 give them one.
 */
export const pictureLayout = (
    spec: PictureSpec,
    input: AnswerMode,
    solution: boolean,
): { picture: PictureRect; lines: PictureRect | null } => {
    if (input === 'keypad') {
        return solution ? spec.keypadSolution : { picture: spec.keypad, lines: null };
    }
    return solution ? spec.tilesSolution : { picture: spec.tiles, lines: null };
};

/** Hand angles of a 12-hour dial in degrees clockwise from 12; the hour hand moves with the minutes. */
export const clockHandAngles = (hour: number, minute: number): { hour: number; minute: number } => ({
    hour: (((hour % 12) + minute / 60) * 30) % 360,
    minute: minute * 6,
});
