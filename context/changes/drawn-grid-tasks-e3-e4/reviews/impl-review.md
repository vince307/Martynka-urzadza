<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zadania na siatce (kwadrat magiczny, kodowanie pól, obwody) i „ustaw zegar” przeciąganiem wskazówek

- **Plan**: `context/changes/drawn-grid-tasks-e3-e4/plan.md`
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- **Date**: 2026-10-14
- **Verdict**: NEEDS ATTENTION before triage → all warnings in content and the scene fixed in this step (`fix(drawn-grid-tasks-e3-e4): poprawki z przeglądu implementacji`); the rest are follow-ups with triggers
- **Findings**: 0 critical, 6 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING (F3 ranges drifted from the plan; fixed) |
| Scope Discipline | PASS |
| Safety & Quality | WARNING (F4 fixed, F5 follow-up) |
| Architecture | PASS (`src/core` pure, `dragMode` in `core/tasks`, boundaries lint-clean; O2) |
| Pattern Consistency | WARNING (O2) |
| Success Criteria | PASS (suites re-run here, breaks re-executed; F6 progress row annotated) |

## Verification observed in this step

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, OK |
| unit gate (`npm test` + deploy tests + `sample` E1–E6) | before fixes 2222 passed = baseline 1927 + 295; after fixes 2223 (+1: E5.12 side-in-table test; the other new checks are assertions inside existing tests) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (full, before the fixes) | 63 passed (4.8 min) = baseline 57 + 6 (`grid-tasks` 3, `clock-set` 3) |
| `npx playwright test` (full, after the fixes) | 63 passed (4.3 min) = 57 + 6 |
| Re-executed break (phase 1, tdd) | `isCorrect` without the array branch (`src/core/round.ts`) → `tests/solvableInMode.test.ts` "is right in any order when the task has no check" red: `expected 'second' to be 'done'`; restored, `git diff` empty. Meta-check: the cross-skill solvability sweep stays green under this break because every `select` skill in the data carries `check`; the dedicated no-check case is what guards it — real assertion through the round state machine. |
| New RED → GREEN (this step) | 5 tests red before the content fixes (magic-square gap line, E3.3/E3.11 set hints ×2, magic 15/30, E5.12 side ≤ 10), green after; hint break re-executed (`clockSetHandsHint` for snap 60 → 2 red) and restored |
| Save format | `src/core/save.ts`, `tests/fixtures/` untouched — v1 |

## Teacher read ([reviewer] rows 2.5, 3.5, 4.4, 5.6, 6.6, 8.5, 9.5)

`npm run sample -- E3|E4|E5|E6 --count 6`, steps E3.3, E3.5, E3.7, E3.11, E4.3, E4.7, E5.12, E6.3, read as a Polish primary-school teacher. Numeral agreement, accusative and gender correct throughout (`ma 1 naklejkę`-type forms do not occur; "leży serce/koło/gwiazdka" nominative is right after "leży"); prompts 1–2 sentences; hint[0] never states the result. Problems found and fixed: F1, F2, F3. Accepted as is: GRID hint[1] "Pole A3: kolumna A, wiersz 3." states the cell, but it is a solution step (shown after the second miss), not hint[0]; distractors "3A"/neighbour cells are close and never a second correct cell; pyramid hints are clear; E5.12 rectangle "Obwód to dwa razy suma dwóch sąsiednich boków" teaches the halving method; E6.3 hints walk the edges in order.

## Findings

### F1 — Magic-square hints subtract numbers from a line they never name

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (content)
- **Location**: `src/core/tasks/generators/puzzleGrid.ts` `magic`
- **Detail**: "Pełny wiersz: 9 + 7 + 5 = 21 | 21 − 3 = 18 | 18 − 7 = 11" — 3 and 7 are the column holding the gap, never said; a child cannot tell where they come from.
- **Fix**: new `pl.tasks.puzzleMagicGapLine` ("W kolumnie z pustym polem są 3 i 7.") inserted before the subtractions; test in `tests/puzzleGrid.test.ts` (the gap line exists and holds both subtrahends).
- **Decision**: FIXED

