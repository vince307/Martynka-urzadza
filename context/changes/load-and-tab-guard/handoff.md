# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-implement` step wrote this handoff for phase 6 (docs only: `CLAUDE.md` and the follow-ups). Rows 5.3 (orchestrator e2e, 101 passed), 6.1 and 6.2 are ticked; 6.3 is for the reviewer. Phase 7 is the e2e phase; do not touch production code there except for the named breaks.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phases 1-5 `0c31db4`, `79023af`, `06b20bb`, `1347887`, `731bcb0`, phase 6 `9ee4570`, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 15 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `CLAUDE.md` | one sentence block "Load limit and tab guard" (totalMs, `loaderCut.ts`, `phaserLoaderPin` tripwire, `pl.loading.slow`, `REGISTRY_KEYS.bootLoad`, `guardedPut`/`NewerSave`, `blockedBy 'newer'`, seams `stallall` and `newer`, gaps 112-113); the follow-ups are named as "(archive folder)" because the archive path does not exist yet |
| `context/changes/load-and-tab-guard/follow-ups/review-fixes.md` | 21 entries (A-3..A-11, V-1..V-8, P-1..P-4, P-6..P-8, card for the child on `'newer'`, card order, WebKit, Phaser upgrade, font hand-over closed), each with `Trigger:` |
| `plan.md` | rows 5.3, 6.1, 6.2 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| `validate-rule-files.sh` | PASS (406 paths, 0 missing) |
| Break: `src/scenes/loaderCut.ts` -> `loaderCutX.ts` in `CLAUDE.md` | FAIL (missing: 1); restored, PASS again. Meta-check: the validator fails on a path the file asserts, so the PASS is not vacuous |
| follow-ups `Trigger:` count | 21 entries, 21 `Trigger` mentions (the closed entry says `Trigger: none (closed)`) |
| `npm run lint` / `npm run typecheck` | pass / pass |
| `npm test` | 2969 passed (branch baseline 2969, +0); `sample` E1-E6 0 violations |
| `npm run build` | passes, `e2e hook: absent (2 chunks checked)`; `git diff --stat main -- vite deploy` empty |
| e2e | not run in this phase (no code change); orchestrator ran 101 passed after phase 5 (note), baseline stays 101 |

## 4. Next command

`/10x-e2e load-and-tab-guard phase 7` (phase 7, `Driver: e2e`)

## 5. Open

- **Reviewer rows:** 3.3 [visual], 3.4, 4.4, 5.4, 6.3. Manual-only: 2.5 Android throttled start; 7.7 iPad.
- **Phase 7:** the `newer` seam logs op `'write'` for the refused attempt too, so the spec expects exactly one extra `'write'` after the block and none later. `load-and-tab-guard` goes into `ROUND_SPEC` in `playwright.config.ts`.
- **Risks carried:** `guardedPut` + `preventDefault` on a failing `get` unverified on WebKit; Phaser internals `^4.2.1`; cold start vs SW precache; `creates` guard.
- **Design gaps:** 112, 113 (already in `docs/design-gaps.md`).
- **Follow-ups:** `context/changes/load-and-tab-guard/follow-ups/review-fixes.md`.

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
- **Phase 6 decisions:** CLAUDE.md names the follow-ups folder as "(archive folder)" without a path (the archive path does not exist before `/10x-archive`, and the validator would flag it; same style as earlier entries). The font hand-over follow-up is written as closed with `Trigger: none (closed)` so the Trigger count matches the entry count. The audit report is on the audit branch, not on this one; the one-sentence descriptions come from its table (read via `git show`). No AskUserQuestion; stop after phase 6.
