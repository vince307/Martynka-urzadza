---
date: 2026-10-15T23:01:11+02:00
researcher: Claude (autonomous run 2026-10-15-fix-s16bcd, research step)
git_commit: 6758a4cb9020d07ce582b49e491207e87b253b8a
branch: feat/load-and-tab-guard
repository: Martynka-urzadza
topic: "Total limit and slow signal for the boot load (A-1, A-2, font); save guard against an older tab (P-5)"
tags: [research, BootScene, LoaderPlugin, LoadingScreen, autosave, idb, service-worker, e2e-seams]
status: complete
last_updated: 2026-10-15
last_updated_by: Claude (research step)
---

# Research: total boot-load limit, "still loading" signal, version guard before a save write

**Date**: 2026-10-15T23:01:11+02:00
**Git Commit**: 6758a4c (branch `feat/load-and-tab-guard`, main at 6f5644c + the change-identity commit)
**Phaser**: 4.2.1 (`node_modules/phaser/package.json`), **idb-keyval**: 6.3.0, **fake-indexeddb**: 6.2.5 (devDependency, `package.json`)

## Research Question

From `change.md` (audit findings A-1, A-2, P-5 and the font limit):

1. How can `BootScene` put a TOTAL time limit on its load in Phaser 4.2.1 so that `create()` runs once with what loaded, stand-ins and art health count the rest, in-flight XHRs and late completions do no harm, and the font (FontFile, no XHR) is covered?
2. What is the "still loading" signal (A-2): rule, number, string, layout?
3. P-5: how does the autosaver avoid writing over a newer stored save version (cost, time limit, what child and parent see, interaction with `replace`/import/reset and the start write after a migration)? Should `skipWaiting`/`clientsClaim` change?
4. Which e2e seams (hook build only) are needed?

## Summary

