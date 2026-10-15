---
date: 2026-10-14T23:10:36+02:00
researcher: Claude (autonomous run 2026-10-14-save-s13b-s15-s14b, research step)
git_commit: 71634332d7d99e0dfbc24970db1e37bcdb6980d0
branch: feat/number-line-written-arrows
repository: Martynka-urzadza
topic: "S-14b number-line-written-arrows: WRITTEN with a 'digit in a box' answer mode (E5.2, E6.7), ARROW_TABLE (E2.6), the number line as a drawing (SEQUENCE E2.7, new MULT_GROUPS jumps skill E3.9) and as a hint picture for ADD_SUB (results <= 30); unlock thresholds on live saves; S-15 variant rounds"
tags: [research, tasks, answer-mode, keypad, written, arrow-table, number-line, hints, pictureLayout, curriculum, unlock, minigame, e2e, design-gaps]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-14b number-line-written-arrows

**Git Commit**: `7163433` · **Branch**: `feat/number-line-written-arrows` · Research only, no product code changed.
Anchors are file + symbol (run contract: no line numbers). `docs/zrodla/` was not read. `lessons.md` in
`context/foundation/` does not exist (checked with `ls`), so no lesson applies. Three read-only workers covered
(A) the answer-mode chain (types, round state machine, keypad, `canonicalInput`, `playable`, e2e hook and helpers,
`TaskScene` wiring, mistake examples); (B) drawings, `pictureLayout`, hints, ADD_SUB/SEQUENCE/MULT_GROUPS generators
and skills, S-15 minigames; (C) curriculum steps, unlock rule on live saves, pinning tests, the design kit, design
gaps, copy keys, roadmap block and triggered follow-ups. Decisive anchors were re-read in the main context
(`isCorrect` in `src/core/round.ts`, `MistakeExample` in `src/core/types.ts`, `TASK_LAYOUT.picture`/`keypad` in
`src/data/layout.ts`, the E3.9 skills, `unlockThreshold`, `drawTask` in `src/core/minigames/word.ts`, `addSubHint`,
`firstHint`, the curriculum `skill`/`addSub` helpers). One worker claim was corrected: ADD_SUB and SEQUENCE skills in
E2/E3 are on `keypad` (the `skill` helper defaults to `'keypad'` in `E2.ts`–`E6.ts`, `'tiles'` only in `E1.ts`).

## Research Question

From `change.md` (scope table, roadmap corrections, autonomous decisions 2–7, triggered follow-ups): what does the
code need so S-14b can ship (1) WRITTEN column addition/subtraction in E5.2 and E6.7 with a new "digit in a box"
answer mode, (2) ARROW_TABLE graphs/tables in E2.6, (3) a number line as the drawing of SEQUENCE (E2.7) and of a new
MULT_GROUPS "jumps" skill (E3.9), (4) a number line as a hint picture for ADD_SUB with results <= 30 without a
`task.visual`? Settle the mode's state machine and the e2e chain, number ranges, layout fit, the unlock-threshold
rises on live v2 saves, and whether new modes/drawings reach the S-15 minigame and puzzle rounds.

## Summary

1. **"Digit in a box" = a new `AnswerMode` value (recommended name `'digits'`), answer stays a number.** The round
   only sees one `answer(state, input)` per submission and compares with `isCorrect` (`src/core/round.ts`:
   `task.check` → array-as-set → `===`). `select` and `drag` added no state to `round.ts`; each has a pure reducer
   (`src/core/round/select.ts`, `src/core/blockDrag.ts`, `src/core/clockSet.ts`) and submits one value through
   `TaskScene.submit`. The box reducer (boxes = result digit count, active box starting at the ones, digits filled
   right-to-left, `delete` clears the last filled box, `ok` submits only when every box is filled) composes the
   digits into a **number** and submits it. A number keeps `MistakeExample.given: number | string`
   (`src/core/types.ts`) and `captureFirstWrong` unchanged, so **the save format stays v2** (an array would not be
   captured at all, and `isCorrect` would compare it as an unordered set — wrong for digits). Change.md decision 2
   holds: `keypadInput` (`src/core/round/keypad.ts`) is a left-to-right text buffer with no notion of boxes, and the
   picture region differs, so the "focused keypad inside `keypad`" reversal condition is not met.
