// Save format and decoder (S-11, test-plan risks #2 and #10). Pure: no Phaser, no browser, no data imports.
// The save is ONE object under one key, so an interrupted write leaves the previous save whole.
// Every version is a one-way door once it ships to children's devices. A change to the shape adds a version, a migration step
// in MIGRATIONS and a frozen fixture (tests/fixtures/save-v<N>.json); it never edits an older fixture.
import { STAGE_ORDER, initialSettings, type SessionLearner } from './placement';
import { LIFT_V2_SALON, carryV2Salon } from './migrations/legacySalon';
import { LIFT_V4_HOUSE } from './migrations/house';
import { copyHouse } from './house';
import { emptyRoomState } from './rooms';
import type { HouseState, RoomState, SaveState, SavedLearner, Settings, StageId, VariantState } from './types';

export const SAVE_VERSION = 5;

/** Error name a store write throws when the stored save is of a newer format than the page writing (P-5). */
export const NEWER_SAVE = 'NewerSave';

/** True only for a stored record whose numeric `version` is above `version`; anything else (no record, wrong shape) never refuses a write. */
export function storedVersionNewer(stored: unknown, version: number): boolean {
    if (typeof stored !== 'object' || stored === null) return false;
    const stamp = (stored as { version?: unknown }).version;
    return typeof stamp === 'number' && Number.isFinite(stamp) && stamp > version;
}

/** Error name a store write throws when another tab wrote a newer generation than the one this page last saw (B-1). */
export const OTHER_WRITER_SAVE = 'OtherWriterSave';

/** Error name for a stored record written by an earlier document of this same tab that this page never read (T-3): refused too, never overwritten. */
export const PREVIOUS_PAGE_SAVE = 'PreviousPageSave';

export type WriteVerdict =
    | { kind: 'refuse'; error: typeof NEWER_SAVE | typeof OTHER_WRITER_SAVE | typeof PREVIOUS_PAGE_SAVE }
    | { kind: 'put'; generation: number; olderWriter?: true };

/**
 * The one rule a store applies inside its write transaction. `page.base` is the generation this page last saw stored; `endedWriters` are the full ids of this tab's earlier documents.
 * A newer format always refuses; another writer that is ahead refuses a normal write (a stale tab) and is overwritten
 * only by an explicit `replace`; otherwise the new generation is one above the highest known.
 */
export function writeVerdict(stored: unknown, page: { version: number; base: number; writer: string; endedWriters?: readonly string[] }, mode: 'normal' | 'replace'): WriteVerdict {
    if (storedVersionNewer(stored, page.version)) return { kind: 'refuse', error: NEWER_SAVE };
    const rec = typeof stored === 'object' && stored !== null ? (stored as { generation?: unknown; writer?: unknown }) : null;
    const generation = rec !== null && isCount(rec.generation) ? rec.generation : 0;
    const writer = rec !== null && typeof rec.writer === 'string' ? rec.writer : '';
    if (mode === 'normal' && generation > page.base && writer !== page.writer) {
        // An earlier document of this tab (a reload) saved after this page read the record: the page never saw that write, so a put
        // would drop the child's last progress. Refused like another window, only named apart for the log (plan review F1).
        return { kind: 'refuse', error: page.endedWriters?.includes(writer) ? PREVIOUS_PAGE_SAVE : OTHER_WRITER_SAVE };
    }
    const next = Math.max(generation, page.base) + 1;
    // A record of an older format over a page that already has a base: an older build wrote after this page saved (T-1). The base
    // excludes the first write after a migration (base 0). Still a put; the flag only lets the store say so.
    const stamp = rec !== null && typeof (rec as { version?: unknown }).version === 'number' ? (rec as { version: number }).version : null;
    if (mode === 'normal' && stamp !== null && stamp < page.version && page.base > 0) return { kind: 'put', generation: next, olderWriter: true };
    return { kind: 'put', generation: next };
}
/**
 * What a message from the save channel (another window saved) means for this page. `stale` is exactly the case `writeVerdict`
 * would refuse at the next normal write (another writer ahead of this page's base), so the channel only moves a refusal earlier
 * and can never block a write that `writeVerdict` would allow.
 */
export function channelVerdict(msg: { writer: string; generation: number }, page: { writer: string; base: number }): 'stale' | 'ignore' {
    return msg.writer !== page.writer && msg.generation > page.base ? 'stale' : 'ignore';
}
export const DEFAULT_PROFILE = 'default';

