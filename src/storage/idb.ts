// The only module that touches IndexedDB, and the only importer of idb-keyval (eslint.config.mjs enforces it).
// One key holds the whole save, so an interrupted transaction leaves the previous save intact.
import { createStore, get, set, type UseStore } from 'idb-keyval';
import { SAVE_VERSION, writeVerdict } from '../core/save';
import { errorName, type BackupRecord, type Persistence, type SaveStore } from '../core/autosave';
import type { SaveState } from '../core/types';

export const SAVE_KEY_PREFIX = 'profile:';

export interface IdbSaveStoreOptions {
    dbName?: string;
    storeName?: string;
    profileId?: string;
    /** Id of this page load in the stored record; default a fresh random one per store, so two tabs are never the same writer. */
    writer?: string;
    /** Writers of earlier documents of this tab (T-3): a record of theirs that this page never read is refused, never overwritten. */
    endedWriters?: readonly string[];
    /** Called when a put went over a record of an older format (an older build wrote after this page's own save). */
    onOlderWriter?: () => void;
    /** Called after every put that landed (a replace included) with this page's writer and the generation written. */
    onWritten?: (stamp: { writer: string; generation: number }) => void;
}

// iOS Safari can lose the connection to the database (WebKit bug 197050); a fresh store reconnects.
const LOST_CONNECTION = new Set(['InvalidStateError', 'UnknownError']);

const isLostConnection = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && LOST_CONNECTION.has((error as { name?: string }).name ?? '');

/**
 * Writes `value` unless `writeVerdict` refuses (a newer format, or another tab wrote after this page last saw the record).
 * The read and the put share ONE readwrite transaction, so no other tab can slip a write between them. A refusal rejects with
 * an error named after the verdict. The record is stamped with the new `generation` and this page's `writer`. If the read
 * itself fails (unreadable record) the write still goes through, as generation `base + 1`: the parent's forced
 * "Zastąp mimo to" must keep working. Resolves with the written generation when the transaction completes.
 */
export function guardedPut(
    os: IDBObjectStore,
    key: string,
    value: SaveState,
    page: { version: number; base: number; writer: string; endedWriters?: readonly string[] },
    mode: 'normal' | 'replace',
    onOlderWriter?: () => void,
): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const tx = os.transaction as IDBTransaction | undefined;
        let refused = false;
        let written = 0;
        let older = false;
        // Told only when the put landed: a refused or aborted write found nothing to report.
        const done = (generation: number): void => {
            resolve(generation);
            if (older) {
                try {
                    onOlderWriter?.();
                } catch (e) {
                    console.warn('save: older-writer listener failed', errorName(e));
                }
            }
        };
        if (tx) {
            tx.oncomplete = () => (refused ? undefined : done(written));
            // No tx.onerror: request errors bubble to the transaction, so the prevented read error would reject a write that
            // lands. A put error that is not prevented aborts the transaction, and tx.error then carries its own name
            // (e.g. QuotaExceededError), not a made-up UnknownError that `run` would retry as a lost connection.
            tx.onabort = () => reject(tx.error ?? new DOMException('aborted', 'AbortError'));
        }
        const put = (generation: number): void => {
            written = generation;
            try {
                const req = os.put({ ...value, generation, writer: page.writer }, key);
                if (!tx) {
                    req.onsuccess = () => done(generation);
                    req.onerror = () => reject(req.error ?? new DOMException('failed', 'UnknownError'));
                }
            } catch (e) {
                refused = true;
                reject(e instanceof Error ? e : new DOMException('put failed', 'UnknownError'));
            }
        };
        const read = os.get(key);
        read.onsuccess = () => {
            const verdict = writeVerdict(read.result, page, mode);
            if (verdict.kind === 'refuse') {
                refused = true;
                reject(Object.assign(new Error('the stored save is not this page\'s to overwrite'), { name: verdict.error }));
                return;
            }
            older = verdict.olderWriter === true;
            put(verdict.generation);
        };
        read.onerror = (event) => {
            event.preventDefault(); // keep the transaction alive: an unreadable record is replaced, not protected
            put(page.base + 1);
        };
    });
}

const request = <T>(req: IDBRequest<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new DOMException('failed', 'UnknownError'));
    });

/**
 * Write-once copy of a raw old-version save, with the record `kept`, in ONE readwrite transaction. `count`, not `getKey`
 * (build target safari14). A copy that already exists (an older build, an earlier session, an earlier migration) is never
 * overwritten or deleted: only the record is written, so the stored line is true across launches. Resolves on `oncomplete`.
 * A failure to put the record aborts the copy too (accepted, plan review F4): the caller counts it as a failed copy.
 */
