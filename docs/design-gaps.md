# Design gaps

Places where the art pack kit (`designs/martynka-maths-A-v1/`) has no screen or copy for what the plan needs.
Each row has a `DESIGN-GAP` comment in the code; the code uses a placeholder drawn in code or a provisional
string until the kit is extended. Remove a row when the kit covers it.

| # | Slice | Gap | Provisional behaviour | Code |
|---|---|---|---|---|
| 1 | S-04 | The kit shows a "Podpowiedź" button before any mistake; the plan shows the first hint automatically after the first mistake | Hint appears in the yellow bar after the first wrong answer, no button | `src/ui/widgets/FeedbackBar.ts` |
| 2 | S-04 | The kit offers "Pokaż kroki" after the first mistake; the plan walks the solution steps after the second mistake | Solution steps after the second wrong answer, one at a time ("Następny krok" / "Już wiem") | `src/ui/widgets/FeedbackBar.ts`, `src/core/round/view.ts` |
| 3 | S-04 | The kit does not say whether a plain retry follows the steps; the plan has the child retype the result, with no star | Retype phase: the answer tile is outlined, no star | `src/ui/widgets/FeedbackBar.ts` |
| 4 | S-04 | Kit shows "Do pokoju" in the HUD always; PRD FR-011 hides it while a task is being solved | Drawn between tasks only (`roundView.switchVisible`); house icon and label drawn in code | `src/ui/widgets/RoomSwitchButton.ts` |
| 6 | S-04 | No solution result line | A closing line "Wynik: N" added when no step states the result | `src/data/pl.ts` (`round.resultLine`) |
| 7 | S-04 | No view for the `'select'` answer mode (E1.6, E3.7; multi-select) | Skills with `'select'` or `'drag'` are not drawn into rounds until S-13 | `src/core/round/pick.ts` |
| 8 | S-04 | No kit frame for a missing-number task (`17 − □ = 9`); Atkinson Hyperlegible Next has no U+25A1, so the blank fell back to a tiny system glyph. RESOLVED in the fix after the visual gate | Every `□` in an expression prompt is drawn in code as an outlined box about one digit wide, between the text pieces (`splitBlanks` / `layoutPieces`); task data keeps `□`. Shape and size are ours, the kit may replace them | `src/scenes/TaskScene.ts` (`drawExpression`), `src/core/round/promptBlank.ts` |
| 9 | S-05 | The kit summary has no line for the clean-round bonus; "+N" alone does not say why it is 7 | A line "Runda bez błędu! +2 ★" under "+N", only when the round had no mistake | `src/ui/widgets/SummaryPanel.ts`, `src/data/pl.ts` (`round.bonus`) |
| 10 | S-05 | The kit has no highlighted state for "Do pokoju" (FR-010, when a renovation task is affordable) | A thicker butter border; not reachable before S-09 (`nextRoomTaskCost: null`) | `src/ui/widgets/PageButton.ts`, `src/core/round/summary.ts` |
| 11 | S-05 | The kit always draws 5 full stars; a task retyped after two mistakes pays none | The star row has one star per task: butter when it paid a star, pale when not | `src/ui/widgets/SummaryPanel.ts` |
| 12 | S-05 | The kit has the room-return button ("Wróć do notesu") but no room view before S-09 | A flat panel with the caption "Tu powstanie pokój" and the button; the kit's `.return-note` counter is left out (the HUD counter stays above) | `src/scenes/RoomScene.ts`, `src/data/pl.ts` (`room`) |
| 13 | S-05 | The kit asks an adult to read the task when there is no Polish voice | No Polish voice found: the speaker button is hidden and nothing is spoken | `src/scenes/UIScene.ts`, `src/core/narration/voice.ts` |
| 14 | S-05 | The kit draws the summary and the room return without the HUD | The HUD counter stays above the summary and the room so the child sees the running total | `src/scenes/UIScene.ts` |
