// Save step v2 -> v3 (salon-load-health, audit H-1/M-2): the salon as live v2 saves know it (10 tasks, before S-16a) becomes
// the 7-task salon of v3. The step reads raw, unvalidated data, so it is total: anything it does not recognise comes back
// with only `version: 3` and the strict check in `decodeSave` decides (malformed -> `corrupt`, never an exception).
// The two tables below are FROZEN LITERALS, never edited and never read from src/data (they describe what the v2 save
// and the v3 salon were); tests pin them to the live data while it still matches.

export interface LegacyTaskV2 {
    slot: string;
    cost: number;
}
/** One task of the v3 salon: the furniture slot it places, or null for the stage task (renovate). */
export interface TargetTaskV3 {
    slot: string | null;
    cost: number;
}

/** The old task list: `tasksDone` counted positions in it and `chosen` was keyed by these slot ids. */
export const LEGACY_SALON_V2: { readonly tasks: readonly LegacyTaskV2[]; readonly renames: Readonly<Record<string, string>> } = {
    tasks: [
        { slot: 'floor', cost: 5 }, { slot: 'walls', cost: 6 }, { slot: 'curtains', cost: 7 }, { slot: 'sofa', cost: 8 },
        { slot: 'rug', cost: 9 }, { slot: 'table', cost: 10 }, { slot: 'lamp', cost: 11 }, { slot: 'shelf', cost: 12 },
        { slot: 'plant', cost: 13 }, { slot: 'picture', cost: 15 },
    ],
    renames: { table: 'coffee-table', shelf: 'cabinet', picture: 'wall-frames' },
};

/** The first 7 tasks of the salon as v3 knows it (the live salon may grow at its end, this snapshot may not). */
export const SALON_V3_TARGET: readonly TargetTaskV3[] = [
    { slot: null, cost: 5 },
    { slot: 'sofa', cost: 7 },
    { slot: 'rug', cost: 9 },
    { slot: 'coffee-table', cost: 10 },
    { slot: 'cabinet', cost: 12 },
    { slot: 'armchair', cost: 13 },
    { slot: 'wall-frames', cost: 15 },
];

const SALON_ID = 'salon';
const TARGET_SLOTS: ReadonlySet<string> = new Set(SALON_V3_TARGET.flatMap((t) => (t.slot === null ? [] : [t.slot])));
/** Keys only the old salon wrote: the marker of a salon that still has to be carried over (M-2). */
const OLD_ONLY_KEYS: ReadonlySet<string> = new Set(LEGACY_SALON_V2.tasks.map((t) => t.slot).filter((slot) => !TARGET_SLOTS.has(slot)));

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const own = (o: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(o, key);

/**
 * v2 -> v3. A salon whose `chosen` holds a key only the old list wrote is carried over by rule B: the new room gets the
 * shortest prefix of its tasks that costs at least what the child spent (capped at the whole room), every furniture piece
 * keeps its variant (renamed slots included), a piece the rounding gifts gets variant 0 and a key unknown to both lists is kept. Stars and other rooms are not
 * touched. Reads and never mutates its input; running it on its own result changes nothing.
 */
export const LIFT_V2_SALON = (raw: unknown): unknown => {
    const lifted = (input: Record<string, unknown>, rooms?: Record<string, unknown>): Record<string, unknown> => ({
        ...input,
        ...(rooms ? { rooms } : {}),
        version: 3,
    });
    if (!isRecord(raw)) return raw;
    const rooms = raw.rooms;
    if (!isRecord(rooms) || !own(rooms, SALON_ID)) return lifted(raw);
    const salon = rooms[SALON_ID];
    if (!isRecord(salon) || !isRecord(salon.chosen)) return lifted(raw);
    const done = salon.tasksDone;
    if (typeof done !== 'number' || !Number.isInteger(done) || done < 0) return lifted(raw);
    const chosenIn = salon.chosen;
    if (!Object.keys(chosenIn).some((key) => OLD_ONLY_KEYS.has(key))) return lifted(raw);

    const spent = LEGACY_SALON_V2.tasks.slice(0, done).reduce((sum, t) => sum + t.cost, 0);
    let prefix = 0;
    let cost = 0;
    while (prefix < SALON_V3_TARGET.length && cost < spent) {
        cost += SALON_V3_TARGET[prefix].cost;
        prefix += 1;
    }
    const carried = new Map<string, unknown>();
    for (const [key, variant] of Object.entries(chosenIn)) {
        carried.set(own(LEGACY_SALON_V2.renames, key) ? LEGACY_SALON_V2.renames[key] : key, variant);
    }
    const chosen: Record<string, unknown> = {};
    // A key that is neither an old-only slot nor a slot of the target is not ours to judge: it stays as it was (M-2).
    for (const [key, variant] of Object.entries(chosenIn)) {
        if (!OLD_ONLY_KEYS.has(key) && !TARGET_SLOTS.has(key)) chosen[key] = variant;
    }
    for (const task of SALON_V3_TARGET.slice(0, prefix)) {
        if (task.slot !== null) chosen[task.slot] = carried.has(task.slot) ? carried.get(task.slot) : 0;
    }
    return lifted(raw, { ...rooms, [SALON_ID]: { ...salon, tasksDone: prefix, chosen } });
};
