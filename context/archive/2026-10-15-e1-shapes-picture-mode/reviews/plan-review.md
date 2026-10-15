<!-- PLAN-REVIEW-REPORT -->
# Plan Review: E1 z obrazkami — figury, szlaczki, porównywanie, „który z kolei”, CHOOSE_OP z obrazkiem, MONEY_PAY

- **Plan**: `context/changes/e1-shapes-picture-mode/plan.md`
- **Mode**: Deep (one verification sub-agent, claims checked against code)
- **Date**: 2026-10-15
- **Verdict**: REVISE → SOUND after the in-plan fixes below
- **Findings**: 2 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | FAIL → PASS after F1/F2 (a SHAPES `all` task could never be answered) |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F3–F5) |
| Plan Completeness | PASS (11 phases, `Driver:` on each, Progress ↔ criteria 1:1) |

## Grounding

Paths 6/6 ✓ (`CoordGrid.ts`, `IconGroups.ts`, `AnswerTiles.ts`, `artFilter.ts`, `clockSet.ts`, `canonicalInput.ts`);
symbols ✓ (`dragMode`, `selectionAnswer`, `solutionSteps`, `isCorrect`, `captureFirstWrong`, `taskKey`, `ROUND_SPEC`,
`unanswerable`); design-gaps max row 99 ✓; `prostokąt` absent from `nouns.ts` ✓; brief ↔ plan ✓.

## Contract checks asked by the step prompt

