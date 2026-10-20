<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Boot limit counts only visible time, "Ups!" card with a code, no site-data advice after NewerSave

- **Plan**: context/changes/audit-boot-hidden-tab/plan.md
- **Mode**: Deep (claims checked directly against the code, no sub-agent)
- **Date**: 2026-10-20
- **Verdict**: SOUND after triage (REVISE before: 2 warnings on proof and lifecycle)
- **Findings**: 0 critical, 3 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS (Z-8 extension justified, F4) |
| Architectural Fitness | PASS |
| Blind Spots | WARNING → fixed (F1, F2, F3) |
| Plan Completeness | PASS (F6 command fixed) |

## Grounding

Paths 8/8 exist (`src/core/bootLimits.ts`, `src/scenes/BootScene.ts`, `src/core/artHealth.ts`, `src/ui/dom/errorCard.ts`,
`src/core/tasks/generateTask.ts`, `src/core/tasks/visual.ts`, `src/core/autosave.ts`, `src/ui/dom/saveSummaryView.ts`);
symbols checked: `bootLimitDue`/`bootLimitWait`/`bootLimitSchedule`, `arm`/`clearTimers` in `BootScene.preload`
(cut guard has no phase check, only `bootLimitDue`), `publish` fields, `mountErrorCard(parent, buildId, onRestart)` one
caller in `src/main.ts`, `pl.saveFailed.detail` = `Kod: … · Wersja …` (contains `Wersja <id>`, so the current
`getByText(pl.errorCard.build(build))` substring match stays green in phase 5), `generateTask` try covers only the
generator, `assertPool`/`lineTicks` called only in widgets with `ART_LIMITS` from `src/data/measures.ts` (core may import
it), `pictureLayout` call at `TaskScene` drawPrompt lacks `skillId` (the other call has it), `replace` catch
`blockedBy ??= 'newer'` with `writesOff` = `blockedBy !== null` (so a later refusal never calls `onBlocked`),
`failureText` forced branch → `siteDataAdvice`. brief↔plan ✓. Progress↔phase ✓ (44 rows, one `## Progress`, every phase
has a `Driver:` line). Save format v4 untouched by every phase ✓.

Drivers: 1, 3, 4, 6 `tdd` (absent pure branches with exact oracles) ✓; 2, 5, 7 `impl` (scene/DOM glue, docs) ✓;
8, 9, 10 `e2e`, after the seam sweep, each on a feature an earlier phase builds ✓. The three e2e phases touch three
different spec files (`load-and-tab-guard`, `error-boundary`, `save-transfer-blocked`) with different setups, so no merge.

Seeds: `numberChoices` moves into the same `try` in the same order; `assertDrawable` consumes no rng. The existing case
"does not consume rng differently from the generator" in `tests/generateTask.test.ts` is the oracle (F6).

## Findings

### F1 — The phase 8 deliberate break cannot turn red

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 (2.3), Phase 8 (8.1)
- **Detail**: the break "drop the clear-on-hide" leaves the hidden-aware guard in the cut callback and in `arm`'s early-fire re-check; the timer fires, the rule says "not due", it re-arms — the spec stays green (A-2 itself names the guard as the fallback). So the e2e would not prove the visible-time rule. The break that proves the RULE is removing the subtraction (scene passes `hiddenMs` 0).
- **Fix**: 2.3 and 8.1 now name the break "the scene passes `hiddenMs` 0 to `bootLimitDue`/`bootLimitWait`" and say the clear-on-hide drop is not a valid break.
- **Decision**: FIXED

