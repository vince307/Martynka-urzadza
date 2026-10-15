# Handoff — `number-line-written-arrows` (slice S-14b)

Final pre-merge state, written by the ship step (archive + ship, 2026-10-15). Before it the visual gate captured every [visual] state of rows 5.7, 6.6 and 8.7 at 1440×900 and 1024×768, fixed six discrepancies in three `fix(...)` commits and returned `VISUAL: PASS`. The [human] rows 8.8 and 9.6 stay open for the author — a post-run checklist, not a blocker.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` .. p11 `4dc12e7` + review fix + `3782115` (impl-review docs) + visual fixes `f966f61`, `33a053b`, `2bb41dd` + `54a3ea1` (visual gate docs) + this handoff commit + `chore(archive): close number-line-written-arrows` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-14-save-s13b-s15-s14b/run-log.md` |
| `change.md` status | `archived` (set by `/10x-archive` in the ship step) |
| `## Progress` | 2 rows open: 8.8, 9.6 [human]; [visual] 5.7, 6.6, 8.7 ticked by this step |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/text/nowrap.ts`, `tests/nowrap.test.ts` | V1: `keepTogether` (no-break spaces inside equations, before a closing number) |
| `src/ui/widgets/SolutionSteps.ts` | V1: lines go through `keepTogether` before the wrap |
| `src/ui/widgets/WrittenColumn.ts` | V2: borrow "1" raised before the digit (`TASK_LAYOUT.written.borrowOne`) |
| `src/core/tasks/generators/addSub.ts` | V3: `hintLine` exported; on lines of 2–3 tens a multiple of five next to the start, a landing or the box is not labelled |
| `src/core/tasks/visual.ts`, `src/core/round/pictureLayout.ts` | V4: `VisualShape` `'long'` (number line), `PictureSpec.long` for tiles tasks |
| `src/core/round/lineLabels.ts`, `tests/lineLabels.test.ts`, `src/ui/widgets/NumberLine.ts` | V5: `labelRows` stagger, dense box width |
| `src/data/layout.ts` | `picture.digits` 400/392, `picture.long`, `picture.hint.keypad` 798 (V6), `numberLine.box.denseWidth`, `numberLine.labelStagger`, `written.borrowOne` |
| `tests/hintVisual.test.ts`, `tests/pictureLayout.test.ts`, `tests/answerModes.test.ts`, `tests/visual.test.ts` | tests for V1, V3–V6; `visualShape(line)` pin is now `'long'` |
| `docs/design-gaps.md` | rows 88, 91, 92, 93 updated with the gate's numbers and rules |
| `context/changes/number-line-written-arrows/screenshots/` | 101 frames (50 states × 2 widths, one state with an extra step) + `README.md` |
| `context/changes/number-line-written-arrows/reviews/visual-review.md` | report, ends `VISUAL: PASS — …` |
| `context/changes/number-line-written-arrows/follow-ups/review-fixes.md` | O1, O2, O3, O5 and provisional rectangles with `Trigger:` lines |
| `context/changes/number-line-written-arrows/plan.md` | 5.7, 6.6, 8.7 ticked with notes |

## 3. Verification

Observed in this step, after the last fix (`2bb41dd`). Baseline main `882cd93`: unit 2326, e2e 71.

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 2445 passed = baseline 2326 + 119 (branch before this step 2429, +16) |
| deploy + ops shell tests, `sample` E1–E6 | OK, `Naruszenia: 0` each |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4` | 77 passed (5.2 min) = baseline 71 + 6, branch +0; run after each fix commit |
| Throwaway visual spec (hook build on 4399) | 22 + 10 + 6 tests passed across the three captures; moved out of the repo before each lint gate |
| Break: `hintLine` rule removed | `tests/hintVisual.test.ts` "leaves out a multiple of five…" red; restored |
| Break: `labelRows` stagger off | `tests/lineLabels.test.ts` 2 red; restored |
| Red before green | `nowrap` (module missing), digits strip (320 < 352), long shape (`wide`, < 12 px), dense box (26 + 14 ≥ 30), hint rect (11.7 px) |
| Meta-check | the layout tests compute the widget's own fit formula from `TASK_LAYOUT`; the frames confirm the pixels (crops of the 0..30 labels read "5", "25" clearly) |
| Teacher read `sample -- E2/E3 --count 6` (hint visual lines) | every line keeps start, landings, box; only fives next to them on 2–3-ten lines drop; one-ten lines keep all fives |
| Ports 4397/4398/4399 | not listening at the end |

## 4. Next command

none — shipped

## 5. Open

- [human] 8.8 carry/borrow notation (`WrittenColumn.render`, gap 91) — now a raised "1" before the borrowing digit; O5 (whole borrow chain in the hint) goes with it.
- [human] 9.6 decisions against the literal ZADANIA text and higher unlock thresholds on live saves (E2.6, E3.9, E5.2, E6.7); add F4 and O3 (one-jump hint repeats the prompt) to the author's read.
- Follow-ups: `follow-ups/review-fixes.md` (F4, F5, F8 rest, F9; O1 `drawSentence` orphan term, O2 E2.7 anchors, O3, O5, provisional rectangles).
- Design gaps touched: 88, 91, 92, 93 (`docs/design-gaps.md`); no new gap row.

## 6. Autonomous decisions

1. **Playwright instead of Claude in Chrome.** Why: every state needs Phaser canvas taps (profile § 8). Would change: a Chrome driver that delivers touch to the canvas.
2. **V2 fixed (borrow "1" before the digit), not left to [human] 8.8.** Why: gap 91 already says "before the digit"; the mark-row placement contradicted it and read as a number. Would change: the author's school notation.
3. **V3 rule only on lines of more than one ten.** Rejected: dropping on every line (removed "20"/"25" on 20..30 lines where 58-unit ticks have room). Would change: a denser one-ten layout.
4. **V4 as a new shape `'long'` for every number line in a tiles task**, not a per-skill rectangle. Why: the line's aspect ratio is the reason, not the skill. Would change: a number line in `select` or `drag` mode (falls back to wide rectangles today).
5. **V5 stagger instead of dropping an essential label.** Why: start and landings are what the hint lines name. Would change: the author preferring fewer numbers.
6. **V6 by widening the hint rectangle to 798 (x 226)** rather than shrinking `denseGap`. Why: `denseGap` 30 is the floor for the box + label room (V5 test). Would change: a kit frame for the hint drawing.
7. **O1–O5 left as follow-ups**: none is a defect of the captured views' legibility; each is content or a neighbouring view (prompt wrap). Would change: the author's read.
8. **Archived with [human] 8.8 and 9.6 open** (ship step). Why: both are the author's reads (school notation, decisions against ZADANIA and higher unlock thresholds); the run prompt makes open [human] rows a post-run checklist, listed in the PR section „Dla właściciela produktu”. Would change: an author decision that needs code before the merge.
9. **Follow-up triggers restated in the roadmap Backlog Handoff** for S-14c (WRITTEN missing digits, F9, ARROW_TABLE multi-field, E5.5 `capacity_half_l_e5`) and S-14d (E1.10 `place_read_12`, hint number line for E1). Why: the run prompt asks to carry them to the dependent rows.
