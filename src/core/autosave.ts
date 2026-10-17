// Autosave state machine (S-11, test-plan risks #2 and #16). Pure: the store, the clock and the log are injected.
import { decodeSave, encodeSave, errorName, NEWER_SAVE, OTHER_WRITER_SAVE, PREVIOUS_PAGE_SAVE, SAVE_VERSION, saveProblem, validateSave, type SalonCarried, type SessionSave } from './save';
import type { SaveState } from './types';
import { balance } from '../data/balance';

export interface SaveStore {
    read(): Promise<unknown>;
    /** `replace` skips the other-writer check (the parent's explicit overwrite); a normal write is refused when another tab wrote first. */
    write(value: SaveState, mode?: 'normal' | 'replace'): Promise<void>;
    /**
     * Keeps a copy of the raw save of version `from` under its own key; required, so a store can never skip it. Never touches the main key.
     * Write-once: an existing copy is never overwritten (`'kept'`), a new one is `'written'`. The record `kept` is stored with it.
     */
    backup(raw: unknown, from: number): Promise<'written' | 'kept'>;
    /** The raw copies present in the store (`backup-v1`..`backup-v{SAVE_VERSION-1}`); absent versions are skipped. */
    readBackups(): Promise<{ from: number; raw: unknown }[]>;
    /** The last record of what became of the old-version copy, or null. Runtime information: `decodeSave` never reads it. */
    backupRecord(): Promise<BackupRecord | null>;
    /** Stores the record (best effort for the caller). Touches neither the main key nor a `backup-v<N>` key. */
    noteBackup(record: BackupRecord): Promise<void>;
}

/** What became of the copy of an old-version save (`kept`: present in the store, `lost`: given up, `uncertain`: the store never answered). */
export interface BackupRecord {
    from: number;
    result: 'kept' | 'lost' | 'uncertain';
    error: string | null;
    at: number;
}

export type LoadOutcome =
    | { kind: 'fresh' }
    | { kind: 'loaded'; session: SessionSave; migratedFrom: number | null; salonCarried: SalonCarried | null; raw: unknown }
    | { kind: 'unreadable'; reason: 'corrupt' | 'future' | 'unknown-version' | 'migration-failed'; raw: unknown; from?: number | null; problem?: string | null; step?: number }
    | { kind: 'unavailable'; error: string; waitLonger?: (timeoutMs: number) => Promise<LoadOutcome> };

/** `newer` (runtime only, never saved): the store refused a write because it holds a save of a newer format (P-5). */
export type BlockReason = 'unreadable' | 'unavailable' | 'fatal' | 'newer' | 'otherTab';

export { errorName };

/** Outcome of asking the browser not to evict the save (audit M-S2). Runtime only. */
export type Persistence = 'unknown' | 'granted' | 'denied' | 'unsupported' | 'error';

export type LoadReason = Extract<LoadOutcome, { kind: 'unreadable' }>['reason'];

export type FailureStage = 'encode' | 'backup' | 'write' | 'replace';

export type WriteReason = 'change' | 'now' | 'hidden' | 'migration';

export interface AutosaveStatus {
    load: LoadOutcome['kind'];
    blocked: boolean;
    blockedBy: BlockReason | null;
    dirty: boolean;
    writes: number;
    failures: number;
    consecutiveFailures: number;
    skipped: number;
    lastReason: WriteReason | null;
    /** Name of the last write or read error (never a message); stays after a later success. */
    lastError: string | null;
    lastWriteAt: number | null;
    /** Runtime only (never saved): the stage and error name of the last failure; stays after a later success. */
    lastFailure: { stage: FailureStage; error: string } | null;
    /** Runtime only (never saved): the version the loaded save was migrated from, or null. */
    migratedFrom: number | null;
    /** Runtime only (never saved): why the load was unreadable; fixed at start. */
    loadReason: LoadReason | null;
    /** Runtime only (never saved): error name of the failed load; fixed at start (`lastError` moves on). */
    loadError: string | null;
    /** Runtime only (never saved): the version an unreadable (corrupt) save was migrated from, or null; fixed at start. */
    loadFrom: number | null;
    /** Runtime only (never saved): consecutive starts (this one included) on which the store would not answer; 0 when the read worked. */
    unavailableStarts: number;
    /**
     * Runtime only (never saved): the copy of the raw older save. `none` without a migration, `pending` before the first
     * try, `failed` after at least one failed try (still owed), `done` once kept, `skipped` when the new version was written without it.
     */
    backup: 'none' | 'pending' | 'failed' | 'done' | 'skipped';
    /** Runtime only (never saved): when the first write after a migration succeeded, or null (not migrated, or not yet written). */
    migrationWrittenAt: number | null;
    /** Runtime only (never saved): error name of the last failed copy; stays after a later success. */
    backupError: string | null;
    /** Runtime only (never saved): the stored record of what became of the last old-version copy (read at start), or null. */
    backupRecord: BackupRecord | null;
    /** Runtime only (never saved): copies that failed, apart from `failures` (V1: the parent view does not repeat them). */
    backupFailures: number;
    /** Runtime only (never saved): error name of the last failed write, encode or replace (not a copy); stays after a later success. */
    lastWriteError: string | null;
    /** Runtime only (never saved): how a write that timed out ended once it answered: `landed` or `failed`; null before and after a good write. */
    lateWrite: 'landed' | 'failed' | null;
    /** Runtime only (never saved): the error name behind a fatal block, or null. */
    fatalError: string | null;
    /** Runtime only (never saved): a record of an older format was found over this page's own save (an older build wrote after it). */
    olderWriterSeen: boolean;
    /** Runtime only (never saved): a replace of the whole save is writing or has replaced it for this page load. */
    replace: 'idle' | 'writing' | 'done';
    /** Runtime only (never saved): what the browser answered to the persistence request after the first write. */
    persistence: Persistence;
}

