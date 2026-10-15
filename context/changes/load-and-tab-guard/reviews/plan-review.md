<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Łączny limit ładowania, linia „jeszcze chwilka” i strażnik zapisu przed starszą kartą

- **Plan**: context/changes/load-and-tab-guard/plan.md
- **Mode**: Deep (claims checked directly against `node_modules/phaser` 4.2.1, `node_modules/idb-keyval` 6.3.0 and `src/`)
- **Date**: 2026-10-15
- **Verdict**: REVISE → SOUND after triage (all fixes applied in plan.md)
- **Findings**: 1 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → PASS after F1 fix |
| Plan Completeness | WARNING (F2, F3, F5 fixed) |

## Grounding

Grounding: 14/14 paths ✓ (`BootScene.ts`, `LoadingScreen.ts`, `autosave.ts`, `idb.ts`, `e2eHook.ts`, `saveHealth.ts`, `saveFile.ts`, `idbStore.test.ts`, `loaderBalance.test.ts`, `e2eSave.test.ts`, `e2eHookGuard.test.ts`, `e2e/support/hook.ts`, `playwright.config.ts` `ROUND_SPEC`, `fake-indexeddb` in devDependencies); symbols ✓ (`nextFile`, `fileProcessComplete`, `loadComplete`, `checkLoadQueue`, `File.resetXHR`/`onError`, `FontFile.onProcess`, `SceneManager.bootScene` `loader.once(COMPLETE)`, `replaceGate`, `withTimeLimit`, `E2E_SAVE_SEAMS`, `writtenVersion`, `openSettings`, `passWelcome`); Phaser installed = 4.2.1, `package.json` `^4.2.1`; brief↔plan ✓ (brief updated for F1).

Verified claims (no finding):
- **One `create()`**: `SceneManager.bootScene` registers `loader.once(LoaderEvents.COMPLETE, this.loadComplete)` after `preload`, and `loadComplete` calls `create` synchronously. `fileProcessComplete` calls `loadComplete` only when `list`, `inflight` and `queue` are all empty. So the last forced failure in `cutLoad` runs `create` once, and any later `COMPLETE` finds no listener. BootScene's own `COMPLETE` listener (registered in `preload`) runs before the SceneManager one, so the timers are cleared before `create`.
- **Late XHR after the cut**: `XHRLoader` sets only `onload`/`onerror`/`onprogress`/`ontimeout`. `resetXHR` clears the first three; the plan also nulls `ontimeout`. `abort()` fires none of them. Result: a late XHR does nothing, and with `retryAttempts = 0` there is no retry path.
- **Timer during load**: `SceneManager.update` steps scenes with `status > START && <= RUNNING` (LOADING = 3), so `this.time.delayedCall` set in `preload` ticks while loading.
- **P-5 / idb-keyval `update`**: `get` and `put` run in one `readwrite` transaction, and a throw in the updater rejects before `put`. A corrupt or unversioned stored value goes through `storedVersionNewer` → false, so the write proceeds. The call stays inside `withTimeLimit` (`limited`). The first write after a migration is v2 → v3, which is allowed, and the backup goes to its own key via `set`. `replace` (import/reset) is refused only when the stored version is newer, and the old save then stays. → One defect remains: F1.
- **Precache vs the cut**: `registerServiceWorker` registers on `window` `load`, and Workbox precache fetches from the SW context. `cutLoad` aborts only the page's XHRs, so precache continues independently and a cut file is missing only for that session. One caveat: F4.
- **Drivers**: 1 tdd, 2 impl, 3 impl, 4 tdd, 5 tdd, 6 impl, 7 e2e. The e2e phase comes after phases 2–5 build the features. These are correct, and each phase leaves the gate green on its own: phase 4 adds the `'newer'` Records that the type forces, and phase 5 depends on phase 4's `NEWER_SAVE`.
- **Progress ↔ phases**: 1:1 in all 7 phases, with 31 rows after the edits.

## Findings

### F1 — idb-keyval `update` breaks the forced replace of an unreadable record

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 5 §1 (`createIdbSaveStore.write`)
- **Detail**: In `update`, `req.onerror = () => reject(req.error)` fires when the `get` itself fails, so the transaction aborts and nothing is put. `replaceGate` exists for this case: `unavailable` with a non-timeout read error plus `force` returns `ok`. That is the "Zastąp mimo to" recovery path for a record the browser cannot read (S-12/S-15, gaps 69–72). With a bare `update`, the parent's import or reset over such a record would always fail, while today's `set` succeeds. That is lost recovery. No e2e would catch it, because the e2e uses the in-memory store.
- **Fix**: `guardedPut(store: IDBObjectStore, key, value)` runs in one `readwrite` transaction on the raw `UseStore`. It calls `get`. If the get succeeds, the store refuses when the stored version is newer and otherwise puts. If the get fails, it calls `preventDefault` and puts anyway, because an unreadable version cannot be protected. A unit test on a stub store with a failing `get` covers this, with its own break.
- **Decision**: FIXED (plan Phase 5 §1, Overview, Desired End State, Key Discoveries, decision 9, Known risks, brief)