| Check | Result |
|---|---|
| MONEY_PAY reachable only with `dragMode` in the hook, exhaustive `answerRight`/`answerWrong` and `payCoins` in the same phase | ✓ Phase 8 carries scene, hook, helpers and data; the `p8a`/`p8b` fallback puts data (reachability) in `p8b`, after the helpers. `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` today send every non-clock `drag` to `buildOnMat` — confirmed; 13 unpinned specs play rounds (adaptive, daily-puzzle, error-boundary, first-launch, minigames, narrator, room-change, room-purchase, save-backup-health, save-migration, save-restart, save-transfer, task-round); default `passWelcome` is E3, whose `previous` pool and warm-up draw all of E2 incl. E2.2. `tsconfig.json` includes `tests`, so the Phase 8 `never` break is a real typecheck red. |
| `trayDrag` keeps block-drag identical | ✓ `tests/blockDrag.test.ts` has no case pinning the old S13-09 `down`-same-pointer behaviour (closest: "a second finger cancels the carry", pointer 2, stays idle); old cases stay green if `blockDrag.ts` keeps its exports (`Mat`, `trayAt`/`onMat`/`matBlockAt` geo, `balance.blockDrag`). Importers: `BlockMat`, `BaseTenBlocks`, `TaskScene`, `dragLayout`, two test files. Full e2e incl. `drawn-tasks.spec` required in Phase 6 ✓. |
| `number[]` + `check` across the round model | `isCorrect` ✓ (`check` first); `validateTask` skips range/choices/check rules for an array answer, but calls `dragMode` (Phase 7 adds `coins`) ✓; `leaksAnswer` false for arrays ✓; `numberChoices` never called for drag ✓; `canonicalInput` non-clock branch throws for non-number — Phase 7 adds the coins branch ✓; word minigame `WORD_TYPES` = ADD_SUB/MULT/DIV with tiles/keypad, `drawTask` rejects visual/non-number — coins and faces never enter ✓; dice/puzzle build their own tasks ✓; `captureFirstWrong` ignores arrays → no mistake example, save `validExample` untouched ✓. Gaps: F2 (string face answer), F5 (no result line for arrays). |
| Child never stuck on a coin task | ✓ once Phase 7 `check` + Phase 8 scene land together with data; the retype phase re-submits a wallet the same `check` judges. Stuck path found for **faces**, not coins: F1. |
| Picture tiles | `AnswerTiles`/`SelectTiles` draw `String(value)` today — Phase 2 draws faces ✓; hook targets carry the value, `answerRight` matches by `===` (strings fine) ✓; narrator never reads tiles ✓ but speaks `solutionSteps` → F2; parent view shows raw codes → Phase 2 `faceLabel` ✓. A 6-year-old answers by figure, no reading ✓. |
| E1 calendar start / thresholds | `tests/curriculumStart.test.ts` `ORACLE` and `playableSteps`, `tests/curriculumEnd.test.ts` title — in Phase 2 ✓; `tests/curriculumPick.test.ts` "an unplayable step below every playable one…" pins `playableSteps(E1)[0] > 1` and was missing → F3. `floorToCalendar` never lowers a saved step ✓; save stays v2 ✓. |
| Follow-ups with `Trigger: S-14d` | MONEY_PAY + Wallet + generic `blockDrag` (S-14) — included; CHOOSE_OP with a picture (S-13b) — included; BONDS pairs (S-13b) — deferred, new trigger `a pairing answer mode` (justified: new answer mode); E1 hint number line (S-14b) — deferred, `a layout band above the tiles` (the trigger's own alternative); E1.10 `place_read_12` (S-14b) — deferred, new trigger (task-space reason, not a widget); O4 `count_5` — included; picture mode (first-launch, `Trigger: S-14`) — included. All justified. |
| Product decisions vs PRD/ZADANIA | None clearly wrong; all against-the-letter decisions are named in `[human]` row 9.7 ✓. |
| Phases / drivers | 11 phases, drivers correct (tdd 1,3,5,6,7; impl 2,4,8,9; e2e 10,11); e2e phases after the seam sweep; both new specs added to `ROUND_SPEC` ✓. Phase 8 is the largest; its `p8a`/`p8b` split keeps each commit green. |

## Findings

### F1 — Select with face codes always submits `[]`: SHAPES `all` unanswerable, child stuck in retype

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 1 / Phase 2 (`E1.1.shapes_all`)
- **Detail**: `selectionAnswer` (`src/core/round/select.ts`) keeps only numbers (`filter(value is number)`), `SelectTiles.onSubmit` is typed `number[]`, and `Task.answer` has no `string[]`. A select task with string face codes always submits `[]`: wrong on first and second try, and the `retype` phase re-submits `[]` forever. Unit tests would not catch it (`canonicalInput` reverses `task.answer`, bypassing the widget); e2e would.
- **Fix**: Phase 1 §3a — `Task.answer` gains `string[]`, `selectionAnswer` returns `SelectValue[]` (numbers ascending as today, strings in choice order) with a test and a deliberate break; Phase 2 retypes `SelectTiles.onSubmit`.
- **Decision**: FIXED (in plan.md)

### F2 — Raw face code shown and spoken in the solution line

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 1 (SHAPES/PATTERN tiles)
- **Detail**: `solutionSteps` (`src/core/round/hints.ts`) appends `answerLine(String(answer))` unless the last hint `includes` the string answer; a hint written in words never contains `shape:triangle:red:big`, so "Wynik: shape:…" appears in the solution and retype bar and the narrator reads it (`spoken.ts` uses `solutionSteps`).
- **Fix**: Phase 1 §3a — for `isFace(answer)` the result line uses `faceLabel(answer)`; tests on `solutionSteps` and spoken solution text; deliberate break added to 1.3.
- **Decision**: FIXED (in plan.md)

### F3 — `tests/curriculumPick.test.ts` pins E1.1 as unplayable

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §3
- **Detail**: "an unplayable step below every playable one falls back to the first playable step" asserts `playableSteps(stage('E1'))[0] > 1`; it goes red in Phase 2 and the plan listed only `curriculumStart`/`curriculumEnd`.
- **Fix**: added to Phase 2 files — rewrite on a synthetic stage with an unplayable step 1 (keeps the fallback covered).
- **Decision**: FIXED (in plan.md)

### F4 — `taskKey` ignores tile choices for SHAPES `name`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 / `src/core/round/unique.ts`
- **Detail**: two `name` tasks with the same prompt and different tiles count as one; with one task per skill it only causes a redraw, but it shrinks variety.
- **Fix**: recorded in `## Known risks` with a trigger.
- **Decision**: ACCEPTED (Known risks)

### F5 — Array answers get no result line; E2.2 art-filter test depends on Phase 7

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phases 7–8
- **Detail**: `solutionSteps` treats array answers as closed, so a MONEY_PAY solution ends without the amount unless the last hint states it; `tests/artFilter.test.ts` (E2.2 keeps the current step whole) changes outcome if `artBlocked` does not know MONEY_PAY when Phase 8 adds `E2.2.money_pay_20`.
- **Fix**: Phase 7 test intent now requires the last hint to state the amount; both recorded in `## Known risks`.
- **Decision**: FIXED (in plan.md)

### F6 — Hook `dragMode` switch must cover `null`

- **Severity**: 💡 OBSERVATION
- **Dimension**: Plan Completeness
- **Location**: Phase 8 helpers
- **Detail**: `Snapshot.dragMode: DragMode | null`; the `switch` needs a `null` arm that throws (input `drag` without a mode) before the `never` default, or typecheck rejects `unanswerable(state.dragMode)`.
- **Decision**: RECORDED

### F7 — Picture mode bends unpinned E1 e2e rounds in October

- **Severity**: 💡 OBSERVATION
- **Dimension**: Blind Spots
- **Location**: Phase 5
- **Detail**: first-launch (age 6), minigames `startE1`, save-backup-health, save-restart play unpinned E1 rounds; after Phase 5 they draw mostly picture skills, incl. SHAPES `all` — safe only with F1 fixed. Already in Known risks (pin `e2eMonth` on flake).
- **Decision**: RECORDED

VERDICT: PROCEED — the approach holds; two child-facing defects in the face-code answer path (unanswerable select, raw code in the solution) and one missing pinned test were fixed in plan.md, MONEY_PAY reachability is gated correctly in Phase 8.
