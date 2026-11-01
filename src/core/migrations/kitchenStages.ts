// The v6 -> v7 step (house-1-polish): the kitchen renovates in three stages before its furniture. FROZEN: never edited.
// A v6 kitchen had ONE stage task ("renovate", before -> after), so a saved `tasksDone` k >= 1 meant "after look, k - 1 pieces
// bought". The new list begins with three stage tasks and the last of them shows exactly the old "after" look, so k becomes
// k + 2 and every slot index moves by the same amount. `tasksDone 0` (nothing bought) stays 0. The constants are local on
// purpose: this step never imports `src/data`, so it keeps its meaning when the kitchen data changes again. A v6 kitchen with
// tasksDone above the old list stays above the new one by the same +2 and is flagged `tasks-overflow` as before.

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Reads and never mutates its input; returns a new object. Anything that is not a kitchen with an integer tasksDone >= 1 passes through. */
export const LIFT_V6_KITCHEN_STAGES = (raw: unknown): unknown => {
    const save = raw as Record<string, unknown>;
    const lifted: Record<string, unknown> = { ...save, version: 7 };
    const rooms = save.rooms;
    if (!isRecord(rooms)) return lifted;
    const kitchen = rooms.kitchen;
    if (!isRecord(kitchen)) return lifted;
    const done = kitchen.tasksDone;
    if (typeof done !== 'number' || !Number.isInteger(done) || done < 1) return lifted;
    lifted.rooms = { ...rooms, kitchen: { ...kitchen, tasksDone: done + 2 } };
    return lifted;
};