export interface AutosaverOptions {
    store: SaveStore;
    snapshot: () => SessionSave;
    timers: { setTimeout: (fn: () => void, ms: number) => unknown; clearTimeout: (id: unknown) => void };
    delayMs: number;
    /** Longest wait for one store write or copy before it counts as a `timeout` failure. */
    writeTimeoutMs: number;
    /** Failed copies of a migrated save in one session after which the current version is written without the copy. */
    backupAttempts: number;
    load: LoadOutcome['kind'];
    blockedBy: BlockReason | null;
    now: () => number;
    /** The raw value of a save that was migrated: copied once before the first write. */
    migrated?: { from: number; raw: unknown };
    loadError?: string;
    loadReason?: LoadReason;
    /** The record of the copy of an older save kept by an earlier launch (`store.backupRecord()`), for the parent view only. */
    backupRecord?: BackupRecord | null;
    /** Version the unreadable save was migrated from (`LoadOutcome.unreadable.from`). */
    loadFrom?: number | null;
    /** Consecutive `unavailable` starts, this one included (device counter outside the save). */
    unavailableStarts?: number;
    log: (...args: unknown[]) => void;
    onFirstWrite?: () => Promise<Persistence> | void;
    /** Called once, when a write is first refused because a newer version or another window of the game saved here (never for load blocks or `replace`). */
    onBlocked?: (reason: 'newer' | 'otherTab', error: string) => void;
}

/**
 * A load that ran out of time: our own read limit (`timeout`) or IndexedDB's `TimeoutError`. The save behind it may be
 * healthy, so it is never forceable and the parent reads the slow-read sentence (impl-review F1).
 */
export const isTimeoutError = (name: string | null): boolean => name === 'timeout' || name === 'TimeoutError';

/**
 * What a read that finished late (behind the slow card) does: `still-slow` only when it ran out of time again; anything else
 * (a loaded or fresh save, an unreadable one, or a read that was refused with a named error) settles the card, so the normal
 * card path can show its `Kod:` line (SVB-02).
 */
export const lateReadVerdict = (late: LoadOutcome): 'still-slow' | 'settle' => (late.kind === 'unavailable' && isTimeoutError(late.error) ? 'still-slow' : 'settle');

/** An unreadable save that still holds an older child's progress: migration failed, unknown version, or corrupt after a migration step. */
export const keepsOldSave = (loadReason: LoadReason | null, loadFrom: number | null | undefined): boolean =>
    loadReason === 'migration-failed' || loadReason === 'unknown-version' || (loadReason === 'corrupt' && loadFrom != null && loadFrom < SAVE_VERSION);

/**
 * The one rule for overwriting the device save, shared by `replace` and the dialogs' `forceable` (plan decision 3).
 * `future` is a healthy save from a newer build and a `timeout` read may be a healthy slow one: neither is ever replaced.
 * A read the browser refused (`unavailable`) is replaced only on an explicit `force` from the
 * `balance.save.forceAfterStarts`-th consecutive such start (SRR-08): the first start asks for a restart.
 */
