# Visual review — minigame-daily-puzzle (S-15)

Step: visual gate of autonomous run 2026-10-14-save-s13b-s15-s14b, after impl-review (`MERGE: CLEAR`, `ac3ad5c`). Five
discrepancies found on `ac3ad5c`, fixed on the branch in `b04a5ca`; every frame was re-captured on the fixed tree at
1440×900 and 1024×768 (78 frames, 39 states). Frame list, routes, values and what was not captured: `screenshots/README.md`.

## Capture

Playwright only, as in the S-13, S-13b and S-14 gates: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder
against the e2e-hook build on 4399, reusing `tests/e2e/support/{welcome,hook}.ts` (`passWelcomeAsParent`, `openSettings`,
`answerWrong`, `answerRight`, `playTaskRight`, `tapNext`); `?e2eVariant=puzzle|word|dice`, `?e2eDay`, `?e2eSave=unreadable|v1`.
Chromium launched in this subagent session as a plain `npx playwright test --config=<abs path>`. Claude in Chrome was not used:
every state needs canvas taps or the 2 s gear hold (profile § 8). The `migration-failed` card is unreachable in every build
(`MIGRATIONS[1]` cannot throw): captured once on a throwaway hook build with a throwing `MIGRATIONS[1]`, source restored at
once, never committed.

## Discrepancies and fixes

| # | Found (first capture, `ac3ad5c`) | Why it matters | Fix (`b04a5ca`) |
|---|---|---|---|
| V1 | The daily puzzle paid 2 stars (counter 0 → 2) but the bar said "Brawo! +1 ★" | The ×2 badge promises double stars; the only per-task feedback contradicted the counter | `RoundView` bar `correct` carries `stars` (0 after a retype, else `rules.starPerTask`); `pl.round.correctStar(n)`. Test `tests/roundView.test.ts` "the bar names the stars the task paid, two for the daily puzzle" (red: `star: true` vs `stars: 2`) |
| V2 | The HUD title ("Ukryte słowo", "Kostki · 0-12") sat right of the progress dots: a 6-letter word drew its 6th dot under the "U", a dice round's 13 dots ran through the whole title | Unreadable title on both widths; the kit's minigame screens have the title centred and no dots | Title centred at x 960 (`HUD_LAYOUT.title` `centerX`/`maxWidth`), `TaskScene.render` hides the dots in a variant (the letters / the board show the progress); gap 79 row updated. Test `tests/wordScreen.test.ts` "takes the place of the progress dots…" (red: `centerX` undefined) |
| V3 | Done-card buttons spanned 618–1442: centre 1030 on a card centred at 960, "Do pokoju" 20 px from the card edge (tablet) | Kit `word-complete.png` centres the pair | `MINIGAME_LAYOUT.buttons.left` 548. Test "centres the pair of buttons on the card" (red: 1030 vs 960) |
| V4 | Long puzzles: `scale-parcels` (keypad, 6 lines) put "kg." of the last step under "Już wiem"; `water-pour` (tiles) drew the answer line "5 − 3 = 2…" behind the answer tiles; `water-empty` (9 lines at 64 px) ran into the hint/retype bar | The child cannot read the result line of the solution; text over text | `TaskScene.drawPrompt` steps a plain sentence prompt down (64 → ≥ 44, `fitSize`) until it ends above the bar zone (keypad) or the tiles; `fitPromptToSteps` + `SolutionSteps.fits` shrink it further while the solution lines would need less than `minScale`, and restore it when the steps close; the solution lines of every tiles task stop above the tiles (was word rounds only). Verified on the three longest puzzles (p09–p11, start / all steps / retype) |
| V5 | The second board row plus its shadow ended at y 867, 3 px into the hint bar / "Już wiem" zone (top 864) | Bar border touched the fields on both widths | `MINIGAME_LAYOUT.board.top` 568 → 552 (dice end at 496, 56 px above). Test `tests/dice.test.ts` "ends the board, shadow included, a gap above the bar zone" (red: 867 > 852) |

