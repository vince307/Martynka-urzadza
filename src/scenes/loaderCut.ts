import { Loader } from 'phaser';

/**
 * The one place that touches the inside of Phaser's loader (audit A-1): it ends every unfinished file as a load error
 * through the loader's own paths, so the loader finishes by itself and `create()` runs exactly once with what loaded.
 * Phaser has no public abort. This relies on Phaser 4.2.1 LoaderPlugin internals (`list`, `inflight`, `queue`,
 * `nextFile`, `fileProcessComplete`, `File.resetXHR`); re-run e2e #15 `stallall` on any Phaser upgrade
 * (tests/phaserLoaderPin.test.ts is the tripwire).
 */
export function cutLoad(load: Loader.LoaderPlugin): string[] {
    if (!load.isLoading()) {
        return [];
    }
    const waiting = [...load.list];
    const flying = [...load.inflight];
    const decoding = [...load.queue];
    const keys = [...waiting, ...flying, ...decoding].map((file) => file.key);

    // A file still in the list never started: no xhr to stop. Move it to inflight so nextFile can finish it.
    for (const file of waiting) {
        load.list.delete(file);
        load.inflight.add(file);
    }
    // A decoding image or a pending font promise: take away what can still call back into the loader, then fail the file.
    for (const file of decoding) {
        if (file.data instanceof HTMLImageElement) {
            file.data.onload = null;
            file.data.onerror = null;
        }
        // Must come before fileProcessComplete: a late FontFace settling then calls a no-op instead of a second loadComplete
        // (queue files are never destroyed, so their `loader` stays set).
        file.onProcessComplete = () => undefined;
        file.state = Loader.FILE_ERRORED;
        load.fileProcessComplete(file);
    }
    for (const file of [...waiting, ...flying]) {
        file.retryAttempts = 0;   // File.onError would retry otherwise
        file.state = Loader.FILE_ERRORED;
        if (file.xhrLoader) {
            file.resetXHR();
            file.xhrLoader.ontimeout = null;   // resetXHR leaves it, and it routes to onError
            file.xhrLoader.abort();
        }
        load.nextFile(file, false);   // counts the failure, emits loaderror, may end the load (and run create) on the last one
    }
    return keys;
}
