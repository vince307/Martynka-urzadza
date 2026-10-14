<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Zadania na siatce (kwadrat magiczny, kodowanie pól, obwody) i „ustaw zegar” przeciąganiem wskazówek

- **Plan**: `context/changes/drawn-grid-tasks-e3-e4/plan.md`
- **Mode**: Deep (claims checked in this session against the code by direct grep/read; no sub-agent, the risky claims were few and local)
- **Date**: 2026-10-14
- **Verdict**: SOUND after triage (REVISE before: 1 critical, 4 warnings, all fixed in plan.md)
- **Findings**: 1 critical, 4 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS (observation F6) |
| Architectural Fitness | WARNING → fixed (F3) |
| Blind Spots | WARNING → fixed (F2, F5) |
| Plan Completeness | FAIL → fixed (F1, F4) |

## Grounding

Grounding: 7/7 paths ✓ (`src/core/round.ts`, `src/core/tasks/validate.ts`, `src/core/tasks/registry.ts`, `src/core/round/pictureLayout.ts`, `src/core/tasks/generators/clock.ts`, `src/ui/widgets/TaskPicture.ts`, `tests/e2e/adaptive.spec.ts`), 9/9 symbols ✓ (`isCorrect` with `===`, `dragKinds(typeof task0.answer === 'number' …)` in `TaskScene.render`, `pointerupoutside` → `cancel` in `TaskScene.create`, `UNBOUNDED_TYPES`, `parseClockParams` h24 ⇒ minuteStep 60, `TASK_LAYOUT.drag.mat/ok/solutionLines`, `keypadSolution.picture` 768 × 190, `test.setTimeout(180_000)`, E5.12/E6.3 `skills: []`), brief↔plan ✓.

Structural: 12 `## Phase N:` blocks, each with `Driver:` + `Driver why:` first; 67 Progress rows map 1:1 to the Success Criteria bullets (counted per phase: 5,5,5,4,7,7,5,7,6,6,5,5); no checkboxes outside `## Progress`.

Drivers: 1–4 `tdd` (pure core; `isCorrect` exists but is wrong for arrays, `dragMode`/`canonicalInput`/`clockSet`/new generators do not exist — failing tests lead) ✓; 5–10 `impl` (widgets, data, scene glue, docs) ✓; 11–12 `e2e` after the seam sweep (phase 10), for browser-level risk #11 on features built in 5–8 ✓.

Triggered follow-ups (`Trigger:` naming S-13b): archive S-13 "PUZZLE_GRID, GRID, PERIMETER and set the clock" → in scope; "BONDS with pairs and CHOOSE_OP with a picture. Trigger: S-13b or S-14" → deferred to S-14d (justified: E1 gestures, S-14 already assigned them there; trigger moved in phase 10); art-stand-in "S13-01..S13-14 … Trigger: the next select/drag skill or S-13b" → S13-01..04, 07, 08 in phase 1/4, S13-09/05/06/11..14 deferred with triggers (phase 10). Also the conditional S-13 follow-ups (select/drag picture area, `pointerupoutside` unit test, `adaptive.spec` time, O1/O2 keypad picture) are each covered by a phase.

Product decisions vs PRD/ZADANIA: E4.3 "set" quarter-only answers with a 5-minute snap (ZADANIA E4 "minuty co 5" stays covered by the existing read skills), hour hand picked separately but drawn coupled, GRID 5 × 4 instead of the kit's 8 × 5, ranges where ZADANIA is silent — none clearly wrong for a grade-3/4 child on a tablet; all named in `[human]` 10.6 (now also the unlock-threshold rises on live saves, F5) and 8.7 (tablet gesture). FR-014 "majority" vs `ceil(0.5·n)` left as existing behaviour (stated in "What We're NOT Doing").

## Findings

