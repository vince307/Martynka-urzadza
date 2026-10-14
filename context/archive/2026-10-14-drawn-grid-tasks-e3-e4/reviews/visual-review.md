# Visual review — drawn-grid-tasks-e3-e4 (S-13b)

Step: visual gate of autonomous run 2026-10-14-save-s13b-s15-s14b, after impl-review (`MERGE: CLEAR`, `e48c9cb`). Three
discrepancies found on `e48c9cb`, fixed on the branch in `7aa3485`; every frame was re-captured on the fixed tree,
1440×900 and 1024×768 (70 frames, 29 states). Frame list, routes, values and what was not captured:
`screenshots/README.md`.

## Capture

Playwright only, as in the S-13 and S-14 gates: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder against the
e2e-hook build on 4399, reusing `tests/e2e/support/{welcome,hook}.ts` (`passWelcomeAsParent`, `answerWrong`, `setClock`,
`tapScene`, `toPage`); `?e2eSkills=<skill id>` for each new skill; the held hand by a raw CDP touch left down for the frame.
Chromium launched in this subagent session as a plain `npx playwright test --config=<abs path>`. The folder was moved out of
the repo before the lint gate. Claude in Chrome was not used: every state needs taps, wrong answers or a held drag, which
synthetic pointer events in Chrome cannot drive on the Phaser canvas (profile § 8).

## Discrepancies and fixes

| # | Found (first capture, `e48c9cb`) | Why it matters | Fix (`7aa3485`) |
|---|---|---|---|
| V1 | Triangle (E4.7) drawn from a fixed shape `[[0,0],[6,0],[rng,4]]` whatever the labels: on the tablet the side labelled 4 cm was drawn ≈ 190 px, the 12 cm side ≈ 150 px | A 7–8-year-old reads the drawing against the numbers; a "short" side drawn longest contradicts the labels | `perimeter.ts` `triangleShape`: the longest side becomes the base, the apex from the law of cosines, a flat apex raised to 0.25 of the base (both slanted sides grow by the same squared height, so the order holds). Test `tests/perimeter.test.ts` "triangle: the drawing keeps the order of the labels" (red on the old shape: `side 1 (7 cm) vs 2 (2 cm): expected 5 to be greater than 5`) |
| V2 | First hint of the magic square (102 characters) wrapped into 3 lines + "Spróbuj jeszcze raz" in the 96 px bar beside the keypad; `FeedbackBar.update` shrinks the text to fit: 36 × 0.5 = 18 scene px = **9.6 CSS px** on the 1024 tablet. Same for E5.12 rectangle side (76 characters) | Below the 12 CSS px floor; the kit `hint-keypad.png` keeps the bar at two lines of full-size text | `pl.tasks.puzzleMagicHint` → "Wiersze, kolumny i przekątne mają równe sumy. Dodaj pełną linię." (64), `perimeterSideRectHint` → "Obwód to dwa razy suma dwóch sąsiednich boków." (46): 2 wrapped lines + "Spróbuj jeszcze raz" = 3 lines, 36 × 0.67 = 24 scene px = **12.8 CSS px** on the tablet (`tablet-02`, `tablet-20h`). Content invariant `tests/contentInvariants.test.ts` `KEYPAD_HINT_MAX = 64` for every keypad skill (red for both skills before the fix); the only older offender, `E5.5.capacity_quarter_l` (75), is a named exception and a follow-up |
| V3 | Last solution line of "ustaw zegar" read "Zegar pokazuje 6.00." while the dial beside it still showed the start pose 3.00 (`tablet-14d` first capture) | The line contradicts the drawing the child is looking at | `pl.tasks.clockSetAnswerHint` → "Wtedy zegar pokaże 6.00." (the child sets it in the retype). Test in `tests/clock.test.ts` set block: no hint line contains "Zegar pokazuje" (red for all four set skills before the fix) |

