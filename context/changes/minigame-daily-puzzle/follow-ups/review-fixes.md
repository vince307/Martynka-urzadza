# Follow-ups — minigame-daily-puzzle

Each item has a `Trigger:`; a later slice greps for it.

- A real e2e of two builds (a v1 build writing a save, a v2 build reading it): v1 to v2 is covered by `?e2eSave=v1` and the frozen fixtures only.
  Trigger: the next save-format change (v3) or a parent report of lost progress after an update
- The copy `profile:default:backup-v1` has no way to be read back inside the app (an export of the copy behind the adult gate); recovery needs the browser tools or support (plan-review F5).
  Trigger: a parent report of lost progress after an update or the next save-format change (v3)
- A permanently failing backup write blocks every save after the migration (progress of that session is lost, v1 stays); no retry policy and no line in "Zapis gry" (plan-review F5).
  Trigger: a parent report of progress not saved after an update
- `migration-failed` can be overwritten like `corrupt` (import or reset after the export card); practically unreachable today because `MIGRATIONS[1]` only extends the record (plan-review F7).
  Trigger: a migration step that can throw (v3)
- `Autosaver.replace` (import, reset) never takes the v1 backup: a replace over a v1 save on a v2 build drops the old copy path.
  Trigger: a replace path that runs before the first normal write after a migration, or the next save-format change (v3)
- S13-06 (save-format dependent items from S-13).
  Trigger: the next save-format change or S-17
- Two open instances of the game writing the same save (S12-15).
  Trigger: a parent reporting lost progress or a second format change
- M-S1, the part touching `deploy/` (rollback to a v1 build after a v2 write shows `future` and does not overwrite).
  Trigger: the next change to deploy/
- S12-07, S12-08, S12-12, S12-13 (from the save-reason-and-recovery list).
  Trigger: the next change to saveImportDialog.ts, saveResetDialog.ts or autosave.ts `replace`
- Dice range for E3-E4 (now 0-12 for every stage), `balance.variants.everyRounds` (3) and the star economy of the 13-field board (about +15 % pace).
  Trigger: the S-17 playtest
- An on-demand "Podpowiedź" / "Pokaż" button in the round (gap 83).
  Trigger: the author asks for it
- Puzzle pools of their own for stages other than E3-E4 (E1-E2 get a minigame; E5-E6 get the E3-E4 pool, see the impl-review F1 entry below), and a choice card before the daily puzzle (gaps 79-81).
  Trigger: the author asks for it or the S-17 playtest shows children skipping the puzzle

## From the implementation review (2026-10-14)

- F1: E5-E6 learners get the daily puzzle from the whole E3-E4 pool (`puzzlePool` in `src/core/puzzles.ts` takes every puzzle stage up to the learner's, and `tests/puzzles.test.ts` asserts it for E6), while plan decision 10 and row 10.6 say "zagadki tylko E3-E4, inne etapy dostają minigrę". The puzzles are in range for E5-E6, so this is a wording mismatch, not a content bug; the author decides at row 10.6 (keep, or make `puzzlePool` return [] outside `balance.variants.puzzleStages`).
  Trigger: the author's read of row 10.6, before the merge
- F5: `puzzleDay` is the day the puzzle ENDS (`TaskScene` `countRound` reads `today()` at the finish): a puzzle started before midnight and finished after it uses up the next day's puzzle. Record the start day with `puzzleId` if it matters.
  Trigger: the S-17 playtest or a parent report of a missing daily puzzle
- F6: `CoverBoard` draws `balance.variants.dice.max + 1` fields while `diceBoard` (`src/core/minigames/dice.ts`) makes `min(throws, max + 1)` throws, and `MAX_RESULT = 12` there repeats `balance.variants.dice.max`: tuning `throws` below 13 would leave fields that can never be covered while the card still says "Wszystkie pola zakryte!". Size the board from the board length, or assert `throws === max + 1`.
  Trigger: any change to `balance.variants.dice`
- F7: widget geometry in code (`src/ui/widgets/Dice.ts` `SIGN_WIDTH`, the shadow and pip ratios; `CoverBoard` `paint` offsets) instead of `MINIGAME_LAYOUT`; `MINUS` defined again in `dice.ts` and `Dice.ts` next to `src/core/tasks/symbols.ts`; `LetterTiles.show` destroys and re-creates its Text objects on every render; `lettersUncovered` (word.ts) also counts covered dice fields.
  Trigger: the next change to a minigame widget or to `src/core/minigames/`
- F8: `src/testing/e2eHook.ts` imports `tests/fixtures/save-v1.json` (src importing from tests). Rollup drops it from `dist/` with the `__E2E_HOOK__` branch (checked: `1760000001000` absent from `dist/_app/*.js`), but no marker in `vite/e2eHookGuard.mjs` names the fixture.
  Trigger: the next change to `vite/e2eHookGuard.mjs` or to the v1 fixtures' use in src
