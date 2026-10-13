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
