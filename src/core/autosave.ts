// Autosave state machine (S-11, test-plan risks #2 and #16). Pure: the store, the clock and the log are injected.
import { decodeSave, encodeSave, NEWER_SAVE, SAVE_VERSION, validateSave, type SessionSave } from './save';
import type { SaveState } from './types';

export interface SaveStore {
    read(): Promise<unknown>;
    write(value: SaveState): Promise<void>;
    /** Keeps a copy of the raw save of version `from` under its own key; required, so a store can never skip it. Never touches the main key. */
    backup(raw: unknown, from: number): Promise<void>;
}

export type LoadOutcome =
    | { kind: 'fresh' }
    | { kind: 'loaded'; session: SessionSave; migratedFrom: number | null; raw: unknown }
    | { kind: 'unreadable'; reason: 'corrupt' | 'future' | 'unknown-version' | 'migration-failed'; raw: unknown }
    | { kind: 'unavailable'; error: string; waitLonger?: (timeoutMs: number) => Promise<LoadOutcome> };

/** `newer` (runtime only, never saved): the store refused a write because it holds a save of a newer format (P-5). */
export type BlockReason = 'unreadable' | 'unavailable' | 'fatal' | 'newer';

/** Only the name of a thrown value, never its message or stack. */
export function errorName(e: unknown): string {
    const name = typeof e === 'object' && e !== null ? (e as { name?: unknown }).name : undefined;
    return typeof name === 'string' && name !== '' ? name : 'Error';
}

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
    /**
     * Runtime only (never saved): the copy of the raw older save. `none` without a migration, `pending` before the first
     * try, `failed` after at least one failed try (still owed), `done` once kept, `skipped` when the new version was written without it.
     */
    backup: 'none' | 'pending' | 'failed' | 'done' | 'skipped';
    /** Runtime only (never saved): when the first write after a migration succeeded, or null (not migrated, or not yet written). */
    migrationWrittenAt: number | null;
    /** Runtime only (never saved): error name of the last failed copy; stays after a later success. */
    backupError: string | null;
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
    log: (...args: unknown[]) => void;
    onFirstWrite?: () => Promise<Persistence> | void;
}

/**
 * A load that ran out of time: our own read limit (`timeout`) or IndexedDB's `TimeoutError`. The save behind it may be
 * healthy, so it is never forceable and the parent reads the slow-read sentence (impl-review F1).
 */
export const isTimeoutError = (name: string | null): boolean => name === 'timeout' || name === 'TimeoutError';

/**
 * The one rule for overwriting the device save, shared by `replace` and the dialogs' `forceable` (plan decision 3).
 * `future` is a healthy save from a newer build and a `timeout` read may be a healthy slow one: neither is ever replaced.
 * A read the browser refused (`unavailable`) is replaced only on an explicit `force`.
 */
export function replaceGate(status: Pick<AutosaveStatus, 'blockedBy' | 'loadReason' | 'loadError'>, force: boolean): 'ok' | 'Blocked' {
    const { blockedBy, loadReason, loadError } = status;
    if (blockedBy === 'fatal' || blockedBy === 'newer') return 'Blocked';
    if (blockedBy === 'unreadable') return loadReason === 'future' ? 'Blocked' : 'ok';
    if (blockedBy === 'unavailable') return !isTimeoutError(loadError) && force ? 'ok' : 'Blocked';
    return 'ok';
}

/**
 * Races `work` against a timer: a store call that never answers becomes a `timeout` failure. The abandoned promise stays subscribed by the race, so a late rejection reaches nobody; a late success is dropped. The timer is always cleared.
 */
export function withTimeLimit<T>(work: Promise<T>, timers: AutosaverOptions['timers'], ms: number): Promise<T> {
    let timer: unknown;
    const limit = new Promise<never>((_, reject) => {
        timer = timers.setTimeout(() => reject(Object.assign(new Error('store timed out'), { name: 'timeout' })), ms);
    });
    return Promise.race([work, limit]).finally(() => timers.clearTimeout(timer));
}

export type ReplaceResult = { ok: true } | { ok: false; error: string };

export interface Autosaver {
    markDirty(): void;
    replace(state: SaveState, options?: { force?: boolean }): Promise<ReplaceResult>;
    current(): SaveState;
    flush(reason: 'now' | 'hidden'): Promise<void>;
    block(reason: BlockReason): void;
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
        if (result.kind === 'ok') return { kind: 'loaded', session: result.session, migratedFrom: result.migratedFrom, raw };
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
    const backupOwed = (): boolean => backup === 'pending' || backup === 'failed';
    const writesOff = (): boolean => blockedBy !== null || replacing || replaced;

