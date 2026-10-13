# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-tdd` phase 8 (commit 1f5ab33): the pure drag reducer `stepBlockDrag`, `matValue` and the tray/mat geometry `dragLayout` exist and are tested; no scene uses them yet.
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + p1 `42a0bee` + p2 `43002aa` + p3 `d481d3c` + p4 `bd16d47` + p5 `9b7da6e` + p6 `7824b24` + p7 `8f73f98` + p8 `1f5ab33` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4, 4.5, 5.3, 6.7, 7.5, 8.4 [reviewer]; 4.4, 6.8, 7.6 [visual]; 4.6, 6.9 [human]; 8.3 (e2e part, orchestrator); phases 9-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/blockDrag.ts`, `tests/blockDrag.test.ts` | `BlockKind`, `Mat`, `stepBlockDrag(state, event, geo, rules)` (rules = `balance.blockDrag`, passed in), `matValue`, `emptyMat`, `initialBlockDrag`; events `down/move/up` (all with `pointerId`, x, y), `cancel`, `reset`; `BlockDragGeo` = `trayAt(x,y)`, `matBlockAt(x,y,mat)`, `onMat(x,y)` |
| `src/core/round/dragLayout.ts`, `tests/dragLayout.test.ts` | `dragLayout(spec, kinds)` -> `{ tray (Partial per kind), mat, ok, matBlock(kind,i) }`, `dragGeometry(layout, kinds)` builds the reducer's geo, `interiorPoint(rect)`, `insideRect` |
| `src/data/balance.ts`, `src/data/layout.ts` | `balance.blockDrag = { startDistance: 12, maxPerKind: 9 }`; `TASK_LAYOUT.drag` (tray x1240 y380 440x300, mat x236 y380 944x460, OK x1240 y724 440x96, 3x3 cells per kind) |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1466 passed (branch baseline 1427, +39) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)`; deploy tests OK (observed) |
| `npm run sample -- E1..E6` | 0 violations each (observed) |
| e2e | `e2e: not runnable in this session — orchestrator gate` (plain `npx playwright test --config=...` ran, Chromium did not start: 16 did not run); no scene or data change in this phase, expected 37 + 0; 8.3 e2e part left unticked |
| RED | before the reducer body: `AssertionError: expected { hundred: +0, ten: +0, one: +0 } to deeply equal { hundred: +0, ten: 1, one: +0 }` (drop over the mat), 9 of 22 failing by assertion on a no-op stub (`balance.blockDrag` was also absent: `expected undefined to deeply equal { startDistance: 12, maxPerKind: 9 }`) |
| Deliberate break 1 | `cancel` handled as `up` -> "a cancelled touch does not put the block down" and "... does not take a mat block off either" red; restored |
| Deliberate break 2 | no `maxPerKind` cap -> "keeps 9 when a 10th ten is dropped" and "keeps 9 when the tray is tapped a 10th time" red; restored |
| Deliberate break 3 | the drag threshold removed (always "not a tap" path disabled) -> tap tests ("a tap on a tray block adds one", "a move under 12 px is still a tap", "a tap on a mat block removes it", "builds 23") red; restored. Meta-check: the expectations come from the plan/research (12 px, 9, tap = +1/-1), written out in the test, not read from `balance`, except one test that pins `balance.blockDrag` to the plan's numbers |

## 4. Next command

`/10x-implement drawn-widget-tasks-e3-e4 phase 9`

## 5. Open

- [reviewer] 8.4 (`blockDrag.ts` has no Phaser or globals, raw events, numbers in `balance.ts`); earlier [reviewer]/[visual]/[human] rows as in §1.
- Orchestrator: e2e for 8.3 (no browser-visible change: expect 37 passed).
- Phase 9 must wire: scene pointerdown/move/up on the whole scene, `pointerupoutside` and `wasCanceled` -> `cancel`, `inputSuspend` switch and sleep/wake -> `reset`, new task -> `initialBlockDrag()`; `BaseTenBlocks`' own `BlockKind` equals the core one (re-export or import in phase 9).
- `TaskScene.render` still throws for `drag`; `playable` still excludes it.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. `dragLayout` takes the spec as its first argument (`dragLayout(spec, kinds)`, the plan wrote `dragLayout(kinds)`): core cannot import `src/data`, same injection as `pictureLayout`. `tray` is `Partial<Record<BlockKind, Rect>>` (only the task's kinds have a tray block). Rejected: importing `TASK_LAYOUT` in core (ESLint boundary).
2. `stepBlockDrag` takes `rules` (`balance.blockDrag`) as a fourth argument, like `longPress`; `matBlockAt` also gets `mat` so only blocks that are on the mat answer a touch.
3. Mixed phase: the data numbers (`TASK_LAYOUT.drag`, `balance.blockDrag`) were added inline; the phase keeps `Driver: tdd`. The geometry tests were written together with `dragLayout` (they passed at first run, no separate RED); the RED/GREEN cycle was done on the reducer, which carries the behaviour.
4. A drag that started and ended over the mat from the mat keeps the block (no re-position on the mat: cells are fixed by count).
