# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the ship step (final pre-merge state). Earlier: the visual gate screenshotted every art task type at 1440×900
and 1024×768, fixed four readability discrepancies in `f4f0c82` and ended `VISUAL: PASS`. This step archives the change
(`chore(archive): close art-tasks-all-stages`, roadmap S-14 → done, Backlog Handoff refreshed), then pushes, opens the PR,
watches CI, merges and watches the Deploy run. The `[human]` rows stay open for the maintainer (post-run checklist).

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | p1 `46aff1d` … p10 `79da1a7`, review `79e92ee` + `0c5b25e`, then this step: `f4f0c82` `fix(art-tasks-all-stages): czytelność grafiki z bramki wizualnej` + `docs(art-tasks-all-stages): bramka wizualna` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-13-s12-s14/run-log.md |
| `change.md` status | `archived` (stamped by `/10x-archive` in the ship step; folder moved to `context/archive/2026-10-14-art-tasks-all-stages/`) |
| `## Progress` rows open | 5 (`grep -c '^- \[ \]' plan.md`), all `[human]`: 2.9, 8.9, 9.7, 9.8, 9.9 |
| Working tree | clean after the two commits (`tests/e2e/visual.local/` moved out to the session scratchpad; `dist-e2e/`, `test-results/` are gitignored) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` (`TASK_LAYOUT.picture.tall` replaces `keypadBeside`; `scale.weightSize/perRow/rowLift`; `thermometer.label.gap`) | V1/V3/V2 data: thermometer column per input mode with the tiles row and bar spans; weights 84 units in rows of 2; label gap |
| `src/core/round/pictureLayout.ts` (`pictureLayout`, new `answerSpans`, `TallSpec`, `Span`) | V1: a tall drawing keeps one column in every phase; `answerSpans` moves the tiles row and the bar right of it |
| `src/scenes/TaskScene.ts`, `src/ui/widgets/AnswerTiles.ts` (`setChoices(choices, row?)`), `src/ui/widgets/FeedbackBar.ts` (`update(bar, input, at?)`) | V1 wiring |
| `src/ui/widgets/Thermometer.ts` (`render`) | V2: labels centred on x 301 as in kit `thermometer-face.js`, never on the ticks |
| `src/ui/widgets/artLayout.ts` (`iconsLayout`) | V4: framed groups shaped (1–3 rows, frames per line) for the largest icon |
| `tests/pictureLayout.test.ts`, `tests/artLayout.test.ts`, `tests/e2e/art-tasks.spec.ts` | tall-layout tests (5), weight readability (1), group shaping (1 + 2 new shapes × 3 areas); e2e reads `TASK_LAYOUT.picture.tall.keypad` |
| `docs/design-gaps.md` row 65 | updated: thermometer column in every phase |
| `context/changes/art-tasks-all-stages/screenshots/` | 58 PNG (29 states × desktop/tablet) + `README.md` (state · desktop · tablet · how reached, values per frame) |
| `context/changes/art-tasks-all-stages/reviews/visual-review.md` | V1–V4 with fixes, per-row verdicts, hand-checks, O1–O4, gate, `VISUAL: PASS` |
| `context/changes/art-tasks-all-stages/follow-ups/review-fixes.md` | F3 marked closed; section "Z bramki wizualnej" with O1–O4 and `Trigger:` lines |
| `context/changes/art-tasks-all-stages/plan.md` | `[visual]` 5.9, 6.7, 7.7, 8.8, 9.6 ticked with notes |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` |
| capture: `npx playwright test --config=<scratchpad>/visual.local/playwright.visual.config.ts` against `npm run preview -- --outDir dist-e2e --port 4399 --strictPort` | 44 passed per capture; three captures (unfixed `0c5b25e`, after V1/V2, after V3/V4 and the label gap); only the last one's frames are kept |
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | 1865 passed (baseline 1482 + 383; branch before this step 1853, +12 from this step) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` each (no content change) |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` | 46 passed (3.4m) = baseline 42 + 4 |
| Break: tall branch only for keypad + solution, group shaping one row only | 5 red (4 `pictureLayout` tall, 1 `iconsLayout` shaping); restored → 103/103 in the two files. Meta: tests read the rectangles `TaskScene` uses, the frames are the pixel evidence |
| Break (before the fix): weight readability test vs `weightSize` 52 | red `expected 51.19 to be ≥ 75`; green at 84 |
| Hand-checks | coins 5+2 = 7, 5+1 = 6; notes 50+2+2 = 54; "2 zł 80 gr"; weights 50+20+20+10 = 100 dag; jugs 1+4×½+4×¼ = 4 l, 4+2×½ = 5 l; thermometer −24 °C measured on a 4× crop (4.9 px/°C); icons 5×6, 4×4, 10+1 (details in `reviews/visual-review.md`) |

