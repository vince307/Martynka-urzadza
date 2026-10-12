# Visual review — task-round-stars (S-04)

Step: visual gate of autonomous run 2026-10-12-s04-s08, after impl-review (`MERGE: CLEAR`, fixes `0c0baf4`).
Capture: Claude in Chrome (browser selected at preflight; own tab, closed at the end), dev server on port 4399,
desktop 1440×900 window (viewport 1440×779), tablet 1024×768 and portrait 420×760 through a same-origin iframe
(profile § 9). All states reached by taps; no state written, no IndexedDB. Frames and how each was reached:
`screenshots/README.md`. Kit: `designs/martynka-maths-A-v1/screenshots/` (`task-tiles`, `task-keypad`,
`hint-tiles`, `second-try`, `solution-step-1`, `correct`, `tablet-1024`) and `screen.css` for tokens.

## States

| Plan row | State | Desktop | Tablet | Verdict |
|---|---|---|---|---|
| 5.6 | Round start: prompt in Atkinson Hyperlegible Next, dots (current turquoise, future empty rings) | `desktop-00`, `desktop-01` | `tablet-00`, `tablet-01` | matches kit after F1 |
| 6.4 | task-tiles, task-keypad | `desktop-01`, `-02`, `-03`, `-00` | `tablet-01`, `-00`, `-11` | matches kit after F1, F2, F3, F6; targets ≥ 48 CSS px (below) |
| 7.4 | hint with a line / without ("Spróbuj jeszcze raz"), second try | `desktop-04b`, `-04`, `-05`, `-03` | `tablet-04`, `-03` | matches the plan; kit difference is DESIGN-GAP 1 |
| 7.4 | solution steps, first and last step | `desktop-06`, `-07` | `tablet-06`, `-07`, `-15`, `-16` | matches kit layout after F3, F4; step dots missing (O1) |
| 7.4 | retype, correct | `desktop-08`, `-09`, `-10`, `-11` | `tablet-08`, `-09`, `-10`, `-11`, `-17` | matches kit `correct.png` after F2, F5 |
| 8.4 | round end with bonus (+2 ★, counter 7); 420×760 "Obróć tablet" over a running round | `desktop-12` (+ `desktop-13`, no bonus) | `tablet-12`, `portrait-420x760-rotate-overlay` | correct; overlay covers the round, which is unchanged after rotating back |

No red cross, no timer, no star ever taken away in any frame.

## Hand-checked number

Rule (PRD FR-006/FR-007, `balance.round`): 1 star per task solved on the first or second try, 0 after the
solution walk, +2 for a round without a mistake.

- Clean round (`desktop-12`, `tablet-12`): five first-try answers → 5 × 1 + 2 = **7**; the counter shows 7 and the
  bar "Runda bez błędu! +2 ★".
- One second try (`desktop-13`): task 1 wrong then right (1 star, no bonus), tasks 2–5 first try → 5 × 1 + 0 = **5**;
  the counter shows 5 and the bar "Brawo!". After task 1 the counter showed 1 (second try still pays).
- Retype (`desktop-09`, `tablet-09`): counter stays 0 after the walk-through; in the tablet run the counter stayed
  7 after a retype in round 2 and went to 8 on the next first-try answer.

## Touch targets at 1024×768 (row 6.4)

Canvas scale 1024 / 1920 = 0.533. Tile 254×136 → 135×73 CSS px; key 156×104 → 83×55; bar button (min) 220×96 →
117×51; keypad field is not a target. All ≥ 48 CSS px.

## Findings and fixes