/** The part of the registry state that is saved. */
export interface SessionSave {
    stars: number;
    rooms: Record<string, RoomState>;
    currentRoom: string;
    settings: Settings;
    learner: SessionLearner | null;
    variants: VariantState;
    house: HouseState;
}

/** Runtime note of a load: the salon was moved to the new look at the v2 step, from `from` to `to` tasks done. Never saved. */
export type SalonCarried = { from: number; to: number };

export type DecodeResult =
    | { kind: 'ok'; session: SessionSave; migratedFrom: number | null; salonCarried: SalonCarried | null }
    | { kind: 'unreadable'; reason: 'future' | 'unknown-version' }
    // `from`: the version read (null when the shape check failed); `problem`: the first broken top-level key after the migrations,
    // `exception:<Name>` when the check itself threw, null at the shape check. Names only, never values.
    | { kind: 'unreadable'; reason: 'corrupt'; from: number | null; problem: string | null }
    // A migration step threw: the save may be healthy, so it is named apart from `corrupt`; `step` is the version it lifts from.
    | { kind: 'unreadable'; reason: 'migration-failed'; step: number };

type Migration = (raw: unknown) => unknown;

const startingVariants = (): VariantState => ({ roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] });

/** Steps that lift a save of version N to version N+1. Reads and never mutates its input. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
    // v1 -> v2 (S-15): the variants block, at its starting values.
    1: (raw) => ({ ...(raw as Record<string, unknown>), version: 2, variants: startingVariants() }),
    // v2 -> v3 (salon-load-health): a salon saved before S-16a (10 tasks) becomes the 7-task salon, in one place and once.
    2: LIFT_V2_SALON,
    // v3 -> v4 (stale-tab-and-health): the guard fields a store stamps inside its write transaction.
    3: (raw) => ({ ...(raw as Record<string, unknown>), version: 4, generation: 0, writer: '' }),
    // v4 -> v5 (rooms-as-data): the house the salon lives in.
    4: LIFT_V4_HOUSE,
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isStage = (v: unknown): v is StageId => typeof v === 'string' && (STAGE_ORDER as readonly string[]).includes(v);
const hasOnly = (o: Record<string, unknown>, ok: (v: unknown) => boolean): boolean => Object.values(o).every(ok);

const validRoom = (v: unknown): v is RoomState =>
    isRecord(v) && isCount(v.tasksDone) && isRecord(v.chosen) && hasOnly(v.chosen, (x) => x === 0 || x === 1 || x === 2);

const validExample = (v: unknown): boolean =>
    isRecord(v) &&
    typeof v.prompt === 'string' &&
    (typeof v.given === 'number' || typeof v.given === 'string') &&
    (typeof v.answer === 'number' || typeof v.answer === 'string' || (Array.isArray(v.answer) && v.answer.every((n) => typeof n === 'number')));

const validHistoryEntry = (v: unknown): boolean =>
    isRecord(v) &&
    typeof v.skillId === 'string' &&
    typeof v.ok === 'boolean' &&
    typeof v.firstTry === 'boolean' &&
    typeof v.at === 'number' &&
    Number.isFinite(v.at) &&
    (v.example === undefined || validExample(v.example));

const validLearner = (v: unknown): v is SavedLearner => {
    if (!isRecord(v)) return false;
    if (!isCount(v.age) || !isStage(v.stage)) return false;
    if (typeof v.stageOverriddenByParent !== 'boolean' || typeof v.warmupPending !== 'boolean') return false;
    if (!isRecord(v.unlockedStep) || !hasOnly(v.unlockedStep, isCount)) return false;
    if (!isRecord(v.mastery) || !hasOnly(v.mastery, isCount)) return false;
    if (!isRecord(v.streak) || !hasOnly(v.streak, isCount)) return false;
    if (!Array.isArray(v.history) || !v.history.every(validHistoryEntry)) return false;
    if (!isCount(v.weakStreak) || !isCount(v.easedRounds)) return false;
    const p = v.pendingUnlock;
    return p === null || (isRecord(p) && isStage(p.stage) && isCount(p.step));
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const validVariants = (v: unknown): v is VariantState =>
    isRecord(v) &&
    isCount(v.roundsSince) &&
    (v.lastMinigame === null || v.lastMinigame === 'word' || v.lastMinigame === 'dice') &&
    (v.puzzleDay === null || (typeof v.puzzleDay === 'string' && DAY.test(v.puzzleDay))) &&
    Array.isArray(v.puzzlesDone) &&
    v.puzzlesDone.every((id) => typeof id === 'string');

const validHouse = (v: unknown): v is HouseState =>
    isRecord(v) &&
    typeof v.id === 'string' &&
    Array.isArray(v.rooms) &&
    v.rooms.every((p) => isRecord(p) && typeof p.room === 'string' && isCount(p.floor) && isCount(p.place));

/** The first top-level key of a v5 save that fails the strict check, or null when the value is a valid save. */
export function saveProblem(value: unknown): string | null {
    if (!isRecord(value)) return 'version';
    if (value.version !== SAVE_VERSION) return 'version';
    if (typeof value.profileId !== 'string') return 'profileId';
    if (!isCount(value.stars)) return 'stars';
    if (!isRecord(value.rooms) || !hasOnly(value.rooms, validRoom)) return 'rooms';
    if (typeof value.currentRoom !== 'string' || !Object.prototype.hasOwnProperty.call(value.rooms, value.currentRoom)) return 'currentRoom';
    if (!isRecord(value.settings)) return 'settings';
    const autoRead = value.settings.autoRead;
    if (autoRead !== null && typeof autoRead !== 'boolean') return 'settings';
    if (value.learner !== null && !validLearner(value.learner)) return 'learner';
    if (!validVariants(value.variants)) return 'variants';
    if (!isCount(value.generation)) return 'generation';
    if (typeof value.writer !== 'string') return 'writer';
    if (!validHouse(value.house)) return 'house';
    return null;
}

