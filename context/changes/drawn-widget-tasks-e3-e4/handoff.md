# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-implement` phase 4 (commit bd16d47): the picture area, `ClockFace` and `Ruler` exist and `TaskScene` draws a task's `visual`; no CLOCK/LENGTH skill is in the curriculum yet (phase 6), so nothing pictured reaches a round.
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`select` phase 7, `drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + p1 `42a0bee` + p2 `43002aa` + p3 `d481d3c` + p4 `bd16d47` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4 [reviewer]; 4.1 e2e part, 4.4 [visual], 4.5 [reviewer], 4.6 [human]; phases 5-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/pictureLayout.ts` | `pictureLayout(spec, input, solution)` (picture rect + lines rect or null), `clockHandAngles` |
| `src/data/layout.ts` | `TASK_LAYOUT.picture` (promptY, tiles/keypad rectangles, with-solution pairs); font roles `clockDigit`, `rulerDigit`, `rulerUnit` |
| `src/ui/widgets/{ClockFace,Ruler,TaskPicture}.ts` | dial and ruler drawn in code; `TaskPicture.render(visual, rect)` dispatcher (blocks/bars are a labelled placeholder frame until phase 5), `bounds()` |
| `src/scenes/TaskScene.ts`, `src/ui/widgets/SolutionSteps.ts` | picture drawn on task change and solution toggle; pictured prompt moved up; `SolutionSteps.show(..., limit?)`; `hideTaskLayer` hides the picture; snapshot `visual` (copy) and `answer` copied; targets `picture` |
| `src/data/pl.ts` | `tasks.rulerUnitLabel` ("cm") |
| `docs/design-gaps.md` | rows 52, 56, 57 (rows 53-55, 58 come with phases 5-9) |
| `tests/pictureLayout.test.ts` | new (8 tests) |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1348 passed (branch baseline 1340, +8) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` (observed) |
| deploy tests, `npm run sample -- E1..E6` | OK, no violations (observed) |
| Deliberate break | `pictureLayout` returning the no-solution picture rect with the solution lines -> "lines beside the picture" test red (`expected false to be true`); restored. Meta-check: only the disjointness test catches it (the inside-notebook and clear-of-answers tests stay green), as the plan said; that the scene uses the function is proven by the screenshots and phase 11 |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, seed spec tried); expected `37 passed` (baseline 37, +0). Row 3.3 ticked from the orchestrator note; row 4.1 left unticked |

## 4. Next command

`/10x-implement drawn-widget-tasks-e3-e4 phase 5`

## 5. Open

- Row 4.1 stays unticked until the orchestrator runs e2e (expect 37 passed). Not drawn on a canvas in this session (no Chromium): the widgets typecheck/lint only, so the [visual] row 4.4 (needs CLOCK/LENGTH in a round: the `?e2eSkills` seam arrives in phase 7, so the screenshots belong after phase 7 or a local, uncommitted skill patch) is the first real look; expect tuning of clock/ruler sizes and the solution-lines rectangle there.
- Rows 1.5, 2.5, 3.4, 4.5 [reviewer]; 4.6 [human] (clock times written with a dot, not the kit's "3:30").
- `TaskPicture` draws a labelled frame for `blocks`/`bars` until phase 5; `TaskScene.render` still throws for `select`/`drag` (removed in phases 7 and 9).
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. `pictureLayout` takes the rectangle numbers as a first argument (`TASK_LAYOUT.picture`), not only `(input, solution)`: `src/core` imports no `src/data`, so the data is injected like `balance` elsewhere. Reverses if the maintainer wants core to read layout directly.
2. A pictured task moves its prompt up to `picture.promptY` (232) in both modes so a 2-line (tiles) or 3-line (keypad) prompt ends above the picture; the kit's prompt y 290 would collide. Recorded in DESIGN-GAP 52.
3. Ruler: every mm gets a tick on the mm ruler, half-cm ticks on both, digits per cm; the "cm" label is printed on both rulers (its digits count centimetres). Long rulers (lengthCm > 12) shrink the digits with the scale; reverses if the visual gate finds them unreadable.
4. The solution lines of a pictured task sit in `lines` and are limited to that rectangle's bottom (`SolutionSteps.show` `limit`); for tiles the button stays in the bar zone, centred under the lines.
