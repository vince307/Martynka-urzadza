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

export type WriteReason = 'change' | 'now' | 'hidden';

export interface AutosaveStatus {
    load: LoadOutcome['kind'];
    blocked: boolean;
    dirty: boolean;
    writes: number;
    failures: number;
    skipped: number;
    lastReason: WriteReason | null;
}

export interface AutosaverOptions {
    store: SaveStore;
    snapshot: () => SessionSave;
    timers: { setTimeout: (fn: () => void, ms: number) => unknown; clearTimeout: (id: unknown) => void };
    delayMs: number;
    load: LoadOutcome['kind'];
    blocked: boolean;
    log: (...args: unknown[]) => void;
    onFirstWrite?: () => void;
}

export interface Autosaver {
    markDirty(): void;
    flush(reason: 'now' | 'hidden'): Promise<void>;
    block(reason: string): void;
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
    let blocked = options.blocked;
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
            if (!validateSave(encoded)) throw new Error('autosave: encoded state does not validate');
            dirty = false;
            await store.write(encoded);
            writes++;
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
            dirty = true;
            log('autosave: write failed', e);
            return false;
        }
    };

    const save = (reason: WriteReason): Promise<void> => {
        if (blocked) {
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
                next = ok && dirty && !blocked ? (rerun ?? null) : null;
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
            if (blocked) {
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
        block: () => {
            blocked = true;
            cancelTimer();
        },
        status: () => ({ load: options.load, blocked, dirty, writes, failures, skipped, lastReason }),
    };
}
