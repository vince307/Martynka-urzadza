<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Zdrowie zapisu widoczne dla rodzica, przyczyna nieudanego odczytu i naprawa nieznanego pokoju

- **Plan**: context/changes/save-observability-c1-c2/plan.md
- **Mode**: Deep (risky claims verified directly against the code on `feat/save-observability-c1-c2` @ `6e39d4d`; no sub-agent)
- **Date**: 2026-10-13
- **Verdict**: SOUND after triage (REVISE before: 1 critical fixed in plan)
- **Findings**: 1 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3 — fixed) |
| Plan Completeness | FAIL → PASS after F1 fix |

## Grounding

Paths 9/9 ✓ (`src/core/autosave.ts`, `src/main.ts`, `src/ui/dom/saveFailedCard.ts`, `settingsPanel.ts`, `progressView.ts`,
`src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`, `docs/design-gaps.md`; new files absent
as planned: `src/core/saveHealth.ts`, `src/ui/dom/saveHealthView.ts`, `tests/saveHealth.test.ts`). Symbols 10/10 ✓
(`loadSave` `catch {}`, `AutosaverOptions.blocked`, `block: () =>` ignoring the reason, `e2eSave`/`e2eSaveStore`,
`RoomScene` `room()`/`roomState()` on 6 call sites, `roomText`, `SALON_PLACEHOLDERS`, `balance.save.debounceMs`,
`UIScene.openSettings` returning without a learner, `E2E_HOOK_MARKERS` containing `e2eSave`). Brief ↔ plan ✓.
Progress ↔ phases ✓ (6 phases, 35 rows, 1:1 with Success Criteria; no checkboxes in phase bodies).
No `docs/reference/contract-surfaces.md`, no `context/foundation/lessons.md`.

## Run-specific checks

1. **No new path overwrites a good save.** Timeout → `unavailable` → `blockedBy: 'unavailable'` → saver blocked from
   creation; a late successful read is discarded inside `loadSave` and no writer exists for it. The orphan read gets
   `.catch` at race start (Critical Implementation Details) and phase 2 proves it with the file's existing
   `unhandledRejection` collector (`tests/autosave.test.ts` `beforeEach`). `writefail`/`hang`/`unavailable` are in-memory
   stores in `src/testing/e2eHook.ts`, selected only under `__E2E_HOOK__` (DCE; build guard + `grep -rl e2eSave dist/`).
   `repairCurrentRoom` runs only in the `loaded` branch, before `createGame` and the `changedata`/`setdata` listeners,
   copies every other room untouched (tests: `toBe` on input rooms, `structuredClone` before/after). `blocked` → `blockedBy`:
   callers are `src/main.ts` `start` and `tests/autosave.test.ts` `setup` (default `blocked: false`) plus the risk-#2 test
   `setup({ load, blocked: true })` — the latter was not named → F2. `block(reason)` callers pass only `'fatal'`.
2. **Save stays v1.** Status fields live only in `AutosaveStatus`. The fixture round-trip row (1.2) is real: checked now,
   `encodeSave(decodeSave(f))` deep-equals and JSON-string-equals both `save-v1.json` and `save-v1-fresh.json` (it is a
   regression lock that is green before the change, so it does not count toward 1.1 red-first).
3. **Audit findings ↔ phases.** C-1: phase 2 (name, warn) + 4 (card) + e2e (a). C-2: phase 1 (status) + 5 (panel) + e2e
   (c)(d). H-R3: phase 3 (repair unit + one resolver). M-R6: indirect via C-2 (F6). M-S5: phase 1. M-S4: phase 2 + e2e (b).
   M-R5/L-R10: phase 3 data tests over `ROOMS`. Out of scope: follow-ups with `Trigger:` in phase 5; two audit directions
   had none → F3.
4. **E2E not vacuous.** Three break patches are production-code edits (`main.ts` card branch, `main.ts` limit, `UIScene`
   `saveHealth`), each visible to named assertions; seams hook-build only; no `page.clock`; settings via the existing
   `openSettings` hold helper; no room switch used; each test = fresh Playwright context. But (a)/(b) named a helper that
   cannot work with a pre-game card → F1.
