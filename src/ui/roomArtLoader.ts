// Runtime room-art loader (kitchen-room phase 3): fetches the pictures of rooms the boot did not load, on the HUD loader that lives
// the whole session (as the music does in src/ui/sound.ts). A room settles when every key of it is in the texture cache or failed;
// a failed file leaves the Polish stand-in (RoomLayer). Never fatal.
import type { Game, Loader } from 'phaser';
import { artCauses, loadErrorLine, roomHealthOf, wrongSizes } from '../core/artHealth';
import { roomsToLoad } from '../core/roomLoad';
import { balance } from '../data/balance';
import { REGISTRY_KEYS } from '../data/layout';
import { roomArt, type RoomArtEntry } from '../data/roomArt';
import { ROOMS } from '../data/rooms';

export interface RoomLoadState { pending: string[]; settled: string[] }

export interface RoomArtLoader {
    attachLoader(load: Loader.LoaderPlugin): void;
    ensure(rooms: readonly string[]): void;
    pending(): ReadonlySet<string>;
    /** Writes the "Obrazki" room record for the room in renovation; a no-op while that room is still loading. */
    refreshHealth(currentRoom: string): void;
}

export interface RoomArtLoaderOptions {
    /** The `?e2eArt=room` seam: nothing is queued. */
    disabled: boolean;
    /** The art of a room; the room table by default (a test passes its own). */
    entriesOf?: (room: string) => readonly RoomArtEntry[];
}

const defaultEntries = (room: string): readonly RoomArtEntry[] => (ROOMS[room] ? roomArt(ROOMS[room]) : []);

export const createRoomArtLoader = (game: Game, opts: RoomArtLoaderOptions): RoomArtLoader => {
    const entriesOf = opts.entriesOf ?? defaultEntries;
    const pending = new Set<string>();
    const settled: string[] = [];
    const failed = new Map<string, number>();
    const loaded = new Set<string>();
    let loader: Loader.LoaderPlugin | undefined;
    let detach: (() => void) | undefined;
    let current: string | undefined;

    const publish = (): void => {
        game.registry.set(REGISTRY_KEYS.roomLoad, { pending: [...pending], settled: [...settled] } satisfies RoomLoadState);
    };
    const exists = (key: string): boolean => game.textures.exists(key);

    const writeHealth = (room: string): void => {
        const entries = entriesOf(room);
        const health = roomHealthOf(entries, exists);
        const causes = artCauses(health.missing, { loaded, failed, cut: new Set<string>() });
        game.registry.set(REGISTRY_KEYS.roomArtHealth, { ...health, causes, wrongSize: wrongSizes(entries, () => undefined) });
        if (health.missing.length > 0) console.warn(`Room art missing: ${health.missing.length} of ${health.total}: ${health.missing.join(', ')}`);
    };

    // A key is settled when its texture exists, its fetch failed (keyed loaderror) or it was fetched without a texture: Phaser 4.2.1
    // emits FILE_LOAD and then onProcessError for a picture that does not decode, never loaderror (tests/phaserLoaderPin.test.ts).
    const attempted = (key: string): boolean => exists(key) || failed.has(key) || loaded.has(key);
    const resolved = (room: string): boolean => entriesOf(room).every((e) => attempted(e.key));

    const onComplete = (): void => {
        for (const room of [...pending]) {
            if (!resolved(room)) continue;
            pending.delete(room);
            settled.push(room);
            if (room === current) writeHealth(room);
        }
        if (pending.size === 0) {
            detach?.();
            detach = undefined;
        } else {
            loader?.once('complete', onComplete);   // the shared loader may complete for another file first
        }
        publish();
    };

    return {
        attachLoader: (load) => {
            loader = load;
            // The previous loader belonged to a scene that shut down (TaskScene "Wróć" stops UIScene): Phaser's LoaderPlugin.shutdown
            // reset its queue and removed every listener, so a room still pending there would never settle. It goes back to "not
            // attempted" and the next ensure queues its missing keys on this loader (keys already in the cache are skipped).
            if (pending.size > 0) {
                detach?.();
                detach = undefined;
                pending.clear();
                publish();
            }
        },
        pending: () => pending,
        refreshHealth: (room) => {
            current = room;
            if (pending.has(room)) return;
            writeHealth(room);
        },
        ensure: (rooms) => {
            if (opts.disabled || !loader) return;
            const load = loader;
            // A key that failed this session is not fetched again (as at boot): the room view calls ensure on every redraw, and a
            // settle redraws, so a retry would loop on a failing file. A reload tries again.
            const wanted = roomsToLoad(rooms, (room) => entriesOf(room).map((e) => e.key), attempted, pending);
            if (wanted.rooms.length === 0) return;
            const entries = wanted.rooms.flatMap((room) => entriesOf(room));
            const queuedKeys = new Set(wanted.keys);
            const onAdd = (_key: string, _type: string, _loader: unknown, file: Loader.File): void => {
                if (queuedKeys.has(file.key)) file.xhrSettings.timeout = balance.loader.timeoutMs;
            };
            const onFile = (file: Loader.File): void => { if (queuedKeys.has(file.key)) loaded.add(file.key); };
            const onFail = (file: Loader.File): void => {
                if (!queuedKeys.has(file.key)) return;
                const status = file.xhrLoader?.status ?? 0;
                failed.set(file.key, status);
                console.warn(loadErrorLine('room', file.key, file.src, status));
            };
            const previous = detach;
            detach = () => {
                previous?.();
                load.off('addfile', onAdd);
                load.off('load', onFile);
                load.off('loaderror', onFail);
                load.off('complete', onComplete);
            };
            try {
                for (const room of wanted.rooms) { pending.add(room); const i = settled.indexOf(room); if (i >= 0) settled.splice(i, 1); }
                load.on('addfile', onAdd);
                load.on('load', onFile);
                load.on('loaderror', onFail);
                for (const key of wanted.keys) {
                    const entry = entries.find((e) => e.key === key);
                    if (entry) load.image(entry.key, entry.url);
                }
                load.once('complete', onComplete);
                publish();
                load.start();
            } catch (error) {
                console.warn('Room art could not be queued', error);
                for (const room of wanted.rooms) { pending.delete(room); settled.push(room); }
                detach();
                detach = undefined;
                publish();
            }
        },
    };
};