### F2 — Full-hour "ustaw zegar" hints ask for a hand the child cannot move

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (content)
- **Location**: `src/core/tasks/generators/clock.ts` `generateClockSet`; `src/data/pl.ts`
- **Detail**: E3.3/E3.11 (snap 60, minute hand fixed on 12) said "Przeciągnij je palcem" and "Długą wskazówkę ustaw na 12".
- **Fix**: snap 60 uses `clockSetHourHandHint` ("Krótka wskazówka pokazuje godzinę. Przeciągnij ją palcem.") and `clockSetLongStaysHint` ("Długa wskazówka zostaje na 12, bo to pełna godzina."); E4.3 (both hands) unchanged; test in `tests/clock.test.ts`.
- **Decision**: FIXED

### F3 — Perimeter ranges drifted from the plan; E5.12 divides outside the times table

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/data/curriculum/E5.ts` `E5.12.perimeter_side_square`; `src/data/curriculum/E6.ts` `E6.3.perimeter_composite`
- **Detail**: plan: side of a square from a perimeter ≤ 40 ("dzielenie przez 4 w tabliczce"), composite ≤ 40 (also recorded in follow-ups row 10.6). Data had `max: 80` (76 : 4 = 19 — two-digit quotients are E6.4 "96 : 6") and `max: 60`.
- **Fix**: `max: 40` for both; `SMALL_SPACES` entry for E5.12 side (9 distinct tasks: side 2..10) in `tests/contentInvariants.test.ts`; test "E5.12 side … inside the multiplication table" in `tests/perimeterSkills.test.ts`. E4.7 `max: 60` and E5.12 `sideRect` `max: 60` are narrower than the plan's 100 — accepted (safer for grade 2/3), named for the author's read 10.6.
- **Decision**: FIXED

### F4 — "OK" under a second finger while a hand is held submits an unsettled pose

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/scenes/TaskScene.ts` `create` (`new ClockSet(...)` callback), `render` (`cancel` when `!dragLive`)
- **Detail**: `ActionButton` fires on pointerdown; a right in-flight pose ends the task, `render` cancels the grab and `idle()` restores `before`, so the dial shows a different time from the one that earned the star.
- **Fix**: the callback ignores "OK" while `clockState.carrying !== null`. No automated proof (scene glue; a two-finger CDP case is a follow-up).
- **Decision**: FIXED (follow-up for the e2e case)

