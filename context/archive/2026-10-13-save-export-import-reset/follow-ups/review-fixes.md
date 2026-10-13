# Follow-ups — save-export-import-reset (S-12)

Closed in this change: L-S2 (export only after a confirmation), M-S2 (persistence result in "Zapis gry"), M-S3 (reason and build id on the card and in the file), N-8 (not-saved-yet and earlier-failure lines), F3 (path of the bad field, key version), export privacy line (S-08 F6), F6 (WelcomeScene guard now `session?.active()`).

## L-S1: decodeSave migration step handling
- File: `src/core/save.ts` (`decodeSave`)
- Trigger: first migration step (v2)

## N-7: timeout versus rejection on a cold IndexedDB open
- File: `src/core/autosave.ts` (`loadSave`)
- Trigger: an iPad measurement of a cold IndexedDB open

## F7: empty progress preview wording
- File: `src/data/pl.ts` (`settings.empty`)
- Trigger: a parent's feedback on the preview or S-17

## Two browser tabs of one origin
- A second open tab of the game keeps its own autosaver and overwrites an imported or reset save at its next write (plan "Known risks"); nothing warns it.
- Trigger: first save-format change (v2), or a parent reporting lost progress

## Full field path in saveProblem
- File: `src/core/save.ts` (`saveProblem`)
- Trigger: a parent reporting a rejected file that should load

## Import from the welcome screen
- A parent who cannot reach the settings panel after an unreadable save cannot import yet.
- Trigger: a parent who cannot reach the panel after an unreadable save

## Import or reset over an unreadable save (impl-review F1)
- Files: `src/scenes/UIScene.ts` (`openImport`, `openReset`), `src/ui/dom/saveImportDialog.ts` (`openSaveImportDialog`), `src/ui/dom/saveResetDialog.ts` (`openSaveResetDialog`)
- With the saver blocked `unreadable`, "Teraz" summarises the fresh session of this page load (0 stars), and a confirmed import or reset overwrites the unreadable stored save, which may be a `future` save after a deploy rollback. change.md decision 5 wanted the summary to say the current save is unreadable and to point to "Zachowaj kopię" first; the plan dropped it. A line in both dialogs when `saver.status().blockedBy === 'unreadable'` (new string in `pl.saveTransfer`, DESIGN-GAP row) closes it.
- Trigger: first save-format change (v2) or the first deploy rollback across a save version, or the next change to saveImportDialog.ts / saveResetDialog.ts
