// Autosave state machine (S-11, test-plan risks #2 and #16). Pure: the store, the clock and the log are injected.
import { decodeSave, encodeSave, validateSave, type SessionSave } from './save';
import type { SaveState } from './types';

export interface SaveStore {
    read(): Promise<unknown>;
    write(value: SaveState): Promise<void>;
}

export type LoadOutcome =
    | { kind: 'fresh' }
    | { kind: 'loaded'; session: SessionSave; migratedFrom: number | null }
    | { kind: 'unreadable'; reason: 'corrupt' | 'future' | 'unknown-version'; raw: unknown }
    | { kind: 'unavailable'; error: string };

export type BlockReason = 'unreadable' | 'unavailable' | 'fatal';

/** Only the name of a thrown value, never its message or stack. */
export function errorName(e: unknown): string {
    const name = typeof e === 'object' && e !== null ? (e as { name?: unknown }).name : undefined;
    return typeof name === 'string' && name !== '' ? name : 'Error';
}

/** Outcome of asking the browser not to evict the save (audit M-S2). Runtime only. */
export type Persistence = 'unknown' | 'granted' | 'denied' | 'unsupported' | 'error';

export type LoadReason = Extract<LoadOutcome, { kind: 'unreadable' }>['reason'];

export type WriteReason = 'change' | 'now' | 'hidden';

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
    /** Runtime only (never saved): why the load was unreadable; fixed at start. */
    loadReason: LoadReason | null;
    /** Runtime only (never saved): error name of the failed load; fixed at start (`lastError` moves on). */
    loadError: string | null;
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
    load: LoadOutcome['kind'];
    blockedBy: BlockReason | null;
    now: () => number;
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
    if (blockedBy === 'fatal') return 'Blocked';
    if (blockedBy === 'unreadable') return loadReason === 'future' ? 'Blocked' : 'ok';
    if (blockedBy === 'unavailable') return !isTimeoutError(loadError) && force ? 'ok' : 'Blocked';
    return 'ok';
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
 * With a `limit` the read races a timer; the abandoned read is caught at once so a late rejection reaches nobody,
 * and a late success is dropped (it is never written).
 */
export async function loadSave(
    store: SaveStore,
    limit?: { timers: AutosaverOptions['timers']; timeoutMs: number },
): Promise<LoadOutcome> {
    let raw: unknown;
    try {
        const read = store.read();
        if (limit === undefined) {
            raw = await read;
        } else {
            read.catch(() => undefined);
            let timer: unknown;
            const timeout = new Promise<never>((_, reject) => {
                timer = limit.timers.setTimeout(() => reject(Object.assign(new Error('read timed out'), { name: 'timeout' })), limit.timeoutMs);
            });
            try {
                raw = await Promise.race([read, timeout]);
            } finally {
                limit.timers.clearTimeout(timer);
            }
        }
    } catch (e) {
        return { kind: 'unavailable', error: errorName(e) };
    }
    if (raw === undefined) return { kind: 'fresh' };
    const result = decodeSave(raw);
    if (result.kind === 'ok') return { kind: 'loaded', session: result.session, migratedFrom: result.migratedFrom };
    return { kind: 'unreadable', reason: result.reason, raw };
}

export function createAutosaver(options: AutosaverOptions): Autosaver {
    const { store, snapshot, timers, delayMs, log } = options;
    let blockedBy: BlockReason | null = options.blockedBy;
    let lastError: string | null = options.loadError ?? null;
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
    const writesOff = (): boolean => blockedBy !== null || replacing || replaced;

    const cancelTimer = (): void => {
        if (timer !== null) timers.clearTimeout(timer);
        timer = null;
    };

    /** One write attempt; resolves true on success. Never throws. */
    const attempt = async (reason: WriteReason): Promise<boolean> => {
        try {
            const encoded = encodeSave(snapshot());
            if (!validateSave(encoded)) throw Object.assign(new Error('autosave: encoded state does not validate'), { name: 'InvalidSave' });
            dirty = false;
            await store.write(encoded);
            writes++;
            lastWriteAt = options.now();
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
            dirty = true;
            log('autosave: write failed', e);
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
            void save('change');
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
            await store.write(state);
        } catch (e) {
            replacing = false;
            failures++;
            consecutiveFailures++;
            lastError = errorName(e);
            log('autosave: replace failed', e);
            if (dirty) arm();
            return { ok: false, error: lastError };
        }
        replacing = false;
        replaced = true;
        writes++;
        lastWriteAt = options.now();
        consecutiveFailures = 0;
        return { ok: true };
    };

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
            lastWriteAt,
            persistence,
            loadReason: options.loadReason ?? null,
            loadError: options.loadError ?? null,
            replace: replacing ? 'writing' : replaced ? 'done' : 'idle',
        }),
    };
}