### F2 — Lifecycle leaves a start-hidden tab and a duplicate "visible" event open

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details — visible-time lifecycle
- **Detail**: the plan seeds the span from `document.hidden` but still arms at `preload` (a hidden start would poll through `arm`'s re-arm while hidden), and "on show: re-arm" without clearing first or checking that a span closed lets a visible→visible event (duplicate event, the e2e fake) add a second timer per limit. The cut callback has no phase guard, so a double cut timer relies on `COMPLETE` clearing it synchronously.
- **Fix**: lifecycle now says: no arm at `preload` when hidden; show acts only when a span closed; `clearTimers()` before re-arming; at most one pending timer per limit.
- **Decision**: FIXED

### F3 — Phase 8 fires an open follow-up on `load-and-tab-guard.spec.ts`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 8, Phase 7 follow-ups
- **Detail**: `context/archive/2026-10-16-stale-tab-and-health/follow-ups/review-fixes.md` "Isolation-only red of the `load-and-tab-guard` e2e (#2, P-5)", Trigger: "the next change to `tests/e2e/load-and-tab-guard.spec.ts`". Phase 8 adds a test there and runs the file alone (8.2), so the old red may reappear; the plan did not mention it.
- **Fix**: 8.2 says the spec must be green run alone, else fix in phase or record evidence; phase 7 follow-ups list closes or restates the item.
- **Decision**: FIXED

### F4 — Z-8 goes past the literal scope (refuseWrites, unforced deviceNewer)

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Lean Execution
- **Location**: Phase 6, A-5, A-6
- **Detail**: scope § 2 Z-8 asks only "never advise siteDataAdvice after a forced replace refused with NewerSave". The plan also (a) maps an unforced `NewerSave` to `deviceNewer` and (b) calls `refuseWrites`. Verified in code: (b) fixes a silent block — `blockedBy ??= 'newer'` makes `writesOff()` true, so no later write runs and `onBlocked` is never called; the child plays on with no saves and no card. (a) is one ordering line in the same function; the plain text would invite a futile retry (gate now `Blocked`). Both stay in the Z-8 code path, no new surface, already narrowed to `NewerSave` (A-6, `writeVerdict` refuses other writers only in `mode 'normal'`). Kept; recorded in `## Known risks`.
- **Decision**: ACCEPTED (justified)

### F5 — `assertDrawable` next to the existing `validateVisual`

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4
- **Detail**: `validateVisual` (`src/core/tasks/visual.ts`) already checks the same `ART_LIMITS`, but also content rules the widgets tolerate; calling it at runtime would turn content-only problems into throws. A thin wrapper over `assertPool`/`lineTicks` is the right size.
- **Fix**: `## Known risks` states the wrapper stays pool/tick only.
- **Decision**: FIXED

### F6 — Phase 4 seed check names a glob that matches nothing and a wrong oracle

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 (4.2, 4.3)
- **Detail**: `tests/*Generator*.test.ts` matches no file (zsh errors on it); generator suites call generators directly and cannot see the `generateTask` rng order. The oracle is `tests/generateTask.test.ts` "does not consume rng differently from the generator".
- **Fix**: 4.2 uses `git diff main -- tests/generateTask.test.ts tests/contentInvariants.test.ts tests/solvableInMode.test.ts | grep '^-[^-]'`; 4.3's break names that case.
- **Decision**: FIXED

### F7 — The `newer-replace` seam is probably not needed

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 10
- **Detail**: the `newer` store (`src/testing/e2eHook.ts`) stores `SAVE_VERSION + 1` on the first write and refuses the next; `#2 P-5` shows that first write happens at start and only a state change triggers the next. A reset opened before answering any task reaches `store.write(…, 'replace')` → `NewerSave`.
- **Fix**: phase 10 notes this; the conditional seam stays as a fallback.
- **Decision**: FIXED

## Scope check

H-1, I-1 (+ skill id: C-1 one argument, C-2 `assertDrawable`, C-3 move into the `try`, I-3 name copy — all cheap, no
rng change) and Z-8 only. H-6 and every other MEDIUM/LOW row deferred with triggers (phase 7). Open follow-ups whose
trigger names this area: TXT-06 (included), L-S3 (not fired: listener in `BootScene`), stale-tab-and-health G-3/P-*
and final-art-p2 F4 (closed per research), S12-03/S12-11/S12-13 (not fired: no new replace path or dialog step;
restated), isolation-only red (F3, now included). Save format stays v4.

VERDICT: PROCEED — approach sound and in scope; the proof break, the hidden-tab lifecycle and the fired e2e follow-up are fixed in plan.md
