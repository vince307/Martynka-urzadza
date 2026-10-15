# Screenshots — text-measure-time-types (S-14c) visual gate

Captured 2026-10-15. The build id in the corner reads `70cc262` (the last commit before the gate); every frame was taken with the
fixes of `da12957` in the working tree, so each frame shows the final code for what it depicts: the INEQUALITY frames and the
typed keypad frames after the blank and grouping fixes, the E6.9 frames (`v0*`) after the expression fit (re-captured last, maxWidth
760). The first capture on `70cc262` showed V1 and V2 of `reviews/visual-review.md`, the second (with the added E6.9 four-term state) V3; those frames were deleted.

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service
workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768)
reused `tests/e2e/support/{welcome,hook,saveImport}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`)
served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The folder was moved out of the repo before the lint gate.
Claude in Chrome was not used: every state but a first try needs taps on the Phaser canvas (tiles, keypad, "Następny krok"), which
synthetic events cannot drive (profile § 8). A silent speech stub hides the speaker; the spec waited 900 ms before each frame.

States are reached through the product: the parent path (E1: age "10+", month 9; E5/E6: age "8", month 8 — overrides, no warm-up)
with `?e2eSkills=<skill>&e2eVariant=off`, then real taps. The review round: a v2 save at E6 step 10 with the step's skills at
mastery 4 imported through the parent panel ("Wczytaj z pliku"), one round played right, "Kolejna runda".

- `desktop-*` = 1440×900 (scene at 0.75); `tablet-*` = 1024×768 (scene at 0.533). Each test is a new browser context, so desktop and
  tablet frames of one state usually show different tasks (values: desktop · tablet).
- Kit: no frame for these text tasks (gaps 98, 99); judged against the existing task screen (kit `task-keypad.png`, `task-tiles.png`).

| # | State | Frames (`desktop-` / `tablet-`) | Skill · values (desktop · tablet) |
|---|---|---|---|
| i01–i02 | INEQUALITY first try; a right tile that is not the model answer tapped (pale green, "Brawo! +1 ★") | `i01-inequality-first`, `i02-inequality-other-right` | `E1.9.inequality_10` · 1 + □ > 5, tapped 6 (model 7) · 1 + □ > 5, tapped 5 (model 9) |
| i03–i04 | next task: first try, wrong tile → hint (second try), solution steps 1–3 ("Pasuje …"), retype | `i03-inequality-next-first`, `i04-inequality-{hint,solution-1,-2,-3,retype}` | 4 + □ < 9 (right 1, 3) · □ + 3 < 7 (right 1, 3) |
| p01–p04 | PRICE first try, four prompts each | `p0{1..4}-price-first` | `E5.10.price_100` · longest: "Zosia kupiła 5 długopisów. Jeden długopis kosztuje 3 złote. Ile złotych zapłaciła za zakupy?" · "Ania kupiła 7 pączków. …" |
| p05–p06 | TIMES_MORE first try, hint (three lines in the keypad bar) | `p05-times-more-first`, `p06-times-more-hint` | `E5.10.times_more_100` · 14, 7 razy mniej · 3, 5 razy więcej |
| p07–p08 | ORDER_OPS first try, hint, solution steps 1–3, retype | `p07-order-ops-first`, `p08-order-ops-{hint,solution-1,-2,-3,retype}` | `E5.11.order_ops_100` · 3 · 5 + 68 · 10 · 3 + 56 |
| c01–c02 | E5.3 lesson end, time tiles ("12.00", "11.30") first try and hint | `c01-lesson-end-first`, `c02-lesson-end-hint` | `E5.3.clock_end_lesson` · tablet 11.15 + 45 min → 12.00 |
| c03–c05 | E5.8 timetable on the keypad (two prompts), hint, solution step 1, retype | `c03-timetable-first`, `c04-timetable-first-2`, `c05-timetable-{hint,solution-1,retype}` | `E5.8.clock_span_timetable` · tablet 18 → 7 (13 h), 19 → 2 (7 h) |
| c06–c07 | E6.2 "do pełnej godziny": first try, hint, step 1, retype | `c06-to-hour-first`, `c07-to-hour-{hint,solution-1,retype}` | `E6.2.clock_to_hour` · tablet 11.38 → 12.00 (22) |
| c08–c09 | E6.2 TV programme span (longest timetable prompts), two first tries | `c08-programme-first`, `c09-programme-first-2` | `E6.2.clock_span_programme` |
| c10–c11 | TIME_UNITS first try, hint, solution steps 1–2, retype | `c10-time-units-first`, `c11-time-units-{hint,solution-1,-2,retype}` | `E6.1.time_units` · tablet 240 min → 4 h |
| u01–u02 | UNIT_CHOICE tiles (km / m / cm), first try and hint | `u01-unit-choice-first`, `u02-unit-choice-hint` | `E5.7.unit_choice` |
| m01–m02b | MASS tare on the keypad (six-line prompt), answer typed, hint, solution steps, retype | `m01-mass-tare-first`, `m02-mass-tare-typed`, `m02b-mass-tare-{hint,solution-1,-2,retype}` | `E6.3.mass_tare_kg` · tablet 19 kg brutto, 15 kg netto → 4 |
| m03 | MASS grams net (E5.7) first try | `m03-mass-grams-first` | `E5.7.mass_grams` |
| m04–m05 | MASS tonne / quintal: first try, hint, solution steps 1–2, retype | `m04-mass-tonne-first`, `m05-mass-tonne-{hint,solution-1,-2,retype}` | `E6.5.mass_tonne` |
| l01–l02 | LENGTH scale first try, hint, solution steps 1–3, retype, second prompt | `l01-scale-first`, `l01b-scale-{hint,solution-1,-2,-3,retype}`, `l02-scale-first-2` | `E5.12.length_scale` · 1 cm = 5 m, 9 cm on the plan → 45 m · 1 cm = 5 m, 20 m → 4 cm |
| l03–l04 | LENGTH `twoUnit` with the box inside the prompt | `l03-two-unit-first`, `l04-two-unit-first-2` | `E6.3.length_two_units` · 12 mm = 1 cm □ mm · 276 mm = 27 cm □ mm |
| l05–l06 | CAPACITY text: first try, hint, solution steps 1–3, retype | `l05-capacity-text-first`, `l06-capacity-text-{hint,solution-1,-2,-3,retype}` | `E5.5.capacity_half_l_e5` · 3 l, ½ l → 6 · 3 l, ½ l → 6 |
| v01–v02c | E6.9 first tries; the box in a four-term decomposition: first try, hint, solution steps 1–2, retype | `v01-e69-first`, `v02-e69-first-2`, `v02b-e69-box`, `v02c-e69-box-{hint,solution-1,-2,retype}` | `E6.9.place_value_10000` · 4442 = 4000 + 400 + 40 + □ · 5749 = 5000 + □ + 40 + 9 |
| v03–v06 | E6.10 six-digit answer: first try, typed before OK ("620 000"), right, next task hint, solution steps 1–3, retype | `v03-e610-first`, `v04-e610-typed`, `v05-e610-done`, `v06-e610-{hint,solution-1,-2,-3,retype}` | `E6.10.place_value_1000000` · 620 000; 840 000 · 530 000; "Ile tysięcy to 66 000?" |
| r01–r06 | "Nowa umiejętność!" card "Powtórka roku", then the five tasks of the first review round | `r01-unlock-review`, `r0{2..6}-review-task-{1..5}` | imported save E6 step 10 |
