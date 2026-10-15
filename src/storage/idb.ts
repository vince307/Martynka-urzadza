// The only module that touches IndexedDB, and the only importer of idb-keyval (eslint.config.mjs enforces it).
// One key holds the whole save, so an interrupted transaction leaves the previous save intact.
import { createStore, get, set, type UseStore } from 'idb-keyval';
import { NEWER_SAVE, storedVersionNewer } from '../core/save';
import { errorName, type Persistence, type SaveStore } from '../core/autosave';
import type { SaveState } from '../core/types';

export const SAVE_KEY_PREFIX = 'profile:';

export interface IdbSaveStoreOptions {
    dbName?: string;
    storeName?: string;
    profileId?: string;
}

// iOS Safari can lose the connection to the database (WebKit bug 197050); a fresh store reconnects.
const LOST_CONNECTION = new Set(['InvalidStateError', 'UnknownError']);

const isLostConnection = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && LOST_CONNECTION.has((error as { name?: string }).name ?? '');

/**
 * Writes `value` unless the stored record has a NEWER version (another tab or an old PWA instance must not overwrite it).
 * The read and the put share ONE readwrite transaction, so no other tab can slip a write between them. Refusal rejects with an
 * error named `NewerSave`. If the read itself fails (unreadable record) the version cannot be known, so the write still goes
 * through: the parent's forced "Zastąp mimo to" must keep working. Resolves when the transaction completes.
 */
export function guardedPut(os: IDBObjectStore, key: string, value: SaveState): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const tx = os.transaction as IDBTransaction | undefined;
        let refused = false;
        if (tx) {
            tx.oncomplete = () => (refused ? undefined : resolve());
            // No tx.onerror: request errors bubble to the transaction, so the prevented read error would reject a write that
            // lands. A put error that is not prevented aborts the transaction, and tx.error then carries its own name
            // (e.g. QuotaExceededError), not a made-up UnknownError that `run` would retry as a lost connection.
            tx.onabort = () => reject(tx.error ?? new DOMException('aborted', 'AbortError'));
        }
        const put = (): void => {
            const req = os.put(value, key);
            if (!tx) {
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error ?? new DOMException('failed', 'UnknownError'));
            }
        };
        const read = os.get(key);
        read.onsuccess = () => {
            if (storedVersionNewer(read.result, value.version)) {
                refused = true;
                reject(Object.assign(new Error('a newer save is stored'), { name: NEWER_SAVE }));
                return;
            }
            put();
        };
        read.onerror = (event) => {
            event.preventDefault(); // keep the transaction alive: an unreadable record is replaced, not protected
            put();
        };
    });
}

export function createIdbSaveStore(options: IdbSaveStoreOptions = {}): SaveStore {
    const { dbName = 'martynka', storeName = 'saves', profileId = 'default' } = options;
    const key = `${SAVE_KEY_PREFIX}${profileId}`;
    let store: UseStore | undefined;

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
        read: () => run((s) => get<unknown>(key, s)),
        write: (value: SaveState) => {
            const mine = ++writeSeq;
            return run((s) => s('readwrite', (os) => guardedPut(os, key, value)), () => mine === writeSeq);
        },
        backup: (raw: unknown, from: number) => run((s) => set(`${key}:backup-v${from}`, raw, s)),
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
