# Visual review: art-stand-in-and-load-signal

Step: visual gate of autonomous run `2026-10-14-fix-art-stand-in`, after impl-review (`MERGE: CLEAR`; its F1 was handed to
this gate). The first capture on `e5c2e91` found two discrepancies. Both were fixed in `8881888`, and every state was
captured again on `8881888` (60 frames: 20 stand-in states × desktop + tablet, 10 panel/dialog states × desktop + 400 px).
Frame list, routes and values are in `screenshots/README.md`.

## Capture

Playwright only, as in the S-13 and S-14 gates. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder ran
against the e2e hook build on 4399 (`dist-e2e`, `E2E_HOOK=1`). Viewports were 1920×1080, 1024×768, and 400×300 for the
DOM panel and dialogs. It reused `tests/e2e/support/{welcome,hook}.ts`. Chromium launched in this subagent session as a
plain `npx playwright test --config=…` command (a piped variant hits the sandbox). Claude in Chrome was not used: the
panel and the dialogs need the 2 s gear long-press, and the solution phase needs two wrong answers (contract § Screenshots).

## F1 measurement (impl-review): stand-in label size on a 1024 px tablet

Measured on the frames by pixel profile: digit height in CSS px, converted to font size with digit ≈ 0.73 em. The
reference is a coin label at full size, `FONT_SIZES.artLabel` 24 × 0.533 = 12.8 CSS px, whose digits measured 9–10 px
(`tablet-02-grosze-e2.png`).

| Label | Before (`e5c2e91`) | After (`8881888`) |
|---|---|---|
| Coins "1 gr", "2 gr", "10 gr" (main and solution) | digits 9–10 px, font 12.8 (full size) | unchanged |
| Weight "10 dag", keypad picture (the child must read it) | digits 7.5 px, font ≈ 10.3 | digits 9 px, font ≈ 12.3 (back row on one line, front row "50 / dag" on two) |
| Weight in the keypad solution (190 px picture) | digits 3.5–4 px, font ≈ 5 | front row ≈ 9.5, back row ≈ 7.5 (O1) |
| Jugs "1 l", "½ l", "¼ l" (main) | full size, but the boxes overlapped (V2) | full size (12.8), boxes apart |

The unit test reproduces the old browser value from the layout data: the deliberate break gave `expected 10.16 ≥ 11.9`,
which matches the measured 10.3. So the test models what the tablet shows.

## Discrepancies and fixes

| # | Found (`e5c2e91`) | Why it matters | Fix (`8881888`) |
|---|---|---|---|
| V1 = F1 | A weight label in the keypad picture was ≈ 10 CSS px on the tablet. In the solution phase it was ≈ 5 px. Back-row labels were half hidden by the front row's boxes once they grew | With missing art the label is the only source of the weight's mass in the first try. A 7-year-old needs ≥ 12 px | `standInLabelFit` (`src/ui/widgets/artLayout.ts`): the label breaks at its space ("10" over "dag") when that keeps it larger. The padding is at most `ART_STAND_IN.paddingShare` (3 %) of the box's shorter side. `scaleLayout().uncovered` gives a back-row weight the part the front row leaves, and `BalanceScale` passes it to `ArtImage.show` as the box. Tests in `tests/artLayout.test.ts`: wrap at full size, back-row label ≥ 11.9 CSS px, uncovered parts disjoint |
| V2 | Jug stand-in boxes covered the whole square image, including its transparent margin. In two rows they overlapped each other, and in the solution phase they covered the first solution line ("Każdy duży dzbanek mieści litr.", "Dwa dzbanki po pół litra…") | The solution line was unreadable, and so were the jug labels in the second row | `ArtImage.show(key, rect, standIn?)`. `Jugs` passes `jugsLayout().jugs[i]` (the shared visible rectangle, already kept apart and inside the area by `jugsLayout`). Boxes are now apart and the line is free (`tablet-04/05/06-…-solution.png`) |

DESIGN-GAP row 66 was updated (wrap, padding, jug and back-row boxes). No new gap.

