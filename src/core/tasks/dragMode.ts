// Which branch of the `drag` answer mode a task uses; decided from the drawing, never from the answer's type.
import type { Task } from './types';

export type DragMode = 'blocks' | 'clock';

/** `clock` for a clock drawing, `blocks` for none or a blocks drawing; any other drawing has no drag branch and throws. */
export const dragMode = (task: Task): DragMode => {
    const kind = task.visual?.kind;
    if (kind === undefined || kind === 'blocks') return 'blocks';
    if (kind === 'clock') return 'clock';
    throw new Error(`No drag branch for a "${kind}" drawing (skill ${task.skillId})`);
};
