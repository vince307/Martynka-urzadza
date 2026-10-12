# Design gaps

Places where the art pack kit (`designs/martynka-maths-A-v1/`) has no screen or copy for what the plan needs.
Each row has a `DESIGN-GAP` comment in the code; the code uses a placeholder drawn in code or a provisional
string until the kit is extended. Remove a row when the kit covers it.

| # | Slice | Gap | Provisional behaviour | Code |
|---|---|---|---|---|
| 1 | S-04 | The kit shows a "Podpowiedź" button before any mistake; the plan shows the first hint automatically after the first mistake | Hint appears in the yellow bar after the first wrong answer, no button | `src/ui/widgets/FeedbackBar.ts` |
| 2 | S-04 | The kit offers "Pokaż kroki" after the first mistake; the plan walks the solution steps after the second mistake | Solution steps after the second wrong answer, one at a time ("Następny krok" / "Już wiem") | `src/ui/widgets/FeedbackBar.ts`, `src/core/round/view.ts` |
| 3 | S-04 | The kit does not say whether a plain retry follows the steps; the plan has the child retype the result, with no star | Retype phase: the answer tile is outlined, no star | `src/ui/widgets/FeedbackBar.ts` |
| 4 | S-04 | "Do pokoju" in the HUD (FR-011): there is no room before S-09 | Nothing drawn; `roundView.switchVisible` is prepared | `src/scenes/UIScene.ts` |
| 5 | S-04 | No end-of-round bar ("Runda bez błędu! +2 ★") before the S-05 summary | Green bar with the bonus text and "Dalej" that starts the next round | `src/data/pl.ts` (`round.bonus`) |
| 6 | S-04 | No solution result line | A closing line "Wynik: N" added when no step states the result | `src/data/pl.ts` (`round.resultLine`) |
| 7 | S-04 | No view for the `'select'` answer mode (E1.6, E3.7; multi-select) | Skills with `'select'` or `'drag'` are not drawn into rounds until S-13 | `src/core/round/pick.ts` |
