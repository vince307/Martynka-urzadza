# Screenshots — drawn-grid-tasks-e3-e4 (S-13b) visual gate

Captured 2026-10-14 on the working tree of `e48c9cb` plus the visual-gate fixes committed right afterwards as `7aa3485`
(the build id in the corner reads `e48c9cb` because the fixes were not committed at capture time; the frames show the
fixed code: the triangle drawn to scale, the shorter keypad hints, "Wtedy zegar pokaże …"). A first capture on the unfixed
tree showed the defects (`reviews/visual-review.md` V1–V3); those frames were deleted and every state re-captured.

Route: Playwright only, as in S-13 and S-14. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config,
no `webServer`, service workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, two projects
`desktop` 1440×900 and `tablet` 1024×768) reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`.
The folder was moved out of the repo before the lint gate. States are reached through the product: the parent path (age
"10+" for E3–E5, "6" for E6, then the stage, no warm-up) with `?e2eSkills=<skill id>` (e2e build only), then real taps,
`answerWrong`, `setClock`, solution-step taps. The held hand is a raw CDP `touchStart` + 6 `touchMove`s with the finger
still down (hook `clock.carrying === 'hour'`), lifted after the frame. The unlock card is the parent path at age 8 in
January (`?e2eMonth=0`: E5 opens on step 11), rounds played right until `pendingUnlock`, then "Kolejna runda". Before every
frame the spec waited for every art texture to be loaded and 900 ms for tweens. A silent speech stub hides the speaker.
Claude in Chrome was not used: every state needs taps, wrong answers or a held drag.

- `desktop-*` = 1440×900; `tablet-*` = 1024×768. Every test is a new browser context (a fresh device). Each skill draws a
  random task, so desktop and tablet frames of one state show different values (from the hook's read-only snapshot).
- Kit compared (not copied; `designs/` is gitignored): `designs/martynka-maths-A-v1/screenshots/task-keypad.png`,
  `hint-keypad.png`, `solution-step-2.png`, `task-tiles.png`, `unlock.png`; `reference/helpers-reference.png`
  (clock, "Figury na siatce"), `reference/clock.svg`, `reference/square-grid.svg`. Number cells, grid marks, side labels,
  hand handles and the figure in the 190 px solution strip have no kit frame: DESIGN-GAP rows 73–78.

| # | State | Desktop | Tablet | Reached / values (desktop · tablet) |
|---|---|---|---|---|
| 01 | magic square, keypad | `desktop-01-magic-keypad.png` | `tablet-01-magic-keypad.png` | `E3.5.magic_square_30` · 7 8 3 / 2 6 10 / 9 4 _ → 5 · 8 7 12 / 13 9 5 / 6 11 _ → 10 |
| 02 | magic square with the hint bar | `desktop-02-magic-hint.png` | `tablet-02-magic-hint.png` | 01 + one wrong number |
| 03 | magic square, solution step 1 beside the keypad | `desktop-03-magic-solution.png` | `tablet-03-magic-solution.png` | 02 + a second wrong number |
| 03b | magic square, solution with the full line and the gap line | `desktop-03b-magic-solution-gap-line.png` | `tablet-03b-magic-solution-gap-line.png` | 03 + two "Następny krok" |
| 04 | pyramid, keypad | `desktop-04-pyramid-keypad.png` | `tablet-04-pyramid-keypad.png` | `E3.5.pyramid_30` · top gap: 10 + 17 = 27 · base gap: 5 − 4 = 1 |
| 04h | pyramid with the hint bar | `desktop-04h-pyramid-hint.png` | `tablet-04h-pyramid-hint.png` | 04 + one wrong number |
| 05 | grid "where", text tiles | `desktop-05-grid-where-tiles.png` | `tablet-05-grid-where-tiles.png` | `E3.7.grid_where` · triangle on A1 (tiles 1A / A2 / A1) · on C3 |
| 06 | grid "what", word tiles | `desktop-06-grid-what-tiles.png` | `tablet-06-grid-what-tiles.png` | `E3.7.grid_what` · trójkąt · kwadrat |
| 06h | grid "what" with the hint bar | `desktop-06h-grid-what-hint.png` | `tablet-06h-grid-what-hint.png` | 06 + one wrong tile |
| 07 | rectangle with labelled sides, keypad | `desktop-07-perim-rect-keypad.png` | `tablet-07-perim-rect-keypad.png` | `E4.7.perimeter_rect` · 5, 16 → 42 · 13, 10 → 46 |
| 08 | triangle with labelled sides (drawn to scale after V1) | `desktop-08-perim-triangle-keypad.png` | `tablet-08-perim-triangle-keypad.png` | `E4.7.perimeter_triangle` · 20 + 8 + 18 = 46 · 15 + 4 + 13 = 32 |
| 09 | perimeter with the hint bar | `desktop-09-perim-hint.png` | `tablet-09-perim-hint.png` | 07 + one wrong number |
| 10 | perimeter, solution step 1 (figure in the 190 px strip) | `desktop-10-perim-solution.png` | `tablet-10-perim-solution.png` | 09 + a second wrong number |
| 10b | perimeter, solution with the sum line | `desktop-10b-perim-solution-step2.png` | `tablet-10b-perim-solution-step2.png` | 10 + "Następny krok" |
| 11 | set the clock E3 (full hour), start pose | `desktop-11-clock-e3-start.png` | `tablet-11-clock-e3-start.png` | `E3.3.clock_set_full` · start 10.00, asked 2.00 · start 11.00, asked 8.00 |
| 12 | hour hand held (finger down, large ring) | `desktop-12-clock-e3-held.png` | `tablet-12-clock-e3-held.png` | 11 + raw touch moved 75° clockwise, not lifted · hook hour 12 / 1, `carrying: 'hour'` |
| 13 | E3 with the hint bar (hour hand only, F2) | `desktop-13-clock-e3-hint.png` | `tablet-13-clock-e3-hint.png` | 12 lifted, then `answerWrong` (hour + 1); hands back to the start |
| 14–14d | E3 solution beside the dial, steps 1–4 ("Długa wskazówka zostaje na 12…", "Wtedy zegar pokaże …") | `desktop-14*-clock-e3-solution*.png` | `tablet-14*-clock-e3-solution*.png` | 13 + a second wrong time, then "Następny krok" ×3 |
| 15 | set the clock E4 (quarter), start pose | `desktop-15-clock-e4-start.png` | `tablet-15-clock-e4-start.png` | `E4.3.clock_set_quarter` · start 4.45, asked 3.00 · start 12.45, asked 1.00 |
| 16 | E4 after setting, before "OK" | `desktop-16-clock-e4-set.png` | `tablet-16-clock-e4-set.png` | 15 + `setClock(answer)` · hook 3.00 · 1.00 |
| 17 | E4 with the hint bar | `desktop-17-clock-e4-hint.png` | `tablet-17-clock-e4-hint.png` | 16 + `answerWrong` |
| 18–18d | E4 solution beside the dial, steps 1–4 | `desktop-18*-clock-e4-solution*.png` | `tablet-18*-clock-e4-solution*.png` | 17 + a second wrong time, then "Następny krok" ×3 |
| 19 | side of a square from the perimeter, E5.12 | `desktop-19-side-square-keypad.png` | `tablet-19-side-square-keypad.png` | `E5.12.perimeter_side_square` · 12 cm → 3 · 8 cm → 2 |
| 20 | other side of a rectangle, E5.12 | `desktop-20-side-rect-keypad.png` | `tablet-20-side-rect-keypad.png` | `E5.12.perimeter_side_rect` · one side 19 → 9 · one side 11 → 15 |
| 20h | E5.12 rectangle with the hint bar (V2) | `desktop-20h-side-rect-hint.png` | `tablet-20h-side-rect-hint.png` | 20 + one wrong number |
| 21 | composite figure on a lattice, E6.3, keypad | `desktop-21-composite-keypad.png` | `tablet-21-composite-keypad.png` | `E6.3.perimeter_composite` · 7 × 4 with a 2 × 2 notch → 26 · 4 × 5 with a 1 × 2 notch → 22 |
| 22 | composite, solution step 1 | `desktop-22-composite-solution.png` | `tablet-22-composite-solution.png` | 21 + two wrong numbers |
| 22b | composite, solution with the sum line | `desktop-22b-composite-solution-step2.png` | `tablet-22b-composite-solution-step2.png` | 22 + "Następny krok" |
| 23 | "Nowa umiejętność!" E5.12 "Obwody i boki" | `desktop-23-unlock-e5-12.png` | `tablet-23-unlock-e5-12.png` | parent path, age 8, `?e2eMonth=0`, E5 (start step 11), rounds right until `pendingUnlock = 12`, "Kolejna runda" |

Not captured: E3.11 `clock_set_24h` (same widget and pose as E3.3; its extra hint line was read in the sample); a
`retype` frame of the clock (the same dial with rings after "Już wiem").