Teacher read after the fixes (`npm run sample -- E3|E4|E5 --count 6`): E3.5 magic square — the bar names the rule and the
method, then "Pełny wiersz: 9 + 7 + 5 = 21.", "W kolumnie z pustym polem są 3 i 7.", 21 − 3, 18 − 7 = 11; "pełna linia"
ties to "Pełny wiersz/Pełna kolumna/Pełna przekątna" in the next step. E4.3 set: "Krótką wskazówkę ustaw między 1 a 2. |
Długą wskazówkę ustaw na 9, czyli 45 minut po pełnej godzinie. | Wtedy zegar pokaże 1.45." E4.7 triangle: sides listed
longest first (17 + 16 + 6 = 39), each set a triangle. E5.12 rectangle: "Obwód to dwa razy suma dwóch sąsiednich boków. |
44 : 2 = 22 | 22 − 15 = 7" — the halving step stays in the solution. No numeral or gender agreement involved.

## States (judged against the kit)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 5.7 | magic square (keypad), pyramid, square with hint, square with steps at the keypad incl. the F1 gap line, grid "where" (tiles), grid "what" with hint | 01–06h | cells in the kit's leaf fill with 4 px teal outline, dashed butter "?" cell (gap 73); cell digits ≈ 18 CSS px tall on `tablet-01`, in the 190 px solution strip ≈ 9 px tall (O6); the gap line "W kolumnie z pustym polem są 11 i 12." shows at step 3 ✓. Grid: column letters and row numbers 30 units × 0.85 × 0.533 = 13.6 CSS px font on the tablet, shapes ≈ 22 px in 35 px cells; hint bar text 2 lines at full size under the tiles ✓ (O1) |
| 6.7 | rectangle with sides, triangle, perimeter with hint, steps beside the keypad in the 190 px strip | 07–10b | side labels 30 units: ≈ 15 CSS px on the tablet in the first phase, ≈ 14 px in the solution strip (`minCell` 36 keeps the figure readable); after V1 the triangle matches its labels; sum line "2 + 2 + 2 + 2 = 8" under the hint line, "Już wiem" below ✓ |
| 8.6 | set clock E3 (start pose), hand held, E4 quarter after setting, hint, steps beside the dial | 11–18d | dial is the kit clock (`helpers-reference.png` "Zegar": oak rim, 60 ticks, teal minute hand, deep-teal hour hand, butter hub); handle rings on the tips (gap 77) ≈ 60 CSS px on the tablet, the held ring larger and butter-filled; a full-hour clock has no minute ring ✓; "OK" 96 scene px tall right of the dial; hint bar spans the tiles width; E3 hints speak of the short hand only and "Długa wskazówka zostaje na 12, bo to pełna godzina." (F2) ✓; solution lines right of the dial at ≈ 16 CSS px. O2, O3 |
| 9.6 | side of a square from the perimeter, composite on a lattice (keypad and solution step), "Nowa umiejętność!" E5.12 | 19–23 | square drawn without labels (the side is the answer) ✓; rectangle with the one given side labelled; composite on the lattice in the kit grid colours, notch lattice visible, 5 rows fit the 190 px strip (gap 78), sum line under it ✓; unlock card as kit `unlock.png` with "Obwody i boki" ✓. O4 |

## Hand-checked against the task's answer (mandatory)

- **Magic square, `desktop-01`** (answer 5): rows 7 + 8 + 3 = 18, 2 + 6 + 10 = 18; last row 9 + 4 + ? = 18 → 5; diagonal
  7 + 6 + ? = 18 → 5 ✓. **`tablet-01`** (10): 8 + 7 + 12 = 27, 13 + 9 + 5 = 27, 6 + 11 + ? = 27 → 10; diagonal 8 + 9 + 10 = 27 ✓.
- **Pyramid, `desktop-04`** (27): top = 10 + 17 = 27, and 10 = 2 + 8, 17 = 8 + 9 ✓. **`tablet-04`** (1): 5 = ? + 4 → 1; 10 = 4 + 6 ✓.
- **Grid, `desktop-05`** (A1): triangle in column A, row 1; distractors "1A" (order swapped) and "A2" ✓. **`tablet-06`**: hook answer "kwadrat" at the asked cell ✓.
- **Rectangle, `desktop-07`**: 5 + 16 + 5 + 16 = 42 = answer ✓; **`tablet-10b`** (first capture): 2 + 2 + 2 + 2 = 8 on screen ✓.
- **Triangle, `tablet-08`** (32): 15 + 4 + 13 = 32. Drawn: base (0,0)–(6,0) = 15 cm → 2.5 cm per unit; apex (5.04, 1.5):
  right side √(0.96² + 1.5²) = 1.78 units = 4.45 cm (apex raised: the true 4 cm triangle is flat), left side √(5.04² + 1.5²) =
  5.26 units = 13.1 cm ✓ — order 15 > 13 > 4 kept. **`desktop-08`**: 20 + 8 + 18 = 46 ✓.
