# Follow-ups — drawn-widget-tasks-e3-e4

Each item has a `Trigger:` line; later slices grep for it.

## Deferred scope

- PUZZLE_GRID, GRID, PERIMETER and "set the clock" (dragging the hands) are not in S-13; CLOCK is read-only. Trigger: S-13b
- BONDS with pairs and CHOOSE_OP with a picture. Trigger: S-13b or S-14
- Highlight on the drawing while a hint is shown (the hint is text only). Trigger: S-14 or a teacher read asking for it
- Parent mistake preview shows no drawing and no example for `select` tasks (a list answer does not reach `firstWrong`; DESIGN-GAP row 58). Trigger: first save-format change (v2)
- Number line as a hint for ADD_SUB. Trigger: S-14
- Regrouping 10 ones into a ten, and hundreds on the mat (E4.8 is read-only; `build` stops below 100). Trigger: S-14 or a child stuck on E4.8

## Carried from earlier changes (checked against this change's files)

- Closed here: S-04 "UI for select/drag" (phases 7 and 9), "mode on Task" (`Task.input`, `roundView`), "`snapshot` answer copy" (`TaskScene.snapshot` copies array answers).
- SolutionSteps step indicator: phase 4 changed only the rectangle of `SolutionSteps.show`. Trigger: the next change to SolutionSteps
- "Oblicz." before comparisons: phase 1 widened only types. Trigger: S-17 or the next change to `drawPrompt`
- Audit findings M-1, M-2, M-13 (TaskScene `beginRound` / `finishRound` / `applyParentStage` commit order), H-3, H-4 (narrator `onerror`, `unlock`): this change did not touch those functions (checked with `git diff b57433c..HEAD`). Trigger: next change to TaskScene round lifecycle or narrator

## From the implementation review (2026-10-14, `reviews/impl-review.md`)

- `adaptive.spec.ts` (#13) plays E4 rounds that now hold `drag` builds (`E4.1.place_build_100`, up to 17 blocks). It timed out at 180 s twice under 6 workers before `buildOnMat` reused one CDP session (`tests/e2e/support/hook.ts` `dragOn`, `BUILD_STEPS`); after the fix it takes about 1.8 min under load (37 s alone). Trigger: a timeout of adaptive.spec, or the next change adding `drag` skills to E4
- `TaskScene.create` now sends `pointerupoutside` to the reducer as `cancel` (plan rule). No e2e covers it (CDP touch cannot lift outside the canvas); the reducer rule itself is unit-tested. Trigger: next change to the drag wiring in TaskScene
- `BlockMat.render` hides the last mat block of a kind as soon as a mat block is touched (before a drag starts), not the block under the finger; the count stays right. Trigger: visual gate row 9.7 or the tablet row 9.8 calling it confusing
- `SelectTiles` toggles on `pointerdown` without a pressed state (AnswerTiles/Keypad use down + up). Trigger: tablet row 9.8 reporting accidental toggles
- `Ruler.render` and `BarChart.render` destroy and recreate their texts on every `TaskScene.render` (no leak, some GC churn). Trigger: frame drops on the iPad
- `pictureLayout` sends `select`/`drag` to the tiles picture area, which overlaps `TASK_LAYOUT.select.top`; no select/drag skill has a drawing today (comment updated). Trigger: the first `select` or `drag` skill with a `visual`
- Learners saved on E3.6, E4.1 or E4.8 see those steps grow from 1-2 to 3-4 skills, so unlocking needs `ceil(0.5·n)` mastered skills (slower, nothing lost). Trigger: S-13 PR body (mention it)
- `clock_read_half` / `clock_read_quarter` also draw full hours (half / a quarter of the time); `h24` says "po południu" also for 18.00-23.00 ("wieczorem"). Trigger: [human] row 10.7 text acceptance
- Three identical rectangle types (`dragLayout` `Rect`, `pictureLayout` `PictureRect`, `ui/widgets/geometry` `Rect`). Trigger: next change to dragLayout or pictureLayout

## From the visual gate (2026-10-14, `reviews/visual-review.md`)

- O1: base-ten reading wraps the ones into a second row under the rods/flat (28 shows 3 cubes beside the rods and 5 under them); counts are right but the ones do not read as one group. `src/ui/widgets/BaseTenBlocks.ts` `blocksLayout` / `flow` (shared with the mat). Trigger: [human] 10.7 or 9.8 calling it confusing, or the next change to `blocksLayout`
- O2: a chart in the keypad solution phase gets 190 scene px (`TASK_LAYOUT.picture.keypadSolution.picture`); axis numbers are unreadable there (≈ 6 CSS px at 1440). Trigger: next change to `pictureLayout` / the solution layout beside the keypad, or S-14 adding more keypad pictures
- O3: blocks on the mat are small (cubes ≈ 10 CSS px on a 1024 tablet; `TASK_LAYOUT.drag.mat`, 3 × 3 cells per kind). Trigger: [human] 9.8 (tablet feel)
- The visual gate did not capture a mat block lifted while the finger is down (the `BlockMat.render` lifted-block item above stays open). Trigger: [human] 9.8
