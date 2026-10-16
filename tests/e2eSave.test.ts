import { describe, expect, it } from 'vitest';
import { decodeSave, encodeSave, NEWER_SAVE, SAVE_VERSION } from '../src/core/save';
import { e2eArt, e2eSave, e2eSaveStore } from '../src/testing/e2eHook';

describe('e2eSave', () => {
    it('reads each seam from the query string', () => {
        for (const seam of ['unreadable', 'corrupt', 'unavailable', 'hang', 'writefail', 'writehang', 'v1', 'backupfail', 'backuphang', 'slow', 'legacy-salon', 'newer']) {
            expect(e2eSave(`?e2eSave=${seam}`), seam).toBe(seam);
            expect(e2eSave(`?a=1&e2eSave=${seam}`), seam).toBe(seam);
        }
    });

    it('returns null for a missing or other value', () => {
        for (const search of ['', '?x=1', '?e2eSave=', '?e2eSave=x', '?e2eSave=UNREADABLE', '?e2eSave=unreadable1', '?e2eSave=Hang']) {
            expect(e2eSave(search), search).toBeNull();
        }
    });
});

describe('e2eSaveStore', () => {
    it('newer reads a fresh start, takes the first write, then holds a newer version and refuses the next', async () => {
        const store = e2eSaveStore('newer');
        await expect(store.read()).resolves.toBeUndefined();
        await expect(store.write({ version: SAVE_VERSION } as never)).resolves.toBeUndefined();
        await expect(store.write({ version: SAVE_VERSION } as never)).rejects.toMatchObject({ name: NEWER_SAVE });
        expect(((await store.read()) as { version: number }).version).toBe(SAVE_VERSION + 1);
    });

    it('unreadable holds a save from a future version', async () => {
        await expect(e2eSaveStore('unreadable').read()).resolves.toMatchObject({ version: 99 });
    });

    it('corrupt decodes as corrupt in its own version (a bad stars field of a v4 shape)', async () => {
        const store = e2eSaveStore('corrupt');
        expect(decodeSave(await store.read())).toEqual({ kind: 'unreadable', reason: 'corrupt', from: SAVE_VERSION, problem: 'stars' });
    });

    it('unavailable rejects the read with an UnknownError', async () => {
        await expect(e2eSaveStore('unavailable').read()).rejects.toMatchObject({ name: 'UnknownError' });
    });

    it('writefail reads a fresh start and rejects every write with QuotaExceededError', async () => {
        const store = e2eSaveStore('writefail');
        await expect(store.read()).resolves.toBeUndefined();
        await expect(store.write({} as never)).rejects.toMatchObject({ name: 'QuotaExceededError' });
    });

    it('writehang reads a fresh start, logs every write and never answers it', async () => {
        const store = e2eSaveStore('writehang');
        await expect(store.read()).resolves.toBeUndefined();
        const outcome = await Promise.race([store.write({} as never).then(() => 'answered'), new Promise((r) => setTimeout(() => r('silent'), 20))]);
        expect(outcome).toBe('silent');
    });

    it('v1 holds the frozen v1 fixture, decodes to the current version and logs backup before write', async () => {
        const store = e2eSaveStore('v1');
        const raw = await store.read();
        expect(raw).toMatchObject({ version: 1, stars: 7 });
        const decoded = decodeSave(raw);
        expect(decoded).toMatchObject({ kind: 'ok', migratedFrom: 1 });
        if (decoded.kind !== 'ok') return;
        await store.backup(raw, 1);
        await store.write(encodeSave(decoded.session));
        expect(((await store.read()) as { version: number }).version).toBe(SAVE_VERSION);
    });

    it('legacy-salon holds the frozen v2 bytes and decodes through MIGRATIONS[2] to the 4-task salon', async () => {
        const raw = await e2eSaveStore('legacy-salon').read();
        expect(raw).toMatchObject({ version: 2 });
        expect(decodeSave(raw)).toMatchObject({
            kind: 'ok',
            migratedFrom: 2,
            session: { stars: 3, rooms: { salon: { tasksDone: 4, chosen: { sofa: 2, rug: 0, 'coffee-table': 0 } } } },
        });
    });

    it('backupfail holds the v1 fixture, rejects the copy with QuotaExceededError and still writes', async () => {
        const store = e2eSaveStore('backupfail');
        await expect(store.read()).resolves.toMatchObject({ version: 1, stars: 7 });
        await expect(store.backup({}, 1)).rejects.toMatchObject({ name: 'QuotaExceededError' });
        const decoded = decodeSave(await store.read());
        if (decoded.kind !== 'ok') throw new Error('fixture must decode');
        await store.write(encodeSave(decoded.session));
        expect(((await store.read()) as { version: number }).version).toBe(SAVE_VERSION);
    });

    it('backuphang holds the v1 fixture and never answers the copy', async () => {
        const store = e2eSaveStore('backuphang');
        await expect(store.read()).resolves.toMatchObject({ version: 1 });
        const outcome = await Promise.race([store.backup({}, 1).then(() => 'answered'), new Promise((r) => setTimeout(() => r('silent'), 20))]);
        expect(outcome).toBe('silent');
    });

    it('the seam store keeps the first copy, lists copies and holds the record', async () => {
        const store = e2eSaveStore('v1');
        expect(await store.backupRecord()).toBeNull();
        expect(await store.backup({ n: 1 }, 1)).toBe('written');
        expect(await store.backup({ n: 2 }, 1)).toBe('kept');
        expect(await store.readBackups()).toEqual([{ from: 1, raw: { n: 1 } }]);
        expect(await store.backupRecord()).toMatchObject({ from: 1, result: 'kept' });
        await store.noteBackup({ from: 1, result: 'lost', error: 'X', at: 1 });
        expect(await store.backupRecord()).toMatchObject({ result: 'lost' });
        expect(await store.read()).toMatchObject({ version: 1 });
    });

    it('slow answers late with a current-version save of 7 stars', async () => {
        const raw = await e2eSaveStore('slow').read();
        expect(decodeSave(raw)).toMatchObject({ kind: 'ok', migratedFrom: null, session: { stars: 7 } });
    });

    it('hang never settles its read', async () => {
        let settled = false;
        void e2eSaveStore('hang')
            .read()
            .then(
                () => (settled = true),
                () => (settled = true),
            );
        for (let i = 0; i < 20; i++) await Promise.resolve();
        await new Promise((r) => setImmediate(r));
        expect(settled).toBe(false);
    });
});

describe('e2eArt', () => {
    it('reads each seam from the query string', () => {
        for (const seam of ['missing', 'corrupt', 'room', 'stall', 'stallall']) {
            expect(e2eArt(`?e2eArt=${seam}`), seam).toBe(seam);
            expect(e2eArt(`?a=1&e2eArt=${seam}`), seam).toBe(seam);
        }
    });

    it('returns null for a missing or other value', () => {
        for (const search of ['', '?x=1', '?e2eArt=', '?e2eArt=x', '?e2eArt=STALL', '?e2eArt=stall-all']) {
            expect(e2eArt(search), search).toBeNull();
        }
    });
});
