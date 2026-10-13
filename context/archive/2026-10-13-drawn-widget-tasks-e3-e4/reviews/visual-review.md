# Visual review — drawn-widget-tasks-e3-e4 (S-13)

Step: visual gate of autonomous run 2026-10-13-s12-s14, after impl-review (`MERGE: CLEAR`, `7ab1e78`; F1 fixed in
`1965c28`: before it the clock face was never drawn). Three discrepancies found on `7ab1e78`, fixed in `26a25df`; every
frame was re-captured on the fixed tree, 1440×900 and 1024×768. Frame list, routes, values and what was not captured:
`screenshots/README.md`.

## Capture

Playwright only: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder (as in the S-10, S-11, S-12 gates)
against the e2e-hook build on 4399, reusing `tests/e2e/support/{welcome,hook}.ts`; parent path to E3/E4 with
`?e2eSkills=<skill id>`, then real taps, `answerWrong`, raw CDP touch drags (the carry frame is taken between the moves and
touchEnd). Chromium launched in this subagent session as a plain `npx playwright test --config=…` command. The folder
was moved out of the repo before the lint gate. The hook's read-only snapshot gave each frame's drawing and answer
(logged per frame) for the hand-checks below. Claude in Chrome was not needed: no state is static enough to reach without
taps or drags.

## Discrepancies and fixes (`26a25df`)

