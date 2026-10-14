# Screenshots — art-tasks-all-stages (S-14) visual gate

Captured 2026-10-14 on the working tree of `0c5b25e` plus the visual-gate fixes committed right afterwards as
`f4f0c82` (the build id in the corner reads `0c5b25e` because the fixes were not committed at capture
time; the frames show the fixed code: the thermometer column, centred scale labels, larger weights, shaped icon groups).
Two earlier captures on the unfixed tree showed the defects (`reviews/visual-review.md` V1–V4); those frames were deleted
and every state re-captured.

Route: Playwright only, as in S-13. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no
`webServer`, service workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, two projects
`desktop` 1440×900 and `tablet` 1024×768) reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`.
The folder was moved out of the repo before the lint gate. States are reached through the product: the parent path
(age "10+", or "6" for E6, then the stage, no warm-up) with `?e2eSkills=<skill id>` (e2e build only) filling the round, then
real taps and wrong answers (`answerWrong`). The unlock card is the child path (age 6, `?e2eMonth=0`, adaptive rounds played
right). Before every frame the spec waited until the hook's `art` list was non-empty and every texture `loaded: true`
(nothing is the stand-in box), then 900 ms for tweens. A silent speech stub hides the speaker. Claude in Chrome was not
used: every state needs taps and wrong answers.

- `desktop-*` = 1440×900; `tablet-*` = 1024×768. Every test is a new browser context (a fresh device). Each skill draws a
  random task, so desktop and tablet frames of one state show different values; they are listed below (from the hook's
  read-only snapshot, logged per frame).
- Kit frames compared (not copied; `designs/` is gitignored): `designs/martynka-maths-A-v1/screenshots/contact-money.png`
  (coins and notes), `contact-measuring.png` (scale, weights, jugs, thermometer), `contact-icons.png`, `task-tiles.png`,
  `task-keypad.png`, `tablet-1024.png`, `hint-*.png`, `solution-step-*.png`, `summary.png`, `unlock.png`,
  `reference/thermometer-face.js`. The kit has no composed scale, money table, jug row, icon groups or a small thermometer
  (DESIGN-GAP 60–65).

| # | State | Desktop | Tablet | How reached (skill · values desktop / tablet) |
|---|---|---|---|---|
| 01 | coins, E1, number tiles | `desktop-01-coins-e1.png` | `tablet-01-coins-e1.png` | `E1.11.money_count_10` · 5+1 = 6 / 5+2 = 7 |
| 02 | notes and coins, E4, keypad | `desktop-02-notes-e4-keypad.png` | `tablet-02-notes-e4-keypad.png` | `E4.1.money_count_100`, played until a note shows · 50+2+2 = 54 / 20+10+1+1 = 32 |
| 03 | zł + gr on text tiles | `desktop-03-money-zl-gr-tiles.png` | `tablet-03-money-zl-gr-tiles.png` | `E4.1.money_count_zl_gr` · 2 zł+50+20+10 gr = "2 zł 80 gr" / 2+2 zł+20+10 gr = "4 zł 30 gr" |
| 04 | scale, kg, tiles | `desktop-04-scale-kg-tiles.png` | `tablet-04-scale-kg-tiles.png` | `E1.11.mass_kg_10` · cushion = 2 kg / lamp = 3 × 1 kg |
| 05 | scale, dag, keypad | `desktop-05-scale-dag-keypad.png` | `tablet-05-scale-dag-keypad.png` | `E3.4.mass_dag_100` · apple = 20 dag / cushion = 50+20+20+10 = 100 dag |
| 06 | scale with the hint bar | `desktop-06-scale-dag-hint.png` | `tablet-06-scale-dag-hint.png` | 05 + one wrong number |
| 06s | scale with the solution steps (picture above the lines, beside the keypad) | `desktop-06-scale-dag-solution.png` | `tablet-06-scale-dag-solution.png` | 06 + a second wrong number |
| 08 | money with the solution steps beside the tiles | `desktop-08-money-solution-tiles.png` | `tablet-08-money-solution-tiles.png` | 01 + two wrong tiles |
| 09 | thermometer positive, E5, keypad | `desktop-09-thermo-e5-keypad.png` | `tablet-09-thermo-e5-keypad.png` | `E5.4.temperature_read_0_30` · 22 / 26 °C |
| 10 | thermometer with the hint bar (bar right of the column) | `desktop-10-thermo-e5-hint.png` | `tablet-10-thermo-e5-hint.png` | 09 + one wrong number |
| 10s | thermometer with the solution steps beside it | `desktop-10-thermo-e5-solution.png` | `tablet-10-thermo-e5-solution.png` | 10 + a second wrong number |
| 11 | thermometer, E3, text tiles (F3) | `desktop-11-thermo-e3-tiles.png` | `tablet-11-thermo-e3-tiles.png` | `E3.11.temperature_read_30` · 30 / 15 °C |
| 12 | thermometer negative, E6, text tiles (F3) | `desktop-12-thermo-e6-negative-tiles.png` | `tablet-12-thermo-e6-negative-tiles.png` | `E6.1.temperature_negative`, played until below 0 · −24 / −10 °C |
| 13 | temperature difference, E6, keypad | `desktop-13-thermo-e6-diff.png` | `tablet-13-thermo-e6-diff.png` | `E6.1.temperature_diff` · now 16 °C, answer 20 / now 6 °C, answer 4 |
| 14 | jugs ½ l, E4, keypad | `desktop-14-jugs-half.png` | `tablet-14-jugs-half.png` | `E4.7.capacity_half_l`, played until a ½ l jug shows · 4×1 + 2×½ = 5 l / 1 + 2×½ = 2 l |
| 15 | jugs with the hint bar | `desktop-15-jugs-half-hint.png` | `tablet-15-jugs-half-hint.png` | 14 + one wrong number |
| 15s | jugs with the solution steps | `desktop-15-jugs-half-solution.png` | `tablet-15-jugs-half-solution.png` | 15 + a second wrong number |
| 16 | counting 1–5, E1 | `desktop-16-count-5.png` | `tablet-16-count-5.png` | `E1.2.count_5` · 1 flower / 1 croissant (the first draw; a single icon) |
| 17 | counting 6–7, E1 | `desktop-17-count-7.png` | `tablet-17-count-7.png` | `E1.4.count_7`, played until ≥ 6 · 7 / 7 |
| 18 | groups in frames, number tiles, E3 | `desktop-18-groups-result.png` | `tablet-18-groups-result.png` | `E3.9.mult_groups_result` · 4 × 3 = 12 / 4 × 4 = 16 |
| 19 | groups in frames, "5 · 6" tiles | `desktop-19-groups-expr.png` | `tablet-19-groups-expr.png` | `E3.9.mult_groups_expr` · 5 frames of 6 → "5 · 6" (both) |
| 20 | groups with the hint bar | `desktop-20-groups-hint.png` | `tablet-20-groups-hint.png` | 18 + one wrong tile |
| 21 | ruler E1.8, number tiles | `desktop-21-ruler-e1.png` | `tablet-21-ruler-e1.png` | `E1.8.length_ruler_cm_10` · 0–9 cm / 0–5 cm |
| 22 | 11–12: a ten in a row and the rest under it | `desktop-22-count-12.png` | `tablet-22-count-12.png` | `E1.10.count_12` · 10 + 1 = 11 (both) |
| 24 | money E2.2, keypad | `desktop-24-money-e2-keypad.png` | `tablet-24-money-e2-keypad.png` | `E2.2.money_count_20` · 10+5+2+1+1 = 19 / 2+1 = 3 |
| 25 | grosze E2.8, keypad | `desktop-25-money-gr-e2.png` | `tablet-25-money-gr-e2.png` | `E2.8.money_count_gr` · 50+1 = 51 / 50+10+10+5+5+2 = 82 |
| 26 | scale dag E2.8 | `desktop-26-scale-dag-e2.png` | `tablet-26-scale-dag-e2.png` | `E2.8.mass_dag_100` · cup = 3 × 10 dag / apple = 3 × 10 dag |
| 27 | jugs ¼ l, E5.5 | `desktop-27-jugs-quarter.png` | `tablet-27-jugs-quarter.png` | `E5.5.capacity_quarter_l`, played until a ¼ l jug shows · 4×¼ = 1 l / 1 + 4×½ + 4×¼ = 4 l |
| 28 | "Nowa umiejętność!" with a new `childName` | `desktop-28-unlock.png` | `tablet-28-unlock.png` | child path, age 6, `?e2eMonth=0` (E1 starts at step 10), adaptive rounds played right until `pendingUnlock`, "Kolejna runda" · E1.11 "Zegar, miesiące i pieniądze" |
| 29 | round summary after an art round | `desktop-29-summary.png` | `tablet-29-summary.png` | E3, `?e2eSkills=` scale kg, groups ×2, thermometer, scale dag, played right: +7 (5 + bonus 2); hook `art` empty |

Not captured: "klocki E1.10" of plan row 8.8 (`E1.10.place_read_12` was cut in phase 8, follow-up S-14b, so no such task
exists); the unlock card for E1.8, E1.10, E2.2, E2.8 or E5.5 (one card shown, E1.11; the same widget); a counting frame with
2–5 icons from `E1.2.count_5` (both draws were 1; `E1.4.count_7` frames show the same layout with 7).
