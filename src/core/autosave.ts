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
    | { kind: 'unavailable' };

export type BlockReason = 'unreadable' | 'unavailable' | 'fatal';

/** Only the name of a thrown value, never its message or stack. */
export function errorName(e: unknown): string {
    const name = typeof e === 'object' && e !== null ? (e as { name?: unknown }).name : undefined;
    return typeof name === 'string' && name !== '' ? name : 'Error';
}

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
    log: (...args: unknown[]) => void;
    onFirstWrite?: () => void;
}

export interface Autosaver {
    markDirty(): void;
    flush(reason: 'now' | 'hidden'): Promise<void>;
    block(reason: BlockReason): void;
    status(): AutosaveStatus;
}

/** Reads the store once. Never rejects: a failed read is `unavailable`. Never writes. */
export async function loadSave(store: SaveStore): Promise<LoadOutcome> {
    let raw: unknown;
    try {
        raw = await store.read();
    } catch {
        return { kind: 'unavailable' };
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
                    options.onFirstWrite?.();
                } catch (e) {
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
        if (blockedBy !== null) {
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
                next = ok && dirty && blockedBy === null ? (rerun ?? null) : null;
            }
        })();
        inflight = run.finally(() => {
            inflight = null;
        });
        return inflight;
    };

    return {
        markDirty: () => {
            dirty = true;
            if (blockedBy !== null) {
                skipped++;
                return;
            }
            cancelTimer();
            timer = timers.setTimeout(() => {
                timer = null;
                void save('change');
            }, delayMs);
        },
        flush: (reason) => save(reason),
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
        }),
    };
}
