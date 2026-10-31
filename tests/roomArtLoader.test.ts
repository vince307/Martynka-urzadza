// The runtime room-art loader (kitchen-room phase 3): queues only missing keys, per-file limit, keyed failures,
// per-room settle on the texture cache, "Obrazki" record untouched while the current room is loading (plan review F1).
import { describe, expect, it, vi } from 'vitest';
import type { Game, Loader } from 'phaser';
import { createRoomArtLoader } from '../src/ui/roomArtLoader';
import { balance } from '../src/data/balance';
import { REGISTRY_KEYS } from '../src/data/layout';
import type { RoomArtEntry } from '../src/data/roomArt';
import type { ArtHealth } from '../src/core/artHealth';

const entry = (key: string): RoomArtEntry => ({ key, url: `assets/rooms/${key}.webp`, width: 10, height: 10, label: '' });
const ROOMS_TABLE: Record<string, RoomArtEntry[]> = {
    a: [entry('a/one'), entry('a/two')],
    b: [entry('b/one'), entry('b/two'), entry('b/three')],
};
const entriesOf = (room: string): RoomArtEntry[] => ROOMS_TABLE[room] ?? [];

const rig = (options: { disabled?: boolean } = {}) => {
    const cached = new Set<string>();
    const store = new Map<string, unknown>();
    const game = {
        textures: { exists: (k: string) => cached.has(k) },
        registry: { get: (k: string) => store.get(k), set: (k: string, v: unknown) => { store.set(k, v); } },
    } as unknown as Game;
    const queued: string[] = [];
    const files: { key: string; xhrSettings: { timeout: number } }[] = [];
    const handlers: { event: string; fn: (...args: unknown[]) => void }[] = [];
    const emit = (event: string, ...args: unknown[]): void => { for (const h of [...handlers]) if (h.event === event) h.fn(...args); };
    const load = {
        image: (key: string) => {
            queued.push(key);
            const file = { key, src: `assets/rooms/${key}.webp`, xhrSettings: { timeout: 0 }, xhrLoader: { status: 404 } };
            files.push(file);
            emit('addfile', key, 'image', load, file);
        },
        on: (event: string, fn: (...args: unknown[]) => void) => { handlers.push({ event, fn }); },
        once: (event: string, fn: (...args: unknown[]) => void) => {
            const wrapped = (...args: unknown[]): void => { const i = handlers.findIndex((h) => h.fn === wrapped); if (i >= 0) handlers.splice(i, 1); fn(...args); };
            handlers.push({ event, fn: wrapped });
        },
        off: (event: string, fn: (...args: unknown[]) => void) => { const i = handlers.findIndex((h) => h.event === event && h.fn === fn); if (i >= 0) handlers.splice(i, 1); },
        start: vi.fn(),
    } as unknown as Loader.LoaderPlugin;
    const service = createRoomArtLoader(game, { disabled: options.disabled ?? false, entriesOf });
    service.attachLoader(load);
    return {
        service, queued, files, handlers, cached, store,
        health: () => store.get(REGISTRY_KEYS.roomArtHealth) as ArtHealth | undefined,
        load: () => store.get(REGISTRY_KEYS.roomLoad) as { pending: string[]; settled: string[] } | undefined,
        fail: (key: string) => emit('loaderror', files.find((f) => f.key === key)),
        fetched: (key: string) => emit('load', files.find((f) => f.key === key)),
        complete: () => emit('complete'),
    };
};

describe('runtime room-art loader', () => {
    it('queues only the missing keys of a room, each with the per-file limit', () => {
        const r = rig();
        r.cached.add('b/one');
        r.service.ensure(['b']);
        expect(r.queued).toEqual(['b/two', 'b/three']);
        expect(r.files.map((f) => f.xhrSettings.timeout)).toEqual([balance.loader.timeoutMs, balance.loader.timeoutMs]);
        expect([...r.service.pending()]).toEqual(['b']);
    });

    it('a second ensure while the room is pending queues nothing', () => {
        const r = rig();
        r.service.ensure(['b']);
        r.service.ensure(['b']);
        expect(r.queued).toEqual(['b/one', 'b/two', 'b/three']);
    });

    it('a keyed failure leaves the room settled with that key missing and does not touch another room record', () => {
        const r = rig();
        r.service.ensure(['b']);
        r.fail('b/two');
        r.cached.add('b/one'); r.cached.add('b/three');
        r.complete();
        r.service.refreshHealth('b');
        expect(r.service.pending().size).toBe(0);
        expect(r.health()?.missing).toEqual(['b/two']);
        r.service.refreshHealth('a');
        expect(r.health()?.missing).toEqual(['a/one', 'a/two']);
    });

    it('a complete caused by another file does not settle a room whose keys are not in the cache', () => {
        const r = rig();
        r.service.ensure(['a']);
        r.cached.add('a/one');   // a/two neither loaded nor failed yet: an unrelated complete (music) arrives
        r.complete();
        expect([...r.service.pending()]).toEqual(['a']);
        expect(r.load()?.settled ?? []).toEqual([]);
        r.cached.add('a/two');
        r.complete();
        expect(r.service.pending().size).toBe(0);
        expect(r.load()?.settled).toEqual(['a']);
    });

    it('a picture fetched but not decoded settles its room as missing (Phaser 4.2.1 emits no loaderror for a decode failure)', () => {
        const r = rig();
        r.service.ensure(['a']);
        r.service.refreshHealth('a');
        r.fetched('a/one'); r.cached.add('a/one');
        r.fetched('a/two');   // FILE_LOAD, then onProcessError: no texture and no keyed loaderror (tests/phaserLoaderPin.test.ts)
        r.complete();
        expect(r.service.pending().size).toBe(0);
        expect(r.load()?.settled).toEqual(['a']);
        expect(r.health()?.missing).toEqual(['a/two']);
        expect(r.health()?.causes).toEqual({ 'a/two': 'decode' });
        expect(r.handlers).toEqual([]);
    });

    it('a key that failed is not queued again in the same session (a redraw that calls ensure cannot loop on a failing file)', () => {
        const r = rig();
        r.service.ensure(['a']);
        r.fail('a/one');
        r.fetched('a/two');   // decode failure
        r.complete();
        r.service.ensure(['a']);
        expect(r.queued).toEqual(['a/one', 'a/two']);
        expect(r.service.pending().size).toBe(0);
        expect(r.handlers).toEqual([]);
    });

    it('disabled queues nothing', () => {
        const r = rig({ disabled: true });
        r.service.ensure(['a', 'b']);
        expect(r.queued).toEqual([]);
        expect(r.service.pending().size).toBe(0);
    });

    it('removes its listeners after settling', () => {
        const r = rig();
        r.service.ensure(['a']);
        expect(r.handlers.length).toBeGreaterThan(0);
        r.cached.add('a/one'); r.cached.add('a/two');
        r.complete();
        expect(r.handlers).toEqual([]);
    });

    it('refreshHealth while the current room is pending leaves the record untouched; the settle writes it', () => {
        const r = rig();
        r.service.ensure(['a']);
        r.service.refreshHealth('a');
        expect(r.health()).toBeUndefined();
        r.cached.add('a/one'); r.cached.add('a/two');
        r.complete();
        expect(r.health()?.missing).toEqual([]);
        expect(r.health()?.total).toBe(2);
    });
});
