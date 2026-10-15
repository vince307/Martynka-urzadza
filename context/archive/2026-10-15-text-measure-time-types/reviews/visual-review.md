# Visual review — text-measure-time-types (S-14c)

Step: visual gate of autonomous run 2026-10-15-fix-s14c-s14d, after impl-review (`MERGE: CLEAR`, `70cc262`). Three discrepancies
found on `70cc262`, fixed on the branch in one commit (`da12957`); every frame was re-captured with the fixes in the tree at
1440×900 and 1024×768 (176 frames, 88 states). Frame list, routes and values: `screenshots/README.md`.

## Capture

Playwright only, as in the S-13 … S-14b gates: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder against the
e2e-hook build on 4399, reusing `tests/e2e/support/{welcome,hook,saveImport}.ts` (`passWelcomeAsParent`, `answerWrong`,
`answerRight`, `snapshot`, `targets`, `tapScene`, `openImport`, `chooseFile`, `reloadedBy`, `playRoundRight`);
`?e2eSkills=<id>&e2eVariant=off`. Chromium launched in this subagent session as a plain `npx playwright test --config=<abs path>`
(one piped call ran sandboxed and hit MachPort, as profile § 8 says). Claude in Chrome was not used: every state past a first try
needs canvas taps (tiles, keypad keys, "Następny krok"), see profile § 8. The spec was moved out of the repo before the lint gate.

## Discrepancies and fixes

| # | Found (V1, V2: first capture on `70cc262`; V3: second capture, the added E6.9 state, before the fit) | Why it matters | Fix (`da12957`) |
|---|---|---|---|
| V1 | INEQUALITY hint bar and solution line 1: "Najpierw znajdź równość: 2 = 7 − ▫." — the "□" is a tiny system fallback glyph (the font has no U+25A1, gap 8), about a third of a digit | The hint's whole point is the equation with the box; a 6-year-old sees a dot, not the box of the prompt | `blankAsText` (`src/core/round/promptBlank.ts`) writes the blank of a hint, retype or solution line as "?"; used by `FeedbackBar.textOf` and `SolutionSteps.measure`. Prompts keep the drawn box, the narrator still says "okienko". Gap row 99. Test `tests/promptBlank.test.ts` "writes every blank …" (red: no export) |
| V2 | E6.10 keypad field shows "220000" while the prompt and the solution write "220 000" (`formatNumber`, grouping from 10 000) | Six bare digits (four zeros) are hard to count and differ from the line the child copies on the retype | `keypadDisplay` (`src/core/round/keypad.ts`) groups the buffer like `formatNumber`; `Keypad.paintField` shrinks a long number to the field (`TASK_LAYOUT.keypad.fieldPadding` 24). Test `tests/keypad.test.ts` `keypadDisplay` (break: return the bare buffer → red) |
| V3 | E6.9 decomposition with a box "6618 = 6000 + 600 + □ + 8" drawn at full expression size: ran off the notebook's left border and under the keypad (desktop "32 = 1000 + 600 + 30 + □" covered keys 1-2) | Unreadable task, digits under the keypad | `fitPieces` (`src/core/round/promptBlank.ts`) shrinks text, box and gaps by one scale when the row is wider than its room; `TaskScene.drawExpression` uses it with `TASK_LAYOUT.expression.maxWidth` 760 (40 px clear of the keypad) and `expressionWide.maxWidth` 1300. Test `tests/promptBlank.test.ts` "shrinks an expression …" (break: scale fixed at 1 → red) |

Meta-check of the breaks: each test asserts the pure function the widget calls, so a widget that stopped calling it would stay green;
the re-captured frames (`i04-*`, `v04-*`, `v02b/c-*`) are the evidence that the widgets use them.

## States (judged against the existing task screen; no kit frame for these text tasks, gaps 98-99)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 2.7 | INEQUALITY first try, non-canonical right tile pale green with "Brawo! +1 ★", wrong tile → hint (second try), solution step 1 … "Pasuje …", retype | i01–i04 | Four tiles 254×136 game px (135×72 CSS on the tablet) under the prompt; the tapped tile (6, model 7 · 5, model 9) is the green one (gap 98); after V1 the equation reads "4 + ? = 9"; the last line "Na przykład 1 + 3 = 4, a 4 < 7. Pasuje 1." stays in the bar on the retype with the model tile outlined |
| 3.6 | PRICE (four prompts each width, longest 3 sentences), TIMES_MORE hint, ORDER_OPS step 1 and last step | p01–p08 | Prompts wrap in 4 lines beside the keypad at full prompt size; TIMES_MORE hint is three bar lines (≈ 12.8 CSS px on the tablet, the floor used since S-15); ORDER_OPS lines under the expression, "Już wiem" in the bar zone |
| 4.7 | E5.3 time tiles first try and hint, E5.8 timetable on the keypad (span and night hours), E6.2 "do pełnej godziny", TIME_UNITS solution | c01–c11 | Time tiles "11.35 / 11.30 / 11.15" fit 254-px tiles at full size; timetable prompts (≤ 4 lines) and the 3-line solution stay above the bar; E6.2 TV-programme prompts are the longest (4 lines), no shrink needed |
| 5.6 | UNIT_CHOICE tiles first try and hint, MASS tare on the keypad (typed), MASS tonne/quintal solution | u01–m05 | Unit tiles km/m/cm with the drawn box in the sentence; the tare prompt is 6 lines (the longest of the slice) and keeps full size; its solution (3 lines) fits between the prompt and "Już wiem" — the prompt steps down only when it must (none needed) |
| 6.6 | LENGTH scale first try (and full solution), `twoUnit` with the box in the middle, CAPACITY text solution | l01–l06 | Scale prompt 5 lines; "12 mm = 1 cm □ mm" and "276 mm = 27 cm □ mm" keep the box between units; "½ l"/"¼ l" glyphs are in the font |
| 7.6 | E6.9 box in the decomposition, E6.10 grouped prompt "Ile tysięcy to 66 000?", six-digit answer typed, solution steps | v01–v06 | After V3 "4442 = 4000 + 400 + 40 + □" fits in 760 px (tablet digits ≈ 20 CSS px); after V2 the field reads "620 000"; solution lines group every number |
| 8.7 | "Nowa umiejętność!" card "Powtórka roku", the tasks of the first review round | r01–r06 | Card as kit unlock card (book icon, name, "Dalej"); the review round mixes E6 steps (Roman, written column, COMPARE_NUM 980 047 □ 980 047, place value, `twoUnit`, temperature, TV span) — each on its usual screen |

