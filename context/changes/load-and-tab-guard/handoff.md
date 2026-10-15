# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-tdd` step wrote this handoff for phase 5 (the IndexedDB guard and the `?e2eSave=newer` seam). Rows 5.1 and 5.2 are done, 3.1 and 4.3 are ticked from the orchestrator note; 5.3 waits for the orchestrator e2e (Chromium cannot start here) and 5.4 is for the reviewer.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phase 1 `0c31db4`, phase 2 `79023af`, phase 3 `06b20bb`, phase 4 `1347887`, phase 5 `731bcb0`, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 22 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/storage/idb.ts` | `guardedPut(os, key, value)`: `get` and `put` in ONE readwrite transaction on the raw store; `NewerSave` (name `NEWER_SAVE`) when `storedVersionNewer`; a failing `get` calls `preventDefault` and still puts; resolves on transaction complete. `write` = `run(s => s('readwrite', os => guardedPut(...)), mayRetry)`, so a `NewerSave` is not a lost connection and is not retried. `backup` keeps `set` |
| `src/testing/e2eHook.ts` | seam `?e2eSave=newer` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`): first write ok, the stored value becomes `version SAVE_VERSION + 1`, later writes reject `NewerSave` and log an op `'write'` |
| `tests/idbStore.test.ts` | two stores on one fake-indexeddb database; `guardedPut` on a stand-in with a failing `get`; the two lost-connection tests now fault the first `createStore` call (the mock moved from `set` to `createStore`) |
| `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` | `newer` parsing, the seam store behaviour, the production-chunk guard case; the existing `e2eSave` marker covers the value (no new marker string) |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| RED (stubbed `guardedPut`, `write` still on `set`) | 3 assertion failures, e.g. `AssertionError: expected 'ok' to be 'NewerSave'` (B v4, A v3) and `expected [] to deeply equal [ { version: 3 ... } ]` (failing `get` still puts) |
| `npm run lint` / `npm run typecheck` | pass / pass |
| unit gate (`npm test`, deploy tests, `sample` E1-E6) | 2969 passed (branch baseline 2961, +8); sample E1-E6 0 violations; deploy tests OK; no content change |
| `npm run build` | passes, `e2e hook: absent (2 chunks checked)`; `git diff --stat main -- tests/fixtures` empty |
| Break 1: `write` back to `set` | 2 red (`B v4, A v3 refused`, `refusal is not retried`); restored. Meta-check: the test uses two independent stores on one fake-indexeddb database, so it proves the read in the transaction, not one object's memory |
| Break 2: no `get`-error branch (`preventDefault` + `put` removed) | red (guardedPut stand-in test timed out and the happy-path writes failed); restored |
| e2e `npx playwright test --config=<abs> --workers=4` | e2e: not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer ... Permission denied`); expected 101 + 0 |

## 4. Next command

`/10x-implement load-and-tab-guard phase 6` (phase 6, `Driver: impl`)

## 5. Open

- **Orchestrator:** run e2e (`--workers=4`, expect 101 passed) and tick row 5.3. Reviewer 5.4 (and 3.3 visual, 3.4, 4.4) are not mine.
- **Risks carried:** `guardedPut` + `preventDefault` on a failing `get` unverified on WebKit; Phaser internals `^4.2.1`; cold start vs SW precache (F4); `creates` guard (F6).
- **Phase 7 (e2e):** the `newer` seam logs op `'write'` for the refused attempt too, so the spec expects exactly one extra `'write'` after the block and none later.
- **Manual-only rows:** 2.5 Android throttled start; 3.3 [visual] slow line; 7.7 iPad.
- **Follow-ups:** none yet; phase 6 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **No AskUserQuestion.** Between-phase prompt decided as "stop after phase 2".
- **Cut result published after `cutLoad` returns.** `create()` runs synchronously inside the last `nextFile`, before the keys are assigned, so `BootScene` calls `publish()` in `create` (empty `cut`) and again after the cut. Rejected: a callback argument on `cutLoad` (changes the planned contract). Would change: none.
- **`E2E_BOOT_LIMITS` read in `BootScene` directly** under `__E2E_HOOK__` and the `forcedArt` registry value, not a new registry key. Rejected: a second key. Would change: a second consumer.
- **`loadPhase()` returns `loading` or `over` in this phase**; `slow` arrives in phase 3.
- **The hook returns `screen: 'loading'` while `BootScene.isLoading()`** (the loading screen exists from `preload` to `create`).
- **e2e not run here.** Chromium cannot launch in the sandbox and the rules forbid bypassing it. Would change: a session where Chromium starts.
- **Phase 3 decisions:** the slow timer checks `phase === 'loading'` and asks `bootLoadPhase(slowAfterMs, limits)` (limits object shared with the cut), draws via `LoadingScreen.slow()` (idempotent, destroyed with the screen), try/catch like the bar. DESIGN-GAP 112 added (pl.ts comment, widget docblock, design-gaps.md). No AskUserQuestion; stop after phase 3.
- **Phase 4 decisions:** `NewerSave` is handled in any stage of `attempt` (the error name decides); `replace` that meets it returns `{ ok:false, error:'NewerSave' }`, blocks, does not arm a write. `deviceNewer` text added to `saveTransfer` because the `blockedText` Record is exhaustive over causes (not in the plan's text list; DESIGN-GAP 113 covers it). The `offState` code is `lastFailure.error` (falls back to `lastError`) so the parent reads `NewerSave`. No AskUserQuestion; stop after phase 4.
- **Phase 5 decisions:** `guardedPut` resolves on the transaction `oncomplete` when the object store has a transaction (a stand-in without one resolves on the put request). The two old lost-connection tests faked `set`; writes no longer call it, so the mock now wraps `createStore` (first store call faulty, later calls real). No new guard marker: `e2eSave` already covers the value, and the guard test lists `newer`. No AskUserQuestion; stop after phase 5.