- **Composite, `desktop-21`** (26): vertices (0,4) (7,4) (7,0) (4,0) (4,2) (2,2) (2,0) (0,0): 7 + 4 + 3 + 2 + 2 + 2 + 2 + 4 = 26 ✓.
  **`tablet-22b`** (22): 4 + 5 + 1 + 2 + 1 + 2 + 2 + 5 = 22 ✓ (first capture's screen line 7 + 2 + 1 + 1 + 5 + 1 + 1 + 2 = 20 matched its figure too).
- **E5.12, `tablet-19`** (2): perimeter 8 cm : 4 = 2 ✓; **`desktop-19`**: 12 : 4 = 3 ✓.
- **Clock, `desktop-16`** (3.00): minute hand on 12, hour hand on 3 (hook 3.00) ✓; **`tablet-16`**: hook 1.00, hour hand on 1 ✓.
  Held frame: hook `carrying: 'hour'`, hour 12 / 1 after a 75° turn from 10 / 11 (2.5 hour marks, snapped) ✓.

## Fit and overlap

Every drawing stays inside the notebook and off the keypad, the tiles and the bar in every captured state; the hint bar
starts below the lowest cell of the magic square (gap ≈ 8 CSS px on the tablet). The clock "OK" never overlaps the dial or
the bar. Smallest text on the tablet after the fixes: solution lines beside the keypad ≈ 12–13 CSS px (shared with every
keypad task since S-04), grid letters 13.6 px font, hint bar 12.8 px at three lines.

## Observations (not fixed, follow-ups with triggers)

- O1: the coordinate grid uses 175 × 140 CSS px of a 600 × 294 area on the tablet (`TASK_LAYOUT.coord.maxScale` and the
  tiles picture height); letters are 13.6 px. A larger cell would help small fingers read the grid. Cosmetic.
- O2: a handle ring sits on the numeral the tip points at (translucent, the digit stays faintly visible); with both hands
  near each other (9.45) the rings overlap. By design (gap 77); the tablet check is `[human]` 8.7.
- O3: during the solution the dial keeps the start pose and the step lines describe the target; showing the target pose
  on the last step would teach more, but changes `ClockSet.render` (design decision for the author).
- O4: the composite figure is white on the lattice; the kit "Figury na siatce" fills figures leaf / butter. Cosmetic.
- O5: `E5.5.capacity_quarter_l` (S-14) has a 75-character keypad first hint — the same 4-line shrink as V2; left as the
  named exception in `LONG_KEYPAD_HINTS`.
- O6: in the keypad solution strip the magic square shrinks to ≈ 35 CSS px cells with ≈ 9 px digits on the tablet; the
  solution lines repeat the numbers they use, so the task stays solvable. Same class as S-13 O2 / S-14 O1 (190 px strip).

## Gate in this step (after the fix, working tree = `7aa3485`)

lint OK; typecheck OK; vitest 2224 passed (contract baseline 1927 on `9554e96`, +297; branch before this step 2223, +1 new
test, the other new checks are assertions inside existing tests); deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0` each;
`npm run build` `e2e hook: absent (2 chunks checked)`; `npx playwright test --config=<abs>` 63 passed (baseline 57, +6), 4.1 min;
ports 4397/4398/4399 not listening afterwards.

VISUAL: PASS — every new view captured in a real round at 1440×900 and 1024×768 (magic square and pyramid with hint and solution incl. the gap line, grid "where"/"what" with hint, rectangle/triangle/perimeter hint and solution strip, E5.12 square and rectangle side, E6.3 composite with solution, clock to set E3 start/held/hint/4 solution steps, E4 start/set/hint/4 solution steps, E5.12 unlock card); three discrepancies fixed (triangle not to its labels, 9.6 px keypad hint text, "Zegar pokazuje" beside a start-pose dial); every drawn value hand-checked; O1–O5 left as follow-ups
