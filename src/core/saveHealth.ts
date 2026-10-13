// What a parent sees about saving (audit C-2, M-S5, N-8, M-S2). Pure: words live in data/pl.ts.
import type { AutosaveStatus, BlockReason, Persistence } from './autosave';

export type SaveHealthState =
    | { kind: 'off'; cause: BlockReason }
    | { kind: 'failing' }
    | { kind: 'notYet' }
    | { kind: 'ok'; lastWriteAt: number | null; earlierFailures: { count: number; error: string } | null };

export type SaveHealthView = SaveHealthState & { persistence: Persistence };

const stateOf = (status: AutosaveStatus): SaveHealthState => {
    if (status.blockedBy !== null) return { kind: 'off', cause: status.blockedBy };
    if (status.consecutiveFailures > 0) return { kind: 'failing' };
    if (status.writes === 0) return { kind: 'notYet' };
    return {
        kind: 'ok',
        lastWriteAt: status.lastWriteAt,
        earlierFailures: status.failures > 0 ? { count: status.failures, error: status.lastError ?? 'Error' } : null,
    };
};

export function saveHealthView(status: AutosaveStatus): SaveHealthView {
    return { ...stateOf(status), persistence: status.persistence };
}
