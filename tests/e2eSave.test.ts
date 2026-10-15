import { describe, expect, it } from 'vitest';
import { decodeSave, encodeSave } from '../src/core/save';
import { e2eSave, e2eSaveStore } from '../src/testing/e2eHook';

describe('e2eSave', () => {
    it('reads each seam from the query string', () => {
        for (const seam of ['unreadable', 'corrupt', 'unavailable', 'hang', 'writefail', 'writehang', 'v1', 'backupfail', 'backuphang']) {
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
    it('unreadable holds a save from a future version', async () => {
        await expect(e2eSaveStore('unreadable').read()).resolves.toMatchObject({ version: 99 });
    });

    it('corrupt decodes as corrupt', async () => {
        const store = e2eSaveStore('corrupt');
        expect(decodeSave(await store.read())).toEqual({ kind: 'unreadable', reason: 'corrupt' });
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

    it('v1 holds the frozen v1 fixture, decodes to v2 and logs backup before write', async () => {
        const store = e2eSaveStore('v1');
        const raw = await store.read();
        expect(raw).toMatchObject({ version: 1, stars: 7 });
        const decoded = decodeSave(raw);
        expect(decoded).toMatchObject({ kind: 'ok', migratedFrom: 1 });
        if (decoded.kind !== 'ok') return;
        await store.backup(raw, 1);
        await store.write(encodeSave(decoded.session));
        expect(((await store.read()) as { version: number }).version).toBe(2);
    });

    it('backupfail holds the v1 fixture, rejects the copy with QuotaExceededError and still writes', async () => {
        const store = e2eSaveStore('backupfail');
        await expect(store.read()).resolves.toMatchObject({ version: 1, stars: 7 });
        await expect(store.backup({}, 1)).rejects.toMatchObject({ name: 'QuotaExceededError' });
        const decoded = decodeSave(await store.read());
        if (decoded.kind !== 'ok') throw new Error('fixture must decode');
        await store.write(encodeSave(decoded.session));
        expect(((await store.read()) as { version: number }).version).toBe(2);
    });

    it('backuphang holds the v1 fixture and never answers the copy', async () => {
        const store = e2eSaveStore('backuphang');
        await expect(store.read()).resolves.toMatchObject({ version: 1 });
        const outcome = await Promise.race([store.backup({}, 1).then(() => 'answered'), new Promise((r) => setTimeout(() => r('silent'), 20))]);
        expect(outcome).toBe('silent');
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
