# Visual review — art-tasks-all-stages (S-14)

Step: visual gate of autonomous run 2026-10-13-s12-s14, after impl-review (`MERGE: CLEAR`, `0c5b25e`; follow-up F3 deferred
here). Four discrepancies found on `0c5b25e`, fixed on the branch in `f4f0c82` (the commit right after
this capture); every frame was re-captured on the fixed tree, 1440×900 and 1024×768 (58 frames, 29 states). Frame list,
routes, values and what was not captured: `screenshots/README.md`.

## Capture

Playwright only, as in the S-13 gate: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder against the e2e-hook
build on 4399, reusing `tests/e2e/support/{welcome,hook}.ts`; parent path to E1–E6 with `?e2eSkills=<skill id>`, then real
taps and `answerWrong`; the unlock card by the child path (age 6, `?e2eMonth=0`). Chromium launched in this subagent session
as a plain `npx playwright test --config=…` command (a piped variant hit the sandbox's MachPort error once and was re-run
plainly). Before each frame the spec polled the hook until `art` was non-empty and every entry `loaded: true`, so no frame
shows the stand-in box; the frame's drawing and answer were logged from the hook for the hand-checks. The folder was moved
out of the repo before the lint gate. Claude in Chrome was not used (no state is reachable without taps and wrong answers).

## Discrepancies and fixes

| # | Found (first capture, `0c5b25e`) | Why it matters | Fix |
|---|---|---|---|
| V1 = F3 | Thermometer beside the tiles (E3.11, E6.1) in the 600×294 tiles rectangle: housing ≈ 98 CSS px tall on the tablet, 2.1 CSS px per degree; −8 vs −12 °C 9 px apart, the liquid barely visible. Beside the keypad (378 px) 3.0 px/°C desktop | A 7–9-year-old cannot read the column against the scale; the task becomes guessing between tiles | **Fixed.** `TASK_LAYOUT.picture.tall` (replaces `keypadBeside`): the thermometer keeps one column on the left of the notebook in every phase (tiles 264×630 from y 330, keypad 240×540 from y 420, both down to the bar's bottom). Pure `answerSpans` moves the tiles row (`AnswerTiles.setChoices` row span) and the bar (`FeedbackBar.update` span) right of the column; solution lines above the tiles or beside the column. Now 4.9 CSS px/°C desktop, 3.5 tablet (tiles); 4.2 / 3.0 (keypad) — 1.7× and 1.4×. Tests `tests/pictureLayout.test.ts` "pictureLayout of a tall drawing (S-14, visual gate F3)"; e2e `art-tasks.spec.ts` reads `TASK_LAYOUT.picture.tall.keypad` |
| V2 | Scale labels ("+30", "−10") drawn left-aligned from x 301 and, at the 22 px floor, ran over the housing's teal rim (both viewports, every thermometer) | Kit `reference/thermometer-face.js` centres them on x 301 (`textAlign 'center'`); the overflow hid digits | `Thermometer.render`: label centred on `label.x`, never starting closer than `label.gap` (13 housing units, the kit's distance) to the major tick end |
| V3 | Weights on the scale 52 units in rows of 3: on the tablet a weight ≈ 27 CSS px, its "10 dag"/"50 dag" plate ≈ 4 px — 10, 20 and 50 dag look the same | The task is to add the weights' masses; unreadable labels make it unanswerable | `TASK_LAYOUT.scale` `weightSize` 52 → 84, `perRow` 3 → 2, `rowLift` 38 → 60; test "scaleLayout readability (visual gate S-14)" (a weight ≥ 75 scene px in the keypad picture; was 51) |
| V4 | Framed groups laid one row of icons per frame: 5 × 6 apples ≈ 18 CSS px desktop, 2 × 5 pears ≈ 15 px on the tablet, the 294 px height mostly empty | Counting 30 small icons is a strain for the youngest; the kit counting frame (`task-tiles.png`) uses ~130 px icons | `iconsLayout` (framed): the group shape (1–3 rows per frame) and the frames per line are chosen for the largest icon; 5 × 6 → 3×2 frames at 46 scene px (was 28), 2 × 5 → 79 (was 50). Test "shapes framed groups to use the height …"; two new shapes in the inside/apart matrix. Unframed counting and the [10, k] ten-row unchanged |