export function replaceGate(status: Pick<AutosaveStatus, 'blockedBy' | 'loadReason' | 'loadError'> & { loadFrom?: number | null; unavailableStarts?: number }, force: boolean): 'ok' | 'Blocked' {
    const { blockedBy, loadReason, loadError, loadFrom, unavailableStarts = 0 } = status;
    if (blockedBy === 'fatal' || blockedBy === 'newer' || blockedBy === 'otherTab') return 'Blocked';
    if (blockedBy === 'unreadable') {
        if (loadReason === 'future') return 'Blocked';
        // A save the game could not migrate or does not know is kept until the parent confirms twice (FR-021); only a plain corrupt one is free.
        return keepsOldSave(loadReason, loadFrom) && !force ? 'Blocked' : 'ok';
    }
    if (blockedBy === 'unavailable') return !isTimeoutError(loadError) && force && unavailableStarts >= balance.save.forceAfterStarts ? 'ok' : 'Blocked';
    return 'ok';
}

/**
 * Races `work` against a timer: a store call that never answers becomes a `timeout` failure. The abandoned promise stays subscribed by the race, so a late rejection reaches nobody; a late success is dropped from the result (an `onLate` observer, attached only after the limit fired, is told how it ended). The timer is always cleared.
 */
export function withTimeLimit<T>(work: Promise<T>, timers: AutosaverOptions['timers'], ms: number, onLate?: (outcome: 'landed' | 'failed') => void): Promise<T> {
    let timer: unknown;
    const limit = new Promise<never>((_, reject) => {
        timer = timers.setTimeout(() => {
            reject(Object.assign(new Error('store timed out'), { name: 'timeout' }));
            // Only after the limit fired, and only to tell how the abandoned work ended: the result above never changes (SVB-03).
            if (onLate) work.then(() => onLate('landed'), () => onLate('failed'));
        }, ms);
    });
    return Promise.race([work, limit]).finally(() => timers.clearTimeout(timer));
}

export type ReplaceResult = { ok: true } | { ok: false; error: string };

export interface Autosaver {
    markDirty(): void;
    replace(state: SaveState, options?: { force?: boolean }): Promise<ReplaceResult>;
    current(): SaveState;
    flush(reason: 'now' | 'hidden'): Promise<void>;
    block(reason: BlockReason, error?: string): void;
    /** The store found a record of an older format over this page's save: noted for the parent view, one log. */
    noteOlderWriter(): void;
    /** Another window's save reached us through the save channel: blocks like an `OtherWriterSave` refusal (shown once), nothing is written. */
    noticeOtherWriter(): void;
    /** The raw old-version copies kept in the store, for the parent's "keep a copy" button. Read-only pass-through; never rejects, `[]` when the read fails. */
    readBackups(): Promise<{ from: number; raw: unknown }[]>;
    status(): AutosaveStatus;
}

/**
 * Reads the store once. Never rejects: a failed or too slow read is `unavailable` with the error name. Never writes.
 * With a `limit` the read races a timer; the abandoned read is caught at once so a late rejection reaches nobody.
 * A `timeout` outcome carries `waitLonger`: it waits on the SAME read (never a second `store.read()`, which would queue
 * behind the hung one) with a longer limit and decodes it like a normal read; a second limit is a plain timeout.
 * Nothing here ever writes, so a late result is only data for the caller to decide on.
 */
export async function loadSave(
    store: SaveStore,
    limit?: { timers: AutosaverOptions['timers']; timeoutMs: number },
): Promise<LoadOutcome> {
    const read = new Promise<unknown>((resolve) => resolve(store.read()));   // a synchronous throw is a rejection too
    const settle = async (timeoutMs: number | undefined, offerMore: boolean): Promise<LoadOutcome> => {
        let raw: unknown;
        try {
            raw = limit === undefined || timeoutMs === undefined ? await read : await withTimeLimit(read, limit.timers, timeoutMs);
        } catch (e) {
            const error = errorName(e);
            if (offerMore && isTimeoutError(error)) {
                return { kind: 'unavailable', error, waitLonger: (ms) => settle(ms, false) };
            }
            return { kind: 'unavailable', error };
        }
        if (raw === undefined) return { kind: 'fresh' };
        const result = decodeSave(raw);
        if (result.kind === 'ok') return { kind: 'loaded', session: result.session, migratedFrom: result.migratedFrom, salonCarried: result.salonCarried, raw };
        if (result.reason === 'corrupt') return { kind: 'unreadable', reason: 'corrupt', raw, from: result.from, problem: result.problem };
        if (result.reason === 'migration-failed') return { kind: 'unreadable', reason: 'migration-failed', raw, step: result.step };
        return { kind: 'unreadable', reason: result.reason, raw };
    };
    return settle(limit?.timeoutMs, true);
}