export function putBackupOnce(os: IDBObjectStore, copyKey: string, recordKey: string, raw: unknown, from: number, at: number): Promise<'written' | 'kept'> {
    return new Promise<'written' | 'kept'>((resolve, reject) => {
        const tx = os.transaction;
        let result: 'written' | 'kept' = 'kept';
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(tx.error ?? new DOMException('aborted', 'AbortError'));
        request(os.count(copyKey)).then(
            (count) => {
                try {
                    if (count === 0) {
                        result = 'written';
                        os.put(raw, copyKey);
                    }
                    const record: BackupRecord = { from, result: 'kept', error: null, at };
                    os.put(record, recordKey);
                } catch (e) {
                    reject(e instanceof Error ? e : new DOMException('put failed', 'UnknownError'));
                }
            },
            (e: unknown) => reject(e instanceof Error ? e : new DOMException('count failed', 'UnknownError')),
        );
    });
}

/** One id per store, so one per page load: the store stamps it in the record so a second tab can be told apart (B-1). */
const randomWriter = (): string =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** The store plus what the save channel verdict needs: this page's writer and the generation it last saw stored or wrote. */
export interface IdbSaveStore extends SaveStore {
    stamp(): { writer: string; base: number };
}

export function createIdbSaveStore(options: IdbSaveStoreOptions = {}): IdbSaveStore {
    const { dbName = 'martynka', storeName = 'saves', profileId = 'default', writer = randomWriter(), endedWriters, onOlderWriter, onWritten } = options;
    const key = `${SAVE_KEY_PREFIX}${profileId}`;
    const recordKey = `${key}:backup-status`;
    let store: UseStore | undefined;
    let base = 0; // the generation this page last saw stored (read) or wrote

    const open = (fresh: boolean): UseStore => {
        if (fresh || !store) store = createStore(dbName, storeName);
        return store;
    };

    // createStore does not touch indexedDB until the first operation, so a missing indexedDB rejects here.
    // `mayRetry` lets a write refuse the retry: an abandoned (timed out) write must never land after a newer one.
    const run = async <T>(op: (s: UseStore) => Promise<T>, mayRetry: () => boolean = () => true): Promise<T> => {
        try {
            return await op(open(false));
        } catch (error) {
            if (!isLostConnection(error) || !mayRetry()) throw error;
            return op(open(true));
        }
    };

    let writeSeq = 0;
    return {
        read: async () => {
            const record = await run((s) => get<unknown>(key, s));
            const generation = (record as { generation?: unknown } | null | undefined)?.generation;
            base = typeof generation === 'number' && Number.isInteger(generation) && generation >= 0 ? generation : 0;
            return record;
        },
        write: async (value: SaveState, mode: 'normal' | 'replace' = 'normal') => {
            const mine = ++writeSeq;
            const generation = await run((s) => s('readwrite', (os) => guardedPut(os, key, value, { version: value.version, base, writer, endedWriters }, mode, onOlderWriter)), () => mine === writeSeq);
            base = Math.max(base, generation);
            try {
                onWritten?.({ writer, generation });
            } catch (e) {
                console.warn('save: written listener failed', errorName(e));
            }
        },
        stamp: () => ({ writer, base }),
        backup: (raw: unknown, from: number) =>
            run((s) => s('readwrite', (os) => putBackupOnce(os, `${key}:backup-v${from}`, recordKey, raw, from, Date.now()))),
        readBackups: async () => {
            const found: { from: number; raw: unknown }[] = [];
            for (let from = 1; from < SAVE_VERSION; from += 1) {
                const raw = await run((s) => get<unknown>(`${key}:backup-v${from}`, s));
                if (raw !== undefined) found.push({ from, raw });
            }
            return found;
        },
        backupRecord: async () => {
            const record = await run((s) => get<BackupRecord>(recordKey, s));
            return record ?? null;
        },
        noteBackup: (record: BackupRecord) => run((s) => set(recordKey, record, s)),
    };
}

/** Asks the browser not to evict the save and reports the answer. A refusal is normal. Never throws or rejects. */
export async function requestPersistence(nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator): Promise<Persistence> {
    try {
        const storage = nav?.storage;
        if (typeof storage?.persist !== 'function') return 'unsupported';
        return (await storage.persist()) ? 'granted' : 'denied';
    } catch (e) {
        // Name only, never the message (S12-12).
        console.warn('save: persist() failed', errorName(e));
        return 'error';
    }
}
