// Origin: save-observability-c1-c2 phase 1, test-plan risk #2 (progress must not vanish silently).
// Oracle: audit C-2 / M-S5: a parent must see whether saving is off (and why), failing, or fine.
import { describe, expect, it } from 'vitest';
import type { AutosaveStatus } from '../src/core/autosave';
import { SAVE_VERSION } from '../src/core/save';
import { cardCopyFor, newestBackup, saveHealthView, unreadableCode } from '../src/core/saveHealth';

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
    lastFailure: null,
    lastWriteAt: null,
    migratedFrom: null,
    loadReason: null,
    loadError: null,
    loadFrom: null,
    unavailableStarts: 0,
    backup: 'none',
    backupError: null,
    migrationWrittenAt: null,
    backupRecord: null,
    backupFailures: 0,
    lastWriteError: null,
    lateWrite: null,
    fatalError: null,
    olderWriterSeen: false,
    replace: 'idle',
    persistence: 'unknown',
    ...over,
});

describe('saveHealthView: an older build wrote here (save-truth p7)', () => {
    it('olderWriter follows the status, in every state', () => {
        expect(saveHealthView(status({ writes: 1 })).olderWriter).toBe(false);
        expect(saveHealthView(status({ writes: 1, olderWriterSeen: true })).olderWriter).toBe(true);
        expect(saveHealthView(status({ blocked: true, blockedBy: 'fatal', olderWriterSeen: true })).olderWriter).toBe(true);
    });
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

    // SIR-03: the parent sees why the save is off, and a code to quote.
    it('an unreadable save from a newer game is off with cause future and the load reason as code', () => {
        const view = saveHealthView(status({ blocked: true, blockedBy: 'unreadable', loadReason: 'future' }));
        expect(view).toMatchObject({ kind: 'off', cause: 'future', code: 'future' });
    });

    it('an unreadable save of another reason keeps cause unreadable and its reason as code', () => {
        const view = saveHealthView(status({ blocked: true, blockedBy: 'unreadable', loadReason: 'corrupt' }));
        expect(view).toMatchObject({ kind: 'off', cause: 'unreadable', code: 'corrupt' });
    });

    it('a timed-out read is cause timeout with code timeout, an other store error stays unavailable', () => {
        expect(saveHealthView(status({ blocked: true, blockedBy: 'unavailable', loadError: 'timeout', lastError: 'Other' }))).toMatchObject({ cause: 'timeout', code: 'timeout' });
        expect(saveHealthView(status({ blocked: true, blockedBy: 'unavailable', loadError: 'TimeoutError', lastError: 'Other' }))).toMatchObject({ cause: 'timeout', code: 'TimeoutError' });
        expect(saveHealthView(status({ blocked: true, blockedBy: 'unavailable', loadError: 'UnknownError', lastError: 'Other' }))).toMatchObject({ cause: 'unavailable', code: 'UnknownError' });
    });

    it('a fatal block carries its own error name as code, not whatever failed last, or null (SRR-11, rewritten)', () => {
        expect(saveHealthView(status({ blocked: true, blockedBy: 'fatal', fatalError: 'TypeError', lastError: 'QuotaExceededError' }))).toMatchObject({ cause: 'fatal', code: 'TypeError' });
        expect(saveHealthView(status({ blocked: true, blockedBy: 'fatal' }))).toMatchObject({ cause: 'fatal', code: null });
    });
});

describe('cardCopyFor', () => {
    it('the load reason picks the card, a future save never gets the generic one (SIR-01 / O1)', () => {
        expect(cardCopyFor('unreadable', 'future')).toBe('future');
        expect(cardCopyFor('unreadable', 'migration-failed')).toBe('migrationFailed');
        expect(cardCopyFor('unreadable', 'corrupt')).toBe('failed');
        expect(cardCopyFor('unreadable', 'unknown-version')).toBe('failed');
        expect(cardCopyFor('unavailable', null)).toBe('unavailable');
        expect(cardCopyFor('unavailable', null, 'UnknownError')).toBe('unavailable');
    });

    it('a save that failed AFTER its migration gets the migration card, not the generic one (C-2r)', () => {
        expect(cardCopyFor('unreadable', 'corrupt', null, 1)).toBe('migrationFailed');
        expect(cardCopyFor('unreadable', 'corrupt', null, 3)).toBe('migrationFailed');
        expect(cardCopyFor('unreadable', 'corrupt', null, SAVE_VERSION)).toBe('failed');
        expect(cardCopyFor('unreadable', 'corrupt', null, null)).toBe('failed');
    });

    it('a read that timed out gets the slow card (SRR-12)', () => {
        expect(cardCopyFor('unavailable', null, 'timeout')).toBe('slow');
        expect(cardCopyFor('unavailable', null, 'TimeoutError')).toBe('slow');
    });
});

