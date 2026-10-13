<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Zadania z rysunkami w kodzie dla E3–E4 (zegar, linijka, klocki, diagram) i tryby `select`/`drag`

- **Plan**: context/changes/drawn-widget-tasks-e3-e4/plan.md
- **Mode**: Deep (claims checked directly against the code in this session; no sub-agent)
- **Date**: 2026-10-13
- **Verdict**: REVISE → SOUND after triage (all fixes applied in plan.md)
- **Findings**: 0 critical, 5 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3, F4) |
| Plan Completeness | WARNING (F1, F5) |

## Grounding

22/22 paths ✓ (`src/core/tasks/types.ts`, `src/core/round/{view,pick,unique,hints}.ts`, `src/core/tasks/bounds.ts`,
`src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`, `vite/e2eHookGuard.mjs`, the six pinned
test files, `tests/e2eHookGuard.test.ts`, `src/ui/widgets/SolutionSteps.ts`, `src/core/longPress.ts`, `src/core/roomHit.ts`),
symbols ✓ (`playable`, `roundView` `input: task.choices ? …`, `distinctTasks` keyed on `prompt`, `generateTask` early return
for non-number answers, `leaksAnswer`, `UNBOUNDED_TYPES`, `captureFirstWrong`, `validExample`, `E2E_HOOK_MARKERS`,
`holdTouch`, `pl.round.okKey`, Phaser 4.2.1 `Pointer#wasCanceled`; `REGISTRY_KEYS.forcedSkills` correctly absent — new),
empty steps E3.3/E3.4/E3.5/E4.3/E4.7 ✓, brief↔plan ✓ (brief updated to 11 phases).

Claims verified against code:
- Ordering rule holds: e2e `answerRight`/`answerWrong` (`tests/e2e/support/hook.ts`) compare tile values with `===`
  regardless of type, so string tiles (CLOCK „15.00”, DATA labels) and numeric keypad answers (LENGTH, PLACE_VALUE) are
  already answerable when phase 6 makes them playable; `select` enters `playable` together with its helpers (phase 7),
  `drag` together with its helpers (phase 9). `narrator.spec.ts` branches on `task.input === 'tiles'` only — safe.
- `?e2eSkills` seam follows the `e2eStars`/`e2eSave` pattern (`src/main.ts` reads behind `__E2E_HOOK__`); `checkE2EHook`
  searches marker text in every production chunk, so the registry key must not be named `e2eSkills` — the plan's
  `forcedSkills` is right; `E2E_REQUIRED_MARKERS = [...E2E_HOOK_MARKERS]` is satisfied because `e2eHook.ts` carries the
  URL key. Phase 7 also greps `dist/_app/*.js`.
- Break patches of phase 11 break rules (empty selection submitted, cancel mapped to up, picture hidden, drop outside adds),
  not labels; all production-code-only.
- Follow-ups with `Trigger: S-13` (archive `2026-10-12-task-round-stars`: select/drag UI, mode on Task, snapshot answer
  copy; archive `2026-10-12-generators-remaining-stages`: BONDS/CHOOSE_OP) — three included, one re-triggered with reason ✓.
- Drivers: tdd 1, 2, 3, 8 (no implementation exists, failing tests lead); impl 4, 5, 6, 7, 9, 10; e2e 11 after the seam
  sweep (phase 10) on features built in 4–10 ✓.
