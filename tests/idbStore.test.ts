import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';
import { decodeSave, NEWER_SAVE, OTHER_WRITER_SAVE, SAVE_VERSION } from '../src/core/save';
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
        expect(back).toMatchObject({ ...fixture, generation: 1 });
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
        expect(await a.read()).toMatchObject(fixture);
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
        expect(await main.read()).toMatchObject(fixture);
        // The copy lives under the key `profile:default:backup-v1`: a store whose profile id is `default:backup-v1` reads it.
        expect(await freshStore('default:backup-v1', dbName).read()).toEqual(raw);
    });

    it('a copy of another version goes to its own key', async () => {
        const dbName = `bk-${++counter}`;
        await freshStore(undefined, dbName).backup({ a: 1 }, 2);
        expect(await freshStore('default:backup-v2', dbName).read()).toEqual({ a: 1 });
        expect(await freshStore('default:backup-v1', dbName).read()).toBeUndefined();
    });

    it('a v4 copy goes to backup-v4 and readBackups returns it (rooms-as-data)', async () => {
        const dbName = `bk-${++counter}`;
        const store = freshStore(undefined, dbName);
        await store.backup({ a: 4 }, 4);
        expect(await freshStore('default:backup-v4', dbName).read()).toEqual({ a: 4 });
        expect((await store.readBackups()).find((b) => b.from === 4)?.raw).toEqual({ a: 4 });
    });

    it('a v3 copy goes to backup-v3 (stale-tab-and-health)', async () => {
        const dbName = `bk-${++counter}`;
        await freshStore(undefined, dbName).backup({ a: 3 }, 3);
        expect(await freshStore('default:backup-v3', dbName).read()).toEqual({ a: 3 });
    });

    // save-truth phase 4 (FU-3/P-8, SV2-04, SVB-01): the copy is write-once, readable, and has a record.
    it('a second backup for the same version keeps the first bytes and answers kept', async () => {
        const dbName = `bk-${++counter}`;
        const store = freshStore(undefined, dbName);
        expect(await store.backup({ n: 1 }, 1)).toBe('written');
        expect(await store.backup({ n: 2 }, 1)).toBe('kept');
        expect(await freshStore('default:backup-v1', dbName).read()).toEqual({ n: 1 });
    });

    it('a copy written now stores the record kept in the same call', async () => {
        const dbName = `bk-${++counter}`;
        const store = freshStore(undefined, dbName);
        expect(await store.backupRecord()).toBeNull();
        await store.backup({ n: 1 }, 3);
        expect(await store.backupRecord()).toEqual({ from: 3, result: 'kept', error: null, at: expect.any(Number) as number });
    });

    it('a copy made earlier (no record yet) gets the record kept and stays untouched', async () => {
        const dbName = `bk-${++counter}`;
        const real = await vi.importActual<typeof import('idb-keyval')>('idb-keyval');
        await real.set('profile:default:backup-v2', { old: true }, real.createStore(dbName, 'saves'));
        const store = freshStore(undefined, dbName);
        expect(await store.backup({ n: 9 }, 2)).toBe('kept');
        expect(await freshStore('default:backup-v2', dbName).read()).toEqual({ old: true });
        expect(await store.backupRecord()).toMatchObject({ from: 2, result: 'kept' });
    });

    it('readBackups returns only the versions present, below the current one', async () => {
        const dbName = `bk-${++counter}`;
        const store = freshStore(undefined, dbName);
        expect(await store.readBackups()).toEqual([]);
        await store.backup({ n: 1 }, 1);
        await store.backup({ n: 3 }, 3);
        expect(await store.readBackups()).toEqual([
            { from: 1, raw: { n: 1 } },
            { from: 3, raw: { n: 3 } },
        ]);
    });

    it('noteBackup stores the record and never touches the main key or a copy', async () => {
        const dbName = `bk-${++counter}`;
        const store = freshStore(undefined, dbName);
        await store.write(fixture);
        await store.backup({ n: 1 }, 1);
        await store.noteBackup({ from: 1, result: 'lost', error: 'QuotaExceededError', at: 5 });
        expect(await store.backupRecord()).toEqual({ from: 1, result: 'lost', error: 'QuotaExceededError', at: 5 });
        expect(await store.read()).toMatchObject({ ...fixture, generation: 1 });
        expect(await freshStore('default:backup-v1', dbName).read()).toEqual({ n: 1 });
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

const PAGE = { version: SAVE_VERSION, base: 0, writer: 'A' };

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
        await expect(guardedPut(os, 'profile:default', value, PAGE, 'normal')).resolves.toBe(1);
        expect(puts).toEqual([{ ...value, generation: 1, writer: 'A' }]);
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
        await expect(guardedPut(os, 'profile:default', value, PAGE, 'normal')).resolves.toBe(1);
        expect(puts).toEqual([{ ...value, generation: 1, writer: 'A' }]);
    });
});