### F5 — `pointerupoutside` → `cancel` path for the clock is not proven

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/scenes/TaskScene.ts` `create` (`pointerupoutside` listener), `tests/e2e/clock-set.spec.ts` "a drag the system cancels"
- **Detail**: break p12c removes the `wasCanceled` branch of `lift`, not the `pointerupoutside` listener (recorded deviation: CDP touchCancel arrives as `pointerup` with `wasCanceled`). The listener is covered by neither unit nor e2e tests; the S-13 follow-up asked for it.
- **Fix**: follow-up — a hook-build e2e drag that ends outside the canvas (mouse path) or a unit-level adapter extracted from `create`. · Strength: closes the S-13 follow-up honestly. · Tradeoff: one more serial spec (~15 s). · Confidence: MED — needs a pointer path Phaser reports as `pointerupoutside` under CDP. · Blind spot: whether Playwright mouse leaving the canvas triggers it at FIT scale.
- **Decision**: DEFERRED → `follow-ups/review-fixes.md`

### F6 — Phase 7's break proves the dial constant, not the phase-7 deliverables; progress row said otherwise

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `plan.md` Progress 7.2
- **Detail**: planned break (drop `clock` from the hook snapshot → typecheck red) is impossible (hand-written `Snapshot` in `tests/e2e/support/hook.ts`); actual break was `TASK_LAYOUT.clockSet.dial.hourLength` 78 → 300 (2 red in `tests/clockSet.test.ts`), while the row kept the original wording. Scene routing and the hook ↔ `setClock` contract are proven by p12a/p12b instead.
- **Fix**: row 7.2 annotated with the actual break and where the scene is proven.
- **Decision**: FIXED (annotation)

### O1 — Phase 2 RED evidence

- **Severity**: OBSERVATION
- **Dimension**: Success Criteria
- **Location**: `tests/puzzleGrid.test.ts`, `tests/visual.test.ts` (commit 2166514)
- **Detail**: production code was written first and reverted. The assertions are real (oracle recomputes every line/brick sum from the drawing, empties cover all cells, hint[0] digit-free, parser bounds); `visual.test.ts` goes red on "accepts good drawings", key and `describeVisual` without the code. The 16 rejection cases pass vacuously without `visual.ts` changes (the default branch already reports unknown kinds); the slanted-edge and two-empty-cells breaks show they discriminate once the code exists. Judged real RED.

### O2 — Duplicated dial geometry and hard-coded tokens

- **Severity**: OBSERVATION
- **Dimension**: Pattern Consistency
- **Location**: `src/ui/widgets/ClockFace.ts` `render` (own scale/centre formula), hand-tip trig in `src/core/clockSet.ts` `grab`, `src/ui/widgets/ClockSet.ts` `tipOf`, `tests/e2e/support/hook.ts` `onDial`; `src/ui/widgets/CoordGrid.ts` (`heart: 0xe0707a`, label offsets), `src/ui/widgets/NumberCells.ts` (`'#245c59'`); `TaskScene.feedDrag(event: BlockDragEvent & ClockSetEvent)` intersection of identical unions; `TaskScene` reads `visual.snap ?? 60` (validator rejects a missing snap); `core/tasks/generators/clock.ts` imports `clockHandAngles` from `core/round/pictureLayout` (type-only cycle, against the direction the plan used for `dragMode`); `figureLayout` `look.minCell` unused (36 px kept by `COMPOSITE_MAX_ROWS`). Follow-up.

### O3 — Live saves after the threshold and calendar changes

- **Severity**: OBSERVATION
- **Dimension**: Architecture
- **Location**: `src/core/curriculum.ts` `floorToCalendar`, `unlockThreshold`; `tests/curriculumStart.test.ts`
- **Detail**: `unlockedStep` is a stored step number and only ever raised (`max(saved, floor)`), so the higher thresholds of E3.3, E3.5, E3.7, E3.11, E4.7 slow the next unlock but never move a child back or drop an unlock. E6 floors went down ([4,5,6,8,10,10] → [3,4,6,8,10,10]) — no effect on saves. E5 floors went up by one in the last three months ([…,8,10,11] → […,9,11,12]): a loaded E5 learner below the new floor is lifted one step further than before, which is the same monthly floor rule S-11 already applies (no PRD rule forbids it; skipped steps stay in the 30 % "earlier" pool, mastery untouched). Save format v1 unchanged.

### O4 — Content observations kept for the author's read

- **Severity**: OBSERVATION
- **Dimension**: Plan Adherence (content)
- **Location**: `src/data/pl.ts` `clockSetSpeak`, `perimeterHint`, `src/data/gridItems.ts`
- **Detail**: spoken "Ustaw zegar na godzinę 1 i 45 minut" is understandable but stiff; rectangle perimeter steps show only `a + b + a + b` (E4 could add `2 · a + 2 · b`); 'kwadrat' as an item on a square grid may confuse; composite generator rejection loop has no cap and accepts ~1–3 % of draws at the parser minimum `max` 12 (data uses 40, feasible). Follow-up / author read 10.6.

MERGE: CLEAR — no critical findings; three content warnings and the OK-while-holding race fixed with red-then-green tests and full suites re-run (unit 1927 + 296, e2e 57 + 6); the unproven `pointerupoutside` path and pattern debts are follow-ups with triggers.