2. **The new mode must be added explicitly everywhere: nothing fails at compile time.** No consumer of the mode
   uses a `never` exhaustiveness check; `pictureLayout`/`answerSpans`/`tallOf` fall back to tiles,
   `FeedbackBar.update` and `roundView` (`input ?? (choices ? 'tiles' : 'keypad')`) fall back to tiles/keypad, and
   `answerRight`/`answerWrong` in `tests/e2e/support/hook.ts` fall into the keypad `else`. Order fixed by the
   contract and the comment in `src/core/round/pick.ts` `playable`: `SkillDef['answer']` → reducer + tests →
   `canonicalInput` branch that throws on an unreachable answer → `tests/solvableInMode.test.ts` → hook snapshot
   (`digits` state) + targets (reuse `keys`) → helper `typeDigits` + `answerRight`/`answerWrong` branches + the
   `Snapshot.input` union → only then `playable`.
3. **Box count must not leak the answer.** Recommend: boxes = number of columns of the wider operand, and the
   generator constrains the result to exactly that many digits (E5.2: two-digit operands, result 10–99, so no
   "100" with a third box; E6.7: three-digit, result 100–999, subtraction never below 100). Then `canonicalInput`
   throws when `String(answer).length !== boxes`.
4. **School method (domain knowledge, not from a repo source — flagged for the teacher read):** numbers aligned
   right, computed column by column from the ones; in addition the carried 1 is written small above the next
   column ("piszę 5, 1 dalej"), which is exactly the kit's gold circle over the tens (`reference/written-addition.svg`,
   `helper-metadata.json` `writtenAddition {a:38, b:27, result:65, carryTens:1}`); in subtraction with borrowing
   the tens digit of the minuend is crossed out and the reduced digit written above, the ones get +10. The kit shows
   addition only; borrowing has no kit reference (DESIGN-GAP). Change.md decision 3 (carry drawn in hint/solution,
   not typed) is kept; reversal stays the teacher read.
5. **ARROW_TABLE fits `keypad` with one empty field per task** (change.md decision 7 holds: the digit reducer fills
   digits of one number, not several numbers; a multi-blank table would need yet another reducer). Graph: input →
   "+n"/"−n" → □ (or □ → "+n" → output, which is the E2.6 "checking subtraction" idea); table: a row of inputs, one
   rule, one empty output. E2 range: up to 20 with bridging (ZADANIA § 2). A new drawn `TaskVisual` kind; no kit view.
6. **A number line is a new `TaskVisual` kind** (recommended `numberLine`): touch the union, `visualKey`,
   `validateVisual`, `describeVisual`, `visualShape` (`src/core/tasks/visual.ts`) and `TaskPicture` (dispatch,
   `widgets`, `render` switch, `hide`). It fits the keypad picture (768 × 378) and also the 190 px
   `keypadSolution.picture` (the kit card is 704 × 200 with 58 px pitch for 0–10), so O6/O2 is **not** triggered by
   the line. Leak rule for every line: **the tick of the answer is never labelled; a box marks it** (SEQUENCE
   missing term, MULT_GROUPS landing, ADD_SUB hint landing).