- **A-1, mechanism**: Phaser 4.2.1 has no public abort. `LoaderPlugin.reset()` only clears the three Sets and does not stop XHRs or remove the scene's `COMPLETE → create` once-listener, so a late file can emit COMPLETE and run `create()` a second time. The sound way is to **force every unfinished file to fail through the loader's own paths** and let the loader complete naturally: files in `list`/`inflight` → `resetXHR()`, null `ontimeout`, `xhr.abort()`, `retryAttempts = 0`, `load.nextFile(file, false)` (emits `loaderror` per file, counts `totalFailed`); files in `queue` (image decode, FontFace promise) → detach `data.onload/onerror`, replace `onProcessComplete` with a no-op, `state = FILE_ERRORED`, `load.fileProcessComplete(file)`. The last one triggers `loadComplete()` → COMPLETE → `create()` exactly once. `artHealth` in `create()` already counts a missing texture via `textures.exists`, so stand-ins and "Obrazki" work unchanged. The font's FontFace promise cannot be cancelled, but the no-op override makes its late settle harmless, and a late success still adds the face to `document.fonts`.
- **A-1, clock**: the timer should run on the game loop clock (`this.time.delayedCall`, which ticks while Boot is LOADING) rather than `window.setTimeout`, so a start that went to the background is not cut off while no new download can begin (the loader only starts queued files in its `update`, which stops with the animation frame). This is a choice for the plan; both are possible.
- **A-1, numbers**: the boot queue today is 64 WebP + 1 font, ~1.75 MB + 0.12 MB on disk; S-16b adds 13 sound files (OGG pack 224 KB, M4A pack 884 KB). At the 50 KB/s cold-start figure already used in `balance.loader`'s comment, a full first load is ~40 s (images + font) to ~55 s (with M4A). A total limit therefore trades a slow-but-working first start for a start with stand-ins; the service worker precaches independently of the loader, so the next launch loads from cache. Recommendation: a total limit around 45 s, a slow line from around 8 s; the plan fixes the numbers in `balance.loader`.
- **A-2**: a pure rule in `src/core/` (e.g. `bootLoadPhase(elapsedMs, limits) → 'loading' | 'slow' | 'over'`), numbers in `balance.loader` (`slowAfterMs`, `totalMs`), one Polish line in `pl.loading` (e.g. `slow`), a position in `LOADING_LAYOUT` under the bar, and a `LoadingScreen.slow()` (or `showSlow`) method; DESIGN-GAP row because the kit has no such line. Pattern: `saveSlow` (`pl.saveSlow`, `cardCopyFor` in `src/core/saveHealth.ts`).
- **P-5**: the guard fits in the store's write without a format change: `src/storage/idb.ts` `write` uses idb-keyval `update(key, updater, store)`, which does `get` + `put` in ONE readwrite transaction (`node_modules/idb-keyval/dist/index.js` `update`); the updater throws a named error (e.g. `NewerSave`) when the stored value has a numeric `version` greater than the value being written, and a throw inside the updater rejects before `put`, so nothing is written. The call stays inside the existing `withTimeLimit` (`limited(store.write(...))`). Cost: one extra `get` (structured-clone read of a tens-of-KB value) in the same transaction per write; writes are debounced 500 ms. Core maps the error to a new runtime `BlockReason` (e.g. `'newer'`), never saved, so the format stays v3.
- **P-5, what is seen**: the parent sees a "Zapis gry" line (`saveHealthView` → `off` with a new cause); the existing `saveOff.future` text says "Zaktualizuj grę", which fits a stale tab only loosely ("Uruchom grę ponownie" is the real remedy because the newer build is already on the device). Whether the child also sees a card mid-game is a product choice for the plan (see Open Questions); the `saveFailedCard` + `pl.saveFuture` pattern exists.
- **P-5, limits**: the guard protects only from this build on. A tab running a build from before this change has no guard and can still write v2 over v3 (`change.md`, row P-5 SW). A same-version two-tab race stays out of scope.
- **SW**: keep `skipWaiting: true` / `clientsClaim: true`. Removing them would make a new worker wait until every client of the origin is closed; an installed PWA that is resumed instead of relaunched could stay on the old build indefinitely, against FR-003 ("instaluje nową wersję sama przy następnym uruchomieniu", `context/foundation/prd.md`). The version guard handles the data risk that mixed builds create. A `controllerchange` listener is not needed for the guard: it also fires in a tab on every ordinary update launch, so it would not mean "save conflict".
- **e2e seams**: (1) a "many stalled files" seam, e.g. `?e2eArt=stallall`, that sets the per-file limit off or long, the total limit and the slow line short (e2e constants beside `E2E_LOADER_TIMEOUT_MS`), with the spec holding several routes (images + `**/fonts/*.ttf`) open under `serviceWorkers: 'block'`; the hook needs a readable loading state, because its `snapshot` getter calls `task().snapshot()` outside the welcome screen; (2) a "newer save appears" seam, e.g. `?e2eSave=newer`, an in-memory store whose stored version jumps above `SAVE_VERSION` after the first write and whose `write` applies the same guard; the idb guard itself (two real stores on one database) is unit-testable with fake-indexeddb in `tests/idbStore.test.ts`.

## Detailed Findings

### 1. Boot load today

