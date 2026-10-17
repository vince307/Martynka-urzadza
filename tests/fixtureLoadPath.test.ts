import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createStore, get, set } from 'idb-keyval';
import { loadSave } from '../src/core/autosave';
import { encodeSave, SAVE_VERSION } from '../src/core/save';
import { createIdbSaveStore } from '../src/storage/idb';

// save-truth impl review: every frozen fixture, stored as an older build left it on a device, goes through the real load path
// (IndexedDB store -> loadSave -> decodeSave) and the first write; nothing the child earned is dropped and the raw old save is
// kept as a write-once copy.
type Raw = {
    version: number;
    stars: number;
    currentRoom: string;
    rooms: Record<string, { tasksDone: number; chosen: Record<string, number> }>;
    settings: { autoRead: boolean | null };
    learner: { stage: string; history: unknown[] } | null;
    variants?: { puzzlesDone: string[] };
};
const FIXTURES = ['save-v1', 'save-v1-fresh', 'save-v1-legacy-salon', 'save-v2', 'save-v2-fresh', 'save-v2-legacy-salon', 'save-v3', 'save-v4'];
const read = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')) as Raw;

let n = 0;
describe('frozen fixtures through the real load path', () => {
    it.each(FIXTURES)('%s loads, keeps every earned value, writes v4 and keeps the old copy', async (name) => {
        const raw = read(name);
        const dbName = `fixture-load-${++n}`;
        await set('profile:default', raw, createStore(dbName, 'saves'));
        const store = createIdbSaveStore({ dbName, storeName: 'saves', writer: 'tab:1' });

        const outcome = await loadSave(store);
        expect(outcome.kind).toBe('loaded');
        if (outcome.kind !== 'loaded') return;
        const s = outcome.session;
        expect(outcome.migratedFrom).toBe(raw.version < SAVE_VERSION ? raw.version : null);
        expect(s.stars).toBe(raw.stars);
        expect(s.settings.autoRead).toBe(raw.settings.autoRead);
        expect(s.learner?.stage ?? null).toBe(raw.learner?.stage ?? null);
        expect(s.learner?.history.length ?? 0).toBe(raw.learner?.history.length ?? 0);
        if (raw.variants) expect(s.variants.puzzlesDone).toEqual(raw.variants.puzzlesDone);
        for (const [id, room] of Object.entries(raw.rooms)) {
            const now = s.rooms[id];
            expect(now).toBeDefined();
            // A legacy salon is carried to the new task list (rule B: the shortest prefix covering the old cost), never shorter.
            expect(now.tasksDone).toBeGreaterThanOrEqual(room.tasksDone);
            if (!name.includes('legacy-salon')) expect(now.chosen).toEqual(room.chosen);
        }

        // The first write after the load: the copy of a migrated save is taken from the raw value in memory and kept write-once.
        if (outcome.migratedFrom !== null) expect(await store.backup(outcome.raw, outcome.migratedFrom)).toBe('written');
        await store.write(encodeSave(s));
        const back = await loadSave(store);
        expect(back.kind).toBe('loaded');
        if (back.kind === 'loaded') expect(back.session).toEqual(s);
        if (outcome.migratedFrom !== null) {
            expect(await get(`profile:default:backup-v${outcome.migratedFrom}`, createStore(dbName, 'saves'))).toEqual(raw);
            expect(await store.backup({ other: true }, outcome.migratedFrom)).toBe('kept');
            expect((await store.readBackups()).find((b) => b.from === outcome.migratedFrom)?.raw).toEqual(raw);
        }
    });
});
