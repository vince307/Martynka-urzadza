// Placement of a new learner: age x month -> proposed stage (docs/ZADANIA.md section 1).
// Pure: the month is always an argument, there is no Date here.
import type { Adaptation, LearnerState, RoomState, Settings, StageId, VariantState } from './types';

/** What placement decides: age and stage (S-06). */
export type PlacedLearner = Pick<LearnerState, 'age' | 'stage' | 'stageOverriddenByParent'> & { warmupPending: boolean };

/** The learner as the running game needs it (placement + adaptation state); the save keeps it (core/save, S-11). */
export type SessionLearner = PlacedLearner & Adaptation & { pendingUnlock: number | null };

export type Band = 'autumn' | 'spring' | 'summer';

/** Placement table of docs/ZADANIA.md section 1; the data lives in src/data/placement.ts. */
export interface PlacementData {
    readonly ages: readonly number[];
    readonly monthBands: Record<Band, readonly number[]>;
    readonly table: Record<Band, Record<number, StageId>>;
}

/** Stages in school order (grade x semester). */
export const STAGE_ORDER: readonly StageId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

export function previousStage(id: StageId): StageId | null {
    const i = STAGE_ORDER.indexOf(id);
    return i > 0 ? STAGE_ORDER[i - 1] : null;
}

export function proposeStage(age: number, month: number, data: PlacementData): StageId {
    if (!data.ages.includes(age)) throw new RangeError(`age ${age} is not one of ${data.ages.join(', ')}`);
    if (!Number.isInteger(month) || month < 0 || month > 11) throw new RangeError(`month ${month} is not 0-11`);
    for (const band of Object.keys(data.monthBands) as (Band)[]) {
        if (data.monthBands[band].includes(month)) return data.table[band][age];
    }
    throw new RangeError(`month ${month} is in no band`);
}

export function placeByChild(age: number, month: number, data: PlacementData): PlacedLearner {
    const stage = proposeStage(age, month, data);
    return { age, stage, stageOverriddenByParent: false, warmupPending: previousStage(stage) !== null };
}

export function placeByParent(age: number, chosen: StageId, month: number, data: PlacementData): PlacedLearner {
    const overridden = chosen !== proposeStage(age, month, data);
    return {
        age,
        stage: chosen,
        stageOverriddenByParent: overridden,
        warmupPending: !overridden && previousStage(chosen) !== null,
    };
}

export function needsPlacement(learner: PlacedLearner | null): boolean {
    return learner === null;
}

/** Session settings before the parent chose anything (S-08; the save keeps them once chosen, S-11). */
export function initialSettings(): Settings {
    return { autoRead: null };
}

/** The parent moved the child to another stage (US-03). Same stage returns the same object. */
export function changeStageByParent(learner: SessionLearner, stage: StageId): SessionLearner {
    if (learner.stage === stage) return learner;
    return {
        ...learner,
        stage,
        stageOverriddenByParent: true,
        warmupPending: false,
        pendingUnlock: null,
        weakStreak: 0,
        easedRounds: 0,
    };
}

/**
 * True once the child has finished a round of her own: an ordinary round counted, a variant played, or more answers
 * than the warm-up alone holds. The warm-up length is an argument (the scene passes `balance.warmup.length`).
 */
export function firstRoundDone(learner: Pick<SessionLearner, 'history'>, variants: VariantState, warmupLength: number): boolean {
    return (
        variants.roundsSince > 0 ||
        variants.lastMinigame !== null ||
        variants.puzzleDay !== null ||
        variants.puzzlesDone.length > 0 ||
        learner.history.length > warmupLength
    );
}

/** Some room of the building has a renovation task done: the child has already spent stars there. */
export function hasPurchase(rooms: Readonly<Record<string, RoomState>>): boolean {
    return Object.values(rooms).some((r) => r.tasksDone > 0);
}

/** "Wróć" to the building choice: before the first round ends and before anything is bought, on both paths (FR-043). */
export function themeBackOffered(
    learner: Pick<SessionLearner, 'history'>,
    variants: VariantState,
    warmupLength: number,
    rooms: Readonly<Record<string, RoomState>>,
): boolean {
    return !firstRoundDone(learner, variants, warmupLength) && !hasPurchase(rooms);
}