    const cancelTimer = (): void => {
        if (timer !== null) timers.clearTimeout(timer);
        timer = null;
    };

    const limited = <T>(work: Promise<T>): Promise<T> => withTimeLimit(work, timers, options.writeTimeoutMs);

    /** Called only after the save itself was written without the copy: a failed write leaves the copy owed. */
    const skipBackup = (): void => {
        backup = 'skipped';
        log(`autosave: writing v${SAVE_VERSION} without the v${options.migrated?.from ?? '?'} copy`, { from: options.migrated?.from ?? null, backupError, attempts: backupFails });
    };

    /** One write attempt; resolves true on success. Never throws. */
    const attempt = async (reason: WriteReason): Promise<boolean> => {
        let stage: FailureStage = 'encode';
        try {
            const encoded = encodeSave(snapshot());
            if (!validateSave(encoded)) throw Object.assign(new Error('autosave: encoded state does not validate'), { name: 'InvalidSave' });
            dirty = false;
            // The old save is copied before it can be overwritten; a failed copy fails this attempt and the next one retries it.
            // After `backupAttempts` failed copies in a session, or when the page is hiding after a failed copy, or when hiding is
            // the first attempt, the current version is written without the copy: the child's progress is worth more than the raw old bytes (SV2-01).
            let giveUpCopy = false;
            if (backupOwed() && options.migrated) {
                stage = 'backup';
                if (reason === 'hidden' && backupFails > 0) {
                    giveUpCopy = true;
                } else {
                    try {
                        await limited(store.backup(options.migrated.raw, options.migrated.from));
                        backup = 'done';
                    } catch (e) {
                        backupFails++;
                        backupError = errorName(e);
                        backup = 'failed';
                        if (reason !== 'hidden' && backupFails < options.backupAttempts) throw e;
                        failures++;
                        lastError = backupError;
                        lastFailure = { stage: 'backup', error: backupError };
                        log('autosave: backup failed', e);
                        giveUpCopy = true;
                    }
                }
            }
            stage = 'write';
            await limited(store.write(encoded));
            if (giveUpCopy) skipBackup();
            writes++;
            lastWriteAt = options.now();
            if (options.migrated && migrationWrittenAt === null) migrationWrittenAt = lastWriteAt;
            consecutiveFailures = 0;
            lastReason = reason;
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
            lastFailure = { stage, error: lastError };
            dirty = true;
            log(`autosave: ${stage} failed`, e);
            if (lastError === NEWER_SAVE) {
                // A newer page saved here: never retry, never overwrite it (P-5).
                blockedBy ??= 'newer';
                cancelTimer();
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
        if (replacing || replaced) return { ok: false, error: 'Busy' };
        // One rule for the dialogs and for this refusal: see `replaceGate`.
        const gate = replaceGate({ blockedBy, loadReason: options.loadReason ?? null, loadError: options.loadError ?? null }, replaceOptions.force === true);
        if (gate === 'Blocked') {
            log('autosave: replace refused', { blockedBy, loadReason: options.loadReason ?? null, force: replaceOptions.force === true });
            return { ok: false, error: 'Blocked' };
        }
        if (blockedBy !== null) log('autosave: replacing a save that was not read', { blockedBy });
        if (!validateSave(state)) return { ok: false, error: 'InvalidSave' };
        replacing = true;
        cancelTimer();
        try {
            await inflight;
            // A copy still owed is tried once and never waited on twice: a failure only marks it skipped (SRR-04).
            let giveUpCopy = false;
            if (backupOwed() && options.migrated) {
                try {
                    await limited(store.backup(options.migrated.raw, options.migrated.from));
                    backup = 'done';
                } catch (e) {
                    backupFails++;
                    backupError = errorName(e);
                    backup = 'failed';
                    log('autosave: backup failed', e);
                    giveUpCopy = true;
                }
            }
            await limited(store.write(state));
            if (giveUpCopy) skipBackup();
        } catch (e) {
            replacing = false;
            failures++;
            consecutiveFailures++;
            lastError = errorName(e);
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
        block: (reason) => {
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
            backup,
            backupError,
            migrationWrittenAt,
            replace: replacing ? 'writing' : replaced ? 'done' : 'idle',
        }),
    };
}