7. **Hint picture for ADD_SUB is a new concept and needs a new `Task` field**, e.g.
   `hintVisual?: { hint: TaskVisual; solution: TaskVisual }`. Today `Task.hint` is `string[]` only, `RoundView`
   exposes `visual` and `bar` (`src/core/round/view.ts`), and `pictureLayout` has only a `solution: boolean`
   (`TaskScene` derives it from `view.bar.kind === 'solution'`). The jumps come straight from `addSubHint`
   (`src/core/tasks/generators/addSub.ts`: tens jump, then "to the ten" + rest when crossing), so the hint drawing
   shows the jumps of `firstHint` (or just the start and a "+b" arc when `firstHint` is null) with the landing
   unlabelled; the solution drawing shows all jumps. Placement: a no-visual keypad task has its expression beside
   the keypad at `TASK_LAYOUT.expression` (620, 456) and solution lines under it; a no-visual tiles task (E1) uses
   `expressionWide` (960, 500) above tiles at `tiles.top` 712. A new layout branch is needed (under the expression,
   above the bar/tiles); exact rectangles are a visual-gate question.
8. **S-15 rounds:** the word minigame (`src/core/minigames/word.ts` `eligible`, `drawTask`) takes only
   ADD_SUB/MULT/DIV skills on `tiles`/`keypad`, forces `answer: 'tiles'`, and rejects a task with `task.visual`.
   So WRITTEN (`digits`), ARROW_TABLE, SEQUENCE and MULT_GROUPS never reach it. **But an ADD_SUB task with a new
   `hintVisual` field passes `drawTask`** (it checks `visual` only) — the plan must either drop `hintVisual` in
   `drawTask` (recommended: the word round has its own layout with letters above, DESIGN-GAP 85) or lay it out
   there. Zakrywanka (`src/core/minigames/dice.ts`) builds its own tasks; the daily puzzle (`src/core/puzzles.ts`)
   is fixed data — neither is affected.
9. **Unlock thresholds on live saves** (`unlockThreshold = ceil(0.5 · n)` over **playable** skills,
   `src/core/curriculum.ts` `unlockReady`, `balance.curriculum.unlockShare` 0.5, `unlockAt` 4). `unlockedStep` is a
   step **number** per stage; `endRound` only raises it and `floorToCalendar` is `max(saved, calendarStart)`, so a
   child never moves backwards; a child already past a step is never re-evaluated; `validLearner`
   (`src/core/save.ts`) checks mastery as a record of counts, not skill ids. With the recommended skills:
   E2.6 1 → 3 skills (threshold 1 → **2**), E3.9 **4** → 5 (2 → **3**; change.md's "2 skills, threshold 1" is
   stale — E3.9 also has `mult_30` and `word_groups_30`), E5.2 2 → 4 (1 → **2**), E6.7 1 → 3 (1 → **2**), E2.7
   unchanged (3 skills, the line is a drawing for the existing skill). The rise takes effect in the commit where
   `playable` admits the mode/generator, since `n` counts playable skills only. Save stays v2.

## Detailed Findings

### A. Answer-mode chain (for `digits`)

- Declaration: `SkillDef.answer: 'tiles' | 'keypad' | 'drag' | 'select'` (`src/core/types.ts`), `AnswerMode =
  SkillDef['answer']` (`src/core/tasks/visual.ts`), `Task.input?: AnswerMode` (`src/core/tasks/types.ts`), stamped by
  `generateTask` (which adds `choices` only for `tiles` with a numeric answer); `src/core/puzzles.ts` and
  `src/core/minigames/dice.ts` stamp `input` by hand; `word.ts` forces `tiles`.
- Consumers to extend (each currently falls back silently): `roundView` (`src/core/round/view.ts`), `playable`
  (`src/core/round/pick.ts`), `pictureLayout`/`answerSpans`/`tallOf` (`src/core/round/pictureLayout.ts`),
  `taskKey` (`src/core/round/unique.ts`, adds choices for `select` only — `digits` needs nothing), `canonicalInput`
  (`src/core/round/canonicalInput.ts`), the mode check in `src/core/tasks/validate.ts` (`dragMode` rule 'mode'),
  `FeedbackBar.update` (`src/ui/widgets/FeedbackBar.ts`), and in `src/scenes/TaskScene.ts`: `render` (visibility and
  `setActive` per widget, `markCorrect`, the solution-lines rectangle), `drawPrompt(input)` (beside-keypad layout
  for `keypad`), `hideTaskLayer`, `answerSpot`, `snapshot`, `targets`. Narration: a grep of `src/core/narration/`
  for `.input` found nothing.