5. **Copy.** `pl.saveUnavailable` and `pl.settings` save lines are calm, adult-facing, no numbers, no technical names; the
   card shares `mountSaveFailedCard` (alertdialog, focus on „Graj dalej”, `booted.failed` check after it) — behaves like
   the unreadable card minus the export. Teacher-read rows 4.4 and 5.6, `[human]` 5.9/5.10 present.

Drivers: 1 tdd ✓, 2 tdd ✓, 3 tdd ✓ (core repair + data tests lead; scene resolver is glue under a grep criterion),
4 impl ✓, 5 impl ✓ (contains the seam sweep, last non-e2e phase), 6 e2e ✓ (after the sweep, risk #2, features from 2–5).
Sizes fit one fresh agent each; phase 5 is the largest (1 component + docs + sweep) but has no logic.

## Findings

### F1 — E2E (a)/(b) use `openWelcome`, which cannot pass a pre-game card

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 — Spec (a), (b)
- **Detail**: `tests/e2e/support/welcome.ts` `openWelcome` does `page.goto` then `waitForFunction('__martynkaE2E' in window)`
  and polls `screen === 'welcome'`. The hook is installed in `start` only after `createGame`, i.e. after „Graj dalej” —
  so with `?e2eSave=unavailable|hang` the helper times out (15 s) under the card. `passWelcome*` navigate again
  (`openGate` → `openWelcome`), so they cannot be used after the card either.
- **Fix**: (a)/(b) start with `page.goto('/?e2eSave=…')` like the „#2 FR-021” spec; after „Graj dalej” wait for the hook,
  `screenIs(page, 'welcome')`, tap an age in place (`targets(page).ages[0]`, age 6 = E1, no warm-up), poll `task`, then
  `openSettings`. (c) keeps `passWelcome(page, { e2eSave: 'writefail' })` (no card).
- **Decision**: FIXED (plan Phase 6 Changes §2)

### F2 — Existing risk-#2 autosave test migration not named

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 — Testy
- **Detail**: `tests/autosave.test.ts` `setup` defaults `blocked: false` and „after a ${load} load nothing is ever written”
  calls `setup({ load, blocked: true })`. Removing the option breaks typecheck there; the plan did not say how to migrate,
  and this is the test that proves an unread save is never overwritten.
- **Fix**: Phase 1 names the migration: default `blockedBy: null` + `now: clock.now`; the risk-#2 test → `blockedBy: load`,
  same assertions plus `blockedBy: load`; never weakened.
- **Decision**: FIXED

### F3 — Two audit directions without a follow-up

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 — follow-ups; What We're NOT Doing
- **Detail**: C-2's „`validateSave` returns the first bad field path to the log” is excluded (signature is the S-12
  import validator) and M-R5's runtime direction „throw (card) on an open panel without a placeholder” is not done; neither
  had a `Trigger:` follow-up. C-2's „gentle signal after N failures” is rejected by the run contract (nothing for the child)
  but unrecorded in the follow-ups.
- **Fix**: Phase 5 follow-ups list gains both with `Trigger:` lines and records the N-failures signal as closed-with-reason.
- **Decision**: FIXED

### F4 — Phase 4/5 „deliberate breaks” that stay unit-green prove nothing alone

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Plan Completeness
- **Location**: Phase 4 (4.2), Phase 5 (5.3)
- **Detail**: Honest by design: the rendered behaviour is proven by phase 6 patches p6 and p6c, which mirror these breaks.
  Kept; the implementer records them in handoff §3 as „unit-blind, proven in phase 6”.
- **Decision**: ACCEPTED

### F5 — The v1 fixtures already carry an unknown room

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Testy
- **Detail**: Both frozen fixtures have `currentRoom: "living"`, not in `ROOMS` (`FIRST_ROOM = 'salon'`). They are a free,
  real-shaped H-R3 input.
- **Fix**: Phase 3 tests add fixture → `decodeSave` → `repairCurrentRoom` → `salon`, `rooms.living` unchanged.
- **Decision**: FIXED

### F6 — M-R6 proven indirectly

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: End-State Alignment
- **Location**: Phase 6 (c); Known risks
- **Detail**: e2e (c) shows a failing write after the welcome, not after a purchase; the purchase uses the same
  `flush('now')` → `attempt`, so the status is identical. Recorded in Known risks.
- **Decision**: ACCEPTED

VERDICT: PROCEED — approach sound (status runtime-only, v1 intact, blocked reads never written over); 1 critical (e2e helper) and 2 warnings fixed in plan.md
