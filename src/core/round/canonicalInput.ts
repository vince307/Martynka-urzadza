// The input a task's answer widget can produce for the right answer. Tests drive the round with it, so an answer the
// widget cannot produce (the `retype` trap: no "Dalej") fails a test instead of stranding a child.
import { reachableTimes } from '../clockSet';
import { balance } from '../../data/balance';
import { dragMode } from '../tasks/dragMode';
import type { Task } from '../tasks/types';

export const canonicalInput = (task: Task): number | string | number[] => {
    const mode = task.input;
    // Phase 1 has no digits skill and no column drawing yet; phase 2 builds the number from `digitBoxCount(task)` digits.
    if (mode === 'digits') throw new Error(`digits needs a column drawing (skill ${task.skillId})`);
    if (mode === 'select') {
        if (!Array.isArray(task.answer)) throw new Error(`select answer is not a list (skill ${task.skillId})`);
        const choices = task.choices ?? [];
        if (!task.answer.every((a) => choices.includes(a))) throw new Error(`select answer outside choices (skill ${task.skillId})`);
        // Reversed: a child may tap the choices in any order.
        const input = [...task.answer].reverse();
        if (task.check && !task.check(input)) throw new Error(`select answer rejected by check (skill ${task.skillId})`);
        return input;
    }
    if (mode === 'drag') {
        if (dragMode(task) === 'clock') {
            const visual = task.visual;
            const snap = visual?.kind === 'clock' ? visual.snap : undefined;
            if (snap === undefined) throw new Error(`clock to set without a snap (skill ${task.skillId})`);
            if (typeof task.answer !== 'string' || !reachableTimes(snap).includes(task.answer)) {
                throw new Error(`clock answer ${String(task.answer)} not in the reachable set of snap ${snap} (skill ${task.skillId})`);
            }
            return task.answer;
        }
        const n = task.answer;
        if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 999) throw new Error(`blocks answer ${String(n)} not buildable (skill ${task.skillId})`);
        const digits = String(n).padStart(3, '0').split('').map(Number);
        if (digits.some((d) => d > balance.blockDrag.maxPerKind)) throw new Error(`blocks answer ${n} exceeds the mat (skill ${task.skillId})`);
        return n;
    }
    return task.answer;
};
