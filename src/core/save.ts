// Save format and decoder (S-11, test-plan risks #2 and #10). Pure: no Phaser, no browser, no data imports.
// The save is ONE object under one key, so an interrupted write leaves the previous save whole.
// Every version is a one-way door once it ships to children's devices. A change to the shape adds a version, a migration step
// in MIGRATIONS and a frozen fixture (tests/fixtures/save-v<N>.json); it never edits an older fixture.
import { STAGE_ORDER, initialSettings, type SessionLearner } from './placement';
import { emptyRoomState } from './rooms';
import type { RoomState, SaveState, SavedLearner, Settings, StageId, VariantState } from './types';

export const SAVE_VERSION = 2;
export const DEFAULT_PROFILE = 'default';

/** The part of the registry state that is saved. */
export interface SessionSave {
    stars: number;
    rooms: Record<string, RoomState>;
    currentRoom: string;
    settings: Settings;
    learner: SessionLearner | null;
    variants: VariantState;
}

export type DecodeResult =
    | { kind: 'ok'; session: SessionSave; migratedFrom: number | null }
    | { kind: 'unreadable'; reason: 'corrupt' | 'future' | 'unknown-version' }
    // A migration step threw: the save may be healthy, so it is named apart from `corrupt`; `step` is the version it lifts from.
    | { kind: 'unreadable'; reason: 'migration-failed'; step: number };

type Migration = (raw: unknown) => unknown;

const startingVariants = (): VariantState => ({ roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] });

/** Steps that lift a save of version N to version N+1. Reads and never mutates its input. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
    // v1 -> v2 (S-15): the variants block, at its starting values.
    1: (raw) => ({ ...(raw as Record<string, unknown>), version: 2, variants: startingVariants() }),
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

/** The first top-level key of a v2 save that fails the strict check, or null when the value is a valid save. */
export function saveProblem(value: unknown): string | null {
    if (!isRecord(value)) return 'version';
    if (value.version !== 2) return 'version';
    if (typeof value.profileId !== 'string') return 'profileId';
    if (!isCount(value.stars)) return 'stars';
    if (!isRecord(value.rooms) || !hasOnly(value.rooms, validRoom)) return 'rooms';
    if (typeof value.currentRoom !== 'string' || !Object.prototype.hasOwnProperty.call(value.rooms, value.currentRoom)) return 'currentRoom';
    if (!isRecord(value.settings)) return 'settings';
    const autoRead = value.settings.autoRead;
    if (autoRead !== null && typeof autoRead !== 'boolean') return 'settings';
    if (value.learner !== null && !validLearner(value.learner)) return 'learner';
    if (!validVariants(value.variants)) return 'variants';
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

/** Strict check of a v2 save: types of every field, counts are whole numbers >= 0, the current room is one of the rooms. */
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
        version: 2,
        profileId,
        stars: session.stars,
        rooms: copyRooms(session.rooms),
        currentRoom: session.currentRoom,
        settings: { autoRead: session.settings.autoRead },
        learner: session.learner ? savedLearner(session.learner, session.learner.pendingUnlock) : null,
        variants: copyVariants(session.variants),
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

/** Raw value -> migrations up to the current version -> strict validation -> session state. Never throws, never mutates `raw`. */
export function decodeSave(raw: unknown, migrations: Readonly<Record<number, Migration>> = MIGRATIONS): DecodeResult {
    if (!isRecord(raw) || typeof raw.version !== 'number' || !Number.isInteger(raw.version)) return { kind: 'unreadable', reason: 'corrupt' };
    const from = raw.version;
    if (from > SAVE_VERSION) return { kind: 'unreadable', reason: 'future' };
    let current: unknown = raw;
    for (let v = from; v < SAVE_VERSION; v++) {
        const step = Object.prototype.hasOwnProperty.call(migrations, v) ? migrations[v] : undefined;
        if (!step) return { kind: 'unreadable', reason: 'unknown-version' };
        try {
            current = step(current);
        } catch {
            return { kind: 'unreadable', reason: 'migration-failed', step: v };
        }
    }
    try {
        if (!validateSave(current)) return { kind: 'unreadable', reason: 'corrupt' };
        return { kind: 'ok', session: toSession(current), migratedFrom: from < SAVE_VERSION ? from : null };
    } catch {
        return { kind: 'unreadable', reason: 'corrupt' };
    }
}

/** The empty game of a first launch and of a reset; the caller names the first room (core does not import data). */
export function freshSession(firstRoom: string, stars = 0): SessionSave {
    return { stars, rooms: { [firstRoom]: emptyRoomState() }, currentRoom: firstRoom, settings: initialSettings(), learner: null, variants: startingVariants() };
}
