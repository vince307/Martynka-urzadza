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
    loadReason: null,
    loadError: null,
    replace: 'idle',
    persistence: 'unknown',
    ...over,
});

describe('saveHealthView', () => {
    it('every block reason is off with that cause, also while writes had failed', () => {
        for (const cause of ['unreadable', 'unavailable', 'fatal'] as const) {
            expect(saveHealthView(status({ blocked: true, blockedBy: cause }))).toMatchObject({ kind: 'off', cause });
            expect(saveHealthView(status({ blocked: true, blockedBy: cause, consecutiveFailures: 3 }))).toMatchObject({ kind: 'off', cause });
        }
    });

    it('failures without a block are failing', () => {
        expect(saveHealthView(status({ consecutiveFailures: 1, lastWriteAt: 5 })).kind).toBe('failing');
    });

    it('a healthy saver that wrote is ok with the last write time and no earlier failures', () => {
        expect(saveHealthView(status({ writes: 1, lastWriteAt: 777 }))).toMatchObject({ kind: 'ok', lastWriteAt: 777, earlierFailures: null });
    });

    // Audit N-8: before any write the parent must not read "saved".
    it('no write yet, no block and no failure is notYet', () => {
        expect(saveHealthView(status()).kind).toBe('notYet');
    });

    it('no write yet but a failed attempt is failing, not notYet', () => {
        expect(saveHealthView(status({ writes: 0, failures: 1, consecutiveFailures: 1, lastError: 'QuotaExceededError' })).kind).toBe('failing');
    });

    it('a block is off even with no write yet', () => {
        expect(saveHealthView(status({ blocked: true, blockedBy: 'unavailable' })).kind).toBe('off');
    });

    it('a success after earlier failures is ok and names the count and the error', () => {
        const view = saveHealthView(status({ writes: 3, lastWriteAt: 9, failures: 2, lastError: 'QuotaExceededError' }));
        expect(view).toMatchObject({ kind: 'ok', earlierFailures: { count: 2, error: 'QuotaExceededError' } });
    });

    // Audit M-S2: the persist() result reaches the view unchanged.
    it('persistence passes through from the status', () => {
        expect(saveHealthView(status({ persistence: 'granted' })).persistence).toBe('granted');
        expect(saveHealthView(status({ blocked: true, blockedBy: 'fatal', persistence: 'denied' })).persistence).toBe('denied');
    });
});