describe('saveHealthView migration lines', () => {
    it('names a failed migration as its own cause', () => {
        expect(saveHealthView(status({ blocked: true, blockedBy: 'unreadable', loadReason: 'migration-failed' }))).toMatchObject({ cause: 'migration-failed', code: 'migration-failed' });
    });

    // SV2-03: the move is a fact only after a v2 write in this session; the intent from the start is not.
    it('before the first write of the new version the line says the move is in progress, never kept or lost (SVB-01, reversed from "no line")', () => {
        const pending = { from: 1, copy: 'pending', code: null };
        expect(saveHealthView(status({ migratedFrom: 1, backup: 'pending', writes: 0 })).migration).toEqual(pending);
        // The write of the new version gates the line, whatever the copy state says.
        expect(saveHealthView(status({ migratedFrom: 1, backup: 'done', writes: 0 })).migration).toEqual(pending);
        expect(saveHealthView(status({ migratedFrom: null, writes: 2 })).migration).toBeNull();
    });

    it('after a write the line says whether the v1 copy was kept, or lost with its code', () => {
        expect(saveHealthView(status({ migratedFrom: 1, writes: 1, migrationWrittenAt: 5, backup: 'done' })).migration).toEqual({ from: 1, copy: 'kept', code: null });
        expect(saveHealthView(status({ migratedFrom: 1, writes: 1, migrationWrittenAt: 5, backup: 'skipped', backupError: 'QuotaExceededError' })).migration).toEqual({
            from: 1,
            copy: 'lost',
            code: 'QuotaExceededError',
        });
    });
});

describe('saveHealthView failing detail', () => {
    it('failing carries the number of failed tries, the stage and the error code', () => {
        const view = saveHealthView(status({ consecutiveFailures: 2, lastError: 'Other', lastFailure: { stage: 'backup', error: 'QuotaExceededError' } }));
        expect(view).toMatchObject({ kind: 'failing', count: 2, stage: 'backup', error: 'QuotaExceededError' });
    });

    it('failing falls back to the write stage and lastError when no failure was recorded', () => {
        expect(saveHealthView(status({ consecutiveFailures: 1, lastError: 'UnknownError' }))).toMatchObject({ stage: 'write', error: 'UnknownError' });
        expect(saveHealthView(status({ consecutiveFailures: 1 }))).toMatchObject({ stage: 'write', error: 'Error' });
    });
});

describe('saveHealthView newer (P-5)', () => {
    it('a newer-save block is off with cause newer and the code NewerSave', () => {
        expect(saveHealthView(status({ blocked: true, blockedBy: 'newer', lastError: 'NewerSave', lastFailure: { stage: 'write', error: 'NewerSave' } }))).toMatchObject({ kind: 'off', cause: 'newer', code: 'NewerSave' });
    });
});

describe('saveHealthView otherTab (stale tab)', () => {
    it('an other-writer block is off with cause otherTab and the code OtherWriterSave', () => {
        expect(saveHealthView(status({ blocked: true, blockedBy: 'otherTab', lastError: 'OtherWriterSave', lastFailure: { stage: 'write', error: 'OtherWriterSave' } }))).toMatchObject({ kind: 'off', cause: 'otherTab', code: 'OtherWriterSave' });
    });
});

describe('unreadableCode (V-1, SV2-07)', () => {
    it('names the broken field of a corrupt save, the step of a failed migration, else the reason', () => {
        expect(unreadableCode({ reason: 'corrupt', problem: 'stars' })).toBe('corrupt/stars');
        expect(unreadableCode({ reason: 'corrupt', problem: 'exception:RangeError' })).toBe('corrupt/exception:RangeError');
        expect(unreadableCode({ reason: 'corrupt', problem: null })).toBe('corrupt');
        expect(unreadableCode({ reason: 'corrupt' })).toBe('corrupt');
        expect(unreadableCode({ reason: 'migration-failed', step: 2 })).toBe('migration-failed/2');
        expect(unreadableCode({ reason: 'future' })).toBe('future');
        expect(unreadableCode({ reason: 'unknown-version' })).toBe('unknown-version');
    });
});