export function createAutosaver(options: AutosaverOptions): Autosaver {
    const { store, snapshot, timers, delayMs, log } = options;
    let blockedBy: BlockReason | null = options.blockedBy;
    let lastError: string | null = options.loadError ?? null;
    let lastFailure: AutosaveStatus['lastFailure'] = null;
    let lastWriteAt: number | null = null;
    let consecutiveFailures = 0;
    let dirty = false;
    let timer: unknown = null;
    let inflight: Promise<void> | null = null;
    let rerun: WriteReason | null = null;
    let writes = 0;
    let failures = 0;
    let skipped = 0;
    let lastReason: WriteReason | null = null;
    let firstDone = false;
    let replacing = false;
    let replaced = false;
    let persistence: Persistence = 'unknown';
    // One predicate for every write path: a block, a replace in progress, or a replaced save (until the page reloads).
    let backup: AutosaveStatus['backup'] = options.migrated === undefined ? 'none' : 'pending';
    let backupFails = 0;
    let backupError: string | null = null;
    let migrationWrittenAt: number | null = null;
    let owedNoted = false;
    let copying: Promise<void> | null = null;
    let migrationRetries = 0;
    let backupFailures = 0;
    let lastWriteError: string | null = null;
    let lateWrite: AutosaveStatus['lateWrite'] = null;
    let fatalError: string | null = null;
    let olderWriterSeen = false;
    const backupOwed = (): boolean => backup === 'pending' || backup === 'failed';
    const writesOff = (): boolean => blockedBy !== null || replacing || replaced;

    const cancelTimer = (): void => {
        if (timer !== null) timers.clearTimeout(timer);
        timer = null;
    };

    const limited = <T>(work: Promise<T>, onLate?: (outcome: 'landed' | 'failed') => void): Promise<T> => withTimeLimit(work, timers, options.writeTimeoutMs, onLate);

    /** Called only after the save itself was written without the copy: a failed write leaves the copy owed. */
    const skipBackup = (): void => {
        backup = 'skipped';
        log(`autosave: writing v${SAVE_VERSION} without the v${options.migrated?.from ?? '?'} copy`, { from: options.migrated?.from ?? null, backupError, attempts: backupFails });
    };

    /**
     * Stores what is known about the owed copy BEFORE a write that leaves it owed (plan review F2): a hidden flush is often the
     * last thing a page does, so the cap may never be reached. Never awaited past: a failure or hang is logged, the write goes on.
     * A later successful copy overwrites the record with `kept` in its own transaction.
     */
    const noteOwed = (): void => {
        if (!options.migrated) return;
        const record: BackupRecord = { from: options.migrated.from, result: isTimeoutError(backupError) ? 'uncertain' : 'lost', error: backupError, at: options.now() };
        try {
            limited(store.noteBackup(record)).catch((e: unknown) => log('autosave: noteBackup failed', e));
        } catch (e) {
            log('autosave: noteBackup failed', e);
        }
    };

    /**
     * One try of the copy, ALWAYS after the progress was written; the source is only `migrated.raw`, never the stored key.
     * Never throws. A failed try counts once (V-6); at `backupAttempts` the copy is given up for good and the record says so (V-7).
     */
    const tryCopy = async (final: boolean): Promise<void> => {
        const migrated = options.migrated;
        if (!migrated || !backupOwed()) return;
        try {
            await limited(store.backup(migrated.raw, migrated.from));
            backup = 'done';
        } catch (e) {
            backupFails++;
            backupFailures++;
            backupError = errorName(e);
            backup = 'failed';
            failures++;
            lastError = backupError;
            lastFailure = { stage: 'backup', error: backupError };
            log('autosave: backup failed', e);
            if (final || backupFails >= options.backupAttempts) {
                skipBackup();
                noteOwed();
            }
        }
    };

    /** The copy runs beside the saver, never inside a write: a hanging copy must not hold the next progress write. */
    const startCopy = (reason: WriteReason): void => {
        if (copying !== null || !backupOwed()) return;
        if (reason === 'hidden' && backupFails > 0) return;   // the page is going away: progress first, the copy stays owed
        copying = tryCopy(false).finally(() => {
            copying = null;
        });
    };

    /** One write attempt; resolves true on success. Never throws. */
    // A write refused by a newer page or another window, or a notice from the save channel: the first reason wins and the
    // listener hears it once, with the error name (the card shows it as the `Kod:` line).
    const refuseWrites = (reason: 'newer' | 'otherTab', error: string): void => {
        const first = blockedBy === null;
        blockedBy ??= reason;
        cancelTimer();
        if (!first) return;
        try {
            options.onBlocked?.(reason, error);
        } catch (listenerError) {
            log('autosave: onBlocked listener failed', listenerError);
        }
    };

    const attempt = async (reason: WriteReason): Promise<boolean> => {
        let stage: FailureStage = 'encode';
        try {
            const encoded = encodeSave(snapshot());
            if (!validateSave(encoded)) throw Object.assign(new Error(`autosave: encoded state does not validate (${saveProblem(encoded) ?? 'unknown'})`), { name: 'InvalidSave' });
            dirty = false;
            // The child's progress is written first and never waits on the copy of the old bytes (SVB-01); the copy follows the write.
            const owed = backupOwed() && options.migrated !== undefined;
            if (owed && !owedNoted) {
                owedNoted = true;
                noteOwed();
            }
            stage = 'write';
            await limited(store.write(encoded), (outcome) => void (lateWrite = outcome));
            lateWrite = null;
            writes++;
            lastWriteAt = options.now();
            if (options.migrated && migrationWrittenAt === null) migrationWrittenAt = lastWriteAt;
            consecutiveFailures = 0;
            lastReason = reason;
            if (owed) startCopy(reason);
            if (!firstDone) {
                firstDone = true;
                try {
                    const pending = options.onFirstWrite?.();
                    if (pending !== undefined) {
                        pending.then(
                            (result) => void (persistence = result),
                            (e: unknown) => {
                                persistence = 'error';
                                log('autosave: onFirstWrite failed', e);
                            },
                        );
                    }
                } catch (e) {
                    persistence = 'error';
                    log('autosave: onFirstWrite failed', e);
                }
            }
            return true;
        } catch (e) {
            failures++;
            consecutiveFailures++;
            lastError = errorName(e);
            lastWriteError = lastError;
            lastFailure = { stage, error: lastError };
            dirty = true;
            log(`autosave: ${stage} failed`, e);
            if (lastError === NEWER_SAVE || lastError === OTHER_WRITER_SAVE || lastError === PREVIOUS_PAGE_SAVE) {
                // A newer page or another window saved here: never retry, never overwrite it (P-5).
                const reason = lastError === NEWER_SAVE ? 'newer' : 'otherTab';
                // The same card and block as another window, named apart in the log: the previous page of this tab saved after this one loaded.
                if (lastError === PREVIOUS_PAGE_SAVE) log('autosave: refused, the previous page of this tab saved later (previous page)');
                refuseWrites(reason, lastError);
            }
            // The first write after a migration re-arms itself, a bounded number of times (the child may never change anything).
            if (!writesOff() && options.migrated !== undefined && migrationWrittenAt === null && migrationRetries < balance.save.migrationWriteRetries) {
                migrationRetries++;
                arm();
            }
            return false;
        }
    };

    const save = (reason: WriteReason): Promise<void> => {
        if (writesOff()) {
            skipped++;
            return Promise.resolve();
        }
        if (inflight) {
            if (dirty) rerun = reason;
            return inflight;
        }
        if (!dirty) return Promise.resolve();
        cancelTimer();
        const run = (async () => {
            let next: WriteReason | null = reason;
            while (next !== null) {
                rerun = null;
                const ok = await attempt(next);
                next = ok && dirty && !writesOff() ? (rerun ?? null) : null;
            }
        })();
        inflight = run.finally(() => {
            inflight = null;
        });
        return inflight;
    };

    const arm = (): void => {
        cancelTimer();
        timer = timers.setTimeout(() => {
            timer = null;
            // Until the migrated save is written once, the debounced write carries that reason.
            void save(options.migrated !== undefined && migrationWrittenAt === null ? 'migration' : 'change');
        }, delayMs);
    };

    const replace = async (state: SaveState, replaceOptions: { force?: boolean } = {}): Promise<ReplaceResult> => {
        if (replacing || replaced) {
            log('autosave: replace refused (Busy)');
            return { ok: false, error: 'Busy' };
        }
        // One rule for the dialogs and for this refusal: see `replaceGate`.
        const gate = replaceGate({ blockedBy, loadReason: options.loadReason ?? null, loadError: options.loadError ?? null, loadFrom: options.loadFrom ?? null, unavailableStarts: options.unavailableStarts ?? 0 }, replaceOptions.force === true);
        if (gate === 'Blocked') {
            log('autosave: replace refused', { blockedBy, loadReason: options.loadReason ?? null, force: replaceOptions.force === true });
            return { ok: false, error: 'Blocked' };
        }
        if (blockedBy !== null) log('autosave: replacing a save that was not read', { blockedBy });
        if (!validateSave(state)) {
            log('autosave: replace refused (InvalidSave)', { problem: saveProblem(state) });
            return { ok: false, error: 'InvalidSave' };
        }
        replacing = true;
        cancelTimer();
        try {
            await inflight;
            // The write that was in flight may have been refused by another window (or the page may have hit a fatal error) while
            // the parent confirmed: the gate is asked again, so a replace never writes over a save this page now knows is newer (impl review).
            if (replaceGate({ blockedBy, loadReason: options.loadReason ?? null, loadError: options.loadError ?? null, loadFrom: options.loadFrom ?? null, unavailableStarts: options.unavailableStarts ?? 0 }, replaceOptions.force === true) === 'Blocked') {
                replacing = false;
                log('autosave: replace refused after the write in flight', { blockedBy });
                return { ok: false, error: 'Blocked' };
            }
            // The same accounting as a normal write: the record first, the save, then the copy tried once and never waited on twice (SRR-04, V-7).
            const owed = backupOwed() && options.migrated !== undefined;
            if (owed) noteOwed();
            await limited(store.write(state, 'replace'));
            if (owed) await copying;
            if (owed) await tryCopy(true);
        } catch (e) {
            replacing = false;
            failures++;
            consecutiveFailures++;
            lastError = errorName(e);
            lastWriteError = lastError;
            lastFailure = { stage: 'replace', error: lastError };
            log('autosave: replace failed', e);
            if (lastError === NEWER_SAVE) {
                blockedBy ??= 'newer';
                return { ok: false, error: lastError };
            }
            // An abandoned replace write may still land later; the live game is written after it.
            if (lastError === 'timeout') dirty = true;
            if (dirty) arm();
            return { ok: false, error: lastError };
        }
        replacing = false;
        replaced = true;
        writes++;
        lastWriteAt = options.now();
        if (options.migrated && migrationWrittenAt === null) migrationWrittenAt = lastWriteAt;
        consecutiveFailures = 0;
        return { ok: true };
    };

    // A migrated save is written once at start, without waiting for a change (audit M-3); the copy goes first.
    if (options.migrated !== undefined && blockedBy === null) {
        dirty = true;
        arm();
    }

    return {
        markDirty: () => {
            dirty = true;
            if (writesOff()) {
                skipped++;
                return;
            }
            arm();
        },
        flush: (reason) => save(reason),
        replace,
        current: () => encodeSave(snapshot()),
        noticeOtherWriter: () => refuseWrites('otherTab', OTHER_WRITER_SAVE),
        readBackups: async () => {
            try {
                // Under the write limit: the settings panel waits for this read, so a store that never answers must not hold it (impl review).
                return await limited(store.readBackups());
            } catch (e) {
                log('autosave: readBackups failed', e);
                return [];
            }
        },
        noteOlderWriter: () => {
            if (olderWriterSeen) return;
            olderWriterSeen = true;
            log('autosave: a record of an older format was found over this save (older build wrote)');
        },
        block: (reason, error) => {
            if (blockedBy === null && reason === 'fatal') fatalError = error ?? null;
            blockedBy ??= reason;
            cancelTimer();
        },
        status: () => ({
            load: options.load,
            blocked: blockedBy !== null,
            blockedBy,
            dirty,
            writes,
            failures,
            consecutiveFailures,
            skipped,
            lastReason,
            lastError,
            lastFailure,
            lastWriteAt,
            persistence,
            migratedFrom: options.migrated?.from ?? null,
            loadReason: options.loadReason ?? null,
            loadError: options.loadError ?? null,
            loadFrom: options.loadFrom ?? null,
            unavailableStarts: options.unavailableStarts ?? 0,
            backup,
            backupError,
            migrationWrittenAt,
            backupRecord: options.backupRecord ?? null,
            backupFailures,
            lastWriteError,
            lateWrite,
            fatalError,
            olderWriterSeen,
            replace: replacing ? 'writing' : replaced ? 'done' : 'idle',
        }),
    };
}
