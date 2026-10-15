# Visual review — number-line-written-arrows (S-14b)

Step: visual gate of autonomous run 2026-10-14-save-s13b-s15-s14b, after impl-review (`MERGE: CLEAR`, `3782115`). Six
discrepancies found on `3782115`, fixed on the branch in three commits (`f966f61`, `33a053b`, `2bb41dd`); every frame was
re-captured on the fixed code at 1440×900 and 1024×768 (101 frames, 50 states; the README says which commit each frame shows).
Frame list, routes and values: `screenshots/README.md`.

## Capture

Playwright only, as in the S-13, S-13b, S-14 and S-15 gates: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder
against the e2e-hook build on 4399, reusing `tests/e2e/support/{welcome,hook}.ts` (`passWelcomeAsParent`, `answerWrong`,
`answerRight`, `snapshot`, `targets`, `tapScene`); `?e2eSkills=<id>&e2eVariant=off`. Chromium launched in this subagent session as a
plain `npx playwright test --config=<abs path>` (a command with a redirect or a `sleep` prefix ran sandboxed and hit MachPort).
Claude in Chrome was not used: every state needs canvas taps (keypad keys, tiles, "Następny krok"), see profile § 8. The spec was
moved out of the repo before each lint gate.

## Discrepancies and fixes

| # | Found (first capture, `3782115`) | Why it matters | Fix |
|---|---|---|---|
| V1 | Solution lines beside the column wrapped inside equations: "Jedności: 9 + / 3 = 12. Piszę", "dziesiątkę: 15 / − 8 = 7."; the graph solution left "9." alone on the last line | The child reads the solution line by line; a broken equation is not readable as one step | `f966f61`: `keepTogether` (`src/core/text/nowrap.ts`, no-break spaces inside every number-operator-number chain and before a number that ends the line) in `SolutionSteps.measure`; `TASK_LAYOUT.picture.digits` column 400 wide (x 216), strip 392 (x 632..1024) instead of 440 / 320. Tests `tests/nowrap.test.ts` (red: module missing), `tests/answerModes.test.ts` "the solution strip … holds a three-digit equation" (red: 320 < 352) |
| V2 | Borrow: the small "1" of the borrowing column sat in the mark row with the lenders' digits — "7 9 1" over 805, "7 1" over 84 — and read as a number | Gap 91 says "a small 1 before the digit"; in the mark row it looks like part of 791 | `f966f61`: `WrittenColumn.render` draws it raised before the digit ("¹5"), offsets in `TASK_LAYOUT.written.borrowOne` (also clears F8's `12 * s` / `22 * s`). Widget only, judged on screen: 903 − 457 now "8̸ 0̸ ¹3" with 8 and 9 above |
| V3 | Hint line labels collided: start "26" and "25" printed as "2526" (26 − 22), the box at 4 covered the "5" (13 − 9, 26 − 22) | Unreadable numbers on the very drawing that explains the hint | `f966f61`: `hintLine` (`src/core/tasks/generators/addSub.ts`, now exported) leaves out a multiple of five on the tick next to the start, a landing or the box, on lines of more than one ten only (one ten has 58-unit ticks). Tests `tests/hintVisual.test.ts` "hintLine labels …" (break: rule removed → red) |
| V4 | E3.9 jumps line (0..30, tiles task) drawn in the 600-px `tiles` rectangle at scale 0.61: labels about 9 CSS px, "+6" about 10 px on the tablet | Below the 12-CSS-px floor; "5" and "6" were hard to tell apart | `f966f61`: new `VisualShape` `'long'` (`visualShape`: numberLine), `pictureLayout` gives a long drawing of a tiles task `TASK_LAYOUT.picture.long` (full notebook width; solution: line above, lines under it, both above the tiles). Tablet labels 20 CSS px (first try) / 13.6 px (solution). Tests `tests/pictureLayout.test.ts` "a long drawing …" (red: shape `wide`, label px < 12); `tests/visual.test.ts` pin updated |
| V5 | On a dense hint line the 52-unit box on 11 covered the "0" of the landing "10" (4 + 7, 9 + 2), and "10" "11" on neighbouring ticks ran into "1011" (11 − 5, 21 − 17) | Same as V3, on both essential labels | `33a053b`: `box.denseWidth` 30 on dense lines; `labelRows` (`src/core/round/lineLabels.ts`) drops the second of two labels on neighbouring ticks a row (`labelStagger` 30). Tests `tests/lineLabels.test.ts` (break: stagger off → 2 red), `tests/pictureLayout.test.ts` "the box of a dense number line" (red: 26 + 14 ≥ 30) |
| V6 | The ADD_SUB hint line of a 0..30 task (31 ticks) in the 768-px hint rectangle: labels 11.7 CSS px on the tablet | Under the 12-px floor the gate checks | `2bb41dd`: `TASK_LAYOUT.picture.hint.keypad` 798 wide (x 226..1024, still before the keypad at 1040): 12.2 px. Test `tests/pictureLayout.test.ts` "the hint number line beside the keypad" (red: 11.7) |