- Round state machine (`src/core/round.ts`): phases first → second (wrong first try, `captureFirstWrong`) →
  solution (wrong second try; `nextSolutionStep` walks `solutionSteps`) → retype (correct → `settle('retype')`, 0
  stars; wrong → unchanged) → done. One task = `RoundState.tasks[index]` = one column for WRITTEN. First try = the
  first full submission (an `ok` with empty boxes must not submit, as `keypadInput` returns `submit: null` on an
  empty buffer). After a wrong submission `TaskScene.submit` resets the keypad/select/mat/clock; `digits` should
  clear all boxes the same way (keeping correct digits would show which digits are right).
- Keypad widget (`src/ui/widgets/Keypad.ts`): owns `buffer`, draws it in `fieldText` inside `keypadGrid(...).field`
  (`src/ui/widgets/geometry.ts`; field 516 × 112 at `TASK_LAYOUT.keypad` left 1040, top 342), calls `keypadInput`
  then `onSubmit(number)`. For `digits` the keys must reach the box reducer (a key callback instead of
  submit-only), and the field should be hidden because the boxes in the column are the field. `maxDigits` is
  `balance.keypad.maxDigits` 7.
- Existing blank drawing: `src/core/round/promptBlank.ts` (`splitBlanks`, `layoutPieces`, `BLANK '□'`,
  `TASK_LAYOUT.blank` 64 × 84) draws decorative boxes in an expression; a reuse candidate for box geometry.
- `canonicalInput`: select (reversed answer, throws outside `choices`), drag/clock (string, throws outside
  `reachableTimes`), drag/blocks (number, throws beyond `maxPerKind`), tiles/keypad pass-through.
  `tests/solvableInMode.test.ts` runs every playable skill (20 seeds × 50) through `validateTask` and
  `answer(startRound([task]), canonicalInput(task))` → phase `done`, outcome `first`.
- E2E: `src/testing/e2eHook.ts` exposes `snapshot`/`targets` from `TaskScene`; `targets.keys` already holds keypad
  key centres. `tests/e2e/support/hook.ts`: `tapNumber` types left-to-right then `ok`; `answerRight`/`answerWrong`
  branch on `state.input` (tiles, select, drag+clock, drag) with keypad as `else`; `Snapshot.input` is a literal
  union of four modes. `digits` needs: snapshot fields (box count, active index, filled digits), a `typeDigits`
  helper (ones first), branches in both answer helpers (a wrong answer with the same digit count, e.g. answer ± 1
  kept in range), and `Snapshot.input` extended.
