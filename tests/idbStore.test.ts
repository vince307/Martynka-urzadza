import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeSave } from '../src/core/save';
import type { SaveState } from '../src/core/types';
import { createIdbSaveStore, requestPersistence } from '../src/storage/idb';

// S-11 phase 3 (test-plan risk #2): the adapter round-trips through a real structured clone.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8')) as SaveState;

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
});
