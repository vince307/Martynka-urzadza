import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';
import { decodeSave } from '../src/core/save';
import type { SaveState } from '../src/core/types';
import { createIdbSaveStore, requestPersistence } from '../src/storage/idb';

// S-11 phase 3 (test-plan risk #2): the adapter round-trips through a real structured clone.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8')) as SaveState;

// The spy wraps the real `set`; a test can hold the first main-key call and reject it later (an abandoned write).
vi.mock('idb-keyval', async (importOriginal) => {
    const real = await importOriginal<typeof import('idb-keyval')>();
    return { ...real, set: vi.fn(real.set) };
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
    it('an abandoned write that fails with a lost connection is not retried once a newer write started', async () => {
        const real = await vi.importActual<typeof import('idb-keyval')>('idb-keyval');
        const set = vi.mocked(idbKeyval.set);
        set.mockClear();
        let rejectFirst: (e: unknown) => void = () => undefined;
        set.mockImplementationOnce(() => new Promise<void>((_, reject) => void (rejectFirst = reject)));
        set.mockImplementation(real.set);
        const store = freshStore();
        const first = store.write({ ...fixture, stars: 1 });
        const firstOutcome = first.then(() => 'ok', (e: unknown) => (e as Error).name);
        await store.write({ ...fixture, stars: 2 });
        rejectFirst(Object.assign(new Error('lost'), { name: 'InvalidStateError' }));
        expect(await firstOutcome).toBe('InvalidStateError');
        expect(set).toHaveBeenCalledTimes(2);
        expect(((await store.read()) as SaveState).stars).toBe(2);
    });

    it('a lost connection still retries a write when no newer write started', async () => {
        const real = await vi.importActual<typeof import('idb-keyval')>('idb-keyval');
        const set = vi.mocked(idbKeyval.set);
        set.mockClear();
        set.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('lost'), { name: 'InvalidStateError' })));
        set.mockImplementation(real.set);
        const store = freshStore();
        await store.write({ ...fixture, stars: 5 });
        expect(set).toHaveBeenCalledTimes(2);
        expect(((await store.read()) as SaveState).stars).toBe(5);
    });
});