## States (judged)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 5.6 | coins E1 tiles, grosze E2.8 with 1 gr / 2 gr, notes E4.1, jugs 1 l / ½ l / ¼ l, scale with ≥ 3 weights, COUNT, MULT_GROUPS, thermometer; each also in the solution phase | 01–10 | Every box shows the Polish value from data, never a file id. Coin and note labels are at full size. Weights and jugs are readable in the first try after V1/V2. COUNT and MULT_GROUPS boxes show the noun ("filiżanka", "gruszka") smaller than 12 px: the child counts boxes, the noun is not the answer. Frames inside the notebook, off the keypad, the tiles and the bar. The thermometer frame is an empty box with the column and the scale labels drawn in code over it (the value stays readable). ✓ |
| 4.5 | "Obrazki" OK, missing, corrupt | 20 | "Wszystkie obrazki zadań są wczytane." / "38 z 38 obrazków nie wczytało się. W tych zadaniach zamiast obrazka jest napis. Uruchom grę ponownie." / "15 z 38 …" (the 15 money images point at a non-image). Agreement for 38 and 15 ("nie wczytało się") is correct. At 400 px the line wraps inside the panel, which scrolls above the sticky "Zatwierdź / Anuluj". ✓ |
| 6.6 | import and reset under `unavailable` | 30 | Only the line "Gra nie mogła odczytać zapisu na tym urządzeniu, więc nie może go teraz zastąpić. Uruchom grę ponownie i spróbuj jeszcze raz." and "Zamknij" (initial focus "Zamknij"); no "Teraz", no file choice, no confirmation. ✓ |
| 6.6 | import and reset under `unreadable` | 31 | A warning stands where "Teraz" would be. Import offers "Wybierz plik" (focus) and "Anuluj"; reset offers "Anuluj" (focus) and "Zacznij od nowa"; no "0 gwiazdek". ✓ |
| 6.6 | healthy save: import step 1, step 2, reset | 32 | Unchanged from S-12: step 2 shows "Teraz" (0 gwiazdek, Klasa 2, I półrocze, Salon: 0 z 10) and "Z pliku" (7 gwiazdek, Klasa 2, II półrocze), with focus on "Anuluj"; reset has "Teraz" and focus on "Anuluj". ✓ |

Keyboard and focus: the initial focus was logged per frame (`document.activeElement`). It is never on a destructive
action: "Zamknij", "Wybierz plik" or "Anuluj" in every dialog.

## Hand-checked against the task's answer (mandatory)

- **Weights, `tablet-07`** (answer 80 dag): labels read 50, 10, 10, 10 dag → 50 + 10 + 10 + 10 = 80 ✓. **`desktop-07`** (100):
  50 + 20 + 20 + 10 = 100 ✓.
- **Notes, `desktop-03`** (80): 50 zł + 20 zł + 5 zł + 5 zł = 80 ✓. **`tablet-03`** (31): 3 × 10 zł + 1 zł = 31 ✓.
- **Grosze, `tablet-02`** (32): 20 + 5 + 5 + 2 = 32 ✓. **`desktop-02`** (63): 50 + 10 + 2 + 1 = 63 ✓.
- **Jugs, `tablet-05`** (4 l): 1 + 1 + 8 × ¼ = 4 ✓. **`desktop-06`** (5): 10 × ½ = 5 ✓. **`tablet-06`** (5): 3 × 1 + 4 × ½ = 5 ✓.
- **Groups, `tablet-09`** (15): 5 frames × 3 boxes "gruszka" = 15 ✓.
- **Font arithmetic**: 24 scene px × 1024/1920 = 12.8 CSS px. A back-row weight in the keypad picture is 84 × 0.984 ≈ 83 scene px
  wide and 60 × 0.984 ≈ 59 tall. With 3 % padding (1.8 px) a one-line "10 dag" (≈ 84 px wide at 24 px) gets (83 − 3.6) / 84 ≈ 0.945
  → 22.7 scene px → 12.1 CSS px. The measured digits (9 px ≈ 12.3 font) agree.

## Observations (not fixed; follow-ups with triggers)

- O1: in the keypad solution phase (190 px picture) stand-in weight labels are still ≈ 7.5–9.5 CSS px (was ≈ 5). The next
  solution line gives the values (`20 + 20 + 20 = 60`), and the real art is no larger there (S-14 visual gate O1). This is a
  layout question for `TASK_LAYOUT.picture.keypadSolution`, recorded in `follow-ups/review-fixes.md` ("Visual-gate O1").
- O2: in very small boxes (weights in the keypad solution) the label nearly touches the border, because the
  padding is 3 % by design. It is readable, and preferred over a smaller text.

## Gate after the fix (working tree = `8881888`)

lint OK; typecheck OK; vitest 1905 passed (branch before this step 1899, +6; contract baseline 1865 on main, +40);
deploy + ops tests OK; `sample` E1–E6 exit 0 each; `npm run build` `e2e hook: absent (2 chunks checked)`, no `e2eArt`/`forcedArt`
in `dist/_app/*.js`; `npx playwright test --config=…/playwright.config.ts` 52 passed (3.8 m) = branch e2e 52 + 0. Deliberate
break: `ART_STAND_IN.paddingShare` 1 (the full padding) → `artLayout.test.ts` "keeps the label of a back-row weight … at
12 CSS px" red (`expected 10.16 to be greater than or equal to 11.9`); restored → 90/90.

VISUAL: PASS — every [visual] state captured at both sizes on the fixed build. F1 fixed: the weight label in the keypad picture went from ≈ 10 to ≈ 12.3 CSS px. Jug boxes no longer cover each other or the solution line. The panel and the dialogs match the plan, with the initial focus never on a destructive action. Small solution-phase weight labels are recorded as follow-up O1.