- `src/scenes/BootScene.ts` `preload` (line 22): draws `LoadingScreen`, forwards `progress`, copies `this.load.xhr.timeout` onto each file on `Loader.Events.ADD` (lines 34-39, because Phaser's per-file default 0 would override the game config), queues the font (`this.load.font(FONT_KEY, …)`), a `loaderror` warning (line 43), all `TASK_ART` and `ROOM_ART` images. No total limit; `create()` (line 63) runs only on loader COMPLETE.
- `src/main.ts` `createGame`: `loader: { timeout: balance.loader.timeoutMs, maxRetries: balance.loader.maxRetries }` (12 000 ms, 1), or `{ timeout: E2E_LOADER_TIMEOUT_MS (2000), maxRetries: 0 }` under `?e2eArt=stall`. No `maxParallelDownloads`, so 6 on Android, 32 elsewhere (`node_modules/phaser/src/core/Config.js:534`); no `imageLoadType`, so `'XHR'` (Config.js:579).
- `create()` computes `artHealth(TASK_ART, key => this.textures.exists(key))` and the same for `ROOM_ART`, writes `REGISTRY_KEYS.artHealth`/`roomArtHealth`, then hands over through `this.time.delayedCall(0, …)`.

### 2. Phaser 4.2.1 loader semantics (paths under `node_modules/phaser/src/`)

Checked by a delegated read of the loader sources; the claims on `nextFile`, `fileProcessComplete`, `reset` and `FontFile.onProcess` were re-read in this step.

- **No abort**: `LoaderPlugin` has no abort/cancel method, and `grep "\.abort()"` over `node_modules/phaser/src/loader` finds no call.
- **`reset()`** (`loader/LoaderPlugin.js:1237-1251`): clears `list`, `inflight`, `queue`, restores base URL/path/prefix, sets `LOADER_IDLE`. It leaves files, XHRs and listeners alone, including the SceneManager's `once(COMPLETE, loadComplete)` (`scene/SceneManager.js:508`).
- **Late completion after `reset()`**: `File.onLoad` → `nextFile` (`LoaderPlugin.js:1034`); its guard (`if (!this.inflight) return`) only catches a destroyed game, so it adds to `queue` and calls `onProcess`; `fileProcessComplete` (`:1080`, guard only for a destroyed scene/game) adds the texture and, with all Sets empty, calls `loadComplete()` → COMPLETE. With the once-listener still attached, `create()` would run a second time. Hence option (a) "reset + call create by hand" is rejected.
- **`nextFile(file, false)`** (`LoaderPlugin.js:1056-1063`): `totalFailed++`, adds to `_deleteQueue`, emits `FILE_LOAD_ERROR` (`'loaderror'`), calls `fileProcessComplete`. This is the path the existing `loaderror` warning hears.
- **`fileProcessComplete` with `FILE_ERRORED`** (`:1088-1116`): skips `addToCache`, removes the file from `queue`, completes the load if all Sets are empty.
- **`File.onError` retries** while `retryAttempts > 0` (`loader/File.js:405-409`), so forcing failure must zero `retryAttempts` or bypass `onError`; `xhr.abort()` alone leaves the file stuck because Phaser sets no `onabort`. `resetXHR()` (`File.js:291-299`) clears `onload/onerror/onprogress` but not `ontimeout` (set at `loader/XHRLoader.js:93`).
- **Scene stop mid-load** (option c, rejected): `SceneManager.stop` removes the COMPLETE→create listener (`SceneManager.js:1299`) and the loader's `shutdown` removes all listeners, so Boot's `create()` (art health, handover) never runs and failures are not counted.
- **Images**: two stages: the XHR blob download (the only stage the `timeout` reaches, `XHRLoader.js:58, :93`) and `ImageFile.onProcess` (`loader/filetypes/ImageFile.js:108-133`), an `Image` decode from a blob URL with no time limit. A decode error goes through `File.onProcessError` (`File.js:479`) with no `FILE_LOAD_ERROR`.
- **Font**: `FontFile` sets `FILE_POPULATED` in its constructor (`loader/filetypes/FontFile.js:84`), so `File.load` calls `nextFile(this, true)` at once (`File.js:311-314`): it is counted as a successful download and sits in `queue` while `onProcess` (`FontFile.js:97-131`) awaits `new FontFace(...).load()` with no limit. Its `.catch` warns and calls `onProcessComplete()`, so a font failure is never a `loaderror` (the font branch of the `loaderror` warning in `BootScene.preload` cannot fire; audit A-7). If the file was destroyed before a late settle, `onProcessComplete` throws inside the promise and the second throw becomes an unhandled rejection, which `installErrorBoundary` treats as fatal (`src/ui/dom/errorBoundary.ts:53`, via the delegated read): the forced path must replace `onProcessComplete` with a no-op first.
- **Progress** (`LoaderPlugin.js:960`) is `1 - (list + inflight) / totalToLoad`: files being decoded already count as done, so a stalled font shows the bar near full.
- **Clock**: the SceneManager steps scenes whose status is above START (`SceneManager.js:569`; LOADING = 3), so `this.time.delayedCall` set in `preload` fires during the load; both it and `loader.update` stop while the animation frame is paused (hidden tab). `window.setTimeout` keeps wall time.
- **Typed access**: `list`, `inflight`, `queue` (`Set<File>`), `nextFile`, `fileProcessComplete`, `loadComplete`, `File.resetXHR`, `xhrLoader`, `retryAttempts` are in `types/phaser.d.ts` (delegated read, around lines 91000-91225), so the forced path compiles without casts except where the plan chooses to wrap it.

**Recommended mechanism (option b)**, a sketch for the plan, not product code:

```ts
// in preload; cleared on COMPLETE
const cut = this.time.delayedCall(totalMs, () => finishNow(this.load));
this.load.once(Loader.Events.COMPLETE, () => cut.remove(false));

function finishNow(load: Loader.LoaderPlugin): void {
    if (!load.isLoading()) return;
    for (const f of [...load.list]) { load.list.delete(f); load.inflight.add(f); }
    for (const f of [...load.inflight]) {                  // downloads: fail, `loaderror` per file
        f.retryAttempts = 0;
        const xhr = f.xhrLoader; f.resetXHR();
        if (xhr) { xhr.ontimeout = null; xhr.abort(); }
        load.nextFile(f, false);
    }
    for (const f of [...load.queue]) {                     // image decode or FontFace promise
        if (f.data instanceof HTMLImageElement) { f.data.onload = null; f.data.onerror = null; }
        f.onProcessComplete = () => undefined;             // a late font settle becomes a no-op
        f.state = Loader.FILE_ERRORED;
        load.fileProcessComplete(f);                       // the last one → loadComplete → COMPLETE → create() once
    }
}
```

Caveats for the plan: (1) `create()` may run synchronously inside the timer callback; the handover is already deferred by `delayedCall(0)`. (2) A cut font leaves already-drawn Phaser texts in the fallback font; texts created after a late `document.fonts.add` use the face. (3) `create()` cannot tell a cut file from a 404 unless the forced path records it; A-11 (load time and `totalFailed` in the record) is out of scope but the plan may pass the cut count to the log line. (4) The decision about the loader internals is the one Phaser-upgrade risk of this change: pin it with a unit test of the forced path if a Phaser scene can be built in vitest (it cannot today: `src/core` has the pure rule only), otherwise with the e2e below; record the Phaser version in a comment.

### 3. "Still loading" signal (A-2)

- `src/ui/widgets/LoadingScreen.ts`: `progress(value)` and `destroy()` only; title from `pl.loading.title` (`src/data/pl.ts:277`, `loading: { title: 'Martynka urządza' }`); layout `LOADING_LAYOUT` (`src/data/layout.ts:440-443`: `title {x 960, y 450}`, `bar {left 560, top 580, width 800, height 36}`); DESIGN-GAP note for the drawn-in-code screen in the class comment.
- Pattern to mirror: the slow save read (`pl.saveSlow`, `cardCopyFor` in `src/core/saveHealth.ts`, `slowLoadTimeoutMs` in `balance.save`).
- Recommended shape: a pure `bootLoadPhase(elapsedMs, { slowAfterMs, totalMs })` in `src/core/` (test first: boundaries, `slowAfterMs < totalMs`), `balance.loader.slowAfterMs`/`totalMs` with a comment carrying the arithmetic, `pl.loading.slow` (short, calm, for a child and a parent, e.g. "Jeszcze chwilka…"; final copy is the plan's, DESIGN-GAP row in `docs/design-gaps.md`), a `LOADING_LAYOUT.slow` position under the bar (S-16c restyles the screen, so the line uses layout tokens only), and `LoadingScreen.slow()` drawing it once. The driver can be the same `this.time` clock (a repeating check or two `delayedCall`s), so the rule decides and the scene renders.
- The existing `tests/loaderBalance.test.ts` bounds only one file's worst case; a new case should bound `totalMs` and the relation `slowAfterMs < totalMs`.

### 4. Save write path and the version guard (P-5)

- `src/core/autosave.ts`: `SaveStore` = `read`, `write`, `backup` (lines 5-10); `BlockReason = 'unreadable' | 'unavailable' | 'fatal'` (line 18); `withTimeLimit` (line 113); `attempt` (line 204) does the optional backup then `await limited(store.write(encoded))` (line 236); `replace` (line 307) checks `replaceGate` (line 102) and writes with `limited(store.write(state))` (line 335); the migrated save is written once at start (line 359, reason `'migration'`); `block(reason)` keeps the first reason (line 376). No read before a write on any of these paths.
- `src/storage/idb.ts` `createIdbSaveStore`: `write` is `run(s => set(key, value, s), () => mine === writeSeq)` (line 45), `backup` is a `set` on `profile:default:backup-v<from>` (line 49); `run` retries once on a lost iOS connection unless the write was superseded.
- idb-keyval 6.3.0 `update(key, updater, store)` (`node_modules/idb-keyval/dist/index.js:86`): one `readwrite` transaction, `store.get(key)` then `store.put(updater(req.result), key)`; a throw in the updater rejects the promise before `put`. This gives an atomic compare-and-write per tab: no other transaction on the store can slip between the read and the put.
- **Guard shape** (recommendation): `write` becomes `run(s => update(key, old => { if (isNewerThan(old, value.version)) throw named('NewerSave'); return value; }, s), …)`. The comparison is tiny and could live in `src/core/` (`storedVersionNewer(raw, version)`, pure, testable) and be used by both the idb store and the e2e store. Only a numeric `version` greater than the one being written refuses; a missing or non-numeric `version` (no save, corrupt) does not, so the existing load-time handling is unchanged. Same version → write proceeds (audit constraint: never block an ordinary same-version write).
- **Core reaction**: in `attempt` and `replace`, an error named `NewerSave` → `blockedBy ??= 'newer'` (new `BlockReason`), `lastFailure = { stage: 'write' | 'replace', error: 'NewerSave' }`, no re-arm. Affected exhaustive consumers: `saveHealthView`/`offState` (`src/core/saveHealth.ts`, cause union), `replaceGate` (must return `Blocked` for `'newer'`, like `future`), `deviceSaveView` (`src/core/saveFile.ts:83-93`, cause union `'future' | 'timeout' | 'unavailable' | 'fatal'`; `'newer'` maps to a non-forceable cause), and the `pl.settings.saveOff` record (a new `newer` line, DESIGN-GAP). `AutosaveStatus` stays runtime-only; `SAVE_VERSION` stays 3; frozen fixtures untouched.
- **Interactions**: the start write after a migration copies the old save first (`backup`, other key) and then writes; with the guard a newer stored save refuses the write and the copy is harmless. `replace` (import/reset dialogs) is refused the same way and returns `{ ok: false, error: 'NewerSave' }`; the dialogs already show a failure for a non-ok result and reload only on success (plan to confirm the copy). `backup` stays unguarded (its own key).
- **Cost**: one `get` of the whole save (tens of KB, structured clone) inside the same transaction per write; writes are debounced `balance.save.debounceMs` 500 ms plus `flush('now')` at purchases and round ends (`balance.save` comment estimates 7-12 attempts per first round). The existing `writeTimeoutMs` 5000 bounds the combined read+put. A `TimeoutError`/`timeout` keeps today's behaviour (failure, retry).
- **Unit tests available**: `tests/idbStore.test.ts` runs on fake-indexeddb 6.2.5, so "store A writes v3, store B (same db) holds v4, A's write is refused and the stored value stays v4" is testable without a browser; `tests/autosave.test.ts` covers the core mapping with a fake store.

### 5. Service worker update model

- `vite/config.shared.mjs` `pwaOptions`: `registerType: 'autoUpdate'`, `injectRegister: null`, `workbox.skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`; comment "New service worker activates at once … the next launch gets the new build silently".
- `src/pwa/registerServiceWorker.ts`: registers `/sw.js` on `load` in production; no `controllerchange` handling.
- Decision history: `context/archive/2026-10-11-installable-offline-pwa/research.md` chose own registration with explicit `skipWaiting`/`clientsClaim` precisely to get "silent update at the next launch" without reloads mid-round; PRD FR-003 (`context/foundation/prd.md`) and PRD decision 4 confirm it.
- Effect of removing `skipWaiting`: the new worker waits until all clients are gone; an iPad PWA that is resumed rather than relaunched keeps the old build, so updates (and fixes like this one) arrive late or not at all; that weakens FR-003 and does not remove the old-tab window for builds already shipped. Effect of keeping it: an older tab can run beside a newer one; the version guard is what protects the save. Recommendation: no change; record the trade-off in the plan.
- All assets load at start (CLAUDE.md, no lazy chunks), so `cleanupOutdatedCaches` under an old tab does not break that tab's assets.

### 6. e2e seams (hook build only, markers in `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`)

- Existing: `?e2eArt=stall` (`src/testing/e2eHook.ts` `e2eArt`, `E2E_LOADER_TIMEOUT_MS` 2000, `maxRetries: 0` in `src/main.ts` `createGame`) with `tests/e2e/salon-load-health.spec.ts` "#15 H-2 a picture that never answers…" (one routed file, `serviceWorkers: 'block'`). It pins the per-file listener; keep it green (follow-up "per-file timeout guarded only by e2e").
- **Needed A (A-1/A-2)**: a new `e2eArt` value (e.g. `stallall`) that keeps the per-file limit out of the way (timeout 0 or long) and sets short e2e totals (e.g. slow line 500 ms, total 3000 ms) so only the total limit can end the load; the spec routes several images and `**/fonts/*.ttf` to never answer. Assertions: the slow line shows (needs a loading-state read: the hook `snapshot` getter calls `task().snapshot()` outside the welcome, which does not exist during Boot, so add a `screen: 'loading'` branch or a registry key the hook reads), then the welcome appears and `artHealth.missing`/`roomArtHealth.missing` ≥ the routed count. Also prove `create()` ran once (e.g. a counter in the hook build, or no second handover). `tests/e2eHookGuard.test.ts` and `tests/e2eSave.test.ts` list the seam values and must learn the new one.
- **Needed B (P-5)**: a new `e2eSave` value (e.g. `newer`) in `e2eSaveStore`: after the first successful write the stored value becomes `{ version: SAVE_VERSION + 1, … }` (simulating another tab), and `write` applies the same guard function as the idb store, rejecting with `NewerSave`. Assertions: `snapshot.save.blockedBy === 'newer'`, `store.writtenVersion` stays the newer one, the "Zapis gry" line (copy from `pl.ts`) shows. Two real browser contexts cannot share the in-memory seam, and the contract forbids opening IndexedDB from a test; the real cross-tab path is covered by the fake-indexeddb unit test.
- Both seams must be absent from `dist/` (the build's `e2eHookGuard` check).

## Code References

- `src/scenes/BootScene.ts:22` `preload`, `:34-39` per-file timeout on `Loader.Events.ADD`, `:43` `loaderror`, `:63` `create`
- `src/main.ts` `createGame` (`loader` config, `?e2eArt=stall`), `start` (load, cards, `createAutosaver`)
- `src/ui/widgets/LoadingScreen.ts` `LoadingScreen.progress`, `destroy`
- `src/data/balance.ts:17` `loader`, `:18` `save`
- `src/data/pl.ts:277` `loading`; `saveFuture`, `settings.saveOff.future`
- `src/data/layout.ts:440` `LOADING_LAYOUT`
- `src/core/autosave.ts:18` `BlockReason`, `:102` `replaceGate`, `:113` `withTimeLimit`, `:204` `attempt`, `:236`/`:335` the two `store.write` calls, `:359` start write after migration
- `src/storage/idb.ts:45` `write`, `:49` `backup`
- `src/core/saveHealth.ts` `offState`, `saveHealthView`, `cardCopyFor`; `src/core/saveFile.ts` `deviceSaveView`
- `src/testing/e2eHook.ts` `e2eArt`, `E2E_LOADER_TIMEOUT_MS`, `e2eSaveStore`, the `snapshot` getter; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`
- `vite/config.shared.mjs` `pwaOptions.workbox`; `src/pwa/registerServiceWorker.ts`
- `node_modules/phaser/src/loader/LoaderPlugin.js:1034` `nextFile`, `:1080` `fileProcessComplete`, `:1237` `reset`; `loader/File.js:291` `resetXHR`, `:405` `onError`; `loader/filetypes/FontFile.js:97` `onProcess`; `loader/filetypes/ImageFile.js:108` `onProcess`; `scene/SceneManager.js:508`, `:1299`
- `node_modules/idb-keyval/dist/index.js:86` `update`
- `tests/loaderBalance.test.ts`, `tests/idbStore.test.ts`, `tests/autosave.test.ts`, `tests/e2e/salon-load-health.spec.ts`

## Architecture Insights

- The scene renders, `src/core` decides: the slow/over rule is pure and tested first; the loader surgery stays in `BootScene` (Phaser), the version comparison can be a pure helper used by both stores.
- Every store call already goes through `withTimeLimit`; the guard rides on it rather than adding a separate read.
- Runtime-only status fields are the established way to add save health without touching the format (`AutosaveStatus` comments, save-v2-backup-health).

## Historical Context (from prior changes)

- `context/archive/2026-10-15-salon-load-health/` added the per-file limit and the `?e2eArt=stall` e2e; its follow-ups ask for a font time limit and a cross-tab guard (both partly answered here). Supported.
- `context/archive/2026-10-13-autosave-versioned-save/` plan-review F5: "a fix (`BroadcastChannel` or a write counter) changes the format". Partial: true for a same-version ordering guard; a version-only guard needs no format change (finding 4).
- `context/archive/2026-10-11-installable-offline-pwa/research.md`: explicit `skipWaiting`/`clientsClaim` with own registration for silent update without reloads. Supported and still in force.
- Audit 2026-10-15_2217 (PR #66), findings A-1 (Android ~11 waves × 24 s), A-2, P-5 (suggests `blockedBy: 'future'`). This research prefers a distinct `'newer'` reason because `future` is a load-time reason with its own card and `loadReason`; the plan may still map both to the same parent text.

## Related Research

- `context/archive/2026-10-15-salon-load-health/research.md`, `context/archive/2026-10-15-save-v2-backup-health/research.md` (time limits on store calls).

## Open Questions (choices for the plan, not missing evidence)

1. Numbers: `totalMs` (recommended ~45 s; arithmetic above) and `slowAfterMs` (~8 s); game-loop clock vs wall clock (recommended loop clock).
2. Child-facing reaction to `'newer'` mid-game: parent-only "Zapis gry" line, or also a calm card with "Uruchom ponownie" (reload) — reuse `mountSaveFailedCard` with a new copy. PRD forbids harsh feedback; either is compatible.
3. Whether the forced path also emits `loaderror` for queued files (decode/font) so the log names them (A-7 is otherwise out of scope).
4. Exact copy for `pl.loading.slow` and `saveOff.newer` (DESIGN-GAP rows).
5. P-8 (a repeated migration overwrites `backup-v2`) stays a follow-up: with the guard, re-migration can only follow a write by a pre-guard build.
