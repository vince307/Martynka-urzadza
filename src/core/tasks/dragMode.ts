// Which branch of the `drag` answer mode a task uses; decided from the drawing, never from the answer's type.
import type { Task } from './types';

export type DragMode = 'blocks' | 'clock' | 'coins';

/** `coins` for a money drawing with a payment tray, `clock` for a clock drawing, `blocks` for none or a blocks drawing; any other drawing has no drag branch and throws. */
export const dragMode = (task: Task): DragMode => {
    const kind = task.visual?.kind;
    if (kind === undefined || kind === 'blocks') return 'blocks';
    if (kind === 'clock') {
        if (task.visual?.kind === 'clock' && task.visual.set) return 'clock';
        throw new Error(`A clock in drag mode must be a clock to set with a snap (skill ${task.skillId})`);
    }
    if (kind === 'money' && task.visual?.kind === 'money' && task.visual.pay) return 'coins';
    throw new Error(`No drag branch for a "${kind}" drawing (skill ${task.skillId})`);
};