### F1 — Phase 2 leaves typecheck red: `TaskPicture` switch is exhaustive

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Rodzaje rysunków
- **Detail**: Phase 2 adds `cells`/`grid`/`figure` to `TaskVisual`, but `src/ui/widgets/TaskPicture.ts` `show` ends its `switch (visual.kind)` with `const unreachable: never = visual;`. The widgets arrive only in phases 5–6, so phase 2 (and 3, 4) could not pass "Pełna bramka lokalna zielona" — a phase that is not independently green.
- **Fix**: Phase 2 adds temporary `case 'cells' | 'grid' | 'figure'` in `TaskPicture` that draw nothing (`this.drawn = null`), replaced by widgets in phases 5–6 (phase 5's typecheck break still works).
- **Decision**: FIXED (plan.md Phase 2 Contract)

### F2 — Where the clock snap comes from per task is unspecified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details (Zegar), Phase 4 §2
- **Detail**: The reducer takes `rules.snapMinutes` (60 or 5) and `canonicalInput` needs `reachableTimes(snapMinutes)`, but the task carried only `{ kind: 'clock', hour, minute, set: true }` — no field tells the scene, the solvability test or the hook which snap applies (E3 60, E4 5). An implementer would guess (from the skill id? from `balance`?), and phase 12 break p12b presupposes a per-task value.
- **Fix**: The set visual carries `snap: 60 | 5` (60 for `minuteStep` 60, else 5); scene, `canonicalInput` and hook read it.
- **Decision**: FIXED (Critical Implementation Details + Phase 4 §2)

### F3 — `dragMode` in `core/round` but called by `validateTask` in `core/tasks`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 1 §2–3
- **Detail**: Phase 1 makes `validateTask` (`src/core/tasks/validate.ts`) flag a `drag` task without a known branch, i.e. it needs `dragMode`, planned at `src/core/round/dragMode.ts`. Today `core/round` imports from `core/tasks` (`hints.ts`, `artFilter.ts`) and nothing in `core/tasks` imports `core/round` — the plan would reverse the dependency.
- **Fix**: `dragMode` lives in `src/core/tasks/dragMode.ts`; round, validator and scene import it from there.
- **Decision**: FIXED

### F4 — Phase 6 deliberate break relies on a pure function no change creates

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 — Widżet `FigureGrid`
- **Detail**: Criterion 6.3 says the break turns red "test geometrii podpisów (czysta funkcja rozmieszczenia w `src/core/round/`)", but Changes Required lists only `FigureGrid.ts`, `TaskPicture.ts`, data and pinned tests — no such function or test, so the break would have nothing to turn red, and the 768 × 190 / cell ≥ 36 px rule would live in the widget untested.
- **Fix**: Add `figureLayout(visual, rect)` in `src/core/round/figureLayout.ts` + `tests/figureLayout.test.ts` (labels outside at edge midpoints, cell ≥ 36 px in 768 × 190, nothing outside the rect); the widget draws its result.
- **Decision**: FIXED

### F5 — `[human]` row omits the unlock-threshold rises on live saves

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 10 Manual 10.6
- **Detail**: Thresholds rise for learners saved on E3.3, E3.5, E3.7, E3.11, E4.7 and E6.1 now unlocks E6.3 instead of E6.4 (plan table, Migration Notes). It is a product decision the maintainer has not seen; only the PR body mentioned it.
- **Fix**: 10.6 (phase block and Progress row) names the threshold rises on live saves.
- **Decision**: FIXED

### F6 — `select`-with-picture layout has no consumer; phase 4 is the heaviest core phase

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 4 §3
- **Detail**: No `select` skill has a `visual` today (E1.6, E3.7 select skills draw nothing), so the select branch of `pictureLayout` closes the S-13 follow-up speculatively; cheap (one layout test), kept. Phase 4 bundles reducer, `set` variant, spoken text, layout and `canonicalInput` — all pure and test-led, within one agent but tight.
- **Fix**: Recorded in `## Known risks` (continuation rule for phase 4, follow-up path for the select area).
- **Decision**: ACCEPTED (Known risks)

### F7 — Phase 7 break proves only the hook ↔ helper type contract

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 Success Criteria
- **Detail**: Already stated in the plan (meta-check); the canvas behaviour of the clock branch is proven only in phase 12 (p12a), and between phases 8 and 12 `adaptive.spec`/`first-launch.spec` exercise it through `setClock`. Acceptable ordering under the contract rule (helpers before data).
- **Decision**: ACCEPTED (no change)

VERDICT: PROCEED — approach sound and drivers right; one critical (phase 2 would break typecheck through `TaskPicture`'s exhaustive switch) and four warnings fixed in plan.md, product decisions named in `[human]` 8.7/10.6.
