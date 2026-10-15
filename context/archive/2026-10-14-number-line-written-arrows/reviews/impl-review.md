<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Słupek pisemny z okienkami cyfr, grafy strzałkowe i oś liczbowa (rysunek i podpowiedź)

- **Plan**: context/changes/number-line-written-arrows/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-15
- **Verdict**: APPROVED (after the three WARNING fixes in this review's `fix(...)` commit; NEEDS ATTENTION before them)
- **Findings**: 0 critical, 3 warnings (all FIXED), 7 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F1 fixed; drifts in F7 are wording and test-file placement) |
| Scope Discipline | PASS (extras: `src/ui/widgets/dashed.ts`, `NumberCells.ts`, `tests/warmup.test.ts`, all seam-sweep or list updates) |
| Safety & Quality | PASS (F2 fixed; no throw reachable from the curriculum, F5) |
| Architecture | PASS (`src/core` pure, ESLint boundaries green) |
| Pattern Consistency | WARNING (F8, observations with follow-ups) |
| Success Criteria | PASS (all automated rows re-run in this review, see below) |

## Verification observed in this review

Baseline main `882cd93`: unit 2326, e2e 71.

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK (before and after the fixes) |
| `npm test` | 2429 passed = 2326 + 103 (before and after the fixes; fixes add no test) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK |
| `npm run sample -- E1` .. `E6` | exit 0 each, no violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=... --workers=4` (after the fixes) | 77 passed (5.2 min) = baseline 71 + 6 (written-column 3, number-line 3) |
| Break: `stepDigitBoxes` fills from the left | `tests/digitBoxes.test.ts` 5 red, `tests/solvableInMode.test.ts` WRITTEN skills red; restored (`git diff` empty) |
| Break: a sixth mode `'probe'` in `ANSWER_MODES` | `tsc` red at the `never` guards in `canonicalInput` (new, F1), `pictureLayout` x4, `TaskScene` x2, `FeedbackBar`, `tests/e2e/support/hook.ts` x2; restored |
| Meta-check | the reducer break goes red through an independent oracle (digits typed ones-first, read back); the mode break proves the guard covers core, scene, bar and e2e helpers, which a test over modes could not |

## Code-level checks asked by the run

- **Exhaustive branches on `Task.input`**: `src/core/round/pictureLayout.ts` `pictureLayout`, `answerSpans`, `tallOf`, `hintPictureLayout`; `src/ui/widgets/FeedbackBar.ts` `spanOf`; `src/scenes/TaskScene.ts` `widgetsOf`, `answerSpot`; `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` (end in `unanswerable(mode: never)`); `src/core/round/canonicalInput.ts` `canonicalInput` after F1. `src/core/round/view.ts` `roundView` keeps the fallback only for tasks without `input` (plan-sanctioned). `src/core/tasks/validate.ts` `validateTask` mode rule is an if-list without fallback (F6).
- **`playable` admits `digits` only with the e2e helpers present**: `src/core/round/pick.ts` `playable` lists `digits` since p8 (`295a5f4`), the same commit that added `typeDigits` and the `digits` branches to `tests/e2e/support/hook.ts`; `tests/answerModes.test.ts` pins the list.
- **S-15 word minigame**: `src/core/minigames/word.ts` `eligible` takes only `tiles`/`keypad` skills of ADD_SUB/MULT/DIV, `drawTask` forces `answer: 'tiles'`, drops any task with `visual` and deletes `hintVisual` (test on the real `wordTask` in `tests/hintVisual.test.ts`). A digits task cannot appear there; dice and daily puzzle build their own tasks.
- **No task a child cannot answer**: `src/core/tasks/generators/written.ts` `draw` keeps the result in 10..99 / 100..999, so the answer has exactly `columns` digits (`canonicalInput` asserts it for all four WRITTEN skills); warm-up may draw a WRITTEN skill (E6 warm-up from E5.2) and `TaskScene` handles `digits` the same in warm-up.
- **`tallOf` throw (p1)**: only `thermometer` is tall (`visualShape`); thermometers come only from TEMPERATURE skills, all `tiles` or `keypad` (E3.11, E5.4, E6.1). Unreachable today (F5).
- **Unlock thresholds on live saves**: `unlockedStep` is a saved number that `endRound` only raises and `floorToCalendar` floors; a higher threshold slows the next unlock, nothing moves back. `SAVE_VERSION = 2`, `tests/fixtures/` and `src/core/save.ts` unchanged vs main.
- **Hook bypass**: none found (commits on the branch carry no `--no-verify` trace; hooks fired on this review's edits).

## Teacher read ([reviewer] rows 2.5, 3.5, 5.6, 6.5, 8.6)

`npm run sample -- E2|E3|E5|E6 --count 6`, read as a Polish primary-school teacher:

- **WRITTEN E5.2, E6.7**: column lines in school order from the ones; "Piszę 5, 1 dalej." and "Pożyczam dziesiątkę / setkę" read right; borrow across zero (900 − 653: "Dziesiątki: było 0, po pożyczce 9.", "Setki: było 9, po pożyczce 8.") is correct; last line is the full operation. The drawn notation in `src/ui/widgets/WrittenColumn.ts` `render` matches the lines: carry = "1" in a gold circle above the next column ("1 dalej"); borrow = lender digit struck with the reduced digit above ("było 1, po pożyczce 0") and a small "1" before the borrowing digit ("14 − 5"). Whether this is the school notation stays `[human]` 8.8.
- **ARROW_TABLE E2.6**: prompts and rule lines fine; the inverse-graph line "Wracamy pod strzałkę: odejmij 1 od liczby." was unclear → F3, now "Idź pod prąd strzałki: od 3 odejmij 1." (no result in the first line).
- **SEQUENCE E2.7 on a line, MULT_GROUPS jumps E3.9**: fine; jumps distractors (5 + 6, 5 · 7, 6 · 4) close and unambiguous.
- **ADD_SUB hint line E2.1, E2.3, E2.5, E3.2, E3.6, E3.8**: `hint visual:` jumps equal the hint lines; the result is never a label; F4 on DT − U.
- **O5 E5.5**: "Dwa dzbanki po pół litra to litr. Cztery po ćwierć litra też." natural and ≤ 64.

## Findings

### F1 — `canonicalInput` ended in a silent tiles/keypad fallback

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/round/canonicalInput.ts `canonicalInput`
- **Detail**: Plan (Critical Implementation Details) lists `canonicalInput` among the core consumers that switch with `never`; it was an if-chain ending in `return task.answer`, so a sixth mode would compile and pass `tests/solvableInMode.test.ts` silently.
- **Fix**: final `switch (mode)` with `case 'tiles': case 'keypad': case undefined` and a `never` default.
- **Decision**: FIXED (the sixth-mode break now reports `canonicalInput` too)

### F2 — `Keypad.setKeyMode` cleared a keypad task's typed digits on every redraw

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/Keypad.ts `setKeyMode`; called from src/scenes/TaskScene.ts `render`
- **Detail**: `render()` calls `setKeyMode(view.input === 'digits')` every time, and `setKeyMode` emptied `buffer`. On main, `render()` never touched the buffer; a redraw mid-entry (`onWake`) now lost the typed number of an ordinary keypad task.
- **Fix**: return early when the mode does not change (a new task still clears through `keypad.reset()`).
- **Decision**: FIXED

### F3 — Inverse arrow-graph hint unclear Polish

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria (teacher read)
- **Location**: src/data/pl.ts `pl.tasks.arrowRuleBack`; src/core/tasks/generators/arrowTable.ts `generateArrowTable`
- **Detail**: "Wracamy pod strzałkę: odejmij 1 od liczby." — "pod strzałkę" does not say "against the arrow" and "od liczby" does not say which number.
- **Fix**: `arrowRuleBack(plus, n, from)` → "Idź pod prąd strzałki: od 3 odejmij 1." / "…: do 3 dodaj 1."; the first line never ends with the answer unless the answer equals n (then `firstHint` falls back to "Spróbuj jeszcze raz").
- **Decision**: FIXED (`sample -- E2` re-read, `tests/arrowTable.test.ts` + `contentInvariants` green)

### F4 — Hint-line skills drop the S-03 "20 − 7" decomposition

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/core/tasks/generators/addSub.ts `generateAddSub` (`params.line` branch) vs `addSubHint`
- **Detail**: With `line: true` the lines come from `hintOfJumps(addSubJumps(...))`, so 20 − 7 / 30 − 9 now have one line "30 − 9 = 21" (first hint "Spróbuj jeszcze raz", then the number line with one jump back) instead of "10 − 9 = 1 | 20 + 1 = 21". Deliberate (comment: drawing must match lines), not in the plan. Counting back on the line is a valid method, so not a defect.
- **Fix**: follow-up with `Trigger:` (author read / visual gate) — keep, or keep the decomposition text beside a one-jump line.
- **Decision**: ACCEPTED → follow-ups/review-fixes.md

### F5 — `tallOf` / `hintPictureLayout` throws are unreachable today but not guarded by the validator

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/round/pictureLayout.ts `tallOf`, `hintPictureLayout`; src/core/tasks/validate.ts `validateTask`
- **Detail**: No select/drag/digits skill makes a thermometer; `hintVisual` on non-keypad is already a `mode` violation in `validateTask` (CI catches it), but "tall drawing needs tiles or keypad" is not, so a future data typo would only show as the fatal card.
- **Fix**: add a `mode` rule for tall drawings — follow-up.
- **Decision**: ACCEPTED → follow-ups/review-fixes.md

### F6 — `validateTask` mode rule is an if-list, not a `never` switch

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/tasks/validate.ts `validateTask`
- **Detail**: Rules per mode (digits ↔ column, hintVisual ↔ keypad, drag ↔ dragMode) with no fallthrough; nothing misroutes, it only does not force a decision for a new mode.
- **Fix**: none now; covered by the F5 follow-up when the rule list is next touched.
- **Decision**: ACCEPTED

### F7 — Wording and placement drifts from the plan

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/curriculum/E2.ts (E2.6 `childName` "Sprawdzanie i grafy", n `[1, 9]` / `[1, 6]` vs plan 2–10), src/data/curriculum/E5.ts (E5.2 "Dwucyfrowe, rzymskie, słupek"); tests planned in `pictureLayout/solvableInMode/addSub/roundView/wordRound.test.ts` live in the new `tests/hintVisual.test.ts`, `answerModes.test.ts`, `digitBoxes.test.ts`; two stale test titles in `tests/answerModes.test.ts`
- **Detail**: Shorter child names fit the card; n = 1 is easy but valid for E2; coverage exists.
- **Fix**: stale titles renamed in this review; rest accepted.
- **Decision**: FIXED (titles) / ACCEPTED (rest)

### F8 — Widget tokens and a second dashed helper

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/ArrowGraph.ts, NumberLine.ts (text colour `'#245c59'`, precedent in NumberCells on main), src/ui/widgets/WrittenColumn.ts `render` (offsets `12 * s`, `22 * s`, `0.3 * W.colW`), src/ui/widgets/BlockMat.ts private `dashedRect` vs src/ui/widgets/dashed.ts `dashedRect`
- **Detail**: Within this change the dashed box is shared (`dashed.ts`); BlockMat's own copy predates it with another dash/gap model.
- **Fix**: text-colour token and geometry into `src/data/layout.ts`, BlockMat onto `dashed.ts` — follow-up.
- **Decision**: ACCEPTED → follow-ups/review-fixes.md

### F9 — `written.ts` `draw` loop has no cap

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/written.ts `draw`
- **Detail**: `for (;;)` without `MAX_ATTEMPTS`; every parsable param set is satisfiable today, so it always ends.
- **Fix**: cap and throw like `addSub` `drawOperands` — follow-up.
- **Decision**: ACCEPTED → follow-ups/review-fixes.md

### F10 — Hint marks vs first hint line; silent "OK" on part-filled boxes

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/tasks/written.ts `columnMarks` (`first`), src/scenes/TaskScene.ts `pressBoxKey`
- **Detail**: When the first carry is in the tens (330 + 571), the hint phase draws the carry over the hundreds while the hint text shows the ones line — consistent, not the same column. "OK" with empty boxes does nothing (no nudge).
- **Fix**: judge at the visual gate.
- **Decision**: ACCEPTED → follow-ups/review-fixes.md (visual gate item)

MERGE: CLEAR — no CRITICAL; the three WARNINGs (canonicalInput guard, keypad buffer reset, inverse-graph wording) are fixed with the full local gate green, and the observations are recorded as follow-ups with triggers.
