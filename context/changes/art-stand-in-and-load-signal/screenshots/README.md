# Screenshots: art-stand-in-and-load-signal visual gate

Captured 2026-10-14 on `8881888` (the visual-gate fix). The build id in the corner reads `8881888`. The first capture on
`e5c2e91` showed the defects (`reviews/visual-review.md` V1, V2). Those frames were deleted and every state was captured again.

Route: Playwright only, as in the S-13 and S-14 gates. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder
had its own config: no `webServer`, service workers blocked, `hasTouch`, `pl-PL`, `Europe/Warsaw`, and three projects:
`desktop` 1920×1080, `tablet` 1024×768 and `narrow` 400×300 (a 400 px landscape viewport stands in for the iframe trick).
It reused `tests/e2e/support/{welcome,hook}.ts` against the e2e hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`),
served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The folder was moved out of the repo before
the e2e gate. Claude in Chrome was not used, because the panel and the dialogs need the 2 s gear long-press and the
solution phase needs two wrong answers.

States were reached through the product:
- Stand-ins: the parent path (age "10+", then the stage, no warm-up) with `?e2eArt=missing&e2eSkills=<skill>`, rounds
  played right until the wanted drawing showed, then two wrong answers to reach the solution phase.
- Panel: `passWelcome` (E3) with or without `?e2eArt`, gear hold, adult gate, panel scrolled to the "Obrazki" line.
- Dialogs: `?e2eSave=unavailable|unreadable` with "Graj dalej" and the first age button; the healthy save is a fresh
  context. Import step 2 uses a valid save file (7 stars, E4) picked in the real file chooser.

Each test is a fresh browser context, so desktop and tablet frames of one state show different random tasks. The
values below come from the hook snapshot logged per frame.

| # | State | Desktop 1920×1080 | Tablet 1024×768 / narrow 400×300 | How reached (skill · values desktop / tablet) |
|---|---|---|---|---|
| 01 | coins, E1, tiles (+ solution beside the tiles) | `desktop-01-coins-e1(-solution).png` | `tablet-01-coins-e1(-solution).png` | `E1.11.money_count_10` · 2+1 = 3 / 2+2+1 = 5 |
| 02 | grosze incl. 1 gr / 2 gr, keypad (+ solution) | `desktop-02-grosze-e2(-solution).png` | `tablet-02-grosze-e2(-solution).png` | `E2.8.money_count_gr`, played until 1 gr or 2 gr · 50+10+2+1 = 63 / 20+5+5+2 = 32 |
| 03 | notes and coins, E4 (+ solution) | `desktop-03-notes-e4(-solution).png` | `tablet-03-notes-e4(-solution).png` | `E4.1.money_count_100`, played until a note · 50+20+5+5 = 80 / 10+10+10+1 = 31 |
| 04 | jugs 1 l, E2 (+ solution) | `desktop-04-jugs-litres-e2(-solution).png` | `tablet-04-jugs-litres-e2(-solution).png` | `E2.2.capacity_litres` · 9 / 4 |
| 05 | jugs with ¼ l, E5.5 (+ solution) | `desktop-05-jugs-quarter-e5(-solution).png` | `tablet-05-jugs-quarter-e5(-solution).png` | `E5.5.capacity_quarter_l` · 1 + 8×¼ = 3 / 2 + 8×¼ = 4 |
| 06 | jugs with ½ l, E4.7 (+ solution) | `desktop-06-jugs-howmany-e4(-solution).png` | `tablet-06-jugs-howmany-e4(-solution).png` | `E4.7.capacity_half_l` · 10×½ = 5 / 3 + 4×½ = 5 |
| 07 | scale with ≥ 3 weights, dag, E3 (+ solution beside the keypad) | `desktop-07-scale-dag-e3(-solution).png` | `tablet-07-scale-dag-e3(-solution).png` | `E3.4.mass_dag_100`, played until ≥ 3 weights · 50+20+20+10 = 100 / 50+10+10+10 = 80 |
| 08 | COUNT icons, E1 (+ solution) | `desktop-08-count-e1(-solution).png` | `tablet-08-count-e1(-solution).png` | `E1.4.count_7` · 7 cups / 5 croissants |
| 09 | MULT_GROUPS icons, E3 (+ solution) | `desktop-09-groups-e3(-solution).png` | `tablet-09-groups-e3(-solution).png` | `E3.9.mult_groups_result` · 4×3 = 12 / 5×3 = 15 |
| 10 | thermometer, E5 (+ solution) | `desktop-10-thermo-e5(-solution).png` | `tablet-10-thermo-e5(-solution).png` | `E5.4.temperature_read_0_30` · 14 / 14 °C |
| 20 | parent panel "Obrazki": OK / missing / corrupt | `desktop-20-panel-art-{ok,missing,corrupt}.png` | `narrow-20-panel-art-{ok,missing,corrupt}.png` | no seam / `?e2eArt=missing` (38 of 38) / `?e2eArt=corrupt` (15 of 38, the money) |
| 30 | import and reset, `?e2eSave=unavailable` | `desktop-30-unavailable-{import,reset}.png` | `narrow-30-unavailable-{import,reset}.png` | card "Graj dalej", age button, gear |
| 31 | import and reset, `?e2eSave=unreadable` | `desktop-31-unreadable-{import,reset}.png` | `narrow-31-unreadable-{import,reset}.png` | as 30 |
| 32 | import step 1, import step 2, reset on a healthy save | `desktop-32-healthy-{import,import-step2,reset}.png` | `narrow-32-healthy-{import,import-step2,reset}.png` | `passWelcome`, file `zapis.txt` (7 stars, E4) |

Kit frames: `designs/` is gitignored, and DESIGN-GAP 66 records that the kit has no stand-in for a missing drawing.
The dialogs and the panel follow the S-12 frames of the same dialogs.
