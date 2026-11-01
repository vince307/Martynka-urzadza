import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createStore, get, set } from 'idb-keyval';
import { loadSave } from '../src/core/autosave';
import { encodeSave, SAVE_VERSION } from '../src/core/save';
import { houseLayout, houseRoomIds, mergeHouse, nextRoom } from '../src/core/house';
import { repairCurrentRoom, roomStateProblems } from '../src/core/rooms';
import { needsPlacement } from '../src/core/placement';
import { FIRST_HOUSE, HOUSES } from '../src/data/houses';
import { ROOMS } from '../src/data/rooms';
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
const FIXTURES = ['save-v1', 'save-v1-fresh', 'save-v1-legacy-salon', 'save-v2', 'save-v2-fresh', 'save-v2-legacy-salon', 'save-v3', 'save-v4', 'save-v4-salon', 'save-v5', 'save-v5-salon', 'save-v6', 'save-v6-bridge-done'];
const read = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')) as Raw;

let n = 0;
describe('frozen fixtures through the real load path', () => {
    it.each(FIXTURES)('%s loads, keeps every earned value, writes v6 and keeps the old copy', async (name) => {
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

// S-28 FR-049: a save from before the choice stays in its building, and the repair stays inside the building (as main.ts does it).
describe('the building of a loaded save (FR-049)', () => {
    const load = async (name: string) => {
        const dbName = `fixture-building-${++n}`;
        await set('profile:default', read(name), createStore(dbName, 'saves'));
        const outcome = await loadSave(createIdbSaveStore({ dbName, storeName: 'saves', writer: 'tab:1' }));
        if (outcome.kind !== 'loaded') throw new Error(`fixture ${name} did not load`);
        return outcome.session;
    };
    const repair = (s: Awaited<ReturnType<typeof load>>) => {
        const layout = houseLayout(s.house, HOUSES, FIRST_HOUSE);
        return repairCurrentRoom(s, houseRoomIds(layout, ROOMS), layout.rooms[0].room);
    };

    it('save-v5-salon stays in house-1 and the salon, keeps its stars and needs no placement', async () => {
        const raw = read('save-v5-salon');
        const s = await load('save-v5-salon');
        const r = repair(s);
        expect(r.session.house.id).toBe('house-1');
        expect(r.session.currentRoom).toBe('salon');
        expect(r.repairedFrom).toBeNull();
        expect(s.stars).toBe(raw.stars);
        expect(needsPlacement(s.learner)).toBe(false);
    });

    it('save-v6 keeps its bridge, and a salon inside base-1 repairs to the bridge', async () => {
        const s = await load('save-v6');
        expect(s.house.id).toBe('base-1');
        expect(repair(s).repairedFrom).toBeNull();
        expect(repair(s).session.currentRoom).toBe('bridge');
        const odd = repair({ ...s, currentRoom: 'salon' });
        expect(odd.session.currentRoom).toBe('bridge');
        expect(odd.repairedFrom).toBe('salon');
    });

    // S-30 FR-047: a Mostek finished in the S-29 build (no Hangar yet) opens in the Hangar; the calls mirror main.ts's load order.
    it('save-v6-bridge-done meets the Hangar: house with both cells, current room hangar, the Mostek and stars kept', async () => {
        const raw = read('save-v6-bridge-done');
        const s = await load('save-v6-bridge-done');
        const repaired = repair(s).session;
        const merged = mergeHouse(repaired.house, houseLayout(repaired.house, HOUSES, FIRST_HOUSE));
        const withHouse = { ...repaired, house: merged.house };
        const moved = nextRoom(withHouse, houseLayout(withHouse.house, HOUSES, FIRST_HOUSE), ROOMS);
        expect(merged.house.id).toBe('base-1');
        expect(merged.house.rooms.map((c) => c.room)).toEqual(['bridge', 'hangar']);
        expect(moved.currentRoom).toBe('hangar');
        expect(moved.movedFrom).toBe('bridge');
        expect(moved.rooms.bridge).toEqual(raw.rooms.bridge);
        // The fixture is what the S-29 build writes: its chosen slots are the Mostek's own, so the load reports no room problem.
        expect(roomStateProblems(moved.rooms, ROOMS)).toEqual([]);
        expect(s.stars).toBe(raw.stars);
    });
});
