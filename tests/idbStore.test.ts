import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';
import { decodeSave, NEWER_SAVE, SAVE_VERSION } from '../src/core/save';
import type { SaveState } from '../src/core/types';
import { createIdbSaveStore, guardedPut, requestPersistence } from '../src/storage/idb';

// S-11 phase 3 (test-plan risk #2): the adapter round-trips through a real structured clone.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8')) as SaveState;

// The spy wraps the real `createStore`; a test can swap the store of the first write for one that holds or rejects it
// (an abandoned write, a lost connection). Writes go through `guardedPut` on the raw store, not through `set`.
vi.mock('idb-keyval', async (importOriginal) => {
    const real = await importOriginal<typeof import('idb-keyval')>();
    return { ...real, createStore: vi.fn(real.createStore) };
});

let counter = 0;
const freshStore = (profileId?: string, dbName = `test-db-${++counter}`) => createIdbSaveStore({ dbName, storeName: 'saves', profileId });

describe('IndexedDB save store', () => {
    it('an empty store reads undefined', async () => {
        expect(await freshStore().read()).toBeUndefined();
    });

    it('a written v1 save reads back deeply equal and still decodes ok', async () => {
        const store = freshStore();
        await store.write(fixture);
        const back = await store.read();
        expect(back).toEqual(fixture);
        expect(decodeSave(back).kind).toBe('ok');
    });

    it('a second write replaces the first (one key)', async () => {
        const store = freshStore();
        await store.write(fixture);
        await store.write({ ...fixture, stars: fixture.stars + 7 });
        expect(((await store.read()) as SaveState).stars).toBe(fixture.stars + 7);
    });

    it('two profiles do not see each other', async () => {
        const dbName = `shared-${++counter}`;
        const a = freshStore('a', dbName);
        const b = freshStore('b', dbName);
        await a.write(fixture);
        expect(await b.read()).toBeUndefined();
        expect(await a.read()).toEqual(fixture);
    });

    it('a value that cannot be cloned rejects', async () => {
        const bad = { ...fixture, hook: () => 1 } as unknown as SaveState;
        await expect(freshStore().write(bad)).rejects.toThrow();
    });

    it('requestPersistence without navigator.storage is unsupported and does not throw', async () => {
        await expect(requestPersistence({} as Navigator)).resolves.toBe('unsupported');
    });

    it('requestPersistence maps persist() to granted, denied, and error (throw or reject)', async () => {
        const nav = (persist: () => unknown): Navigator => ({ storage: { persist } }) as unknown as Navigator;
        await expect(requestPersistence(nav(() => Promise.resolve(true)))).resolves.toBe('granted');
        await expect(requestPersistence(nav(() => Promise.resolve(false)))).resolves.toBe('denied');
        await expect(requestPersistence(nav(() => { throw new Error('x'); }))).resolves.toBe('error');
        await expect(requestPersistence(nav(() => Promise.reject(new Error('x'))))).resolves.toBe('error');
    });

    it('requestPersistence logs the error name, not the message', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const nav = { storage: { persist: () => Promise.reject(new DOMException('secret detail', 'SecurityError')) } } as unknown as Navigator;
            await expect(requestPersistence(nav)).resolves.toBe('error');
            expect(warn).toHaveBeenCalledWith('save: persist() failed', 'SecurityError');
        } finally {
            warn.mockRestore();
        }
    });
});

