# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

Written by the `/10x-new` step of run `2026-10-15-fix-s16bcd`. The change folder exists with `change.md` (source: observability audit 2026-10-15_2217, PR #66, findings A-1, A-2, P-5 + font limit), an audit-vs-repo table and the follow-ups in scope. The next agent must not promise that P-5 protects against a tab already running an older build: the guard lives only in this build onwards, and the save format stays v3.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | 1 on the branch: `docs(load-and-tab-guard): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/load-and-tab-guard/change.md` | change identity: source and scope, save format statement (stays v3), audit claim / repo now / correction table, open follow-ups with triggers and scope take, autonomous decisions |
| `context/changes/load-and-tab-guard/handoff.md` | this handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| code reads (observed in this step) | `src/data/balance.ts` `loader` 12000/1; `node_modules/phaser/src/core/Config.js` `loaderMaxParallelDownloads` 6 on Android; 64 WebP + 1 font queued in `BootScene.preload`; Phaser `FontFile` `FILE_POPULATED`; `LoadingScreen` has `progress`/`destroy` only; `SaveStore` write path never reads; `vite/config.shared.mjs` `skipWaiting`/`clientsClaim` true; `SAVE_VERSION` 3 |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main 6f5644c per contract, inherited, unverified) |

No deliberate break: no test or code in this step.

## 4. Next command

`/10x-research load-and-tab-guard`

## 5. Open

- Research questions for the next step:
  - Can a total timer end Phaser's `preload` cleanly while files (and the font promise) are in flight — e.g. `this.load.reset()`/`removeAllListeners` + manual `create`, or start the next scene from a timer in `BootScene` — without a second `create()` when the loader completes late? (`src/scenes/BootScene.ts` `preload`/`create`)
  - Where the slow-line rule lives (`src/core/`, pure, like `saveSlow` in `src/core/autosave.ts` `loadSave` `waitLonger`), its number in `src/data/balance.ts` `loader`, its text in `src/data/pl.ts` `loading`, its place in `LOADING_LAYOUT` (`src/data/layout.ts`), and how S-16b's sound files join the same queue.
  - P-5 guard shape: a read of the stored `version` before each write in `src/core/autosave.ts` (cost per write under `withTimeLimit`), a new `BlockReason` (e.g. `future`) and its line in "Zapis gry" (`src/core/saveHealth.ts`), interplay with `replaceGate` and `Autosaver.replace`; whether a `controllerchange` signal in `src/pwa/registerServiceWorker.ts` should mark this build stale; whether `skipWaiting`/`clientsClaim` in `vite/config.shared.mjs` should change (removing them changes the update model "silent update at the next launch").
  - e2e seams needed (hook build only, marker in `vite/e2eHookGuard.mjs`): a stall of many files (today `?e2eArt=stall` with `maxRetries: 0` and room only), a newer stored save written under a running tab.
- Follow-ups listed in `change.md` (table "Open follow-ups…"); this change's own `follow-ups/review-fixes.md` does not exist yet — the plan/review steps create it with the audit findings not in scope (A-3..A-11, V-*, P-1..P-4, P-6..P-8) and mark the `BootScene.create` font-promise hand-over follow-up as already closed.
- Carried risk: the v2-build-tab-over-v3 window from builds already shipped cannot be closed by code (see `change.md` table, row P-5 SW).

## 6. Autonomous decisions

- **Next step `/10x-research`**: fixed by the step prompt; the change needs reading of Phaser loader internals, the SW and the IndexedDB write path before planning. Would change: nothing (run order).
- **Font limit in scope** as part of A-1's total limit. Rejected: a separate `FontFace` timer as the first choice. Why: one total limit ends the wait for any file type. Would change: research showing the loader cannot be ended while the font promise is pending.
- **P-5 scoped to "from this build on"**. Rejected: claiming the old-tab case is closed. Why: old builds' JS has no guard. Would change: evidence that the shipped build re-reads the version before writing (it does not on 6f5644c).
- **Save format v3, guard on `version` only**; same-version two-tab ordering stays a follow-up. Rejected: a write counter / tab id (v4, forbidden in this run). Would change: research proving a sound guard needs a saved field (then stop at an open PR per the contract) or the maintainer widening scope.
- **Title and artifacts in English**, commit message as given by the step prompt. Would change: a maintainer rule for Polish change artifacts.