## States (judged against the kit)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 7.6 | puzzle tiles / keypad, hint, solution steps, summary with 2 stars, HUD title | p01–p11 | Ordinary notebook and widgets (gap 79); title "Zagadka dnia ★ ×2" centred, 16 CSS px on the tablet; bar "Brawo! +2 ★" (after V1); summary "Brawo!", one star (one task), "+2" ✓. Hint bar beside the keypad 3 lines ≈ 13 CSS px on the tablet (ink 13–14 px), solution lines ≈ 14 px ✓ |
| 8.4 | Hasło start, first letter, hint, second try, solution, partly revealed, done card; KANAPA | w01–w09b | Letter tiles as kit `word-idle` (ivory, butter border, dot), uncovered letters green as `word-first-letter`; tiles 254×136 scene = 135×72 CSS on the tablet; the expression stands alone under the letters; solution lines between the expression and the tiles at ≈ 13 px, nothing overlaps; done card as kit `word-complete` (word in caps, star +N, centred buttons after V3). E1 first hint is "Spróbuj jeszcze raz" only (no hint line for E1 skills, as in ordinary rounds) |
| 9.4 | dice start, mid-game, wrong throw, solution lines, done card | d01–d05 | Dice with pips and the board 7 + 6 as kit `dice-idle`; covered fields green with a check (gap 86); fields 160×136 scene = 85×72 CSS on the tablet, 20 px apart; solution lines above the dice in the notebook, clear of the HUD title (which is outside the notebook) ✓; done card "Wszystkie pola zakryte!" fits at full width ✓ |
| 3.6 | `future` card, `migration-failed` card, import step with date and build, "Zapis gry" with "przeniesiono z wersji 1" | s01–s04 | Calm adult cards with the code line (gap 87); "Graj dalej" has the initial focus, not the export; import step two: "Teraz" / "Z pliku" summaries, then "Kopia z 10.10.2026, wersja gry a1b2c3d" ✓; "Zapis gry": "Gra jeszcze niczego nie zapisała…" + "Zapis przeniesiono z wersji 1." ✓ |

## Hand-checked against the task's answer (mandatory)

- **Puzzle stars**: p01–p04 tablet: start 0, one wrong tile (stays 0), right tile → counter 2 = 1 task × `starPerTask` 1 ×
  `puzzleMultiplier` 2; summary `earned: 2`, bonus 0 ✓.
- **`water-pour`** (p01/p10 tablet): 5 − 3 = 2, tile 2 ✓. **`water-empty`** (p11): 7 − 4 = 3 ✓. **`scale-parcels`** (p09): 10 : 2 = 5 ✓.
  **`train-bear`** (p08 desktop): 3 + 1 + 5 = 9 (4th from the front, 6th from the back) ✓. **`floors-lift`** (p05 desktop): 0 + 7 − 3 = 4 ✓.
- **Hasło, tablet**: KANAPA has 6 letters; one task settled by the retype → 5 stars, done card "+5", stars row
  `[t,t,f,t,t,t]` ✓; E3 `6 · 3` (first capture): 6 · 2 = 12, 12 + 6 = 18 = tile 18 ✓.
- **Zakrywanka**: d04b tablet 2 + 1, lines "Zacznij od 2 i dodaj 1. Wynik: 3" ✓; d05: 13 throws, one retype → +12 ✓.
- **Migrated save** (s03): stars 7 = `tests/fixtures/save-v1.json` stars ✓.

## Fit and overlap

After the fixes no text crosses another element in any captured state. Smallest text on the 1024 tablet: hint bar beside the
keypad at three lines ≈ 13 CSS px, solution lines at `minScale` ≈ 14 px, a long prompt at 44 px ≈ 23 px; tap targets:
letter/answer tiles 135×72 CSS, board fields 85×72, done-card buttons 213×58.

## Observations (not fixed, follow-ups with triggers)

- O1: a unit can wrap away from its number ("…waży 5 / kg.") in solution lines and prompts; a non-breaking space in the puzzle
  data or the wrap would keep them together.
- O2: the HUD title "Kostki · 0-12" uses a hyphen, the kit an en dash.
- O3: the puzzle summary draws one star for one task and "+2" beside it; the ×2 is explained only by the HUD badge (gap 80).
- O4: the dice hint bar sits 12 px under the board on both widths after V5 — fine, but any taller board needs the bar to move.

## Gate in this step (after the fix, working tree = `b04a5ca`)

lint OK; typecheck OK; vitest 2326 passed (branch before this step 2322, +4 new tests; contract baseline 2224 on main, +102);
deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0` each; `npm run build` `e2e hook: absent (2 chunks checked)`;
`npx playwright test --config=<abs> --workers=4` 71 passed (branch before 71, +0; baseline 63, +8), 5.2 min; ports
4397/4398/4399 not listening afterwards.

VISUAL: PASS — every [visual] state of rows 3.6, 7.6, 8.4 and 9.4 captured at 1440×900 and 1024×768 (puzzle tiles/keypad, hint, solution incl. the three longest prompts, summary +2; Hasło start/hint/letters/solution/done; Zakrywanka start/mid/hint/solution/done; future and migration-failed cards, import step with date and build, "Zapis gry" migrated line); five discrepancies fixed (+1 ★ for a ×2 puzzle, title over the progress dots, off-centre done-card buttons, solution lines under "Już wiem"/behind tiles, board touching the bar); O1–O4 left as follow-ups
