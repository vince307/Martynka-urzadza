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

## Two cards of one origin
- The unreadable-save card and the settings export both offer the same file; keep them in step.
- Trigger: first save-format change (v2), or a parent reporting lost progress

## Full field path in saveProblem
- File: `src/core/saveFile.ts` (`saveProblem`)
- Trigger: a parent reporting a rejected file that should load

## Import from the welcome screen
- A parent who cannot reach the settings panel after an unreadable save cannot import yet.
- Trigger: a parent who cannot reach the panel after an unreadable save