Deliberate break: the tall branch limited to the keypad solution (old behaviour) and the group shaping limited to one row →
5 tests red (4 pictureLayout, 1 iconsLayout); the weight test was red (51 < 75) before its fix; restored → 103/103 in the two
files. Meta: the tall-layout tests read the rectangles `TaskScene` uses (`pictureLayout`, `answerSpans`), not the widgets' pixels;
the frames above are the pixel evidence.

## States (judged against the kit)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 5.9 | coins E1.11 tiles, notes E4.1 keypad, zł + gr text tiles, scale kg tiles, scale dag keypad, scale hint, scale solution beside the keypad, money solution beside the tiles | 01–08 | coins and notes are the kit art (`contact-money.png`), sharp at both sizes, notes above coins; "2 zł 80 gr" tiles fit at the tile font; after V3 the weights read "10 dag"/"20 dag"/"50 dag"/"1 kg"; hint bar under the drawing (keypad) or the tiles; in the money solution the coins move left and the lines sit right of them, tiles unchanged ✓. O1: scale in the keypad solution 190 px tall, weights small again (lines explain the sum) |
| 6.7 | thermometer positive (keypad), negative with text tiles, with hint, with steps beside it, temperature difference, jugs ½ l, jugs with steps | 09–15 | after V1/V2 the housing matches the kit frame (turquoise rim, ivory face, centred labels, "°C"), column in the kit teal; the hint bar starts right of the column; the solution lines sit between the column and the keypad; "−24 °C" tiles use the kit minus (U+2212); jugs are the kit 1 l / ½ l art in rows, labels "1 l", "½ l" on the jugs ✓ |
| 7.7 | counting 1–5, 6–7, groups with number tiles and with "5 · 6" tiles, groups with hint | 16–20 | icons are kit art; after V4 frames are 3×2 / 2×2 blocks, icons 46–79 scene px; prompts in two lines end above the drawing ✓. Only 1-icon draws captured for `count_5` (README) |
| 8.8 | ruler E1.8, 11–12 (ten + rest), money E2.2 keypad, grosze E2.8, scale dag E2.8, jugs ¼ l E5.5, unlock card with a new `childName` | 21–28 | ruler as in S-13 (kit ruler, "10 cm"); the ten in one row with the rest under it; ¼ l jugs show the quarter level; unlock card "Nowa umiejętność!" + "Zegar, miesiące i pieniądze" (E1.11) as in kit `unlock.png` ✓. "klocki E1.10" does not exist (cut in phase 8) |
| 9.6 | summary after an art round | 29 | "Brawo!", 5 stars, "+7", "Runda bez błędu! +2"; the hook's `art` list is empty, no image left on the page ✓ |

## Hand-checked against the task's answer (mandatory)

- **Coins, `tablet-01`** (answer 7): 5 zł + 2 zł on the table = 7 ✓. **`desktop-01`**: 5 zł + 1 zł = 6 = answer 6 ✓.
- **Notes, `desktop-02`** (answer 54): 50 zł note + 2 zł + 2 zł = 54 ✓. **zł + gr, `desktop-03`** ("2 zł 80 gr"): 2 zł + 50 gr +
  20 gr + 10 gr = 2 zł 80 gr; distractors "80 zł 2 gr" (swapped) and "3 zł 30 gr" ✓.
- **Weights, `tablet-05`** (answer 100 dag): plates read 20, 10, 50, 20 dag → 50 + 20 + 20 + 10 = 100 = the cushion's mass ✓.
  **`desktop-26`**: 3 × 10 dag = 30 = answer ✓; **`desktop-04`**: one 2 kg = 2 ✓.
