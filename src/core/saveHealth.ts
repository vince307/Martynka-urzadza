// What a parent sees about saving (audit C-2, M-S5, N-8, M-S2). Pure: words live in data/pl.ts.
import { isTimeoutError, type AutosaveStatus, type BlockReason, type Persistence } from './autosave';

export type SaveHealthState =
    | { kind: 'off'; cause: BlockReason | 'future' | 'timeout' | 'migration-failed'; code: string | null }
    | { kind: 'failing' }
    | { kind: 'notYet' }
    | { kind: 'ok'; lastWriteAt: number | null; earlierFailures: { count: number; error: string } | null };

export type SaveHealthView = SaveHealthState & { persistence: Persistence; migratedFrom: number | null };

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
    return { kind: 'off', cause: 'fatal', code: status.lastError };
};

const stateOf = (status: AutosaveStatus): SaveHealthState => {
    if (status.blockedBy !== null) return offState(status, status.blockedBy);
    if (status.consecutiveFailures > 0) return { kind: 'failing' };
    if (status.writes === 0) return { kind: 'notYet' };
    return {
        kind: 'ok',
        lastWriteAt: status.lastWriteAt,
        earlierFailures: status.failures > 0 ? { count: status.failures, error: status.lastError ?? 'Error' } : null,
    };
};

export function saveHealthView(status: AutosaveStatus): SaveHealthView {
    return { ...stateOf(status), persistence: status.persistence, migratedFrom: status.migratedFrom };
}

export type SaveCardKey = 'future' | 'migrationFailed' | 'failed' | 'unavailable';

/** Which card copy a save that could not be read gets: the reason decides, never the order of the checks (SIR-01). */
export function cardCopyFor(kind: 'unreadable' | 'unavailable', reason: string | null): SaveCardKey {
    if (kind === 'unavailable') return 'unavailable';
    if (reason === 'future') return 'future';
    if (reason === 'migration-failed') return 'migrationFailed';
    return 'failed';
}