## States (judged against the kit)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 8.7 | E5 column empty, partly filled (active box), full, hint with carry, solution steps beside it, retype, retype done, right first try; E5 subtraction with a borrow; E6 three digits (borrow across zero, two carries) | w01–w17 | Digits, sign and rule as kit `written-addition.svg` (right-aligned columns, sign left, teal rule); carry is the kit's gold circle above the next column; no collision of marks at scale 1.3 (two columns) or 1.22 (three) — two circles over 348 + 397 stand 75 px apart. Active box butter with a thick border, locked boxes white, settled boxes green (gap 90). Boxes 48 × 64 CSS on the tablet (display only), keypad keys 83 × 55 CSS. Column stays in place in every phase; after V1 the lines beside it keep each equation whole. Borrow after V2 (gap 91, [human] 8.8) |
| 5.7 | Graph with empty output / input, hint, solution; table, hint, all lines; E2.7 sequence line, hint, solution (line in 768 × 190), retype; E3.9 jumps with tiles, hint, solution, retype | a01–a08, n01–n06b | Graph: circles and the rule over the arrow, dashed butter "?" for the empty field, 30+ px clear of the keypad; table: rule column "−1 ↓" left of two tile rows, bottom row 14 px above the hint bar (gap 89). E2.7: 0..100 every 10, labels only on the terms, box on the missing term, readable at 17 CSS px (font) on the tablet. E3.9 after V4: arcs with "+k", gold start dot, labels every 5, as kit `number-line.svg` |
| 6.6 | ADD_SUB first try (no line), hint with the line (addition through ten, subtraction), solution step 1 and last step with line and lines, retype | h01–h03 | No line on the first try; after a miss the line under the expression (gap 92); the hint bar keeps "Spróbuj jeszcze raz" + the first line; solution lines under the line, centred, whole. After V3/V5/V6 no label touches another or the box; smallest label 12.2 CSS px (0..30) |

## Hand-checked against the task's answer (mandatory)

- **Written**: 39 + 36 (w04 desktop): 9 + 6 = 15, write 5 carry 1; 3 + 3 + 1 = 7 → 75 = answer 75, lines say the same ✓. 903 − 457
  (w12–w14 desktop): 13 − 7 = 6; tens 0 → 10 from the hundreds (9 → 8), lends one (10 → 9): 9 − 5 = 4; 8 − 4 = 4 → 446 = answer ✓;
  marks 8 over 9, 9 over 0, ¹3 ✓. 703 − 439 (tablet): 13 − 9 = 4, 9 − 3 = 6, 6 − 4 = 2 → 264 ✓. 348 + 397: 15 → 5 c1, 4 + 9 + 1 = 14 →
  4 c1, 3 + 3 + 1 = 7 → 745 ✓. 42 − 18: 12 − 8 = 4, 3 − 1 = 2 → 24 ✓.