/** The first problem of a file of any readable version, named after its migration to the current one (null when it is valid). */
export function importProblem(raw: unknown, migrations: Readonly<Record<number, Migration>> = MIGRATIONS): string | null {
    if (!isRecord(raw) || typeof raw.version !== 'number' || !Number.isInteger(raw.version)) return saveProblem(raw);
    let current: unknown = raw;
    try {
        for (let v = raw.version; v < SAVE_VERSION; v++) {
            const step = Object.prototype.hasOwnProperty.call(migrations, v) ? migrations[v] : undefined;
            if (!step) return saveProblem(raw);
            current = step(current);
        }
    } catch {
        return saveProblem(raw);
    }
    return saveProblem(current);
}

/** Strict check of a v5 save: types of every field, counts are whole numbers >= 0, the current room is one of the rooms. */
export function validateSave(value: unknown): value is SaveState {
    return saveProblem(value) === null;
}

const copyRoom = (r: RoomState): RoomState => ({ tasksDone: r.tasksDone, chosen: { ...r.chosen } });
const copyRooms = (rooms: Record<string, RoomState>): Record<string, RoomState> =>
    Object.fromEntries(Object.entries(rooms).map(([id, r]) => [id, copyRoom(r)]));

const copyHistory = (history: SavedLearner['history']): SavedLearner['history'] =>
    history.map((h) => ({
        skillId: h.skillId,
        ok: h.ok,
        firstTry: h.firstTry,
        at: h.at,
        ...(h.example
            ? { example: { prompt: h.example.prompt, given: h.example.given, answer: Array.isArray(h.example.answer) ? [...h.example.answer] : h.example.answer } }
            : {}),
    }));

const copyVariants = (v: VariantState): VariantState => ({
    roundsSince: v.roundsSince,
    lastMinigame: v.lastMinigame,
    puzzleDay: v.puzzleDay,
    puzzlesDone: [...v.puzzlesDone],
});

/** The learner as saved: fields are picked one by one, so a field added to the session later is never saved by accident. */
function savedLearner(l: SessionLearner, pendingStep: number | null): SavedLearner {
    return {
        age: l.age,
        stage: l.stage,
        stageOverriddenByParent: l.stageOverriddenByParent,
        warmupPending: l.warmupPending,
        unlockedStep: { ...l.unlockedStep },
        mastery: { ...l.mastery },
        streak: { ...l.streak },
        history: copyHistory(l.history),
        weakStreak: l.weakStreak,
        easedRounds: l.easedRounds,
        pendingUnlock: pendingStep === null ? null : { stage: l.stage, step: pendingStep },
    };
}