- S-13b lesson (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/`, `dragMode` in `src/core/tasks/dragMode.ts`):
  branch explicitly on data and throw on an unknown case instead of taking a default branch.

### B. WRITTEN content and ranges

- Steps: E5.2 (`src/data/curriculum/E5.ts`) title "Rzymskie I–XII; 27 + 20; 23 + 42, 65 − 42; pisemne dodawanie i
  odejmowanie w słupku", types `['ROMAN','ADD_SUB','WRITTEN']`, 2 skills (`E5.2.roman_12` tiles,
  `E5.2.add_sub_100_two_digit` keypad), childName "Dwucyfrowe i cyfry rzymskie". E6.7 (`E6.ts`) types
  `['WRITTEN','FACT_FAMILY']`, 1 skill `E6.7.fact_check_1000`, childName "Sprawdzanie działań".
- ZADANIA § 2: E5 "≤ 100 pełne (47 + 28, 63 − 48), także pisemnie"; E6 "≤ 1000 (… 468 + 216, 500 − 284), także
  pisemnie"; § 3 E6.7 "z przekroczeniem (468 + 216, 365 − 156)"; § 4 WRITTEN "E5 do 100, E6 trzycyfrowe z
  przekroczeniem; wariant brakujące cyfry (E6)". ZADANIA is silent on whether the E5.2 written tasks carry; the step
  examples (23 + 42, 65 − 42) have no carry and E5.6 brings 47 + 28 mentally. Recommendation: E5.2 two skills
  (written addition, written subtraction), two-digit operands, result 10–99, carry/borrow allowed (`bridge: 'any'`,
  the reusable `Bridge` of `addSub.ts`) — the column method is what makes carrying easy, and a no-carry-only column
  teaches little; E6.7 two skills (addition, subtraction), three-digit operands, result 100–999, at least one carry
  or borrow required ("z przekroczeniem"). The teacher read may reverse E5.2 to no-carry only.
- Generator shape: a new `WRITTEN` generator registered next to a params parser in
  `src/core/tasks/registry.ts`; answer a number; `visual` a new kind (e.g. `column` with `a`, `b`, `op`, column
  count, and for the solution the carries/borrows per column). `addSub.ts` has the carry walk to reuse
  (`hasCarry`, `crossesTen`, the per-digit loop in its feasibility code).
- Hints (`src/core/round/hints.ts`): `firstHint` returns `hint[0]` only when there are ≥ 2 lines and the first line
  does not leak the answer; `solutionSteps` returns all lines plus an answer line when the last does not state it.
  WRITTEN lines go per column ("Jedności: 8 + 7 = 15. Piszę 5, 1 dalej.", "Dziesiątki: 3 + 2 + 1 = 6."); the first
  line must state the column sum without the result's digits in their final order. `KEYPAD_HINT_MAX = 64` in
  `tests/contentInvariants.test.ts` applies to keypad skills' first hint; extend it to `digits`.
- Layout: the kit column (`written-addition.svg`, 460 × 420: digits 72 px, column pitch 82 px, `+` 64 px, carry row
  at baseline 106, rule line 4 px, result baseline 381) is about 420 px tall for two-digit numbers. It fits the
  keypad picture (768 × 378) at about 0.9 scale, but **not** `keypadSolution.picture` (190 px → ~33 px digits). The
  column is narrow (3 digits + sign ≈ 330 px), so recommend a `digits` layout branch that keeps the column in the
  same place in every phase and puts the solution lines beside it (the column itself shows carries and fills in
  the solution). This settles O6/O2 for WRITTEN without changing `keypadSolution`.

### C. ARROW_TABLE

- E2.6 (`src/data/curriculum/E2.ts`): title "Sprawdzanie odejmowania dodawaniem, grafy +n / −n", types
  `['FACT_FAMILY','ARROW_TABLE']`, 1 skill `E2.6.fact_check_sub_20` (keypad), childName "Sprawdzanie odejmowania".
  ZADANIA § 4: input → arrow "+5"/"−8"/"·3" → output; table with an input row and a rule; chain of arrows; from E2.
- Recommendation: two skills on `keypad`: `arrow_graph_20` (one arrow; blank output, or blank input — the inverse
  connects to "checking subtraction") and `arrow_table_20` (3–4 inputs, one rule, one blank output); a two-arrow
  chain only if it fits the 768 × 378 picture; "·3" stays out (no multiplication in E2). Numbers ≤ 20 with bridging
  (ZADANIA § 2 E2). Hint: the arithmetic line of the blank ("7 + 5", inverse "12 − 5"). Real `−` (kit style guide).
- Not supported now: several blanks at once (each would be a separate number; the `digits` reducer fills digits
  of one number).

### D. Number line (SEQUENCE, MULT_GROUPS) and the ADD_SUB hint picture

- `TaskVisual` (`src/core/tasks/visual.ts`) has 12 kinds; latest code-drawn patterns: `NumberCells`, `CoordGrid`,
  `FigureGrid` with `src/ui/widgets/lattice.ts`, `geometry.ts`, `src/core/round/figureLayout.ts`. Widget contract:
  `render(..., rect)`, `setVisible`, `shown`, optional `art`. `artBlocked` (`src/core/round/artFilter.ts`) filters by
  skill type and art ids only; a code-drawn line needs no `TASK_ART` entry (so the `ArtPool` follow-up is not
  triggered).
- SEQUENCE: one skill in the programme, `E2.7.sequence_tens_100` (`{max:100, steps:[10], start:'multiple'}`,
  keypad), generator `generateSequence` (`src/core/tasks/generators/sequence.ts`, length 4–6, directions); prompt
  `pl.tasks.sequence` "Uzupełnij ciąg:" + numbers with "□", hint `sequenceHint` + arithmetic line. A 0–100 line with
  ticks every 10 is 11 ticks (kit pitch 58 px → 580 px), readable. Label only the given terms; the missing term gets
  a box.
- MULT_GROUPS (`generators/multGroups.ts`, `parseMultGroupsParams`): variants `result`/`expr`, groups 2–5, size
  2–6, max 30, visual `icons` with `PLATE_ICONS` (`src/data/measures.ts`). E3.9 has 4 skills (`mult_30` keypad,
  `mult_groups_result` tiles, `mult_groups_expr` tiles, `word_groups_30` keypad). `tests/e2e/art-tasks.spec.ts`
  forces the two MULT_GROUPS ids — keep them. New variant `jumps`: line 0..g·k (≤ 30 → pitch ≈ 25 px at 768 px;
  label every 5, never the landing tick), arcs "+k" in kit turquoise `#54BEB4`. Recommend the jumps skill asks for
  the expression on tiles (like `expr`) or the landing number with a boxed landing tick; either avoids a leak.
- ADD_SUB skills with `max ≤ 30` (all `bridge`-param'd, no `visual`): E1.3.add_sub_5, E1.5.add_sub_9,
  E1.9.add_sub_10 (tiles, `E1.ts`), E2.1.add_sub_20_units, E2.3.add_bridge_20, E2.5.sub_bridge_20 (keypad),
  E3.2.add_sub_20_bridge, E3.6.add_sub_30_nobridge, E3.8.add_sub_30_bridge (keypad). `params.max` caps operands and
  result, so a skill-level opt-in (a data param such as `line: true`, rejected by the parser when `max > 30`) is
  exact; this keeps the decision in `src/data/`.
- Hint/solution flow today: `barOf` (`view.ts`) maps phase second → `hint` bar, solution → progressive lines with
  `next`/`gotIt`, retype → last line. `TaskScene` draws the solution lines in `layout.lines` only when `view.visual`
  (or drag) exists, else under the expression (`TASK_LAYOUT.expression` beside the keypad, `expressionWide` above
  tiles, width `TASK_LAYOUT.barSpan`). There is no hint picture concept (`hintVisual`/`numberLine` absent from
  `src/`, `tests/`, `scripts/` by grep). Proposed: `RoundView.hintPicture` (hint drawing in `second`, solution
  drawing in `solution`/`retype`), a `pictureLayout` branch for it, `scripts/sample.ts` printing it (today it
  prints `describeVisual(task.visual)` only), validator rule that the hint drawing does not label the answer.
- Word round: `drawTask` passes ADD_SUB tasks with any extra field; drop `hintVisual` there (see Summary 8).

### E. Design source and copy

- Kit (read-only): `designs/martynka-maths-A-v1/style-guide.md` "Code-drawn helpers" (ivory faces, teal `#245C59`,
  4 px contours, 2 px minor ticks, active positions distinguished by geometry as well as colour) and "Font and
  spacing" (calculations 112 px, answers 90, keypad numerals 58, hints 30–34, targets ≥ 96 px, real `−`/`×`);
  `reference/written-addition.svg` (above); `reference/number-line.svg` (704 × 200, line 4 px with arrowhead, 11
  ticks pitch 58 px, labels 28 px, hop arcs `#54BEB4` 5 px rising ~61 px with arrowheads, start/end butter dots r 9);
  `helper-metadata.json` `numberLine {start:0, end:10, jumps:[4,5,6,7]}`; screenshots `task-keypad.png`,
  `hint-keypad.png`, `hint-tiles.png`, `solution-step-1.png`, `solution-step-2.png`.
- Nothing in the kit for digit boxes, the active box, borrowing, arrow graphs/tables, a line in the hint phase, a
  0–100 line, boxed ticks or k > 1 jumps → DESIGN-GAP rows from **88** (`docs/design-gaps.md`, last row 87, columns
  `| # | Slice | Gap | Provisional behaviour | Code |`).
- Copy (`src/data/pl.ts` `tasks`): `sequence` "Uzupełnij ciąg:", `sequenceHint(step, up)`, `multGroupsResult`,
  `multGroupsResultHint`, `multGroupsExpr` "Które działanie pokazuje obrazek?", `multGroupsExprHint`,
  `multGroupsCountsHint`, `multGroupsExprAnswerHint`. New keys needed: WRITTEN prompt and per-column hint/solution
  lines (carry "1 dalej", borrowing), ARROW_TABLE prompts and hints, the MULT_GROUPS jumps prompt; extended
  `childName` for E2.6, E5.2, E6.7 (and E3.9 if wanted).
- O5 (in scope, cheap): `E5.5.capacity_quarter_l`'s first hint is
  `${capacityHalfFact} ${capacityQuarterAlso}` (`src/core/tasks/generators/capacity.ts`) = 75 characters; shorten
  those keys in `pl.ts` (or split into two lines) to ≤ 64 and drop the entry from `LONG_KEYPAD_HINTS`.

### F. Unlock thresholds and save

- `unlockReady` (`src/core/curriculum.ts`): current = nearest playable step ≤ `unlockedStep[stage]`; counts current
  step's playable skills with mastery ≥ 4; unlocks at `ceil(0.5 · n)`. New skills start at mastery 0
  (`mastery[id] ?? 0`). Pinned counts in `tests/curriculumEnd.test.ts` (E3.1, E3.10, E4.6, E2.1, E5.4) do not cover
  the five steps; `tests/curriculum.test.ts` `LATER` lists WRITTEN and ARROW_TABLE (allowed without skills; nothing
  forces removal, the plan should remove them once skills exist). Save v2 (`SAVE_VERSION = 2`, fixtures
  `tests/fixtures/save-v1*.json`, `save-v2*.json`) is untouched: no new persisted shape (digits submit a number).

## Code References

- `src/core/round.ts` — `isCorrect`, `answer`, `captureFirstWrong`, `settle`, `nextSolutionStep`, `roundResults`
- `src/core/round/keypad.ts` — `keypadInput`; `src/ui/widgets/Keypad.ts`; `src/ui/widgets/geometry.ts` `keypadGrid`
- `src/core/round/view.ts` — `roundView`, `barOf`; `src/core/round/hints.ts` — `firstHint`, `solutionSteps`
- `src/core/round/pictureLayout.ts` — `pictureLayout`, `answerSpans`, `tallOf`; `src/data/layout.ts` `TASK_LAYOUT.picture`, `.keypad`, `.expression`, `.expressionWide`, `.blank`
- `src/core/round/canonicalInput.ts` — `canonicalInput`; `tests/solvableInMode.test.ts`; `src/core/round/pick.ts` — `playable`
- `src/core/tasks/visual.ts` — `TaskVisual`, `visualKey`, `validateVisual`, `describeVisual`, `visualShape`; `src/ui/widgets/TaskPicture.ts`
- `src/core/tasks/generators/addSub.ts` — `addSubHint`, `crossesTen`, `hasCarry`; `sequence.ts`; `multGroups.ts`; `capacity.ts`
- `src/core/minigames/word.ts` — `eligible`, `drawTask`, `WORD_TYPES`; `src/core/minigames/dice.ts`; `src/core/puzzles.ts`
- `src/core/curriculum.ts` — `unlockReady`, `unlockThreshold`, `floorToCalendar`, `endRound`; `src/core/save.ts` — `validLearner`, `SAVE_VERSION`
- `src/core/types.ts` — `SkillDef`, `MistakeExample`; `src/core/tasks/types.ts` — `Task`
- `src/scenes/TaskScene.ts` — `render`, `submit`, `drawPrompt`, `snapshot`, `targets`; `src/testing/e2eHook.ts`; `tests/e2e/support/hook.ts` — `answerRight`, `answerWrong`, `tapNumber`, `Snapshot`
- `tests/contentInvariants.test.ts` — `LONG_KEYPAD_HINTS`, `KEYPAD_HINT_MAX`; `tests/curriculum.test.ts` — `LATER`

## Architecture Insights

- Every answer mode so far is "a pure reducer in core + a widget + one `submit(value)`"; the round state machine is
  mode-agnostic. `digits` should follow the same shape, and add `never`-exhaustive switches where today's if-chains
  fall back silently (S-13b lesson).
- Drawings are data (`TaskVisual`) validated in core and printed by `describeVisual`; a hint picture should be the
  same data type, carried on a separate `Task` field so `task.visual`-based filters (word round, layout, uniqueness)
  keep their meaning.
- Leak rules live in core (`firstHint`'s `leaksAnswer`); the number line needs the analogous rule (no label on the
  answer tick) enforced by the validator and `tests/contentInvariants.test.ts`.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/` (S-13b): new `TaskVisual` kinds `cells`/`grid`/`figure`;
  `dragMode` branch for the clock; `canonicalInput` + `solvableInMode` introduced; e2e helper (`setClock`) before
  admitting the mode; O5 and O6/O2 follow-ups (O5 `Trigger: S-14b or the next content change to CAPACITY` —
  supported, in scope; O6/O2 — partially triggered: the line fits 190 px, the WRITTEN column does not, solved by a
  `digits` layout branch).
- `context/archive/2026-10-14-minigame-daily-puzzle/` (S-15): save v2 (`MIGRATIONS[1]` adds `variants`); word round
  filter (`drawTask`) — supported as described; `hintVisual` is a new hole in that filter.
- `context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`: "Oś liczbowa jako podpowiedź"
  (`Trigger: S-14b`) — in scope; "E1.10 `place_read_12` and E5.5 `capacity_half_l_e5`" (`Trigger: S-14b`) — the
  cause is task space (two numbers / "½ l" up to 5), a number line does not enlarge it; move to S-14d / S-14c as
  change.md proposes; "Wspólny `ArtPool`/`fitRect`" and (from `2026-10-14-art-stand-in-and-load-signal`) S14-09/S14-10
  (`Trigger: S-14b or the next widget built on ArtImage`) — not triggered in substance (all new drawings are
  code-drawn); move the trigger at archive.
- `CLAUDE.md` still says "save format v1" in the S-11 paragraph; the code is v2 since S-15 (stale doc, not a blocker).

## Related Research

- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/research.md`
- `context/archive/2026-10-14-minigame-daily-puzzle/research.md`

## Open Questions (for `/10x-plan`, with recommendations)

1. E5.2 WRITTEN with carry/borrow allowed vs no-carry only — recommend allowed (`bridge: 'any'`), teacher read decides.
2. MULT_GROUPS jumps skill answer: expression on tiles vs landing number with a boxed tick — recommend expression on
   tiles (no new leak surface, reuses `expr` distractors).
3. ADD_SUB hint picture rectangles beside the keypad (under the expression at y ≈ 520–860) and above the E1 tiles
   (y ≈ 560–700) — fix in the plan as `TASK_LAYOUT` numbers, confirm at the visual gate.
4. Borrowing notation in the solution drawing (crossed-out digit + small reduced digit above + small 1 before the
   ones) — DESIGN-GAP; the teacher read confirms.
5. Where the `digits` boxes take keys from: extend `Keypad` with a raw key callback vs a second keypad widget —
   recommend extending `Keypad` (one key grid, `targets.keys` unchanged for e2e).
