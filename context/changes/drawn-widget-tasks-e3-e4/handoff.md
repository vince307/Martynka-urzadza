# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-implement` phase 9 (commit f1d6375): the `drag` mode is playable (tray + mat in `TaskScene`, `BlockMat`, E3.6/E4.1 `build` skills) and the e2e helpers answer it. Browser behaviour is unproven until the orchestrator runs `e2e-request-p9.md`.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + p1 `42a0bee` + p2 `43002aa` + p3 `d481d3c` + p4 `bd16d47` + p5 `9b7da6e` + p6 `7824b24` + p7 `8f73f98` + p8 `1f5ab33` + p9 `f1d6375` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4, 4.5, 5.3, 6.7, 7.5, 8.4, 9.6 [reviewer]; 4.4, 6.8, 7.6, 9.7 [visual]; 4.6, 6.9, 9.8 [human]; 9.2 (e2e, orchestrator); phases 10-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/BlockMat.ts` | tray (one tile per kind with block + label), mat (white, dashed outline), mat blocks by `dragLayout` cells, carried block with shadow, "OK"; `setLayout`, `render(state, active, trayShown)`, `setVisible`, `targets()` (tray/mat/ok/matBlocks interior points), `okTarget()` |
| `src/scenes/TaskScene.ts` | `dragState`/`dragGeo`/`dragLive`; scene `pointerdown/move/up/upoutside` -> `feedDrag` -> `stepBlockDrag` (cancel/reset always, touches only while a drag task takes input); `sleep`, summary/unlock, input suspender (in `update`), new task, wrong answer -> reset/empty mat; solution lines in `TASK_LAYOUT.drag.solutionLines` (tray hidden, mat stays); snapshot `mat`, `carrying`; targets `drag` |
| `src/core/round/dragLayout.ts` | `dragKinds(answer)` (ten, one below 100; hundreds from 100) |
| `src/ui/widgets/BaseTenBlocks.ts` | `drawBlock` extracted and exported; `BlockKind` re-exported from core |
| `src/data/curriculum/E3.ts`, `E4.ts`, `layout.ts`, `pl.ts` | `E3.6.place_build_30` {11..30}, `E4.1.place_build_100` {21..99} (drag); `TASK_LAYOUT.drag` extras (labelHeight, dash, shadow, trayScale 1.3, solutionLines); `pl.round.trayLabels` |
| `tests/e2e/support/hook.ts` | `dragTouch`, `cancelTouch` (CDP touchCancel), `buildOnMat`; `answerRight`/`answerWrong` for `drag` (wrong = answer+1, or answer-1 when ones = 9); `Snapshot.mat/carrying`, `Targets.drag` |
| `docs/design-gaps.md` | row 55 (tray, mat, drop outside) |
| `context/changes/drawn-widget-tasks-e3-e4/e2e-request-p9.md` | what the orchestrator runs |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1472 passed (branch baseline 1466, +6) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)`; deploy tests OK (observed) |
| `npm run sample -- E1..E6` | 0 violations each (observed); E3/E4 `--count 6` teacher read: "Zbuduj z klocków liczbę 23.", hint "Dziesiątki to długie klocki, a jedności to małe kostki." then "Liczba 23 to 2 dziesiątki i 3 jedności." - agreement correct (1 dziesiątka, 2 dziesiątki, 7 dziesiątek, 1/2/8 jedności), first hint does not give the number |
| e2e | `e2e: not runnable in this session — orchestrator gate` (plain `npx playwright test --config=... tests/e2e/task-round.spec.ts` ran, Chromium crashed at launch, SIGTRAP/EPERM); `e2e-request-p9.md` written (full suite expect 37 + 0, one-off proof with `e2eSkills: 'E3.6.place_build_30'`); 9.2 left unticked |
| RED | `tests/pick.test.ts`: "the 'drag' skills E3.6 and E4.1 are in the pool" -> `expected [ 'E3.11.calendar', …(25) ] to include 'E3.6.place_build_30'`; "playable lets every answer mode in" -> `expected false to be true` |
| Deliberate break | `playable` without `drag` -> 3 pick tests red ("playable lets every answer mode in", "'drag' skills E3.6 and E4.1 are in the pool", "draws from several skills ... (uniform over the stage)"); restored. Meta-check: proves the pool/oracle, not the scene's event glue (cancel != drop is proven only by e2e phase 11 `e2e-break-p11b.patch`) |
| Greps | `Unsupported input mode` in `src/` and `wait for their own UI` in `pick.ts`: empty |

## 4. Next command

`/10x-implement drawn-widget-tasks-e3-e4 phase 10`

## 5. Open

- Orchestrator: run `e2e-request-p9.md` (full suite expect 37 passed; one-off proof of `buildOnMat`/`answerRight`/`answerWrong` for `drag`); tick 9.2 on green. If the one-off is red, fix before phase 10.
- [reviewer] 9.6 (teacher read above), [visual] 9.7, [human] 9.8; earlier [reviewer]/[visual]/[human] rows as in §1.
- Untested in a browser: Phaser `pointermove` for CDP touches, `pointerupoutside`, `wasCanceled` path; the carried block is drawn only after the 12 px threshold; mat cells give a rod 17 px wide (scale 0.76 so a rod stays ten cubes long) - a visual-gate item.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Solution phase for `drag`: the tray and "OK" are hidden, the mat keeps the child's build, and the solution lines take `TASK_LAYOUT.drag.solutionLines` (the tray's rectangle, 440 px wide). Rejected: lines under the prompt (the mat covers that area). Would change if the visual gate shows the lines unreadable at scale 0.6.
2. `BlockMat.render(state, active, trayShown)` (the plan wrote `render(state, active)`): the tray-hidden flag is the third argument; `onSubmit(value)` uses the mat the widget last drew.
3. `dragKinds(answer)` lives in `core/round/dragLayout.ts` with a unit test; the scene derives the layout from the open task's numeric answer.
4. Oracles in `tests/curriculumPick.test.ts` and `tests/warmup.test.ts` restated "playable" without `drag`; both updated to include it (they failed on the new skills, as designed).
5. Block-drag glue lives in `TaskScene` (scene-level pointer events) not in a zone, like `RoomScene`'s `pointermove`; the input suspender is checked in `update()` (as `RoomScene`), a `sleep` resets.
