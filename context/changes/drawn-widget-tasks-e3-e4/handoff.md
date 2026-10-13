# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-implement` phase 5 (commit 9b7da6e): `BaseTenBlocks` and `BarChart` exist and `TaskPicture` draws all four kinds without a placeholder; no blocks/bars skill is in the curriculum yet (phase 6), so nothing reaches a round.
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`select` phase 7, `drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + p1 `42a0bee` + p2 `43002aa` + p3 `d481d3c` + p4 `bd16d47` + p5 `9b7da6e` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4 [reviewer]; 4.4 [visual], 4.5 [reviewer], 4.6 [human]; 5.1 e2e part, 5.3 [reviewer]; phases 6-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/BaseTenBlocks.ts` | `BaseTenBlocks` widget (flats with 10x10 grid, rods, cubes; kit base-ten.svg) plus the pure `blocksLayout(h, t, o, rect)`, `blockSize(kind, scale)` (for the phase 9 mat) |
| `src/ui/widgets/BarChart.ts` | `BarChart` widget (axis 0..scaleMax, gridlines, columns, labels under, no values above) and `gridStep` |
| `src/ui/widgets/TaskPicture.ts` | dispatcher now draws blocks and bars; placeholder frame removed |
| `src/data/layout.ts` | `TASK_LAYOUT.blocks`, `TASK_LAYOUT.chart`, font roles `chartLabel`/`chartAxis`, colours `blockHundred`/`blockTen`, `CHART_COLORS` |
| `docs/design-gaps.md` | row 53 (bar chart) |
| `tests/baseTenBlocks.test.ts` | new (5 tests: counts, inside + no overlap incl. 9/9/9, kit proportions, max scale, `gridStep`) |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1353 passed (branch baseline 1348, +5) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` (observed) |
| `npm run sample -- E1..E6` | OK, no violations (observed) |
| Deliberate break | `blocksLayout` row wrap without moving down (`y += 0`) -> "inside the rectangle and never overlaps" red (`expected true to be false`); restored. First attempt (wrap width fixed at 4000, a single row) stayed green: the layout just shrinks, a wrong break, discarded. Meta-check: the scene use of the layout and the look are proven only by the screenshots and phase 11 |
| `grep placeholder src/ui/widgets/TaskPicture.ts` | empty (observed) |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, plain command tried twice); expected `37 passed` (baseline 37, +0). Row 4.1 ticked from the orchestrator note; row 5.1 left unticked |

## 4. Next command

`/10x-implement drawn-widget-tasks-e3-e4 phase 6`

## 5. Open

- Row 5.1 stays unticked until the orchestrator runs e2e (expect 37 passed).
- Not drawn on a canvas in this session (no Chromium): the new widgets typecheck/lint/unit only; blocks and chart sizes, label font sizes and the axis need the [visual] look after phase 6/7 (`?e2eSkills` arrives in phase 7).
- Rows 1.5, 2.5, 3.4, 4.5, 5.3 [reviewer]; 4.4 [visual]; 4.6 [human].
- `TaskScene.render` still throws for `select`/`drag` (removed in phases 7 and 9).
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. The pure placement (`blocksLayout`, `blockSize`) lives in the widget file, not in `src/core`, because it needs `TASK_LAYOUT` (data) and the file imports Phaser types only; it is unit tested without Phaser. Reverses if the mat reducer in phase 8 wants it in `core` with injected sizes.
2. Block wrap: all wrap widths from 180 to 4000 own units are tried and the one allowing the largest scale wins (cap `blocks.maxScale` 1.5); groups hundreds | tens | ones keep a `groupGap`. Reverses if the visual gate finds the grouping unreadable.
3. Bar colours are a separate `CHART_COLORS` array (not in `PLACEHOLDER_COLORS`, which is numbers only); axis numbers every 1 up to scale 10, every 2 above; labels are plain Text scaled with the chart.
