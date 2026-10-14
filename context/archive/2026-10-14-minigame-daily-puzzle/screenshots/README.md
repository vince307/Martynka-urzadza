# Screenshots — minigame-daily-puzzle (S-15) visual gate

Captured 2026-10-14 on the working tree of `ac3ad5c` plus the visual-gate fixes committed right afterwards as `b04a5ca`
(the build id in the corner reads `ac3ad5c` because the fixes were not committed at capture time; every frame below shows
the fixed code: centred HUD title without dots in a variant, "Brawo! +2 ★", centred done-card buttons, the board 16 px
higher, long prompts fitted). Frames of the first capture on the unfixed tree showed the defects (`reviews/visual-review.md`
V1–V5); they were deleted and every state re-captured.

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`,
service workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, two projects `desktop` 1440×900 and
`tablet` 1024×768) reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build --
--outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The folder was moved out of the
repo before the lint gate. Claude in Chrome was not used: every game state needs taps on the Phaser canvas (and the settings
panel a 2 s hold), which synthetic events in Chrome cannot drive (profile § 8). Before every frame the spec waited 900 ms; a
silent speech stub hides the speaker.

States are reached through the product: the parent path (age "10+", the stage button, no warm-up, `?e2eMonth=9`) with
`?e2eVariant=puzzle&e2eDay=2026-10-14` (E3 or E4), `?e2eVariant=word` or `?e2eVariant=dice` (E1, E3), then real taps,
`answerWrong`/`answerRight`, solution-step taps. The puzzle is drawn by the round's rng, so the spec opened new devices until
the wanted input mode or puzzle id came (`water-pour`, `scale-parcels`, `water-empty` are the longest prompts). Save states:
`?e2eSave=unreadable` (a version-99 save → the `future` card), `?e2eSave=v1` (frozen v1 fixture → settings "Zapis gry"), an
import of an envelope around `tests/fixtures/save-v2.json` with `build: a1b2c3d`, `exportedAt: 2026-10-10`. The
`migration-failed` card is not reachable in any build (`MIGRATIONS[1]` only spreads the record): it was captured on a
throwaway hook build with `MIGRATIONS[1]` made to throw, `?e2eSave=v1`; `src/core/save.ts` was restored at once (no diff)
and that build was never committed or shipped.

- `desktop-*` = 1440×900; `tablet-*` = 1024×768 (the 16:9 scene letterboxed at 0.533). Each test is a new browser context.
  Random tasks: desktop and tablet frames of one state show different values (from the hook snapshot).
- Kit compared (not copied; `designs/` is gitignored): `designs/martynka-expansion-v1/screenshots/word-idle.png`,
  `word-first-letter.png`, `word-hint.png`, `word-second-try.png`, `word-complete.png`, `dice-idle.png`, `dice-correct.png`,
  `dice-second-try.png`, `dice-solution.png`, `dice-complete.png`, `tablet-word-1024.png`, `tablet-dice-1024.png`. The daily
  puzzle, the ×2 badge, the save cards and the migration line have no kit frame: DESIGN-GAP rows 79–87.

| # | State | Desktop | Tablet | Reached / values (desktop · tablet) |
|---|---|---|---|---|
| p01 | daily puzzle, tiles, HUD "Zagadka dnia ★ ×2" | `desktop-p01-puzzle-tiles.png` | `tablet-p01-puzzle-tiles.png` | E3 · `scale-fruit` (4) · `water-pour` (2) |
| p02 | puzzle with the hint bar | `desktop-p02-puzzle-tiles-hint.png` | `tablet-p02-puzzle-tiles-hint.png` | p01 + one wrong tile |
| p03 | right on the second try, "Brawo! +2 ★", counter 2 | `desktop-p03-puzzle-tiles-done.png` | `tablet-p03-puzzle-tiles-done.png` | p02 + the right tile |
| p04 | summary of the puzzle (one star, "+2") | `desktop-p04-puzzle-summary.png` | `tablet-p04-puzzle-summary.png` | p03 + "Dalej" |
| p05 | daily puzzle, keypad | `desktop-p05-puzzle-keypad.png` | `tablet-p05-puzzle-keypad.png` | E4 · `floors-lift` (4) · `water-empty` (3) |
| p06 | keypad puzzle with the hint bar | `desktop-p06-puzzle-keypad-hint.png` | `tablet-p06-puzzle-keypad-hint.png` | p05 + one wrong number |
| p07, p07b | keypad puzzle, solution steps 1 and 2 beside the keypad | `desktop-p07*-puzzle-solution*.png` | `tablet-p07*-puzzle-solution*.png` | p06 + a second wrong number, "Następny krok" |
| p08, p08b | tiles puzzle, solution steps above the tiles | `desktop-p08*-puzzle-tiles-solution*.png` | `tablet-p08*-puzzle-tiles-solution*.png` | E3 · `train-bear` · `number-odd`, two wrong tiles |
| p09 | `scale-parcels` (keypad): start, all steps, retype | `desktop-p09-long-keypad*.png` | `tablet-p09-long-keypad*.png` | E3, the puzzle that hid "kg." under "Już wiem" (V4) |
| p10 | `water-pour` (tiles): start, all steps, retype | `desktop-p10-long-tiles*.png` | `tablet-p10-long-tiles*.png` | E3, the puzzle whose answer line was behind the tiles (V4) |
| p11 | `water-empty` (keypad, longest): start, all steps, retype | `desktop-p11-longest-keypad*.png` | `tablet-p11-longest-keypad*.png` | E4, 9 lines at 64 px ran into the hint bar (V4) |
| w01 | Hasło start, letters hidden, title "Ukryte słowo" | `desktop-w01-word-start.png` | `tablet-w01-word-start.png` | E1 · DYWAN (5) · KANAPA (6) |
| w02 | Hasło, wrong tile → "Spróbuj jeszcze raz" | `desktop-w02-word-hint.png` | `tablet-w02-word-hint.png` | w01 + a wrong tile |
| w03 | first letter uncovered after the second try | `desktop-w03-word-first-letter.png` | `tablet-w03-word-first-letter.png` | w02 + the right tile, "+1 ★" |
| w04 | solution of the third task, two letters shown | `desktop-w04-word-solution.png` | `tablet-w04-word-solution.png` | two wrong tiles |
| w05 | all but one letter uncovered | `desktop-w05-word-partly.png` | `tablet-w05-word-partly.png` | DYWA_ · KANAP_ |
| w06 | done card "Brawo! / DYWAN / +4" · "KANAPA / +5" | `desktop-w06-word-done.png` | `tablet-w06-word-done.png` | last task right (one task was a retype: no star) |
| w07–w09b | Hasło in E3 (tiles): start, hint, solution steps 1–2 | `desktop-w0[7-9]*.png` | `tablet-w0[7-9]*.png` | E3, `?e2eVariant=word` |
| d01 | Zakrywanka start, title "Kostki · 0-12" | `desktop-d01-dice-start.png` | `tablet-d01-dice-start.png` | E1, `?e2eVariant=dice` |
| d02 | five fields covered (check marks) | `desktop-d02-dice-mid.png` | `tablet-d02-dice-mid.png` | 5 throws right |
| d03 | wrong field → hint bar under the board | `desktop-d03-dice-hint.png` | `tablet-d03-dice-hint.png` | d02 + a wrong field |
| d04, d04b | solution lines above the dice | `desktop-d04*-dice-solution*.png` | `tablet-d04*-dice-solution*.png` | d03 + a second wrong field, steps |
| d05 | done card "Wszystkie pola zakryte!" +12 | `desktop-d05-dice-done.png` | `tablet-d05-dice-done.png` | all 13 throws (one retype: 12 stars) |
| s01 | start card `future` | `desktop-s01-card-future.png` | `tablet-s01-card-future.png` | `?e2eSave=unreadable` |
| s02 | start card `migration-failed` | `desktop-s02-card-migration-failed.png` | `tablet-s02-card-migration-failed.png` | throwaway build, see above |
| s03 | settings "Zapis gry" with "Zapis przeniesiono z wersji 1." | `desktop-s03-settings-migrated.png` | `tablet-s03-settings-migrated.png` | `?e2eSave=v1`, gear hold + adult gate |
| s04 | import step two with "Kopia z 10.10.2026, wersja gry a1b2c3d" | `desktop-s04-import-step-two.png` | `tablet-s04-import-step-two.png` | parent path E3, "Wczytaj z pliku", envelope file |

Not captured: PÓŁKA (Ó/Ł in the letter tiles) in the final set — it was drawn in an intermediate capture only (desktop, before the prompt fit;
the letter row and done card were unchanged by the fixes); the card focus ring under keyboard use (touch-only product).
