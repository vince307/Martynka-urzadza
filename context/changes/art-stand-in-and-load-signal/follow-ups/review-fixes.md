# Follow-ups — art-stand-in-and-load-signal

Findings of the observability audit 2026-10-14 (S14-*, S12-*, S13-*) that this change does not fix. Each has a trigger.

## Open, out of scope

- S14-05: mistakes on tasks that were unsolvable because a picture was missing are recorded as real mistakes (`recordRound`, mastery and parent examples). Trigger: a parent report of money/mass/capacity among the weakest skills while "Obrazki" shows missing.
- S14-06: `check:deploy` does not request `/assets/tasks/*.webp`. S14-07: no `loader.timeout`, one hung request on a first online visit leaves an empty canvas. Trigger: a production report of a missing task image.
- S14-08 (rest): the loader handler logs the font too and without URL, status or build. Trigger: the next change to BootScene.preload.
- S14-09, S14-10: a key outside `TASK_ART` gets ratio 1:1, and `this.images[i]?.show` silently drops elements beyond the pool (money, jugs, scale). Trigger: S-14b or the next widget built on ArtImage.
- S12-02 .. S12-15: save panel and `Autosaver.replace` findings (S12-02 `replace` without a time limit, S12-03 and S12-10..12 health lines, S12-04 "Zapisz kopię" exports the fresh session while the save is `unreadable`, and the rest of the audit list). Trigger: the next change to the save panel or autosave.replace.
- S13-01..S13-14: select and drag solvability, S13-07 generator errors without `skill.id`, and the rest. Trigger: the next select/drag skill or S-13b.
- Raw copy of an unreadable save from inside the import/reset dialog (today only on the start card). Trigger: a parent who cannot reach the start card's copy.

## Still open, repeated from the audit (this change touches only the `freshRound` arguments in `TaskScene`)

- M-1, M-2, M-13, H-3, H-4. Trigger: next change to TaskScene / narrator.

## Closed in this change

- "BootScene.preload loaderror" (archive `2026-10-14-art-tasks-all-stages`): a failed or undecodable task image is now counted from `textures.exists`, shown in the parent's settings and drawn as a Polish stand-in.
- "Import or reset over an unreadable save (impl-review F1)" (archive `2026-10-13-save-export-import-reset`): `deviceSaveView` and the `replace` refusal on `unavailable`.
