# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The visual gate wrote this handoff: row 3.3 (slow line on the loading screen) and the `newer` "Zapis gry" state were captured at 1440 and 1024 on the code of `5a11370`, no fix needed, `VISUAL: PASS`. Next is the archive; the two `[human]` rows stay open on purpose.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phases `0c31db4`, `79023af`, `06b20bb`, `1347887`, `731bcb0`, `9ee4570`, `949aab0`; review fix `5a11370`; docs `41e7bb7`; then this docs commit (visual gate) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 2 (`grep -c '^- \[ \]' plan.md`): 2.5 [human], 7.7 [human] |
| Working tree | clean after the docs commit (`tests/e2e/visual.local/` deleted; `dist-e2e/`, `test-results/` are gitignored build output) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/load-and-tab-guard/reviews/visual-review.md` | visual review, ends `VISUAL: PASS — …` |
| `context/changes/load-and-tab-guard/screenshots/README.md` | route and table of frames |
| `context/changes/load-and-tab-guard/screenshots/{desktop,tablet}-v01-loading-slow.png` | loading screen with the slow line (row 3.3) |
| `context/changes/load-and-tab-guard/screenshots/{desktop,tablet}-v02-newer-save.png`, `-v03-newer-save-actions.png`, `-v04-newer-reset-dialog.png` | "Zapis gry" under `?e2eSave=newer`, the save buttons, the reset dialog with `deviceNewer` |
| `context/changes/load-and-tab-guard/plan.md` | row 3.3 ticked |
| `context/changes/load-and-tab-guard/follow-ups/review-fixes.md` | + spec (c) ordering race, with Trigger |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` (HEAD `41e7bb7`, after `5a11370`) |
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | `e2e hook: present (2 chunks checked)` |
| throwaway spec, `npx playwright test --config=<abs visual.local config> --workers=4` against preview on 4399 | v01 2/2 passed (hook: `loading.phase === 'slow'`, `screen === 'loading'` at the shot, then `welcome`); newer: frames taken at both widths after `save.blockedBy === 'newer'`, panel text equal to `pl.settings.saveOff.newer` + `Kod: NewerSave`; the last debug log line failed after the dialog closed the panel (no product assertion failed) |
| Hand-checked geometry | 1440: bar top 480, line top 555, line ≈ 444 px < bar 600 px; 1024: bar top ≈ 405, line ≈ 459, line ≈ 315 px < bar 427 px (arithmetic in visual-review.md) |
| Local gate | not re-run: no code changed in this step (impl-review observed green on `5a11370`: lint, typecheck, `npm test` 2970 = baseline 2925 + 45, sample E1–E6, build, e2e 104 = baseline 101 + 3; inherited, unverified here) |
| Port 4399 | stopped (no LISTEN) |

## 4. Next command

`/10x-archive load-and-tab-guard`

## 5. Open

- **Human checklist:** 2.5 Android throttled start (≤ ~45 s, stand-ins, no error card); 7.7 iPad WebKit (cut ~45 s, line ~8 s, no card).
- **Risks carried:** `guardedPut` (`src/storage/idb.ts`) `preventDefault` on a failing `get` unverified in WebKit; Phaser internals (`src/scenes/loaderCut.ts`, tripwire `tests/phaserLoaderPin.test.ts`); guard only from this build on.
- **Possible e2e flake:** `tests/e2e/load-and-tab-guard.spec.ts` (c) — the session's first write can absorb the answered task, so no refused write follows within the 5 s poll (seen once in the visual capture); follow-up with trigger in `follow-ups/review-fixes.md`.
- **Design gaps:** 112, 113 (no change in this step).
- **Follow-ups:** `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **Playwright fallback, not Claude in Chrome.** Chrome cannot hold the font/WebP routes open (the loading state) nor do the 2 s touch hold on the canvas gear. Would change: a Chrome tool that can block requests and send touch holds.
- **Extra frames beyond the plan row** (v03 save buttons, v04 reset dialog) to answer "nothing else in the section contradicts it". Rejected: only v02 (the buttons and the dialog text would be unread). Would change: none.
- **Spec (c) race recorded as a follow-up, not fixed here.** It is a test-ordering issue seen once in a throwaway capture, not a product discrepancy; fixing it would touch a reviewed spec and need an e2e re-run in this docs step. Would change: (c) failing in a gate run (then fix per the follow-up).
- **No AskUserQuestion**; no code changed, so no `fix(...)` commit and no gate re-run.

### Previous step (impl review)

- **impl-review: no AskUserQuestion; triage in place.** F1 and F2 fixed (cheap WARNINGs), F3 to follow-ups, F4/F5 accepted. Would change: none.
- **F1 rated WARNING, not CRITICAL.** The write lands and `run`'s one retry made the forced replace succeed; no progress lost, but the error name and the retry were wrong. Chosen fix: drop `tx.onerror` (rely on `onabort` with `tx.error`). Rejected: filter `event.target === read` in `tx.onerror` (keeps the `UnknownError` rename of put errors). Would change: a browser where an unprevented request error does not abort the transaction.
- **F2: slow line at the existing `bar` text role (36 px)**, not a new `FONT_SIZES` role. Rejected: a new role (also needs a weight entry, no kit value). Would change: the author's loading art (S-16c) with its own type size.

### Earlier steps



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
