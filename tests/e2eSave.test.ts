import { describe, expect, it } from 'vitest';
import { e2eSave, e2eSaveStore } from '../src/testing/e2eHook';

describe('e2eSave', () => {
    it('reads each seam from the query string', () => {
        for (const seam of ['unreadable', 'unavailable', 'hang', 'writefail']) {
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

    it('unavailable rejects the read with an UnknownError', async () => {
        await expect(e2eSaveStore('unavailable').read()).rejects.toMatchObject({ name: 'UnknownError' });
    });

    it('writefail reads a fresh start and rejects every write with QuotaExceededError', async () => {
        const store = e2eSaveStore('writefail');
        await expect(store.read()).resolves.toBeUndefined();
        await expect(store.write({} as never)).rejects.toMatchObject({ name: 'QuotaExceededError' });
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