// stale-tab-and-health phase 2 (B-1): a page that did not see another tab's write is refused inside the transaction.
// Two stores on ONE fake database stand for two tabs; each has its own writer id.
describe('IndexedDB stale-writer guard', () => {
    const v = (stars: number): SaveState => ({ ...fixture, version: SAVE_VERSION, stars }) as unknown as SaveState;
    const tab = (writer: string, dbName: string) => createIdbSaveStore({ dbName, storeName: 'saves', writer });
    const named = async (p: Promise<unknown>): Promise<string> => p.then(() => 'ok', (e: unknown) => (e as Error).name);
    const stored = async (dbName: string) => (await tab('probe', dbName).read()) as { generation: number; writer: string; stars: number };

    it('the first write stamps generation 1 and its writer; a stale tab is refused and the record stays', async () => {
        const db = `stale-${++counter}`;
        const a = tab('A', db);
        const b = tab('B', db);
        await a.read();
        await b.read();
        await a.write(v(10));
        expect(await stored(db)).toMatchObject({ generation: 1, writer: 'A', stars: 10 });
        expect(await named(b.write(v(99)))).toBe(OTHER_WRITER_SAVE);
        expect(await stored(db)).toMatchObject({ generation: 1, writer: 'A', stars: 10 });
    });

    it('a replace lands over another writer; the replaced tab is then refused', async () => {
        const db = `stale-${++counter}`;
        const a = tab('A', db);
        const b = tab('B', db);
        await a.read();
        await b.read();
        await a.write(v(10));
        await b.write(v(50), 'replace');
        expect(await stored(db)).toMatchObject({ generation: 2, writer: 'B', stars: 50 });
        expect(await named(a.write(v(11)))).toBe(OTHER_WRITER_SAVE);
    });

    it('a page that is created again reads the record and writes', async () => {
        const db = `stale-${++counter}`;
        const a = tab('A', db);
        await a.read();
        await a.write(v(10));
        const b = tab('B', db);
        await b.read();
        await b.write(v(20));
        const a2 = tab('A', db);
        await a2.read();
        expect(await named(a2.write(v(30)))).toBe('ok');
        expect(await stored(db)).toMatchObject({ generation: 3, writer: 'A', stars: 30 });
    });

    it('own writes in a row climb 1, 2 and are never refused', async () => {
        const db = `stale-${++counter}`;
        const a = tab('A', db);
        await a.read();
        await a.write(v(1));
        await a.write(v(2));
        expect(await stored(db)).toMatchObject({ generation: 2, writer: 'A', stars: 2 });
        expect(await named(a.write(v(3)))).toBe('ok');
    });

    it('an own write that lands after a later own write started (an abandoned, timed-out write) is never refused', async () => {
        const db = `stale-${++counter}`;
        const a = tab('A', db);
        await a.read();
        // Both start before either completes, so `base` is still 0 for both: the second meets the first's record (writer A).
        const results = await Promise.all([named(a.write(v(1))), named(a.write(v(2)))]);
        expect(results).toEqual(['ok', 'ok']);
        expect(await stored(db)).toMatchObject({ generation: 2, writer: 'A', stars: 2 });
        expect(await named(a.write(v(3)))).toBe('ok');
    });

    it('an old build (version below the stored one) is refused NewerSave and the record is unchanged', async () => {
        const db = `stale-${++counter}`;
        const a = tab('A', db);
        await a.read();
        await a.write(v(10));
        const old = tab('old', db);
        await old.read();
        const oldValue = { ...v(5), version: SAVE_VERSION - 1 } as unknown as SaveState;
        expect(await named(old.write(oldValue))).toBe(NEWER_SAVE);
        expect(await stored(db)).toMatchObject({ generation: 1, writer: 'A', stars: 10 });
    });

    it('a store without an explicit writer gets its own random id (two default stores are different writers)', async () => {
        const db = `stale-${++counter}`;
        const a = createIdbSaveStore({ dbName: db, storeName: 'saves' });
        const b = createIdbSaveStore({ dbName: db, storeName: 'saves' });
        await a.read();
        await b.read();
        await a.write(v(1));
        expect(await named(b.write(v(2)))).toBe(OTHER_WRITER_SAVE);
    });

    it('a put that throws rejects the write (B-7)', async () => {
        const os = {
            get: () => {
                const req = {} as { onsuccess?: () => void; result: unknown };
                queueMicrotask(() => req.onsuccess?.());
                return req;
            },
            put: () => {
                throw new DOMException('too big', 'DataError');
            },
        } as unknown as IDBObjectStore;
        await expect(guardedPut(os, 'profile:default', v(1), { version: SAVE_VERSION, base: 0, writer: 'A' }, 'normal')).rejects.toMatchObject({ name: 'DataError' });
    });
});

