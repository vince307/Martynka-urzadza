// Origin: save-observability-c1-c2 phase 1, test-plan risk #2 (progress must not vanish silently).
// Oracle: audit C-2 / M-S5: a parent must see whether saving is off (and why), failing, or fine.
import { describe, expect, it } from 'vitest';
import type { AutosaveStatus } from '../src/core/autosave';
import { saveHealthView } from '../src/core/saveHealth';

const status = (over: Partial<AutosaveStatus> = {}): AutosaveStatus => ({
    load: 'fresh',
    blocked: false,
    blockedBy: null,
    dirty: false,
    writes: 0,
    failures: 0,
    consecutiveFailures: 0,
    skipped: 0,
    lastReason: null,
    lastError: null,
    lastWriteAt: null,
    ...over,
});

describe('saveHealthView', () => {
    it('every block reason is off with that cause, also while writes had failed', () => {
        for (const cause of ['unreadable', 'unavailable', 'fatal'] as const) {
            expect(saveHealthView(status({ blocked: true, blockedBy: cause }))).toEqual({ kind: 'off', cause });
            expect(saveHealthView(status({ blocked: true, blockedBy: cause, consecutiveFailures: 3 }))).toEqual({ kind: 'off', cause });
        }
    });

    it('failures without a block are failing', () => {
        expect(saveHealthView(status({ consecutiveFailures: 1, lastWriteAt: 5 }))).toEqual({ kind: 'failing' });
    });

    it('a healthy saver is ok with the last write time, null before the first write', () => {
        expect(saveHealthView(status())).toEqual({ kind: 'ok', lastWriteAt: null });
        expect(saveHealthView(status({ writes: 1, lastWriteAt: 777 }))).toEqual({ kind: 'ok', lastWriteAt: 777 });
    });
});
