// What a parent sees about saving (audit C-2, M-S5). Pure: words live in data/pl.ts.
import type { AutosaveStatus, BlockReason } from './autosave';

export type SaveHealthView = { kind: 'off'; cause: BlockReason } | { kind: 'failing' } | { kind: 'ok'; lastWriteAt: number | null };

export function saveHealthView(status: AutosaveStatus): SaveHealthView {
    if (status.blockedBy !== null) return { kind: 'off', cause: status.blockedBy };
    if (status.consecutiveFailures > 0) return { kind: 'failing' };
    return { kind: 'ok', lastWriteAt: status.lastWriteAt };
}