## Hand-checked against the task's answer (mandatory)

- INEQUALITY 1 + □ > 5: right tiles are > 4 within the four (3, 4, 6, 7) → 6 and 7; 6 tapped pays ✓; tablet tiles (3, 4, 5, 9) → 5 and 9,
  5 tapped pays ✓. □ + 3 < 7: □ < 4 → 1, 3 of (1, 3, 4, 5); "4 + 3 = 7, więc … mniej niż 4" ✓.
- PRICE 10 długopisów za 30 zł → 3 ✓; 5 · 3 = 15 ✓. TIMES_MORE 24 : 3 = 8 ✓; 14 : 7 = 2 ✓. ORDER_OPS 95 − 50 : 5 = 95 − 10 = 85 ✓;
  3 · 5 + 68 = 83 ✓.
- Time: 10.45 + 45 min = 11.30 ✓; 11.15 + 45 = 12.00 ✓; 15.56 → 16.50 = 4 + 50 = 54 ✓; 8.01 → 9.44 = 103 ✓; 19.00 → 2.00 = 5 + 2 = 7 h ✓;
  7.52 → 8.00 = 8 ✓; 240 : 60 = 4 ✓.
- Mass/length/capacity: 20 − 19 = 1, 19 − 15 = 4 (tara) ✓; 600 − 60 = 540 (netto) ✓; 800 : 100 = 8 kwintali ✓; 1 cm = 10 m, 70 m → 7 cm ✓;
  9 · 5 = 45 m ✓; 8 m 72 cm = 872 cm ✓; 276 mm = 27 cm 6 mm ✓; 3 l : ½ l = 6, 3 · 4 = 12 szklanek po ¼ l ✓.
- Place value: 9 tysięcy, 1 setka, 3 jedności = 9103 ✓; 5749 − 5000 − 40 − 9 = 700 ✓; 4442 − 4000 − 400 − 40 = 2 ✓; 800 000 + 70 000 = 870 000 ✓;
  66 000 → 66 tysięcy ✓.
- Stars: i02 right non-canonical tile → counter 0 → 1, "Brawo! +1 ★" ✓; the review round counter 10 → 14 over four right tasks ✓.

## Fit and legibility on the 1024 tablet

Smallest text: the hint bar with three lines (TIMES_MORE, E6.2 "Godzina ma 60 minut …", E5.12 "Sprawdź, ile razy …") ≈ 12.8 CSS px; the
longest first hint of any new skill is 67 characters (E5.12), which stays at three lines. Solution lines ≈ 23 CSS px, prompts ≈ 26 CSS px,
shrunk E6.9 expression ≈ 20 CSS px, keypad field 6 digits + space ≈ 40 CSS px. No text crosses another element in any captured state
after the fixes.

## Observations (not fixed, follow-ups with triggers in `follow-ups/review-fixes.md`)

- O1: the E5.8 night-hours hint is spoken with the dotted time "czyli do 24.00" (narration of the hint line), not through `spokenTime`.
- O2: a three-line hint bar beside the keypad is at the 12-px floor; a first hint over ~70 characters would wrap to a fourth line
  and drop below it.
- O3: the shrunk E6.9 expression keeps no minimum scale: a 5-term decomposition with five-digit numbers would shrink further.

## Gate in this step (after the fix, working tree = `da12957`)

lint OK; typecheck OK; vitest 2672 passed (branch before this step 2669, +3; baseline 2479 on main, +193); deploy + ops tests OK;
`sample` E1–E6 `Naruszenia: 0` each (no content changed, no teacher read needed); `npm run build` `e2e hook: absent (2 chunks checked)`;
`npx playwright test --config=<abs> --workers=4` 86 passed (branch before 86, +0; baseline 82, +4), 5.8 min; ports 4397/4398/4399 not
listening afterwards.

VISUAL: PASS — every [visual] state of rows 2.7, 3.6, 4.7, 5.6, 6.6, 7.6 and 8.7 captured at 1440×900 and 1024×768 (inequality tiles and hint/solution, long text prompts beside the keypad, time tiles, six-digit keypad answer, unit tiles, unlock card and review round); three discrepancies fixed (tiny "□" glyph in hint and solution lines, ungrouped six-digit keypad field, E6.9 decomposition running under the keypad); O1–O3 left as follow-ups
