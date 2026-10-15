# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-tdd` step wrote this handoff for phase 4 (the `'newer'` reason in `core`, runtime only). Rows 4.1 and 4.2 are done; 4.3 waits for the orchestrator e2e (Chromium cannot start here), and so does 3.1. Phase 5 must make the store's `write` throw an error named `NewerSave` (`NEWER_SAVE`) and must not use the bare idb-keyval `update`; it uses `guardedPut` on the raw store, so a failing `get` still puts (F1).

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phase 1 `0c31db4`, phase 2 `79023af`, phase 3 `06b20bb`, phase 4 `1347887`, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 27 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/save.ts` | `NEWER_SAVE = 'NewerSave'`, `storedVersionNewer(stored, version)` (numeric finite `version` above ours; anything else false) |
| `src/core/autosave.ts` | `BlockReason` + `'newer'` (runtime); `attempt` and `replace` turn a `NewerSave` error into `blockedBy ??= 'newer'` with no retry and no re-arm; `replaceGate` Blocked for `'newer'` even with force |
| `src/core/saveHealth.ts`, `src/core/saveFile.ts`, `src/ui/dom/saveSummaryView.ts`, `src/data/pl.ts` | `offState` cause `newer` (code `NewerSave`), `deviceSaveView` `blocked/newer/forceable false`, `settings.saveOff.newer`, `saveTransfer.deviceNewer`; DESIGN-GAP 113 in `docs/design-gaps.md` |
| `tests/{save,autosave,saveHealth,saveFile}.test.ts` | new blocks `storedVersionNewer`, `a store that refuses with NewerSave blocks saving for good`, `saveHealthView newer`, `deviceSaveView newer` |
| `src/scenes/loaderCut.ts` | `cutLoad(load)`: moves `list` files to `inflight`, ends `queue` files (swaps `onProcessComplete`, detaches image callbacks) and `inflight`/`list` files (`retryAttempts` 0, `resetXHR`, `ontimeout` null, `abort` only with an `xhrLoader`) as `FILE_ERRORED`; returns the cut keys |
| `src/scenes/BootScene.ts` | total-limit timer (`this.time.delayedCall(totalMs)`, removed on `COMPLETE`), one `console.warn` line, `publish()` of `REGISTRY_KEYS.bootLoad`, `creates` guard, `loadPhase()` (`loading`/`over` for now) and `isLoading()` |
| `src/data/layout.ts` | `REGISTRY_KEYS.bootLoad` (runtime only) |
| `src/main.ts` | `?e2eArt=stallall` gives `loader: { timeout: 0, maxRetries: 0 }` (hook build only) |
| `src/testing/e2eHook.ts` | `E2EArtSeam` + `stallall`, `E2E_BOOT_LIMITS` (500 ms / 3000 ms), snapshot `screen: 'loading'` with `loading.phase`, `bootLoad` in every snapshot |
| `tests/e2e/support/hook.ts` | `Snapshot.screen` + `'loading'`, `loading`, `bootLoad` |
| `tests/phaserLoaderPin.test.ts` | tripwire: Phaser must be 4.2.1 |
| `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` | `stallall` parsing and the production-chunk guard case; the existing `e2eArt` marker covers the value |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| RED (stubbed `storedVersionNewer` returning false, no `'newer'`) | 8 assertion failures, e.g. `AssertionError: expected 'ok' to be 'Blocked'` (replaceGate), `expected false to be true` (storedVersionNewer), `expected { kind: 'off', cause: 'fatal' ...} to match { cause: 'newer' }` |
| `npm run lint` / `npm run typecheck` | pass / pass |
| unit gate (`npm test`, deploy tests, `sample` E1–E6) | 2961 passed (branch baseline 2942, +19); sample E1–E6 0 violations; deploy tests OK; no content change |
| `npm run build` | passes, `e2e hook: absent (2 chunks checked)`; `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` empty |
| Break 1: no `blockedBy ??= 'newer'` in `attempt` | 2 red (write-once test counting store calls; migration start test) ; restored |
| Break 2: `replaceGate` without `'newer'` | 2 red (replace with force refused; gate test); restored. Meta-check: tests count store `write` calls and `ops`, not only the status field |
| e2e `npx playwright test --config=<abs> --workers=4` | e2e: not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer … Permission denied`); expected 101 + 0 |

## 4. Next command

`/10x-tdd load-and-tab-guard phase 5` (phase 5, `Driver: tdd`)

## 5. Open

- **Orchestrator:** run e2e (`--workers=4`, expect 101 passed) and tick rows 3.1 and 4.3. Visual 3.3 and reviewer 3.4 / 4.4 are not mine.
- **Phase 5:** the store must reject with `Object.assign(new Error(...), { name: NEWER_SAVE })` when `storedVersionNewer(stored, SAVE_VERSION)`; `guardedPut` in one `readwrite` transaction, an unreadable record does not block the write. Autosave start write after a migration, `replace` (import/reset) and the forced "Zastąp mimo to" path were tested in `core` against `'newer'` (no deadlock: `replacing` is cleared, no timer armed); the real store proof is phase 5.
- **Child-facing:** no card for the child at `'newer'` (parent line and one log only), as planned.
- **Risks carried:** Phaser internals `^4.2.1`; cold start vs SW precache (F4); `creates` guard belts (F6, p7b expected green); `guardedPut` + `preventDefault` on a failing `get` unverified on WebKit.
- **Manual-only rows:** 2.5 Android throttled start; 3.3 [visual] slow line; 7.7 iPad.
- **DESIGN-GAP 113 added** (phase 4). **Follow-ups:** none yet; phase 6 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **No AskUserQuestion.** Between-phase prompt decided as "stop after phase 2".
- **Cut result published after `cutLoad` returns.** `create()` runs synchronously inside the last `nextFile`, before the keys are assigned, so `BootScene` calls `publish()` in `create` (empty `cut`) and again after the cut. Rejected: a callback argument on `cutLoad` (changes the planned contract). Would change: none.
- **`E2E_BOOT_LIMITS` read in `BootScene` directly** under `__E2E_HOOK__` and the `forcedArt` registry value, not a new registry key. Rejected: a second key. Would change: a second consumer.
- **`loadPhase()` returns `loading` or `over` in this phase**; `slow` arrives in phase 3.
- **The hook returns `screen: 'loading'` while `BootScene.isLoading()`** (the loading screen exists from `preload` to `create`).
- **e2e not run here.** Chromium cannot launch in the sandbox and the rules forbid bypassing it. Would change: a session where Chromium starts.
- **Phase 3 decisions:** the slow timer checks `phase === 'loading'` and asks `bootLoadPhase(slowAfterMs, limits)` (limits object shared with the cut), draws via `LoadingScreen.slow()` (idempotent, destroyed with the screen), try/catch like the bar. DESIGN-GAP 112 added (pl.ts comment, widget docblock, design-gaps.md). No AskUserQuestion; stop after phase 3.
- **Phase 4 decisions:** `NewerSave` is handled in any stage of `attempt` (the error name decides); `replace` that meets it returns `{ ok:false, error:'NewerSave' }`, blocks, does not arm a write. `deviceNewer` text added to `saveTransfer` because the `blockedText` Record is exhaustive over causes (not in the plan's text list; DESIGN-GAP 113 covers it). The `offState` code is `lastFailure.error` (falls back to `lastError`) so the parent reads `NewerSave`. No AskUserQuestion; stop after phase 4.