export function encodeSave(session: SessionSave, profileId: string = DEFAULT_PROFILE): SaveState {
    return {
        version: SAVE_VERSION,
        profileId,
        stars: session.stars,
        rooms: copyRooms(session.rooms),
        currentRoom: session.currentRoom,
        settings: { autoRead: session.settings.autoRead },
        learner: session.learner ? savedLearner(session.learner, session.learner.pendingUnlock) : null,
        variants: copyVariants(session.variants),
        generation: 0,
        writer: '',
        house: copyHouse(session.house),
    };
}

function toSession(save: SaveState): SessionSave {
    const l = save.learner;
    return {
        stars: save.stars,
        rooms: copyRooms(save.rooms),
        currentRoom: save.currentRoom,
        settings: { autoRead: save.settings.autoRead },
        variants: copyVariants(save.variants),
        house: copyHouse(save.house),
        learner: l
            ? {
                  age: l.age,
                  stage: l.stage,
                  stageOverriddenByParent: l.stageOverriddenByParent,
                  warmupPending: l.warmupPending,
                  unlockedStep: { ...l.unlockedStep },
                  mastery: { ...l.mastery },
                  streak: { ...l.streak },
                  history: copyHistory(l.history),
                  weakStreak: l.weakStreak,
                  easedRounds: l.easedRounds,
                  pendingUnlock: l.pendingUnlock !== null && l.pendingUnlock.stage === l.stage ? l.pendingUnlock.step : null,
              }
            : null,
    };
}

/** Only the name of a thrown value, never its message or stack. */
export function errorName(e: unknown): string {
    const name = typeof e === 'object' && e !== null ? (e as { name?: unknown }).name : undefined;
    return typeof name === 'string' && name !== '' ? name : 'Error';
}

/** The name of a thrown value, plus `/<skillId>` when it carries a skill id (a task that failed while being drawn). Never throws. */
export function errorCode(e: unknown): string {
    const id = typeof e === 'object' && e !== null ? (e as { skillId?: unknown }).skillId : undefined;
    return typeof id === 'string' && id !== '' ? `${errorName(e)}/${id}` : errorName(e);
}

/** Raw value -> migrations up to the current version -> strict validation -> session state. Never throws, never mutates `raw`. */
export function decodeSave(raw: unknown, migrations: Readonly<Record<number, Migration>> = MIGRATIONS): DecodeResult {
    if (!isRecord(raw) || typeof raw.version !== 'number' || !Number.isInteger(raw.version)) return { kind: 'unreadable', reason: 'corrupt', from: null, problem: null };
    const from = raw.version;
    if (from > SAVE_VERSION) return { kind: 'unreadable', reason: 'future' };
    let current: unknown = raw;
    let salonCarried: SalonCarried | null = null;
    for (let v = from; v < SAVE_VERSION; v++) {
        const step = Object.prototype.hasOwnProperty.call(migrations, v) ? migrations[v] : undefined;
        if (!step) return { kind: 'unreadable', reason: 'unknown-version' };
        try {
            if (v === 2 && step === LIFT_V2_SALON) {
                // The same step, asked for its note as well (M-4); a test's own step 2 never produces one.
                const moved = carryV2Salon(current);
                current = moved.value;
                salonCarried = moved.carried;
            } else {
                current = step(current);
            }
        } catch {
            return { kind: 'unreadable', reason: 'migration-failed', step: v };
        }
    }
    try {
        const problem = saveProblem(current);
        if (problem !== null) return { kind: 'unreadable', reason: 'corrupt', from, problem };
        return { kind: 'ok', session: toSession(current as SaveState), migratedFrom: from < SAVE_VERSION ? from : null, salonCarried };
    } catch (e) {
        return { kind: 'unreadable', reason: 'corrupt', from, problem: `exception:${errorName(e)}` };
    }
}

/** The empty game of a first launch and of a reset; the caller names the house (core does not import data), the first room is its first cell. */
export function freshSession(house: HouseState, stars = 0): SessionSave {
    const firstRoom = house.rooms[0].room;
    return { stars, rooms: { [firstRoom]: emptyRoomState() }, currentRoom: firstRoom, settings: initialSettings(), learner: null, variants: startingVariants(), house: copyHouse(house) };
}
