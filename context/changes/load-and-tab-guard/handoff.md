# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-implement` step wrote this handoff for phase 2 (the total boot limit and the loader cut). Rows 2.1 and 2.2 are done; 2.3 (e2e) and row 1.3 are left to the orchestrator because Chromium cannot start here. The next agent must not use the bare idb-keyval `update` in phase 5. Phase 5 uses `guardedPut` on the raw store, so a failing `get` still puts (F1). Break p7b is expected to stay green (F2).

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phase 1 `0c31db4`, phase 2 `79023af` (`feat(load-and-tab-guard): łączny limit ładowania w BootScene (p2)`), then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 27 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
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
| `npm run lint` / `npm run typecheck` | pass / pass |
| unit gate (`npm test`, `sample` E1–E6) | 2942 passed (branch baseline 2940, +2: tripwire, `stallall` in the `e2eHookGuard` it.each); sample E1–E6 clean (no content change) |
| `npm run build` | passes, prints `e2e hook: absent (2 chunks checked)`; `E2E_BOOT_LIMITS` and `stallall` absent from `dist/_app/*.js` |
| Break: tripwire `toBe('4.2.2')` | `AssertionError: src/scenes/loaderCut.ts relies on loader internals: re-verify e2e #15 stallall, then update this pin: expected '4.2.1' to be '4.2.2'`; restored, green |
| Meta-check | the tripwire guards only the Phaser version; the cut behaviour is proven by e2e #15 in phase 7 (patches p7a/p7b), not here |
| e2e `npx playwright test --config=<abs> --workers=4` | e2e: not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer … Permission denied`); expected baseline 101 + 0, with `salon-load-health.spec.ts` "#15 H-2" green |

## 4. Next command

`/10x-implement load-and-tab-guard phase 3` (phase 3, `Driver: impl`)

## 5. Open

- **Orchestrator:** run e2e (`--workers=4`, expect 101 passed) and tick rows 1.3 and 2.3.
- **Phase 3 inputs:** `BootScene.phase` exists (`loading`/`over`); phase 3 adds `slow` through a `delayedCall(slowAfterMs)` that calls `LoadingScreen.slow()`, using `bootLoadPhase`. The same `limits` object is built in `preload` (hook build uses `E2E_BOOT_LIMITS`), so reuse it. Remove the slow timer on `COMPLETE` and stop it after the cut.
- **Risks carried:** Phaser internals `^4.2.1`; cold start competes with the SW precache (F4); the `creates` guard and `onProcessComplete` swap are belts without a red test (F6; p7b expected green); the guard protects only from this build on; `guardedPut` + `preventDefault` on a failing `get` is unverified on WebKit.
- **Manual-only rows:** 2.5 Android throttled start; 3.3 [visual] slow line; 7.7 iPad.
- **DESIGN-GAPs planned:** 112 (`pl.loading.slow`, phase 3) and 113 (`saveOff.newer`, phase 4).
- **Follow-ups:** none yet; phase 6 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **No AskUserQuestion.** Between-phase prompt decided as "stop after phase 2".
- **Cut result published after `cutLoad` returns.** `create()` runs synchronously inside the last `nextFile`, before the keys are assigned, so `BootScene` calls `publish()` in `create` (empty `cut`) and again after the cut. Rejected: a callback argument on `cutLoad` (changes the planned contract). Would change: none.
- **`E2E_BOOT_LIMITS` read in `BootScene` directly** under `__E2E_HOOK__` and the `forcedArt` registry value, not a new registry key. Rejected: a second key. Would change: a second consumer.
- **`loadPhase()` returns `loading` or `over` in this phase**; `slow` arrives in phase 3.
- **The hook returns `screen: 'loading'` while `BootScene.isLoading()`** (the loading screen exists from `preload` to `create`).
- **e2e not run here.** Chromium cannot launch in the sandbox and the rules forbid bypassing it. Would change: a session where Chromium starts.