### F2 — The late-font premise is wrong: queue files are never destroyed, so the p7b break cannot go red

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details; Phase 7 (b), p7b
- **Detail**: Files in `queue` arrived through `nextFile(f, true)` and are not in `_deleteQueue`. After the cut, `loadComplete` never destroys them, so their `loader` stays set.
  - If the `FontFace` settles late without the swap, it does not throw. It calls `fileProcessComplete`, which runs a second `loadComplete`. That emits a second `COMPLETE` with no listener and flips the loader state from `SHUTDOWN` to `COMPLETE`. There is no error card, and the `once` prevents a second `create`.
  - The p7b break is therefore expected to stay green.
  - Scenario (b) released only the room file, whose XHR the cut had already aborted. That exercised nothing.
- **Fix**: the plan now states this mechanism. (b) releases the held **font** (the one late event that reaches the loader) and releases the room file with a `.catch`. p7b is expected green with a meta-check; a red result means the analysis was wrong, so stop. The swap stays as a belt.
- **Decision**: FIXED

### F3 — Files moved from `list` have no `xhrLoader` and stay `FILE_PENDING`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details (cut order)
- **Detail**: A file still in `list` never ran `File.load`, so its `xhrLoader` is undefined, and `abort()` on it would throw inside the cut callback. Its state also stays `FILE_PENDING` through `fileProcessComplete`.
- **Fix**: call `abort()` only when there is an `xhrLoader`, and set `state = FILE_ERRORED` on every cut file.
- **Decision**: FIXED

### F4 — A cold first start shares bandwidth with the SW precache

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 §2 (balance comment); Known risks
- **Detail**: The SW registers on `window` `load`, which does not wait for Phaser's XHRs, so precache downloads the whole build in parallel with `BootScene`. The "≈ 40 s at 50 KB/s" figure ignores this, so a slow but working first start is more likely to hit 45 s. The effect is limited to that session: precache continues in the SW context, and the next start reads from cache. If the server is silent, the SW install hangs too, as it already did before this change.
- **Fix**: add a Known risks entry, and mention the competition in the `balance.loader` comment. The numbers are unchanged (decision 2 already names a tablet measurement as the reversal condition).
- **Decision**: FIXED (documented)

### F5 — `?e2eSave=newer` seam log semantics are unspecified

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 §2; Phase 7 (c)
- **Detail**: The current `write` sets `writtenVersion = next.version`, and the phase 7 assertion "at most one more write" depends on whether a refused write logs an op.
- **Fix**: after write 1, `writtenVersion` holds the bumped version. A refused attempt pushes `'write'` (as `writehang` does). Spec (c) expects exactly one more `'write'` after the block.
- **Decision**: FIXED

### F6 — The `creates` guard and the font swap have no red test

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §2; Phase 7
- **Detail**: Phaser's `once` already guarantees a single `create`, so the `creates` counter and the `onProcessComplete` swap are belts, and no browser test can turn them red. The plan says so. Recorded in Known risks.
- **Decision**: ACCEPTED

## Autonomous decisions (this review)

- **F1: fixed with `guardedPut` on the raw store.**
  - Rejected: bare `update` with a fallback to `set` on any non-`NewerSave` error. That breaks atomicity on timeouts and lost connections.
  - Rejected: the replace path skips the guard. That would let an import erase a newer save.
  - Would change: a measurement that `preventDefault` on the `get` error does not keep the transaction alive in WebKit. The follow-up is the WebKit item.
- **F2: the swap is kept as a belt, not removed.** It costs nothing, and it prevents a second `COMPLETE` and a texture landing in the cache after `artHealth`. Would change: an implementer showing that it needs casts the lint rejects.
- **F4: the numbers are not changed.** Would change: a tablet measurement (decision 2).

VERDICT: PROCEED — one CRITICAL (forced replace of an unreadable record blocked by `update`) and three WARNINGs fixed in plan.md; loader-cut mechanism, single `create`, P-5 transaction semantics and drivers verified against Phaser 4.2.1 / idb-keyval 6.3.0 source.