describe('saveHealthView across launches (save-truth p6)', () => {
    const rec = (result: 'kept' | 'lost' | 'uncertain', error: string | null = null) => ({ from: 2, result, error, at: 9 });

    it('a later launch tells the fate of the old copy from the stored record', () => {
        expect(saveHealthView(status({ writes: 1, backupRecord: rec('kept') })).migration).toEqual({ from: 2, copy: 'kept', code: null });
        expect(saveHealthView(status({ writes: 1, backupRecord: rec('lost', 'QuotaExceededError') })).migration).toEqual({ from: 2, copy: 'lost', code: 'QuotaExceededError' });
        expect(saveHealthView(status({ writes: 1, backupRecord: rec('uncertain', 'timeout') })).migration).toEqual({ from: 2, copy: 'uncertain', code: 'timeout' });
        expect(saveHealthView(status({ writes: 1 })).migration).toBeNull();
    });

    it('the session that migrated knows more than the record: its own copy state wins', () => {
        const old = rec('lost', 'QuotaExceededError');
        expect(saveHealthView(status({ migratedFrom: 2, writes: 1, migrationWrittenAt: 5, backup: 'done', backupRecord: old })).migration).toEqual({ from: 2, copy: 'kept', code: null });
        expect(saveHealthView(status({ migratedFrom: 2, writes: 1, migrationWrittenAt: 5, backup: 'skipped', backupError: 'timeout', backupRecord: null })).migration).toEqual({ from: 2, copy: 'uncertain', code: 'timeout' });
        // a copy that is still being retried claims nothing yet
        expect(saveHealthView(status({ migratedFrom: 2, writes: 1, migrationWrittenAt: 5, backup: 'failed', backupError: 'QuotaExceededError', backupRecord: old })).migration).toBeNull();
    });

    it('a write that timed out says it may have worked, unless its late answer was a failure', () => {
        const base = { consecutiveFailures: 1, failures: 1, lastError: 'timeout', lastFailure: { stage: 'write' as const, error: 'timeout' } };
        expect(saveHealthView(status(base))).toMatchObject({ kind: 'failing', slow: true });
        expect(saveHealthView(status({ ...base, lateWrite: 'landed' }))).toMatchObject({ kind: 'failing', slow: true });
        expect(saveHealthView(status({ ...base, lateWrite: 'failed' }))).toMatchObject({ kind: 'failing', slow: false });
        expect(saveHealthView(status({ ...base, lastError: 'QuotaExceededError', lastFailure: { stage: 'write', error: 'QuotaExceededError' } }))).toMatchObject({ slow: false });
    });

    it('a failed copy is not repeated among the earlier failures (V1)', () => {
        const onlyCopy = status({ writes: 1, failures: 3, backupFailures: 3, lastError: 'QuotaExceededError', lastFailure: { stage: 'backup', error: 'QuotaExceededError' } });
        expect(saveHealthView(onlyCopy)).toMatchObject({ kind: 'ok', earlierFailures: null });
        const mixed = status({ writes: 1, failures: 3, backupFailures: 2, lastWriteError: 'AbortError', lastError: 'QuotaExceededError', lastFailure: { stage: 'backup', error: 'QuotaExceededError' } });
        expect(saveHealthView(mixed)).toMatchObject({ kind: 'ok', earlierFailures: { count: 1, error: 'AbortError' } });
    });
});

describe('old-version copy on the panel (save-truth p9)', () => {
    const record = (result: 'kept' | 'lost' | 'uncertain') => ({ from: 1, result, error: result === 'kept' ? null : 'timeout', at: 1 });
    it('an uncertain record with the copy present reads as kept, without a code', () => {
        expect(saveHealthView(status({ writes: 1, backupRecord: record('uncertain') }), [1]).migration).toEqual({ from: 1, copy: 'kept', code: null });
        expect(saveHealthView(status({ writes: 1, backupRecord: record('uncertain') }), []).migration?.copy).toBe('uncertain');
        expect(saveHealthView(status({ writes: 1, backupRecord: record('lost') }), [1]).migration?.copy).toBe('lost');
    });
    it('newestBackup picks the highest version, null when there is none', () => {
        expect(newestBackup([{ from: 1 }, { from: 3 }, { from: 2 }])).toEqual({ from: 3 });
        expect(newestBackup([])).toBeNull();
    });
});
