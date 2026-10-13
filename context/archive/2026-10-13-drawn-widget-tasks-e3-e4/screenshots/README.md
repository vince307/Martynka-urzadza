# Screenshots — drawn-widget-tasks-e3-e4 (S-13) visual gate

Captured 2026-10-14 on the working tree of `7ab1e78` plus the visual-gate fix committed right afterwards as `26a25df`
(the build id in the corner reads `7ab1e78` because the fix was not committed yet at capture time; the frames show the
fixed code: prompt font fit, "15 cm" with a gap, tray rod with a margin). A first capture on the unfixed `7ab1e78` showed
the defects (`reviews/visual-review.md` V1–V3); those frames were deleted and every state re-captured.

Route: Playwright only. Every state is a drag, a sequence of answers or a played round, so a throwaway spec in the
gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service workers blocked, `hasTouch`,
`locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`) reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`.
The folder was moved out of the repo before the lint gate. States are reached through the product: the parent path
(age "10+", stage E3 or E4, no warm-up) with `?e2eSkills=<skill id>` (e2e build only) filling the round, then real taps,
wrong answers (`answerWrong`) and raw CDP touch drags. A silent speech stub hides the speaker. Claude in Chrome was not
used (no static state needs it; the long drags and the carry frame cannot be driven from it, profile § 8).

- `desktop-*` = 1440×900; `tablet-*` = 1024×768. Every test is a new browser context (a fresh device). Each skill draws a
  random task, so desktop and tablet frames of one state show different numbers; the values are listed below.
- Kit frames compared (not copied; `designs/` is gitignored): `designs/martynka-maths-A-v1/reference/helpers-reference.png`
  (clock, ruler, base-ten), `screenshots/task-tiles.png`, `task-keypad.png`, `tablet-1024.png`, `hint-*.png`,
  `solution-step-*.png`, `summary.png`, `unlock.png`. The kit has no chart, select, tray or mat screen (DESIGN-GAP 53–55).

| # | State | Desktop | Tablet | How reached (skill · values desktop / tablet) |
|---|---|---|---|---|
| 01 | clock, full hour, tiles | `desktop-01-clock-full.png` | `tablet-01-clock-full.png` | `E3.3.clock_read_full` · 9.00 / 10.00 |
| 02 | clock with the hint bar | `desktop-02-clock-full-hint.png` | `tablet-02-clock-full-hint.png` | 01 + one wrong tile |
| 03 | clock with the solution steps beside it | `desktop-03-clock-full-solution.png` | `tablet-03-clock-full-solution.png` | 02 + a second wrong tile |
| 04 | clock, half hour | `desktop-04-clock-half.png` | `tablet-04-clock-half.png` | E4, `E4.3.clock_read_half`, tasks played right until minute ≠ 0 · 9.30 / 4.30 |
| 05 | clock, quarter | `desktop-05-clock-quarter.png` | `tablet-05-clock-quarter.png` | `E4.3.clock_read_quarter` · 9.45 / 1.30 (the quarter skill also draws halves, follow-up F12) |
| 06 | clock, 5 minutes | `desktop-06-clock-5min.png` | `tablet-06-clock-5min.png` | `E4.3.clock_read_5` · 9.50 / 11.30 |
| 07 | clock, 24-hour | `desktop-07-clock-24h.png` | `tablet-07-clock-24h.png` | `E3.11.clock_24h` · 21.00 / 19.00 |
| 08 | ruler cm, keypad | `desktop-08-ruler-cm.png` | `tablet-08-ruler-cm.png` | `E3.5.length_ruler_cm_15` · 2–12 cm = 10 / 0–5 cm = 5 |
| 08b | ruler cm, segment not from 0 | `desktop-08b-ruler-cm-shifted.png` | `tablet-08b-ruler-cm-shifted.png` | same skill, played until `fromMm > 0` · 2–12 cm / 1–13 cm = 12 |
| 09 | ruler with the hint bar | `desktop-09-ruler-cm-hint.png` | `tablet-09-ruler-cm-hint.png` | 08 + one wrong number |
| 10 | ruler with the solution steps below it | `desktop-10-ruler-cm-solution.png` | `tablet-10-ruler-cm-solution.png` | 09 + a second wrong number |
| 11 | ruler mm | `desktop-11-ruler-mm.png` | `tablet-11-ruler-mm.png` | E4, `E4.7.length_ruler_mm_10` · 0–40 mm / 0–41 mm |
| 12 | base-ten read, E3.6 | `desktop-12-blocks-e3.png` | `tablet-12-blocks-e3.png` | `E3.6.place_read_30` · 30 / 23 |
| 13 | base-ten read with hundreds, E4.8 | `desktop-13-blocks-e4-hundreds.png` | `tablet-13-blocks-e4-hundreds.png` | E4, `E4.8.place_read_1000` · 109 / 358 |
| 14 | bar chart `most`, label tiles | `desktop-14-chart-most.png` | `tablet-14-chart-most.png` | `E3.4.data_most_10` · Niebieski 8, Czerwony 9, Różowy 6, Zielony 5 / Śliwka 9, Gruszka 4, Truskawka 3, Banan 6 |
| 15 | bar chart `diff`, keypad (five-line prompt, fixed V1) | `desktop-15-chart-diff.png` | `tablet-15-chart-diff.png` | `E3.4.data_diff_10` · Zielony 10, Różowy 7, Czerwony 3 → 4 / Czerwony 7, Zielony 8, Różowy 3 → 5 |
| 16 | bar chart with the solution steps | `desktop-16-chart-diff-solution.png` | `tablet-16-chart-diff-solution.png` | 15 + two wrong numbers |
| 17 | select, nothing marked | `desktop-17-select-none.png` | `tablet-17-select-none.png` | `E3.7.select_even_30` · {2, 6, 8, 12} / {12, 26, 30} |
| 18 | select, two marked (partial set) | `desktop-18-select-two.png` | `tablet-18-select-two.png` | two correct tiles tapped |
| 19 | select after a wrong set (hint bar, set cleared) | `desktop-19-select-hint.png` | `tablet-19-select-hint.png` | 18 + "OK" |
| 20 | select in the solution steps | `desktop-20-select-solution.png` | `tablet-20-select-solution.png` | 19 + a wrong tile + "OK" |
| 21 | select retype, the whole set marked | `desktop-21-select-retype.png` | `tablet-21-select-retype.png` | 20 + "Następny krok"/"Już wiem" to the retype, every correct tile tapped |
| 22 | drag, empty mat and tray | `desktop-22-drag-start.png` | `tablet-22-drag-start.png` | `E3.6.place_build_30` · 18 / 16 |
| 23 | drag, a rod under the finger (carrying) | `desktop-23-drag-carrying.png` | `tablet-23-drag-carrying.png` | CDP touchStart on the tray rod + 8 moves to halfway, frame taken before touchEnd (hook `carrying: true`) |
| 24 | drag, 2 rods and 3 cubes on the mat | `desktop-24-drag-on-mat-23.png` | `tablet-24-drag-on-mat-23.png` | drags from the tray to the mat, hook mat `{ten: 2, one: 3}` |
| 25 | drag, a cube dropped outside the mat went back | `desktop-25-drag-dropped-off-mat.png` | `tablet-25-drag-dropped-off-mat.png` | drag a cube to (700, 260), mat unchanged |
| 26 | drag, a tap on a mat cube took it off | `desktop-26-drag-tap-removed.png` | `tablet-26-drag-tap-removed.png` | tap on a mat cube, hook mat `{ten: 2, one: 2}` |
| 27 | drag, hint bar after a wrong number | `desktop-27-drag-hint.png` | `tablet-27-drag-hint.png` | answer + 1 built and "OK" (mat emptied, row 55) · 14 / 12 |
| 28 | drag, solution steps in the tray's place | `desktop-28-drag-solution.png` | `tablet-28-drag-solution.png` | 27 + a second wrong build |
| 29 | round summary after drawn tasks | `desktop-29-summary.png` | `tablet-29-summary.png` | clock, chart, ruler, blocks, select played right: +7 (5 + bonus 2) |
| 30 | "Nowa umiejętność!" card, E4.3 | `desktop-30-unlock.png` | `tablet-30-unlock.png` | age 8, E4, `?e2eMonth=8` (route of `adaptive.spec` #13), adaptive rounds played right until `pendingUnlock` 3, "Kolejna runda" |

Not captured: the "Nowa umiejętność!" card for E3.3 (age 10+, E3, September: no unlock in 14 clean rounds; E4.3 shows the
same widget with an S-13 `childName`); 7.45 exactly (random draw, 9.45 stands for "a quarter to"); a block lifted from the
mat while the finger is down (follow-up `BlockMat.render` lifted block; the tap-to-remove frame 26 covers the result).
