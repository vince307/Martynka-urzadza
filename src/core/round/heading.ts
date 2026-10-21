// PA-1: the one place that says which heading a task gets above its prompt.
// The task screen and the narrator both use it.
import type { Task } from '../tasks/types';
import { isExpression } from './prompt';

export type HeadingKind = 'calculate' | 'sign' | 'fill';

export interface HeadingWords {
    calculate: string;
    sign: string;
    fill: string;
}

/** Order: not an expression -> none; a sign answer -> sign; a box that is not the single trailing result slot -> fill; else calculate. */
export const headingOf = (task: Pick<Task, 'prompt' | 'answer'>): HeadingKind | null => {
    if (!isExpression(task.prompt)) return null;
    if (typeof task.answer === 'string') return 'sign';
    const boxes = task.prompt.split('□').length - 1;
    const trailingResult = boxes === 1 && task.prompt.trim().endsWith('= □');
    return boxes > 0 && !trailingResult ? 'fill' : 'calculate';
};
