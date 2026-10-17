// What a parent sees about saving (audit C-2, M-S5, N-8, M-S2). Pure: words live in data/pl.ts.
import { isTimeoutError, type AutosaveStatus, type BlockReason, type FailureStage, type Persistence } from './autosave';
import { parentVisible, type RoomProblem } from './rooms';
import { SAVE_VERSION, type SalonCarried } from './save';

export type SaveHealthState =
    | { kind: 'off'; cause: BlockReason | 'future' | 'timeout' | 'migration-failed'; code: string | null }
    | { kind: 'failing'; count: number; stage: FailureStage; error: string; slow: boolean }
    | { kind: 'notYet' }
    | { kind: 'ok'; lastWriteAt: number | null; earlierFailures: { count: number; error: string } | null };

// The save moved from an older format: `pending` until the new version is written, then the fate of the old copy (kept, lost, or not known).
export type SaveMigration = { from: number; copy: 'pending' | 'kept' | 'lost' | 'uncertain'; code: string | null };

export type SaveHealthView = SaveHealthState & { persistence: Persistence; migration: SaveMigration | null; olderWriter: boolean; roomMismatch: boolean; salonCarried: boolean };

// The session that migrated knows its own copy state (it can be still retried); later launches read the stored record (SVB-01).
const migrationOf = (status: AutosaveStatus, copies: readonly number[]): SaveMigration | null => {
    if (status.migratedFrom !== null) {
        const from = status.migratedFrom;
        if (status.migrationWrittenAt === null) return { from, copy: 'pending', code: null };
        if (status.backup === 'done') return { from, copy: 'kept', code: null };
        if (status.backup === 'skipped') return { from, copy: isTimeoutError(status.backupError) ? 'uncertain' : 'lost', code: status.backupError };
        return null;
    }
    const record = status.backupRecord;
    if (record === null) return null;
    // An `uncertain` record with the copy actually in the store is a kept copy (the timeout was only a slow answer).
    if (record.result === 'uncertain' && copies.includes(record.from)) return { from: record.from, copy: 'kept', code: null };
    return { from: record.from, copy: record.result, code: record.result === 'kept' ? null : record.error };
};

/** The newest old-version copy in the store (highest version), or null: the one "Zachowaj kopię starego zapisu" exports. */
export function newestBackup<T extends { from: number }>(copies: readonly T[]): T | null {
    return copies.reduce<T | null>((best, c) => (best === null || c.from > best.from ? c : best), null);
}

// The cause the parent reads, and a code to quote. The load reason and error are the start state (never lastError,
// which a later failed write changes), except for a fatal block, which has no load part.
const offState = (status: AutosaveStatus, blockedBy: BlockReason): SaveHealthState => {
    if (blockedBy === 'unreadable') {
        const cause = status.loadReason === 'future' || status.loadReason === 'migration-failed' ? status.loadReason : 'unreadable';
        return { kind: 'off', cause, code: status.loadReason };
    }
    if (blockedBy === 'unavailable') {
        return { kind: 'off', cause: isTimeoutError(status.loadError) ? 'timeout' : 'unavailable', code: status.loadError };
    }
    if (blockedBy === 'newer') return { kind: 'off', cause: 'newer', code: status.lastFailure?.error ?? status.lastError };
    if (blockedBy === 'otherTab') return { kind: 'off', cause: 'otherTab', code: status.lastFailure?.error ?? status.lastError };
    return { kind: 'off', cause: 'fatal', code: status.fatalError ?? status.lastError };
};

const stateOf = (status: AutosaveStatus): SaveHealthState => {
    if (status.blockedBy !== null) return offState(status, status.blockedBy);
    if (status.consecutiveFailures > 0) return {
            kind: 'failing',
            count: status.consecutiveFailures,
            stage: status.lastFailure?.stage ?? 'write',
            error: status.lastFailure?.error ?? status.lastError ?? 'Error',
            // A write that timed out may have landed (SVB-03): said so unless its late answer was a failure.
            slow: status.lastFailure?.error === 'timeout' && status.lateWrite !== 'failed',
        };
    if (status.writes === 0) return { kind: 'notYet' };
    // A failed copy has its own line in the migration part; it is not repeated here (V1).
    const earlier = status.failures - status.backupFailures;
    return {
        kind: 'ok',
        lastWriteAt: status.lastWriteAt,
        earlierFailures: earlier > 0 ? { count: earlier, error: status.lastWriteError ?? status.lastError ?? 'Error' } : null,
    };
};

/** `copies`: the versions of the old-version copies found in the store when the panel opened (empty when none or not read).
 * `roomProblems`: the load-time check of the saved rooms (R-4), report only.
 * `salonCarried`: this load moved the old salon to the new look (M-4), a runtime note, never saved. */
export function saveHealthView(status: AutosaveStatus, copies: readonly number[] = [], roomProblems: readonly RoomProblem[] = [], salonCarried: SalonCarried | null = null): SaveHealthView {
    return { ...stateOf(status), persistence: status.persistence, migration: migrationOf(status, copies), olderWriter: status.olderWriterSeen, roomMismatch: roomProblems.some(parentVisible), salonCarried: salonCarried !== null };
}

export type SaveCardKey = 'future' | 'migrationFailed' | 'failed' | 'unavailable' | 'slow';

/** Which card copy a save that could not be read gets: the reason decides, never the order of the checks (SIR-01). */
export function cardCopyFor(kind: 'unreadable' | 'unavailable', reason: string | null, error?: string | null, from?: number | null): SaveCardKey {
    if (kind === 'unavailable') return isTimeoutError(error ?? null) ? 'slow' : 'unavailable';
    if (reason === 'future') return 'future';
    if (reason === 'migration-failed') return 'migrationFailed';
    // A save read at an older version that fails the check after its migration is a migration problem, not damage (C-2r).
    if (reason === 'corrupt' && typeof from === 'number' && from < SAVE_VERSION) return 'migrationFailed';
    return 'failed';
}

/** The `Kod:` text of the unreadable-save card: the broken field of a corrupt save, the step of a failed migration, else the reason (V-1, SV2-07). */
export function unreadableCode(outcome: { reason: string; problem?: string | null; step?: number }): string {
    if (outcome.reason === 'corrupt' && outcome.problem) return `corrupt/${outcome.problem}`;
    if (outcome.reason === 'migration-failed' && outcome.step !== undefined) return `migration-failed/${outcome.step}`;
    return outcome.reason;
}
