# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-implement` step for phase 6 (commit `44c4f19`): `Jugs` and `Thermometer` widgets over `ArtImage`, their layout functions, skills in E3.11, E4.7, E5.4, E6.1. Phase 7 (impl) is next; the e2e of this phase (6.5) and the browser proof of the tall layout (6.3) were NOT run (Chromium cannot start here).

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (p1), `d4f4470` + `ab0dc05` (p2), `b6a947d` (p3), `ba4e0da` (p4), `89e5ea0` (p5), `44c4f19` (p6), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | 41 (`grep -c '^- \[ \]' plan.md`); open for this phase: 6.3 break (browser), 6.5 e2e (orchestrator), 6.6 reviewer, 6.7 visual |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/artLayout.ts` | new pure `jugsLayout` (rows of up to 5, two rows from 6; the image is placed so the shared visible rectangle lands on the jug cell), `thermometerLayout` (housing 512x1536 fitted, `scale` for face units), `thermometerMarks` (every ten major, every five medium, single degrees only when `pxPerDegree >= minGapPx`, else every second) |
| `src/ui/widgets/Jugs.ts` | pool of 10 `ArtImage`; `render`, `setVisible`, `shown`, `art`, `bounds` |
| `src/ui/widgets/Thermometer.ts` | `ArtImage` housing + Graphics face (tube, liquid, bulb, ticks) + 7 label texts + `°C` text, port of `reference/thermometer-face.js`; `shown()` needs the housing AND the visible face AND the unit label; `art()` is the housing's state |
| `src/ui/widgets/TaskPicture.ts` | dispatches `jugs` and `thermometer`; only `icons` is still an empty case (phase 7) |
| `src/data/layout.ts` | `TASK_LAYOUT.jugs` (gap, rowGap, maxPerRow 5, maxScale), `TASK_LAYOUT.thermometer` (face geometry in housing units, `minGapPx` 7, `minLabelPx` 22), font role `thermoLabel` (size and weight); `DESIGN-GAP (row added in S-14 phase 9)` comments |
| `src/core/text/measure.ts` | `formatScaleMark` ("+10", "0", "−20") |
| `src/core/tasks/generators/temperature.ts` | diff variant no longer draws a cold morning equal to minus the answer (spoken "minus osiem" vs answer 8 failed the speech test) |
| `src/data/curriculum/E3.ts`, `E4.ts`, `E5.ts`, `E6.ts` | E3.11 `temperature_read_30` (tiles, text); E4.7 `capacity_half_l`, `capacity_litres_half` (keypad); E5.4 `temperature_read_0_30` (keypad); E6.1 `temperature_negative` (tiles), `temperature_diff` (keypad) |
| `tests/artLayout.test.ts` | +19 tests: jugs inside 3 areas and apart for 1/2/5/6/10, one vs two rows, image/visible-rect offset; thermometer proportions in the narrow column, marks density, major/medium kinds |
| `tests/contentInvariants.test.ts` | `SMALL_SPACES` entry for `E4.7.capacity_litres_half` (10 distinct tasks: 1..10 litres) |
| `context/changes/art-tasks-all-stages/plan.md` | rows 5.5 (from the orchestrator note), 6.1, 6.2, 6.4 ticked |

TaskScene needed no change in this phase: it already passes `visualShape(task.visual)` to `pictureLayout` (phase 1), so a thermometer with the keypad solution uses `keypadBeside`.

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `npm test` | 1745 passed (branch baseline 1707, +38: 19 layout, 3 skills x 6 invariants... rest from the 7 new skills) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` ... `E6` | exit 0 each; `--count 6` read for E3.11, E4.7, E5.4, E6.1: "Naruszenia: 0" |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | `jugsLayout` image placed at the jug cell without the visible-rect offset: `tests/artLayout.test.ts` red (`expected 674.48 to be close to 661`); restored, 51 green. Meta-check: proves the layout rule only, not what the scene draws |
| Break 6.3 (TaskScene always `wide`) | NOT done: needs a browser; row left unticked. A temporary spec (E5.4 via `passWelcomeAsParent` stage E5, `e2eSkills`, two wrong answers, `targets().picture` taller than wide, `art` = thermometer-frame loaded) was written, could not launch Chromium, and was deleted (not committed) |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`). Expected `42 passed + 0`; row 6.5 unticked |
| Teacher read | read: "−5 °C" style tiles, opposite-sign distractor first, diff hints ("16 − 10 = 6", "6 + 14 = 20"), "Dwa dzbanki po pół litra to razem litr", "2 · 2 = 4"; no violation. The last hint line states the result by design |

## 4. Next command

`/10x-implement art-tasks-all-stages phase 7` (phase 7, Driver: impl)

## 5. Open

- Row 6.5 (orchestrator): `npx playwright test` expects 42 passed. Row 6.3 needs a browser: phase 10 (row 10.5) or the orchestrator can run the temporary spec described above; the break (TaskScene passes `'wide'`) must turn `picture.height > picture.width` red in the solution phase. Rows 6.6 `[reviewer]`, 6.7 `[visual]` (screens in plan row 6.7). Earlier open: 1.5, 2.8, 2.9 `[human]`, 3.5, 4.5, 5.7, 5.8, 5.9.
- Readability risk for the visual gate: the thermometer is height-bound (1:3), so in a 378 px column it is 126 px wide and in the tiles area (294 px) 98 px wide; label size is floored by `minLabelPx` 22 and ticks by `minGapPx` 7 (every second degree below that). `TASK_LAYOUT.jugs` (gap 40, maxScale 0.8) and the thermometer numbers were chosen by eye, never seen on a canvas.
- Browser proof of `art` for jugs/thermometer: phase 10 should assert jugs keys `tasks/measuring/container-*` (one per jug, all `loaded`), thermometer keys `[tasks/measuring/thermometer-frame]`, `art` empty after hide.
- DESIGN-GAP rows (from 59) are written in phase 9 for money, scale, jugs, thermometer small sizes; E4.1 banknotes 200/500 zł follow-up `Trigger: S-14c`.
- Phase 7 widget `IconGroups` replaces the last empty `icons` case in `TaskPicture`.
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. The scene part of the phase ("render passes the shape") was already done in phase 1, so no `TaskScene` edit; the break 6.3 therefore has nothing new to prove in unit tests and stays a browser break. Would change: nothing.
2. `Thermometer.shown()` requires housing, face and unit label together (S-13 F1 lesson); `art()` reports only the housing image (the one art texture).
3. Changed the E6.1 `diff` generator (phase 4 file) to avoid a negative morning whose magnitude equals the answer, because the existing speech test (`speech does not give away the answer`) failed on it. Rejected: loosening the shared test. Would change: a teacher preferring the coincidence to stay.
4. `E4.7.capacity_litres_half` gets a `SMALL_SPACES` entry (10 distinct), as the plan foresaw; top share stays about 10 %, below the 15 % cap.
5. The degree label `°C` is a unit symbol drawn in the widget, not a Polish sentence; kept out of `pl.ts`. Would change: a reviewer insisting on `pl.ts` for every drawn string.
6. e2e not run (Chromium cannot start); the orchestrator note applied to row 5.5.
