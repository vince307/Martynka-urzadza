# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The e2e step wrote this handoff for phase 7 (the last phase; spec ran under the orchestrator because Chromium cannot start in the sandbox). Rows 7.1-7.6 are ticked, 7.7 is [human]; the change is `implemented`. Next is the implementation review; do not edit production code before it.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phases 1-5 `0c31db4`, `79023af`, `06b20bb`, `1347887`, `731bcb0`, phase 6 `9ee4570`, phase 7 `949aab0`, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 8 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/load-and-tab-guard.spec.ts` | three tests: (a) #15 stalled files and a late font, cut and slow line; (b) #15 A-1 a file that answers after the cut does not start the game twice (first wait is an `expect.poll` with a 15 s timeout, the cut comes at 3 s); (c) #2 a newer save is not overwritten |
| `tests/e2e/support/hook.ts`, `playwright.config.ts` | helpers for the spec; spec added to `ROUND_SPEC` |
| `context/changes/load-and-tab-guard/e2e-request-p7.md`, `e2e/e2e-break-p7{a,b,c,d}.patch` | orchestrator run request and the four break patches |
| `plan.md`, `change.md` | rows 7.1-7.6 ticked, status `implemented` |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| `npm run lint` / `npm run typecheck` | pass / pass |
| `npm test` | 2969 passed, 160 files (baseline 2969, +0); `sample` E1-E6 0 violations |
| `npm run build` | passes, `e2e hook: absent (2 chunks checked)` |
| e2e spec (orchestrator-observed, not run by this step) | first run (a),(c) passed, (b) failed on the 5 s `screenIs welcome` wait; fixed with a 15 s `expect.poll`; rerun 3 passed |
| e2e full `--workers=4` (orchestrator) | 104 passed (baseline 101, +3) |
| Break p7a (`cutLoad` without the cut) | 2 failed ((a),(b)); reverted |
| Break p7b (no no-op `onProcessComplete`) | 3 passed; the documented plan-review F2 meta-check: in Chromium a late font is harmless without the guard, so p7b cannot turn red here (WebKit is the human row 7.7) |
| Break p7c (no slow line) | 1 failed ((a)); reverted |
| Break p7d (seam without the guard) | 1 failed ((c)); reverted |
| Ports 4397-4399 | free |

## 4. Next command

`/10x-e2e load-and-tab-guard phase 7` (phase 7, `Driver: e2e`)

## 5. Open

- **Reviewer rows:** 3.3 [visual], 3.4, 4.4, 5.4, 6.3. Manual-only: 2.5 Android throttled start; 7.7 iPad.
- **Visual gate observation:** the slow line "Jeszcze chwilka, wczytuję obrazki." renders much larger than the title width and wider than the bar (`LoadingScreen.slow`, text in `pl.loading.slow`); check at the visual gate.
- **Phase 7 (done):** p7b stays green in Chromium by design (F2); `load-and-tab-guard` is in `ROUND_SPEC`.
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
- **Phase 7 decisions:** the (b) wait was widened to 15 s by the orchestrator rather than moving the cut (the cut is a seam value, 3 s after load); tick of 7.1-7.5 rests on the orchestrator's observed runs, cited above. No AskUserQuestion; stop after phase 7.
