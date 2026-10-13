// The only module that touches IndexedDB, and the only importer of idb-keyval (eslint.config.mjs enforces it).
// One key holds the whole save, so an interrupted transaction leaves the previous save intact.
import { createStore, get, set, type UseStore } from 'idb-keyval';
import type { Persistence, SaveStore } from '../core/autosave';
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

export function createIdbSaveStore(options: IdbSaveStoreOptions = {}): SaveStore {
    const { dbName = 'martynka', storeName = 'saves', profileId = 'default' } = options;
    const key = `${SAVE_KEY_PREFIX}${profileId}`;
    let store: UseStore | undefined;

    const open = (fresh: boolean): UseStore => {
        if (fresh || !store) store = createStore(dbName, storeName);
        return store;
    };

    // createStore does not touch indexedDB until the first operation, so a missing indexedDB rejects here.
    const run = async <T>(op: (s: UseStore) => Promise<T>): Promise<T> => {
        try {
            return await op(open(false));
        } catch (error) {
            if (!isLostConnection(error)) throw error;
            return op(open(true));
        }
    };

    return {
        read: () => run((s) => get<unknown>(key, s)),
        write: (value: SaveState) => run((s) => set(key, value, s)),
    };
}

/** Asks the browser not to evict the save and reports the answer. A refusal is normal. Never throws or rejects. */
export async function requestPersistence(nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator): Promise<Persistence> {
    try {
        const storage = nav?.storage;
        if (typeof storage?.persist !== 'function') return 'unsupported';
        return (await storage.persist()) ? 'granted' : 'denied';
    } catch {
        return 'error';
    }
}
