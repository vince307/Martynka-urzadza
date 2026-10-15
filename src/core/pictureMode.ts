// Picture mode (S-14d, docs/ZADANIA.md section 1): a 6-year-old in the first semester, or any E1 learner while the
// easing counter runs, gets tasks with a picture first. It is a draw filter computed from the learner and the month;
// nothing is saved. Other stages never use it.
import { balance } from '../data/balance';
import type { SessionLearner } from './placement';

export interface PictureRules {
    readonly age: number;
    readonly months: readonly number[];
}

export const pictureMode = (learner: SessionLearner, month: number, rules: PictureRules = balance.pictureMode): boolean =>
    learner.stage === 'E1' && (learner.easedRounds > 0 || (learner.age === rules.age && rules.months.includes(month)));
