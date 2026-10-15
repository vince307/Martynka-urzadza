# Follow-ups — save-v2-backup-health

Findings of the observability audit 2026-10-15_0253 and of plan review that this change does not fix. Each has a trigger.

- SV2-04 and option B (the v1 raw copy under a second key, or a v1 save kept readable after the move to v2). Trigger: a parent report of lost progress after an update, or the v3 save format.
- SRR-08 and a counter of `unavailable` starts. Trigger: the [human] N-7 measurement showing permanent timeouts, or a report that "Poczekaj dłużej" was not enough.
- S12-07 (export edge case). Trigger: the next change to saveExport.ts.
- S12-08, S12-13 (a refused readable file; import/reset step wording). Trigger: a parent report of a refused readable file, or the next change that adds a step to saveImportDialog/saveResetDialog.
- S12-03, S12-11 (replace paths that keep the page). Trigger: any replace path that does not reload the page right after apply.
- F7, SRR-09, SRR-01 (migration errors). Trigger: a migration step that can throw (v3).
- SRR-07, SRR-10, SRR-11, SRR-13, SV2-05 to SV2-15 except SV2-08 (medium and low audit findings). Trigger: the next change to autosave.ts attempt or main.ts start.
- SV2-08 (deploy-side finding). Trigger: a human deploy/ change.
- L-S3 (`visibilitychange` handler). Trigger: the next change to the visibilitychange handler in main.ts.
- Abort of an IndexedDB transaction in idb.ts after a timeout. Trigger: evidence that hangs happen inside a live transaction on iPadOS.
- Visual-gate O1: card text for the `future` branch. Trigger: the first deploy rollback across a save version, or the next change to the future branch of saveFailedCard.ts.
- Visual-gate O2: colon without a list in the reset dialog. Trigger: the next copy change to the reset dialog's lead line or saveSummaryView.ts.
- O4: `tests/deviceSaveWiring.test.ts` for openExport and design-gaps rows 43-51. Trigger: the next change to UIScene.openExport.
- No e2e for the Escape guard on the import dialog (reset is covered in phase 6). Trigger: the next change to saveImportDialog.ts.
- Impl-review F3/F4: `Autosaver.replace` marks the v1 copy `skipped` after one failed try even when its own write then fails, so later ordinary writes skip the copy after 1 failure (not `backupAttempts`); its `skipBackup` log reads `attempts: 0` and says "writing" before the write is known. Keep the copy `failed` (owed) when the replace write fails and count the try in `backupFails`. Trigger: the next change to `replace` in src/core/autosave.ts, or the v3 save format.