// save-truth phase 7 (T-3, T-1): the store hands the ended writers to the verdict and surfaces an older build's write.
describe('IndexedDB store: previous page and older writer (save-truth p7)', () => {
    const v = (stars: number): SaveState => ({ ...fixture, version: SAVE_VERSION, stars }) as unknown as SaveState;
    const named = async (p: Promise<unknown>): Promise<string> => p.then(() => 'ok', (e: unknown) => (e as Error).name);
    const raw = async (dbName: string) => (await createIdbSaveStore({ dbName, storeName: 'saves', writer: 'probe' }).read()) as { generation: number; writer: string; stars: number; version: number };

    it('a late write of the ended document refuses the reloaded page, and the record stays (never overwritten)', async () => {
        const db = `prev-${++counter}`;
        const before = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'T:n1' });
        const after = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'T:n2', endedWriters: ['T:n1'] });
        await after.read();   // read before the late write landed
        await before.write(v(10));
        expect(await named(after.write(v(99)))).toBe('PreviousPageSave');
        expect(await raw(db)).toMatchObject({ generation: 1, writer: 'T:n1', stars: 10 });
    });

    it('without the ended list the same write is an OtherWriterSave', async () => {
        const db = `prev-${++counter}`;
        const before = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'T:n1' });
        const after = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'T:n2' });
        await after.read();
        await before.write(v(10));
        expect(await named(after.write(v(99)))).toBe(OTHER_WRITER_SAVE);
    });

    it('a record of an older format over this page\'s own save reaches onOlderWriter once per such put', async () => {
        const db = `older-${++counter}`;
        let told = 0;
        const store = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'W', onOlderWriter: () => void told++ });
        await store.read();
        await store.write(v(1));
        expect(told).toBe(0);
        await idbKeyval.set('profile:default', { ...v(5), version: SAVE_VERSION - 1 }, idbKeyval.createStore(db, 'saves'));
        await store.write(v(2));
        expect(told).toBe(1);
        expect(await raw(db)).toMatchObject({ version: SAVE_VERSION, stars: 2, writer: 'W' });
        await store.write(v(3));
        expect(told).toBe(1);
    });

    it('the first write after a migration (the page read the old record, base 0) is not an older writer', async () => {
        const db = `older-${++counter}`;
        await idbKeyval.set('profile:default', { ...v(5), version: SAVE_VERSION - 1 }, idbKeyval.createStore(db, 'saves'));
        let told = 0;
        const store = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'W', onOlderWriter: () => void told++ });
        await store.read();
        await store.write(v(6));
        expect(told).toBe(0);
    });
});

describe('onWritten (save-truth p8)', () => {
    const v = (stars: number): SaveState => ({ ...fixture, version: SAVE_VERSION, stars }) as unknown as SaveState;
    const named = async (p: Promise<unknown>): Promise<string> => p.then(() => 'ok', (e: unknown) => (e as Error).name);
    it('tells the writer and the generation after each put that landed, a replace included', async () => {
        const told: { writer: string; generation: number }[] = [];
        const store = createIdbSaveStore({ dbName: `written-${++counter}`, storeName: 'saves', writer: 'W', onWritten: (s) => void told.push(s) });
        await store.read();
        await store.write(v(1));
        await store.write(v(2), 'replace');
        expect(told).toEqual([
            { writer: 'W', generation: 1 },
            { writer: 'W', generation: 2 },
        ]);
    });

    it('is silent for a refused write, and a throwing listener does not fail the write', async () => {
        const db = `written-${++counter}`;
        const told: number[] = [];
        const a = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'A', onWritten: (s) => void told.push(s.generation) });
        const b = createIdbSaveStore({ dbName: db, storeName: 'saves', writer: 'B' });
        await a.read();
        await b.read();
        await b.write(v(5));
        expect(await named(a.write(v(6)))).toBe(OTHER_WRITER_SAVE);
        expect(told).toEqual([]);
        const c = createIdbSaveStore({ dbName: `written-${++counter}`, storeName: 'saves', writer: 'C', onWritten: () => { throw new Error('boom'); } });
        await c.read();
        await expect(c.write(v(1))).resolves.toBeUndefined();
    });
});
