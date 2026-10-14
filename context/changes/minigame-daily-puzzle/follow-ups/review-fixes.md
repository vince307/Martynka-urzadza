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
- Puzzle pools for stages other than E3-E4 (they get a minigame), and a choice card before the daily puzzle (gaps 79-81).
  Trigger: the author asks for it or the S-17 playtest shows children skipping the puzzle