describe('IndexedDB backup copy (S-15 phase 2)', () => {
    it('writes the raw v1 under backup-v1 and leaves the main key alone', async () => {
        const dbName = `bk-${++counter}`;
        const main = freshStore(undefined, dbName);
        await main.write(fixture);
        const raw = { ...fixture, stars: 123 };
        await main.backup(raw, 1);
        expect(await main.read()).toEqual(fixture);
        // The copy lives under the key `profile:default:backup-v1`: a store whose profile id is `default:backup-v1` reads it.
        expect(await freshStore('default:backup-v1', dbName).read()).toEqual(raw);
    });

    it('a copy of another version goes to its own key', async () => {
        const dbName = `bk-${++counter}`;
        await freshStore(undefined, dbName).backup({ a: 1 }, 2);
        expect(await freshStore('default:backup-v2', dbName).read()).toEqual({ a: 1 });
        expect(await freshStore('default:backup-v1', dbName).read()).toBeUndefined();
    });

    // plan-review F1: an abandoned write must not land after a newer one.
    // The first store call goes to `first`; every later call (also the next store) goes to the real store.
    const faultyFirstCall = async (first: (real: idbKeyval.UseStore) => Promise<unknown>) => {
        const real = await vi.importActual<typeof import('idb-keyval')>('idb-keyval');
        const create = vi.mocked(idbKeyval.createStore);
        create.mockClear();
        let calls = 0;
        create.mockImplementation((db, name) => {
            const inner = real.createStore(db, name);
            return ((mode, fn) => (++calls === 1 ? first(inner) : inner(mode, fn))) as idbKeyval.UseStore;
        });
        return () => calls;
    };

    it('an abandoned write that fails with a lost connection is not retried once a newer write started', async () => {
        let rejectFirst: (e: unknown) => void = () => undefined;
        const calls = await faultyFirstCall(() => new Promise<unknown>((_, reject) => void (rejectFirst = reject)));
        const store = freshStore();
        const first = store.write({ ...fixture, stars: 1 });
        const firstOutcome = first.then(() => 'ok', (e: unknown) => (e as Error).name);
        await store.write({ ...fixture, stars: 2 });
        rejectFirst(Object.assign(new Error('lost'), { name: 'InvalidStateError' }));
        expect(await firstOutcome).toBe('InvalidStateError');
        expect(calls()).toBe(2);
        expect(((await store.read()) as SaveState).stars).toBe(2);
    });

    it('a lost connection still retries a write when no newer write started', async () => {
        const calls = await faultyFirstCall(() => Promise.reject(Object.assign(new Error('lost'), { name: 'InvalidStateError' })));
        const store = freshStore();
        await store.write({ ...fixture, stars: 5 });
        expect(calls()).toBeGreaterThanOrEqual(2);
        expect(((await store.read()) as SaveState).stars).toBe(5);
    });
});

// load-and-tab-guard phase 5 (P-5): an old tab must not overwrite a newer save. Two stores on ONE database stand for two tabs.
describe('IndexedDB newer-save guard', () => {
    const at = (version: number, stars = 1): SaveState => ({ ...fixture, version, stars }) as unknown as SaveState;
    const named = async (p: Promise<unknown>): Promise<string> => p.then(() => 'ok', (e: unknown) => (e as Error).name);

    it('a store holding version 4 refuses a v3 write from another store with NewerSave and keeps v4', async () => {
        const dbName = `newer-${++counter}`;
        const tabB = freshStore(undefined, dbName);
        const tabA = freshStore(undefined, dbName);
        await tabB.write(at(SAVE_VERSION + 1, 40));
        expect(await named(tabA.write(at(SAVE_VERSION, 1)))).toBe(NEWER_SAVE);
        const back = (await tabA.read()) as SaveState;
        expect(back.version).toBe(SAVE_VERSION + 1);
        expect(back.stars).toBe(40);
    });

    it('an empty store, the same version and a lower version all accept the write', async () => {
        const dbName = `newer-${++counter}`;
        const store = freshStore(undefined, dbName);
        expect(await named(store.write(at(SAVE_VERSION, 1)))).toBe('ok');
        expect(await named(store.write(at(SAVE_VERSION, 2)))).toBe('ok');
        const other = freshStore(undefined, `newer-${++counter}`);
        await other.write(at(1, 3));
        expect(await named(other.write(at(SAVE_VERSION, 4)))).toBe('ok');
        expect(((await other.read()) as SaveState).stars).toBe(4);
    });

    it('a stored record without a numeric version (damaged) is overwritten', async () => {
        const dbName = `newer-${++counter}`;
        const real = await vi.importActual<typeof import('idb-keyval')>('idb-keyval');
        await real.set('profile:default', { stars: 'many' }, real.createStore(dbName, 'saves'));
        const store = freshStore(undefined, dbName);
        expect(await named(store.write(at(SAVE_VERSION)))).toBe('ok');
        expect(((await store.read()) as SaveState).version).toBe(SAVE_VERSION);
    });

    it('the backup copy stays a separate key and is never refused', async () => {
        const dbName = `newer-${++counter}`;
        const store = freshStore(undefined, dbName);
        await store.write(at(SAVE_VERSION + 1));
        expect(await named(store.backup({ ...fixture, stars: 9 }, 1))).toBe('ok');
    });

    it('a NewerSave refusal is not retried', async () => {
        const dbName = `newer-${++counter}`;
        await freshStore(undefined, dbName).write(at(SAVE_VERSION + 1));
        const create = vi.mocked(idbKeyval.createStore);
        create.mockClear();
        const store = freshStore(undefined, dbName);
        expect(await named(store.write(at(SAVE_VERSION)))).toBe(NEWER_SAVE);
        expect(create).toHaveBeenCalledTimes(1);
    });
});