| # | Finding | Evidence | Fix |
|---|---|---|---|
| F1 | Every canvas text drawn at weight 400; style guide and `screen.css` use 650–750 (`.prompt` 750, `.answer` 700, `.key` 750, `.feedback` 650, `.stars` 750). The loader registered the variable font as weight "normal", so even a bold request would have been faked | first capture vs `task-keypad.png` | `FONT_WEIGHTS` + `FONT_WEIGHT_RANGE` in `src/data/layout.ts`, `src/ui/widgets/textStyle.ts`, FontFace descriptor `weight: '200 800'` in `BootScene.preload`; test in `tests/layout.test.ts` (break: prompt 400 → red) — `daa513e` |
| F2 | Button tokens: step and hint buttons drawn in solid butter `#f1ce6b`, kit `#fff2c0` with `#d8bd73` border; "Dalej" turquoise with a butter border, kit `#a6ddd2` with `#397f73`; OK key turquoise with an ivory label, kit `#a6ddd2`/`#397f73` with a deep-teal label; hint bar without its `#d9bd73` outline | `correct.png`, `solution-step-1.png`, `hint-tiles.png` | palette keys `button`, `buttonBorder`, `next`, `nextBorder`, `hintBorder`; `ActionButton` takes a border; `Keypad.paintButton`; `FeedbackBar.update` — `daa513e` |
| F3 | Keypad column off the kit: expression centred at x 560 (kit `.equation` centre 623) and y 560 (kit 456); solution lines centred on the bar (x 665), not under the expression | `task-keypad.png`, `tablet-1024.png`, `solution-step-1.png` | `TASK_LAYOUT.expression` {620, 456}; `TaskScene.render` centres the steps on the expression — `daa513e`, `f0ec6d5`; geometry test (break: x 760 → red) |
| F4 | A long solution line (the months in order, CALENDAR) ran off the notebook and the screen | first tablet run (`sierpień` task) | `SolutionSteps.show` wraps at the bar width (`barSpan`); verified in `tablet-16` — `daa513e` |
| F5 | The task dot stayed turquoise after a correct answer; kit `correct.png` shows it green at once | `correct.png` | `roundView` marks the current dot `done` when `phase === 'done'`; test first in `tests/roundView.test.ts` (red, then green) — `daa513e` |
| F6 | Word tiles shrank one by one, so labels in a row had different sizes | `I kwartał` vs `III kwartał` | `AnswerTiles.setChoices` scales all labels by the smallest factor — `daa513e` |

Gate after the fixes (observed): lint OK, typecheck OK, unit 593 passed (baseline 441, +152; +3 in this step),
deploy and ops tests OK, `sample` E1–E6 `Naruszenia: 0`, build OK with `e2e hook: absent (2 chunks checked)`,
`npx playwright test` 4 passed (baseline 1, +3) in four of five runs; the one red run overlapped my own `npm run
build` writing `dist/` in parallel and passed on every sequential re-run.

## Kept, recorded, not changed

- **V3 slashed zero**: recorded maintainer decision (the font has no plain zero; the kit approves it). Visible in
  every frame with a 0 (`kasuj 0` key, counter `0`, `10`). Not touched.
- **DESIGN-GAP 1–7** (no "Podpowiedź" button, steps after the second mistake, retype phase, no "Do pokoju", the
  end-of-round bar, the result line, no select mode): the frames show the provisional behaviour each row describes.
- **DESIGN-GAP 8 (new)**: the kit has no missing-number frame and the font has no `□` (U+25A1), so the blank in
  `2 + 9 = □` falls back to a smaller system glyph (`tablet-14`). Comment in `TaskScene.drawPrompt`, row in
  `docs/design-gaps.md`.
- **Art**: the kit's room background, ruled margin, ribbon, speaker button and "Do pokoju" are art or later slices
  (S-09, S-16); placeholders drawn in code are the plan's rule until then.

## Open observations (follow-ups, `follow-ups/review-fixes.md`)

- O1 Solution step indicator dots from the kit are not drawn (needs the step count in `roundView`).
- O2 The kit writes `38 + 27 = ?`; the scene shows `38 + 27` (needs a `pl.ts` string and a width check for E5–E6).
- O3 Bar text at the tablet size is about 19 CSS px, and wrapped two-line bars shrink to about 13 CSS px
  (`tablet-17`); same root as the earlier V1 follow-up, for the iPad check (row 8.5).
- O4 In keypad mode the flying star starts over the "9" key for its first frames.

## Fix after the gate

DESIGN-GAP 8 is resolved in `87049c5`: `splitBlanks` / `layoutPieces` (`src/core/round/promptBlank.ts`, test `tests/promptBlank.test.ts`) split an expression on "□", `TaskScene.drawExpression` draws the text pieces and an outlined rounded box (`TASK_LAYOUT.blank`, about one digit wide and 84 px tall in the 1920 space, stroke in the text colour) between them; the task data and generators still carry "□". Re-captured with the box last (`tablet-14b`, `desktop-14b`), in the middle (`tablet-14c`, `desktop-14c`) and first (`tablet-14d`): the blank is clearly visible and the row stays centred on the expression point beside the keypad. The centred layout (tiles) uses the same helper with `expressionWide`; MISSING always takes the keypad, so it has no frame. Gate: lint, typecheck, unit 596 (593 + 3), build `e2e hook: absent`, playwright 4 passed. Break (helper drops the box) turned the test red, restored.

VISUAL: GAPS — every [visual] state captured; the blank is now a drawn box (87049c5); open: kit step-indicator dots and "= ?" copy not drawn, small bar text at 1024
