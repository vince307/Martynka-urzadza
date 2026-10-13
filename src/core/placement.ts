// Placement of a new learner: age x month -> proposed stage (docs/ZADANIA.md section 1).
// Pure: the month is always an argument, there is no Date here.
import type { LearnerState, StageId } from './types';

/** The learner as the running game needs it; S-11 will persist it. */
export type SessionLearner = Pick<LearnerState, 'age' | 'stage' | 'stageOverriddenByParent'> & { warmupPending: boolean };

export type Band = 'autumn' | 'spring' | 'summer';

/** Placement table of docs/ZADANIA.md section 1; the data lives in src/data/placement.ts. */
export interface PlacementData {
    readonly ages: readonly number[];
    readonly monthBands: Record<Band, readonly number[]>;
    readonly table: Record<Band, Record<number, StageId>>;
}

const ORDER: readonly StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

export function previousStage(id: StageId): StageId | null {
    const i = ORDER.indexOf(id);
    return i > 0 ? ORDER[i - 1] : null;
}

export function proposeStage(age: number, month: number, data: PlacementData): StageId {
    if (!data.ages.includes(age)) throw new RangeError(`age ${age} is not one of ${data.ages.join(', ')}`);
    if (!Number.isInteger(month) || month < 0 || month > 11) throw new RangeError(`month ${month} is not 0-11`);
    for (const band of Object.keys(data.monthBands) as (Band)[]) {
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