- **Jugs, `tablet-27`** (answer 4 l): one 1 l, four ½ l, four ¼ l → 1 + 2 + 1 = 4 ✓. **`desktop-14`**: 4 × 1 l + 2 × ½ l = 5 = answer ✓.
- **Thermometer, `desktop-12`** (answer "−24 °C"): measured on a 4× crop, label ticks 0 / −10 / −20 / −30 at y 48 / 245 / 443 /
  640 → 19.7 px per degree; column top at y 523 → (523 − 443) / 19.7 = 4.1 below −20 → −24 ✓. Rule `thermometer` (16 units
  per degree, −30 at 1260) at scale 0.41: 16 × 0.41 × 0.75 = 4.9 CSS px/°C, the crop's 19.7 / 4 = 4.9 ✓. On the first
  capture (frame replaced) `desktop-09` 16 °C: (585 − 398) / 117 × 10 = 16.0 ✓, and `tablet-12` −8 °C after V1: (603 − 490) / 14 = 8.1
  below 0 ✓.
- **Icons, `desktop-19`** ("5 · 6"): 5 frames × 6 apples = 30 icons, hook `art` 30 entries ✓; **`tablet-18`** (16): 4 frames × 4 =
  16 ✓; **`desktop-22`** (11): a row of 10 and 1 under it ✓.
- **Difference, `desktop-13`**: "Rano było −4 °C"… hook: now 16 °C, answer 20 → 16 − (−4) = 20 ✓ (prompt read on the frame).

## Fit and overlap (rectangles from the layout data, sizes read off the frames, approximate)

Every drawing stays inside the notebook and off the tiles, the keypad and the bar in every state captured; the thermometer
column ends 16 px above the notebook's inner bottom; tiles beside the column end 68 px inside the right edge. Tablet
legibility (scale 0.533): coins 45–55 CSS px, notes 130 × 70, weights ≈ 45 px with plates ≈ 8 px text, jugs ≈ 75 px,
counting icons 40–80 px, thermometer labels 11.7 px (the 22 px floor).

## Observations (not fixed, follow-ups with triggers)

- O1: in the keypad solution phase the scale (and jugs, money) get `keypadSolution.picture` (190 px): weight plates are
  unreadable there again; the lines explain the sum. Same class as S-13 O2.
- O2: the keypad thermometer column (240 × 540 from y 420, under a two- or three-line prompt) gives 3.0 CSS px/°C on the
  tablet; the E5 keypad task reads every 2 °C. Readable with the ticks, but the smallest of the thermometer layouts; a prompt
  beside the column would free ~90 px.
- O3: in the tiles layout with the thermometer the area above the tiles right of the column is empty (the prompt is one
  line); the tiles could rise. Cosmetic.
- O4: `E1.2.count_5` drew a single icon in both captures (the skill allows 1); counting 2–5 shows the same layout as 7.

## Gate in this step (after the fix, working tree = `f4f0c82`)

lint OK; typecheck OK; vitest 1865 passed (contract baseline 1482 on `bb00d7f`, +383; branch before this step 1853, +12 new
tests); deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0` each; `npm run build` `e2e hook: absent (2 chunks checked)`;
`npx playwright test --config=<abs>` 46 passed (baseline 42, +4); servers 4397/4398/4399 not listening afterwards.

VISUAL: PASS — every art type captured in a real round at 1440×900 and 1024×768 (coins, notes, zł+gr tiles, scale kg/dag with hint and solution, thermometer E3 tiles / E5 keypad / E6 negative / difference / beside-keypad solution, jugs ½ l and ¼ l, counting 1/7/11–12, framed groups with number and "a · b" tiles, ruler, unlock card, summary); F3 and three more discrepancies fixed (thermometer column, labels on the rim, unreadable weights, tiny group icons); coin, note, zł+gr, weight, jug, thermometer and icon values hand-checked; O1–O4 left as follow-ups