- Product decisions: CLOCK notation „15.00” follows ZADANIA § 4 (the kit's „3:30” is a reference caption) — kept,
  `[human]` 4.6; scope split to S-13b and DATA in scope are justified (grid family is one widget, E3.4 would stay empty
  without DATA) — kept, `[human]` 6.9; DATA 3–4 bars, values 1–10, PLACE_VALUE E3 ≤ 30 and E4 ≤ 999 (read) match ZADANIA
  ranges ✓.

## Findings

### F1 — Phases 5 and 8 too heavy for one fresh agent

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: old Phase 5 (`BaseTenBlocks` + `BarChart` + data E3/E4) and old Phase 8 (`drag` + docs + seam sweep)
- **Detail**: Old phase 5 mixed two unrelated risk classes — two canvas widgets and the only step-order change (≈15 new
  skills, six pinned unit test files with a hand-derived calendar oracle, two e2e specs through the request-file round
  trip). Old phase 8 carried a widget, raw pointer wiring in `TaskScene`, two CDP helpers, data, the follow-ups file,
  `CLAUDE.md`, design-gap reconciliation and the seam sweep over eight phases. Both comply with "≤ 2 new UI components"
  but not with "sized for one fresh agent"; a request-file BLOCKED in the data half would also hold the widget commit.
- **Fix (applied)**: split into 11 phases — 5 `BaseTenBlocks`+`BarChart` (impl), 6 data + pinned tests + e2e (impl),
  7 `select`, 8 reducer (tdd), 9 `drag` (impl), 10 documentation + follow-ups + seam sweep (impl), 11 e2e. Widgets land
  before data, so no placeholder picture is ever playable. All phase references, request/patch file names
  (`e2e-request-p6/p7/p9/p11.md`, `e2e-break-p11a…d.patch`), `[human]` row ids (4.6, 6.9, 9.8, 10.6, 10.7), decisions 1,
  5, 7, 10–13, brief and roadmap row renumbered; Progress rebuilt 1:1 with Success Criteria (63 rows).
  - Strength: each phase has one risk class and one proof; seam sweep is the last impl phase.
  - Tradeoff: two more agent sessions.
  - Confidence: HIGH — mapping check passes per phase.
  - Blind spot: none significant.
- **Decision**: FIXED

### F2 — Phase 5 (now 6) deliberate break proves nothing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 Success Criteria (old 5.4)
- **Detail**: The break "changed `minStartSteps` → start test red" cannot prove the oracle pins the new data:
  `tests/curriculumStart.test.ts` uses its own `RULES` constant, so changing `balance.curriculum.minStartSteps` keeps it
  green, and changing `RULES` in the test proves only the test.
- **Fix (applied)**: break = E3.4 back to `skills: []` → `playableSteps` E3 and the `ORACLE` E3 row go red; meta-check
  names why the data, not `RULES`, is broken. Also: research hand-derived only October, so the phase computes the other
  months by hand and records them in a test comment.
- **Decision**: FIXED

### F3 — Follow-ups triggered by files this slice touches are not handled

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phases 2, 4, 1, 10
- **Detail**: Open follow-ups whose trigger is a file change this plan makes: `tests/hints.test.ts` `try/catch { continue }`
  hides an always-throwing generator (`Trigger: next change to tests/hints.test.ts`, phase 2 edits it); solution step
  indicator (`Trigger: the next change to SolutionSteps`, phase 4 changes `SolutionSteps.show`); „Oblicz.” before
  comparisons (`Trigger: S-17 or the next change to drawPrompt`, phase 1 widens `drawPrompt`); audit M-1, M-2, M-13, H-3,
  H-4 (`Trigger: next change to TaskScene / narrator`).
- **Fix (applied)**: phase 2 counts the skips in `tests/hints.test.ts`; phase 10 closes or explicitly re-triggers the
  other three with a reason (phase 4 only moves the solution rect; phase 1 only widens types; read the audit items and
  close any whose code the slice touched).
- **Decision**: FIXED

### F4 — CLOCK hour domain undefined for `read`/`later`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 § CLOCK; Critical Implementation Details (`TaskVisual.clock` hour 0–23, `formatTime(0,30)='0.30'`)
- **Detail**: A 12-hour dial cannot tell 3.00 from 15.00 or 0.00 from 12.00; the plan never said which hours `read` and
  `later` draw, nor what `later` returns at the 12 boundary (12.00 vs 0.00). An implementer reading "hour 0–23" could emit
  „0.00” for a dial at twelve, or a 24-hour answer to a 12-hour question.
- **Fix (applied)**: `read`/`later` draw 1–12, twelve is „12.00”, `later` wraps modulo 12 into 1–12 (10.00 + 2 → 12.00,
  11.00 + 2 → 1.00); `h24` draws 13–23 with „po południu” in the prompt and the „3.00 instead of 15.00” distractor
  mandatory; the 1000-draw test asserts `read`/`later` never give „0.00”.
- **Decision**: FIXED

### F5 — Two departures from ZADANIA have no `[human]` row

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: old 8.11 (now 10.6)
- **Detail**: ZADANIA § 4 CLOCK gives the 24-hour example as „15.00 to która na tarczy?” (time → dial); the plan goes dial
  → „15.00”. ZADANIA PLACE_VALUE lists hundreds dragged onto the tray; the plan builds only up to 99 (E4.8 read only).
  Both are defensible (no dial tiles widget; decision 6) but neither was named for the maintainer.
- **Fix (applied)**: row 10.6 now names both, next to „no hand drag”, tap-to-add and the parent preview without a picture.
- **Decision**: FIXED

### F6 — `passWelcome` already takes a query

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 11 § 1, Phase 7 one-off e2e run
- **Detail**: `tests/e2e/support/welcome.ts` `passWelcome(page, query?: Record<string, string>)` already forwards URL
  parameters; the planned change to `welcome.ts` is unnecessary.
- **Fix (applied)**: phase 11 leaves `welcome.ts` unchanged; phase 7's one-off run edits only the spec call.
- **Decision**: FIXED

### F7 — Forced skills must be playable

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details — `?e2eSkills`
- **Detail**: Between phases 7 and 9 a forced `drag` id would reach `TaskScene.render` and its temporary `throw`.
- **Fix (applied)**: the seam forces the list only when every id exists in the stage **and** is `playable`.
- **Decision**: FIXED

### F8 — Patch p11d overlaps the phase 8 unit tests

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 11 deliberate break `e2e-break-p11d.patch`
- **Detail**: "drop outside the mat adds a block" is a reducer rule the unit tests already pin; the e2e break proves only
  that the scene routes events through the reducer.
- **Fix (applied)**: meta-check sentence added; patch kept (cheap, proves the wiring).
- **Decision**: FIXED

### F9 — `select` gives no parent example and repeats its prompt

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks
- **Detail**: `captureFirstWrong` (`src/core/round.ts`) stores only number/string, so a wrong `select` set never becomes a
  `MistakeExample`; the `select` prompt is fixed and has no visual, so `distinctTasks` cannot tell two `select` tasks apart
  (same as any fixed prompt today; `validExample` in `src/core/save.ts` is unaffected).
- **Fix (applied)**: Known risks entry; the parent-preview follow-up in phase 10 covers the `select` example.
- **Decision**: FIXED

## Triage summary

Fixed: F1–F9 (9). Skipped / accepted / dismissed: none. Verdict after fixes: SOUND.

VERDICT: PROCEED — approach sound and claims hold against the code; phases rebalanced to 11 (data change and seam sweep isolated), ordering rule, seam and drivers verified, all warnings fixed in plan.md.