- **Arrows**: 5 +7 → 12 ✓; ? −5 → 13: the hint "do 13 dodaj 5" gives 18 = answer ✓; table −1: 11 → 10 ✓; tablet +5: 12 → 17 ✓.
- **Lines**: E2.7 ?, 10, 20, 30 → 0, box on tick 0 ✓; E3.9 five jumps of 5 from 0 land on 25 = 5 · 5 ✓, tablet 5 · 6 = 30 ✓.
  9 + 2: 9 + 1 = 10, 10 + 1 = 11, box on 11 ✓; 13 − 9 (first capture): 13 − 3 = 10, 10 − 6 = 4, box on 4 ✓; 28 − 21: 28 − 20 = 8,
  8 − 1 = 7, box on 7 ✓; 26 − 22 → labels after V3 `[0, 6, 10, 15, 20, 26, 30]`, box 4 (unit test and first-capture frame) ✓.
- **Stars**: w07 right first try → counter 1 → 2, "Brawo! +1 ★"; w06 retype → counter unchanged, "Brawo!" without a star ✓.

## Fit and legibility on the 1024 tablet

Smallest text after the fixes: hint bar three lines ≈ 13 CSS px (as in S-15), number-line labels 12.2 px (0..30 hint line), 13.6 px
(E3.9 in the solution), column marks ≈ 22 px, solution lines ≈ 23 px. Tap targets: keypad keys 83 × 55 CSS, expression tiles
135 × 72, "Następny krok"/"Już wiem" ≥ 110 × 50. No text crosses another element in any captured state.

## Observations (not fixed, follow-ups with triggers in `follow-ups/review-fixes.md`)

- O1: the E2.7 prompt wraps its last term alone ("Uzupełnij ciąg: 70, 60, / 50, ▢" or "… 20, / 30"): `TaskScene.drawSentence`
  (`wrapBlankLines`) wraps the blank-box sentence, `keepTogether` does not reach it.
- O2: the E2.7 line labels only the sequence terms: on "?, 20, 10, 0" the ticks above 30 carry no number at all; a 0 and 100 anchor
  might help (gap 88 says "numbers under chosen ticks").
- O3: the hint of a one-jump ADD_SUB task (10 − 2, 18 − 10) is the prompt again ("Oblicz. dziesięć minus dwa") — the line is
  the only new help; content question for the author's read ([human] 9.6, F4).
- O4: the "+1" arc of a one-unit jump has no label (narrower than `minLabelSpan`), by design; the hint lines name it.
- O5 (F10, partly seen): the hint draws the first carry, or the whole first borrow chain (8, 9, ¹3 over 903) — so a borrow across
  zero shows the tens' and hundreds' marks before the hint text reaches them. Author's read with [human] 8.8.

## Gate in this step (after the last fix, working tree = `2bb41dd`)

lint OK; typecheck OK; vitest 2445 passed (branch before this step 2429, +16 new tests; contract baseline 2326 on main, +119);
deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0` each; teacher read of the changed hint-line labels in `sample -- E2/E3 --count 6`
(E2.1, E2.3, E2.5, E3.2, E3.6, E3.8: every line keeps its start, landings and box; only fives next to them on 2–3-ten lines drop);
`npm run build` `e2e hook: absent (2 chunks checked)`; `npx playwright test --config=<abs> --workers=4` 77 passed (branch before 77,
+0; baseline 71, +6), 5.2 min, run after each of the three fix commits; ports 4397/4398/4399 not listening afterwards.

VISUAL: PASS — every [visual] state of rows 5.7, 6.6 and 8.7 captured at 1440×900 and 1024×768 (written column empty/partly/full/hint with carry and borrow/solution beside it/retype/correct for E5.2 and E6.7 incl. a borrow across zero; arrow graph out/in and table with hints; E2.7 sequence line and E3.9 jumps; ADD_SUB hint line for addition, subtraction and 0..30); six discrepancies fixed (equations broken in the solution strip, borrow "1" read as part of a number, colliding hint-line labels, 9-px E3.9 labels, box over a neighbour label and "1011", 11.7-px 0..30 hint labels); O1–O5 left as follow-ups