| # | Found (first capture, `7ab1e78`) | Why it matters | Fix |
|---|---|---|---|
| V1 | `E3.4.data_diff_10` beside the keypad: the prompt ("Dzieci głosowały na swój ulubiony kolor. O ile więcej dzieci zagłosowało na kolor zielony niż na kolor żółty?") wrapped to five lines at 64 px in the 800 px column and ran over the top of the chart (axis numbers and the tallest column hidden under text), both viewports; in the solution phase it covered the shrunken chart entirely | The child cannot read the bars the question is about; the layout (`TASK_LAYOUT.picture`, gap row 52) assumed at most three keypad lines | `drawPrompt`: a pictured task's sentence prompt steps its font from 64 down to at most 44 (`TASK_LAYOUT.picture.promptMinSize`, step 4, pure `fitSize`) until it ends `promptGap` (16) above the picture rectangle; `render`: the picture rectangle moves down under the prompt if it still does not fit, bottom kept (pure `belowPrompt`). Frames 15/16: four lines, chart fully below. Unit tests `tests/pictureLayout.test.ts` "belowPrompt …", "fitSize"; deliberate break (`belowPrompt` ignoring the prompt) → 2 tests RED, restored → 13/13. Gap row 52 updated |
| V2 | Ruler: "cm" ran into the last digit ("15cm", "10cm" overlapping glyphs) | Kit `reference/ruler.svg` puts "10" at x 620 and "cm" at 661, a visible gap | `Ruler` `RULER.unitX` 27 → 41 (the kit's distance); frames 08–11 show "15 cm" / "10 cm" inside the body |
| V3 | Drag tray: the 10 rod at `trayScale` 1.3 (234 of 244 scene px) touched the tray tile's top border | Reads as the rod sticking out of its tile | `TASK_LAYOUT.drag.trayScale` 1.3 → 1.2; frames 22–26 show a margin. The carried copy follows the same scale |

## States (judged against the kit)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.4 | clock full hour, half, quarter, 5 min, 24 h | 01, 04–07 | dial matches kit `helpers-reference.png` (ivory face, oak rim, 60 ticks, numerals 1–12, teal minute hand, dark hour hand, butter hub); about the kit's size at desktop (≈293 scene px across vs the kit's 300); hands right in every frame checked (below) ✓. Kit caption "3:30" vs "4.30" style: [human] 4.6 |
| 4.4 | clock with hint bar, with solution steps beside | 02, 03 | hint bar under the tiles (existing S-04 bar), dial unchanged; in the solution the dial moves left and the lines sit right of it, tiles below, nothing overlaps ✓ |
| 4.4 | ruler cm (from 0 and shifted), mm, hint, solution | 08–11 | kit ruler look (butter body, teal ticks, half-cm ticks, digits under); the segment floats above with lead lines (gap row 56); the shifted segment starts on a whole cm ✓; solution line under the ruler, keypad untouched ✓ |
| 6.8 | base-ten read E3.6 / E4.8 | 12, 13 | flat 10×10, rod of 10, cube, kit colours; counts right ✓. Observation O1 (ones split over two rows) |
| 6.8 | chart `most` (tiles with labels), `diff` (keypad), chart in solution | 14–16 | columns in palette colours, axis 0–10 every 1, labels under columns, no values on columns (gap row 53) ✓ after V1; long labels shrink to fit the column (F6). O2: chart small in the keypad solution |
| 6.8 | unlock card | 30 | "Nowa umiejętność!", book icon, "Zegar: minuty i kwadrans", "Dalej" — kit `unlock.png` layout ✓ (E4.3, not E3.3: see README) |
| 7.6 | select none / two marked / after a wrong set / solution / retype | 17–21 | six tiles in one row, marked tiles green with a tick (kit `.answer.selected`), "OK" under them; the wrong set clears and the hint bar shows; in the solution the hint line sits under the prompt, "Już wiem" under "OK"; retype marks the whole set ✓. Nothing over the notebook edge |
| 9.7 | drag start, carrying, on the mat, dropped outside, tap-removed, hint, solution, summary | 22–29 | tray with "Dziesiątki"/"Jedności", dashed mat, "OK" under the tray; the carried rod follows the finger over the mat; 2 rods + 3 cubes counted on the mat (hook `{ten 2, one 3}`); the off-mat cube went back (mat unchanged); a tap took a cube off (`one 2`); hint bar under mat and tray; in the solution the lines take the tray's place, mat empty (gap row 55); summary "+7", "Runda bez błędu! +2" ✓. O3: mat blocks small |

## Hand-checked against the task's answer (mandatory)

- **Clock, `tablet-04`** (4.30). Rule `clockHandAngles`: hour = ((h mod 12) + m/60)·30°, minute = 6·m. 4.30 → hour 135°, minute 180°. Measured on
  `tablet-04` from the hub (512, 385): minute hand tip straight down to the 6 (180°) ✓; hour hand tip (541, 412):
  atan2(dx 29, −dy −27) = 133° ≈ 135°, between 4 and 5 ✓ → the dial reads 4.30 = answer "4.30" ✓. On the first capture (frame since replaced; the clock code was
  not touched by the fix) 1.35: hour tip (763, 413) from hub (720, 452) → 47.8° vs rule 47.5° ✓,
  minute to the 7 = 35 min ✓.
- **Ruler, `desktop-08b`** (`fromMm 20, toMm 120`, answer 10): segment caps at x 266 and 610, exactly over the digits "2"
  (266) and "12" (610); 610 − 266 = 344 px = 10 × 34.4 px per cm (digit pitch "0"→"1" 198→232) → 10 cm ✓.
  **`tablet-11`** (`0–41 mm`, answer 41): right cap at x 290; digit "4" at 286, 35 px per cm → 3.5 px per mm → 286 + 3.5 =
  289.5 ✓.
- **Bars, `tablet-15`** (Czerwony 7, Zielony 8, Różowy 3; answer 5): axis 0 at y 515, 10 at y 347 → 16.8 px per unit;
  column tops 397, 380, 465 → (515−397)/16.8 = 7.0, (515−380)/16.8 = 8.0, (515−465)/16.8 = 3.0 ✓; zielony − różowy =
  8 − 3 = 5 = answer ✓.
- **Blocks, `desktop-13`** (109): 1 flat, 0 rods, 9 cubes (1 + 8) ✓; `tablet-13` (358): 3 flats, 5 rods, 8 cubes ✓;
  first capture (replaced) 990: 9 flats, 9 rods, 0 cubes ✓.

## Fit and overlap (measured on the frames)

Every drawing stays inside the notebook (also asserted by `drawn-tasks.spec.ts` (a) for the clock), never under the
tiles, the keypad or the bar; after V1 no prompt touches a drawing. The keypad column starts 26 px (desktop) right of the
widest drawing (blocks 990). Tablet legibility (1024 px wide, scale 0.533): clock numerals ≈ 11 CSS px, ruler digits
≈ 12 CSS px, chart axis ≈ 9 CSS px — about the kit's own sizes scaled to the tablet, readable for the main reading
(hands, segment ends, column tops); the fine print is secondary.

## Observations (not fixed, follow-ups with triggers)

- O1: base-ten reading wraps the ones into a second row under the rods/flat (28 → 3 cubes beside the rods, 5 under them;
  109 → 1 + 8). Counts are right, but the ones do not read as one group. `blocksLayout` `flow` (shared with the mat).
- O2: a chart in the keypad solution phase gets 190 scene px of height (`keypadSolution.picture`): axis numbers ≈ 6 CSS
  px at 1440, unreadable; the bars still show which is taller.
- O3: blocks on the mat are much smaller than in the tray (3 × 3 cells per kind in 944 × 460): cubes ≈ 14 CSS px at 1440,
  ≈ 10 at 1024. Countable, small for a 7-year-old's finger to tap off ([human] 9.8 will tell).
- O4: the hint/solution bar text (S-04 `FeedbackBar`) wraps to three lines at a small size on the clock hint (frame 02);
  not S-13 code.
- O5: `clock_read_quarter`/`_5` also draw halves (tablet 05: 1.30, tablet 06: 11.30) — known F12, [human] 10.7.

## Gate in this step (after the fix, on `26a25df`)

lint OK; typecheck OK; vitest 1482 passed (contract baseline 1247 on `b57433c`, +235; branch before this step 1477, +5 new
tests); deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0` each; `npm run build` `e2e hook: absent (2 chunks checked)`;
`npx playwright test --config=<abs>` 42 passed (baseline 37, +5); servers 4397/4398/4399 not listening afterwards.

VISUAL: PASS — every drawn type captured in a real round at 1440×900 and 1024×768 (clock full/half/quarter/5 min/24 h, ruler cm from 0 and shifted, mm, base-ten E3.6/E4.8, chart most/diff/solution, select ×5 states, drag start/carry/on-mat/off-mat/tap-remove/hint/solution, summary, unlock card); three discrepancies fixed in 26a25df (long prompt over the chart, "cm" into the last digit, tray rod on its border); dial 4.30, ruler 2–12 cm and 0–41 mm, bars 7/8/3 and block counts 109/358 hand-checked; O1–O3 legibility notes left as follow-ups