describe('guardedPut on a raw object store', () => {
    // A stand-in whose get fails (an unreadable record) and which records what was put.
    const brokenGet = () => {
        const puts: unknown[] = [];
        const os = {
            get: () => {
                const req = {} as { onsuccess?: () => void; onerror?: (e: { preventDefault(): void }) => void; error: unknown };
                req.error = new DOMException('unreadable', 'UnknownError');
                queueMicrotask(() => req.onerror?.({ preventDefault: () => (prevented = true) }));
                return req;
            },
            put: (value: unknown) => {
                puts.push(value);
                const req = {} as { onsuccess?: () => void; onerror?: () => void };
                queueMicrotask(() => req.onsuccess?.());
                return req;
            },
        } as unknown as IDBObjectStore;
        let prevented = false;
        return { os, puts, wasPrevented: () => prevented };
    };

    it('puts anyway when the get itself fails, after preventing the abort', async () => {
        const { os, puts, wasPrevented } = brokenGet();
        const value = { ...fixture, version: SAVE_VERSION } as unknown as SaveState;
        await expect(guardedPut(os, 'profile:default', value)).resolves.toBeUndefined();
        expect(puts).toEqual([value]);
        expect(wasPrevented()).toBe(true);
    });

    // impl-review F1: in a browser the error event of the failed get BUBBLES to the transaction (IndexedDB fires request
    // errors with bubbles: true). The transaction must not treat that prevented read error as a failed write.
    it('a prevented read error that bubbles to the transaction does not reject the write', async () => {
        const puts: unknown[] = [];
        const tx = {} as { oncomplete?: () => void; onerror?: (e: unknown) => void; onabort?: () => void; error: unknown };
        tx.error = null;
        const os = {
            transaction: tx,
            get: () => {
                const req = {} as { onerror?: (e: unknown) => void; error: unknown };
                req.error = new DOMException('unreadable', 'UnknownError');
                queueMicrotask(() => {
                    const event = { target: req, preventDefault: () => undefined };
                    req.onerror?.(event);
                    tx.onerror?.(event);   // bubbling: request, then transaction
                });
                return req;
            },
            put: (value: unknown) => {
                puts.push(value);
                queueMicrotask(() => tx.oncomplete?.());
                return {};
            },
        } as unknown as IDBObjectStore;
        const value = { ...fixture, version: SAVE_VERSION } as unknown as SaveState;
        await expect(guardedPut(os, 'profile:default', value)).resolves.toBeUndefined();
        expect(puts).toEqual([value]);
    });
});