Servers: 4399 started by this step (background preview) and stopped; Playwright started and stopped 4397/4398; `lsof -ti tcp:4397|4398|4399 -sTCP:LISTEN` empty afterwards.

## 4. Next command

none — shipped

## 5. Open

- `[human]` checklist (plan `## Progress`): 2.9 WebP / loose files / `tasks/measuring/`; 8.9 narrowed scope (S-14b/c/d, S-13b); 9.7 departures from ZADANIA (incl. E3.11 `low 0`); 9.8 text acceptance (incl. `SCALE_ITEMS` masses); 9.9 tablet sharpness (iPad DPR 2, Android) — now also the readability of the thermometer column and the 84-unit weights on a real tablet.
- Follow-ups: `follow-ups/review-fixes.md` — earlier ones, the impl-review ones (F3 now closed), and O1–O4 from this gate (`TASK_LAYOUT.picture.keypadSolution` small drawings in the keypad solution; `TASK_LAYOUT.picture.tall.keypad` 3.0 px/°C on the tablet; tiles beside the thermometer sit low; `E1.2.count_5` draws 1 icon).
- Design gaps: row 65 updated (no new rows).
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. F3 decided from the picture: **fix**. On the tablet the tiles thermometer had about 2.1 CSS px per degree (−8 vs −12 °C 9 px apart, column barely visible). Chosen: a tall column on the left in every phase with tiles/bar moved right (`answerSpans`). Rejected: a taller rectangle above the tiles only (+36 %, still ~2.9 px/°C); a scale cut to the task's range (needs a cropped kit housing, DESIGN-GAP 64, S-16). Would change: a tablet check (9.9) or teacher read finding 3–3.5 px/°C still too small → the cut scale.
2. Fixed three discrepancies the step prompt did not name (V2 labels on the rim, V3 unreadable weights, V4 tiny group icons) because each makes a task hard to read for a 7–9-year-old; each is a data/layout change in the existing widgets with a test first. Rejected: recording them as observations (S-13 did that for O1–O3, but those stayed readable; these were not). Would change: the maintainer preferring the kit proportions (weights at pan size) over legibility.
3. Kept the keypad prompt above the thermometer column (column from y 420) instead of beside it. Rejected: prompt right of the column (would wrap to 4–5 lines and shrink the font). Would change: O2 — a tablet check finding 3.0 px/°C too small.
4. Ran Chromium myself (plain `npx playwright test`) instead of the request-file protocol; a piped variant failed once on the sandbox MachPort and was re-run as a plain command.
5. Kit frames compared, not copied into the change folder (`designs/` is gitignored and must not be staged), as in the S-13 gate.
6. `[visual]` 8.8 ticked although "klocki E1.10" was not captured: the skill (`E1.10.place_read_12`) was cut in phase 8 (follow-up S-14b), so no such state exists; the unlock card shows E1.11 only. Would change: the maintainer wanting each new `childName` card captured.
7. Ship step: archived despite 5 open `[human]` Progress rows (0 automated, 5 manual — the skill's recommended option);
   they are the maintainer's post-run checklist, not a blocker. Rejected: holding the PR until the tablet check (9.9).
   Would change: the maintainer asking for a tablet check before the merge.
