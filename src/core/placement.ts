// Placement of a new learner: age x month -> proposed stage (docs/ZADANIA.md section 1).
// Pure: the month is always an argument, there is no Date here.
import type { placementData } from '../data/placement';
import type { LearnerState, StageId } from './types';

/** The learner as the running game needs it; S-11 will persist it. */
export type SessionLearner = Pick<LearnerState, 'age' | 'stage' | 'stageOverriddenByParent'> & { warmupPending: boolean };
type PlacementData = typeof placementData;

const ORDER: readonly StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

export function previousStage(id: StageId): StageId | null {
    const i = ORDER.indexOf(id);
    return i > 0 ? ORDER[i - 1] : null;
}

export function proposeStage(age: number, month: number, data: PlacementData): StageId {
    if (!data.ages.includes(age)) throw new RangeError(`age ${age} is not one of ${data.ages.join(', ')}`);
    if (!Number.isInteger(month) || month < 0 || month > 11) throw new RangeError(`month ${month} is not 0-11`);
    for (const band of Object.keys(data.monthBands) as (keyof PlacementData['monthBands'])[]) {
        if (data.monthBands[band].includes(month)) return data.table[band][age];
    }
    throw new RangeError(`month ${month} is in no band`);
}

export function placeByChild(age: number, month: number, data: PlacementData): SessionLearner {
    const stage = proposeStage(age, month, data);
    return { age, stage, stageOverriddenByParent: false, warmupPending: previousStage(stage) !== null };
}

export function placeByParent(age: number, chosen: StageId, month: number, data: PlacementData): SessionLearner {
    const overridden = chosen !== proposeStage(age, month, data);
    return {
        age,
        stage: chosen,
        stageOverriddenByParent: overridden,
        warmupPending: !overridden && previousStage(chosen) !== null,
    };
}

export function needsPlacement(learner: SessionLearner | null): boolean {
    return learner === null;
}
