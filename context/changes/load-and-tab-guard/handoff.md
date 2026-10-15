# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The implementation review wrote this handoff: full plan reviewed, two WARNINGs fixed in `5a11370`, `MERGE: CLEAR`. Next is the visual gate (row 3.3): the slow line was resized in this step, so the screenshot must be taken on `5a11370` or later, not reused from earlier.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | phases `0c31db4`, `79023af`, `06b20bb`, `1347887`, `731bcb0`, `9ee4570`, `949aab0`; review fix `5a11370`; then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 3 (`grep -c '^- \[ \]' plan.md`): 2.5 [human], 3.3 [visual], 7.7 [human] |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/load-and-tab-guard/reviews/impl-review.md` | review report, verdict APPROVED, ends `MERGE: CLEAR — …` |
| `src/storage/idb.ts` (`guardedPut`) | fix F1: no `tx.onerror` (the prevented read error bubbled to it and rejected a landed write; put errors were renamed `UnknownError`) |
| `tests/idbStore.test.ts` | new test "a prevented read error that bubbles to the transaction does not reject the write" |
| `src/ui/widgets/LoadingScreen.ts` (`slow`), `src/data/layout.ts` (`LOADING_LAYOUT.slow.maxWidth`), `docs/design-gaps.md` (row 112) | fix F2: slow line at `textStyle('bar')` 36 px, centred, wrapped at the bar width 800 |
| `context/changes/load-and-tab-guard/plan.md` | reviewer rows 1.4, 2.4, 3.4, 4.4, 5.4, 6.3 ticked |
| `context/changes/load-and-tab-guard/change.md` | `impl_reviewed`, updated 2026-10-16 |
| `context/changes/load-and-tab-guard/follow-ups/review-fixes.md` | + F3 (slow timer asks the rule with a constant), with Trigger |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| lint / typecheck | pass / pass |
| `npm test` before the fix | 2969 passed (baseline 2925, +44) |
| `npm test` after `5a11370` | 2970 passed (baseline 2925, +45) |
| deploy and ops shell tests; `sample` E1–E6 | pass; 0 violations |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `stallall`/`E2E_BOOT_LIMITS` absent from `dist/` |
| `npx playwright test --config=<abs> --workers=4` on `5a11370`, run by this step (Chromium launched) | 104 passed (baseline 101, +3) |
| F1 RED → GREEN | new test failed with `UnknownError: failed` from `tx.onerror` before the fix; green after |
| Re-executed break 5.2 (`write` back to `set`) | 2 red (`B v4, A v3 refused`, `refusal is not retried`); restored. Meta-check: two stores on one fake-indexeddb database prove the read inside the transaction |
| RED evidence phases 1, 4, 5 | quoted in handoffs `71337e3`, `309aede`, `80892a4` (assertion failures) |
| Fixtures / save format | `git diff --stat main..HEAD -- tests/fixtures vite deploy` empty; `SAVE_VERSION` 3 |
| Ports 4397–4399 | free |

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- **Visual gate row 3.3:** the loading screen under `?e2eArt=stallall` with a hanging file, 1440 and 1024, on `5a11370`+: the slow line ("Jeszcze chwilka, wczytuję obrazki.", `LoadingScreen.slow`) under the bar, smaller than the title, within the bar width.
- **Human checklist:** 2.5 Android throttled start (≤ ~45 s, stand-ins, no error card); 7.7 iPad WebKit (cut ~45 s, line ~8 s, no card).
- **Risks carried:** `guardedPut` `preventDefault` on a failing `get` unverified in WebKit; Phaser internals (`loaderCut.ts`, tripwire `tests/phaserLoaderPin.test.ts`); guard only from this build on.
- **Design gaps:** 112 (row text updated), 113.
- **Follow-ups:** `follow-ups/review-fixes.md` (now including impl-review F3).

## 6. Autonomous decisions

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
