# Screenshots — number-line-written-arrows (S-14b) visual gate

Captured 2026-10-15 on the fixed tree. The build id in the corner is the last commit before the capture, so it lags the code
it shows: the written-column and arrow frames read `3782115` and were taken with the first fix set already in the working tree
(committed right after as `f966f61`); the E2.7/E3.9 number-line frames read `f966f61` with the dense-line fix in the tree
(`33a053b`); the ADD_SUB hint frames read `33a053b` with the wider hint rectangle in the tree (`2bb41dd`). Each later fix touches
only the number line or the hint rectangle, so every frame shows the final code for what it depicts. The first capture on the
unfixed tree (`3782115`, all 101 frames) showed the defects in `reviews/visual-review.md` V1–V6; those frames were deleted.

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service
workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet`
1024×768) reused `tests/e2e/support/{welcome,hook}.ts` (`passWelcomeAsParent`, `answerWrong`, `answerRight`, `snapshot`,
`targets`, `tapScene`) against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The folder was moved out of the repo before every lint gate.
Claude in Chrome was not used: every state needs taps on the Phaser canvas (keypad keys, tiles, "Następny krok"), which synthetic
events in Chrome cannot drive (profile § 8). Before every frame the spec waited 900 ms; a silent speech stub hides the speaker.

States are reached through the product: the parent path (age 8 or "10+", the stage button, no warm-up, `?e2eMonth=8`) with
`?e2eSkills=<skill>&e2eVariant=off`, then real taps. The spec played tasks right until the open task matched (`findTask`): a
carry or borrow in the ones (E5.2), a 0 in the tens of the minuend (E6.7 sub), two carries (E6.7 add, desktop only — the tablet
draw has one), an empty output / input (E2.6 graph), a product ≥ 24 (E3.9), answer 11 (E2.3), 4 or 6 (E2.5), ≤ 9 (E3.8).

- `desktop-*` = 1440×900 (scene at 0.75); `tablet-*` = 1024×768 (scene at 0.533). Each test is a new browser context, so
  desktop and tablet frames of one state show different tasks (values below: desktop · tablet).
- Kit compared (read-only, `designs/` is gitignored): `designs/martynka-maths-A-v1/reference/written-addition.svg` (column, gold
  carry circle) and `reference/number-line.svg` (axis, ticks, labels, arcs, gold dots). The result boxes, the active box, the
  borrow notation, the arrow graph/table, the 0..100 and 0..30 lines, the box on a tick and the hint line have no kit frame:
  DESIGN-GAP rows 88–93.

| # | State | Desktop | Tablet | Reached / values (desktop · tablet) |
|---|---|---|---|---|
| w01 | E5.2 column, empty boxes, ones box active | `desktop-w01-e5-add-empty.png` | `tablet-w01-e5-add-empty.png` | `E5.2.written_add_100` · 39 + 36 · 14 + 66 |
| w02 | one digit typed, tens box active | `desktop-w02-e5-add-partly.png` | `tablet-w02-e5-add-partly.png` | ones digit of a wrong row |
| w02b | every box filled, before OK | `desktop-w02b-e5-add-full.png` | `tablet-w02b-e5-add-full.png` | the rest of the wrong row |
| w03 | wrong row → hint, carry circle, boxes empty | `desktop-w03-e5-add-hint.png` | `tablet-w03-e5-add-hint.png` | OK |
| w04 | solution steps 1–3 beside the column | `desktop-w04-e5-add-solution-{1,2,3}.png` | `tablet-w04-…` | second wrong row, "Następny krok" |
| w05 | retype | `desktop-w05-e5-add-retype.png` | `tablet-w05-e5-add-retype.png` | "Już wiem" |
| w06 | retype done (green boxes, no star) | `desktop-w06-e5-add-retype-done.png` | `tablet-w06-…` | right row |
| w07 | right on the first try, "Brawo! +1 ★" | `desktop-w07-e5-correct.png` | `tablet-w07-e5-correct.png` | next task, right row |
| w08–w10 | E5.2 subtraction with a borrow: start, hint, all lines + retype | `desktop-w0{8,9}-…`, `desktop-w10-…` | `tablet-…` | `E5.2.written_sub_100` · 42 − 18 · 52 − 26 |
| w11–w14 | E6.7 three digits, borrow across zero: start, hint, solution step 1, all lines + retype | `desktop-w1{1,2,3,4}-…` | `tablet-…` | `E6.7.written_sub_1000` · 903 − 457 · 703 − 439 |
| w15–w17 | E6.7 addition: start, hint, all lines + retype | `desktop-w1{5,6,7}-…` | `tablet-…` | `E6.7.written_add_1000` · 348 + 397 (two carries) · 457 + 157 |
| a01, a02 | graph, empty output; hint | `desktop-a0{1,2}-…` | `tablet-…` | `E2.6.arrow_graph_20` · 5 → +7 · 15 → +3 |
| a03–a05 | graph, empty input; hint "Idź pod prąd strzałki…"; solution step 1 | `desktop-a0{3,4,5}-…` | `tablet-…` | ? −5 → 13 · ? +4 → 20 |
| a06–a08 | table; hint; all lines + retype | `desktop-a0{6,7,8}-…` | `tablet-…` | `E2.6.arrow_table_20` · −1 (11 → ?) · +5 (12 → ?) |
| n01–n03b | E2.7 sequence on the line: start, hint, solution (line in 768 × 190), retype | `desktop-n0{1,2,3}*-…` | `tablet-…` | `E2.7.sequence_tens_100` · ?, 10, 20, 30 · ?, 20, 10, 0 |
| n04–n06b | E3.9 jumps with expression tiles: start, hint, solution, retype | `desktop-n0{4,5,6}*-…` | `tablet-…` | `E3.9.mult_groups_jumps` · 5 · 5 (0..25) · 5 · 6 (0..30) |
| h01 | ADD_SUB E2.3: first try (no line), hint with the line, steps 1–2, retype | `desktop-h01-e2-add-*.png` | `tablet-h01-…` | `E2.3.add_bridge_20` · 9 + 2 · 6 + 5 |
| h02 | ADD_SUB E2.5 subtraction: same states | `desktop-h02-e2-sub-*.png` | `tablet-h02-…` | `E2.5.sub_bridge_20` · 13 − 9 · 13 − 7 |
| h03 | ADD_SUB E3.8 up to 30: same states (0..30 line, 31 ticks on the tablet) | `desktop-h03-e3-30-*.png` | `tablet-h03-…` | `E3.8.add_sub_30_bridge` · 10 − 2 (one jump: one step) · 28 − 21 |

Not captured: "OK" pressed with empty boxes (does nothing, F10 — no visible state); a column without a carry or borrow in the
ones (F10, e.g. 330 + 571), where the hint's mark and its first line would name different columns — every captured hint starts
in the ones (the hint draws the first carry or the first borrow chain only: 348 + 397 shows one circle, 903 − 457 the whole chain
8, 9, ¹3).
