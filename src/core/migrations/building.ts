// The v5 -> v6 step (first-building-choice): a rollback guard. The shape of a v5 save is unchanged; only the version moves, so a
// build that predates the base building meets the save as `future` and never overwrites it. FROZEN: never edited. The building
// is `house.id` as saved; this step never copies the house from the data and never imports `src/data`, so a v5 save keeps its house as saved.

/** Reads and never mutates its input; every field passes through. */
export const LIFT_V5_BUILDING = (raw: unknown): unknown => ({ ...(raw as Record<string, unknown>), version: 6 });
