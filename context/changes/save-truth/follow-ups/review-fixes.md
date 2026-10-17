# Follow-ups — save-truth

Every item was deferred on purpose; none has a fired trigger. Later slices grep for `Trigger:`.

## 1. S12-03

`stateOf` (saveHealth) never reads `status.replace`; masked because every successful replace reloads the page.

Trigger: any replace path that does not reload the page right after apply.

## 2. S12-11

Replace failures share `failures`/`consecutiveFailures` with write failures; `lastFailure.stage = 'replace'` names it.

Trigger: same as S12-03, or a parent report of "failing" right after a failed import.

## 3. S12-13

Dialog handlers run outside `session.run`; two different buttons are both called "Zacznij od nowa".

Trigger: a parent report of a stuck import/reset dialog, or the next copy change to `pl.saveTransfer.resetConfirm` / `pl.errorCard`.

## 4. SRR-07

"Replacing a save that was not read" is only a console log wiped by the reload; no persistent marker.

Trigger: a parent report of lost progress after an import/reset over an unreadable save.

## 5. SRR-13

The export envelope does not say it holds the session, not the device save (`ExportInput` has `kind: 'save'` only).

Trigger: a parent importing a file exported under `exportNotDevice`, or the next change to `ExportInput`.

## 6. SV2-13

One bad `variants` field rejects the whole save; a repair on decode would change save semantics.

Trigger: a save rejected with problem `variants` in any report, or the next save-format change (v5).

## 7. SV2-15

The backup lives in the same database, so eviction of site data looks like a first launch (`fresh`).

Trigger: a parent report of an empty game after a long pause on iPad (the `profile:default:backup-status` record may then serve as the "had a save" marker).

## 8. T-4 / F6 (stale-window replace)

An import or reset in a stale window can replace newer progress written by another window; the early BroadcastChannel signal only narrows it.

Trigger: a parent report of an import over newer progress.

## 9. V-3, V-5, V-8 (load-and-tab-guard)

Three LOW items of the load-and-tab-guard list that this slice did not take.

Trigger: the next change to `attempt`, `decodeSave`, `parseImport` or `saveHealth.ts`.

## 10. P-7 the `future` card names no version

The card for a save of a newer version does not say which version it is.

Trigger: the first rollback across versions, or a change to the `future` branch.

## 11. L-S3 `visibilitychange` throw skips `flush`

A throw before `flush` in the visibilitychange handler would skip the save.

Trigger: the next change to the visibilitychange handler in `main.ts`.

## 12. Import from the welcome screen

A parent cannot restore a file before the first round; import lives in the settings panel only.

Trigger: a parent who needs to restore before the first round.

## 13. Raw copy from inside the import/reset dialogs

The raw unreadable-save copy is only on the start card; the dialogs offer the old-version copy only.

Trigger: a parent who cannot reach the start card's copy.

## 14. Abort of an IDB transaction after a timeout

`withTimeLimit` abandons the promise; the transaction behind it is not aborted.

Trigger: evidence of hangs inside a live transaction.

## 15. E2E on two real builds

The stale-window and older-writer paths are proven with one build plus seams, never two real builds.

Trigger: the save format v5, or a report of a cross-build overwrite.

## 16. BroadcastChannel inside an iPadOS home-screen app (unverified)

The channel is a hint; whether it delivers between a home-screen app and a Safari tab is not verified. Without it the refusal at the next write stays.

Trigger: a tablet check of two windows (plan row 14.4) showing no early card, or a parent report.

## 17. Safari floor for `os.count`

Write-once backups use `IDBObjectStore.count` (not `getKey`, which needs Safari 15+); the choice was not tested on an old iPad.

Trigger: a report of a missing backup on an old iPad, or raising the supported iPadOS floor.

## 18. SV2-08 / M-S1 deploy-side rollback guard

A rollback below the v4 build is not stopped on the deploy side; the older build meets v4 as `future`.

Trigger: a human change to `deploy/` (never shipped by a run, profile section 5).

## 19. Escape during `replace` without an import-dialog e2e

The `busy` guard that ignores Escape is unit-proven only; no import-dialog e2e covers it.

Trigger: a change that adds an import-dialog e2e, or a report of a dialog closing mid-write.

## 20. `isRecord` watch (three copies)

`isRecord` is copied in `src/core/save.ts`, `saveFile.ts` and `migrations/legacySalon.ts`; this slice added no fourth.

Trigger: a fourth copy in `src/core`: extract `src/core/isRecord.ts` instead.

## 21. T-1 prevention (older build overwrites silently)

`olderWriter` detects and names an older build's write; it does not stop this page overwriting that build's newer v3 progress.

Trigger: a parent report of lost progress after running two builds, or a decision to change the write rule.

## 22. Pending reviewer/visual/human rows of save-truth

Rows tagged [reviewer], [visual], [human] across phases 2-13 were not ticked by implementation steps.

Trigger: the ship step of the audit sweep (impl-review and the maintainer's tablet checks).


## 23. Copy-after-write window for the FIRST copy (impl review F2)

Since phase 5 every write, the very first one after a migration included, lands before the copy of the raw old save (`attempt` → `startCopy` in `src/core/autosave.ts`). A page killed in the few milliseconds between the v4 write commit and the `backup` transaction commit loses the old-version copy (the progress itself is safe and complete, `tests/fixtureLoadPath.test.ts`); the record already says `lost` (`noteOwed`). The plan accepted this (Known risks, decision 8); the impl review measured that copy-first on the first attempt only would reverse 16 unit tests and two e2e specs, so it was not done in review.

Trigger: a [human] decision at ship on row 4.6 / 5.x, a report of a missing `backup-v<N>` after an update, or the next change to `attempt`.

## 24. `unavailableStarts` counts restarts of one episode (impl review F5)

`src/storage/startCounter.ts` `bump` counts every non-timeout `unavailable` start with no time separation and across tabs (`localStorage`), so a reload during one wedged-IndexedDB episode reaches `balance.save.forceAfterStarts`; the counter is not reset on an `unreadable` start (the store answered); a storage whose `setItem` throws while `getItem` works returns a stale N+1, one whose read fails returns 1 forever (force never unlocks). The force step still needs two parent confirmations.

Trigger: a parent report of an overwrite after one failed start, or the next change to `startCounter.ts` / `replaceGate`.

## 25. `guardedPut` overwrites on a failed read in normal mode (impl review F6, pre-existing)

`src/storage/idb.ts` `guardedPut` `read.onerror` puts `page.base + 1` without a verdict in BOTH modes (from load-and-tab-guard), so a transient read error inside an ordinary autosave can overwrite another window's or the previous page's newer record, bypassing `OtherWriterSave` / `PreviousPageSave`. Fix sketch: in normal mode reject with a named `StoreReadFailed`, overwrite only for `replace`.

Trigger: the next change to `guardedPut`, or a stale-tab report on a device with IndexedDB read errors.

## 26. `putBackupOnce` puts after a promise hop; forced replace takes no copy (impl review F7)

`putBackupOnce` puts inside `.then` after `os.count`, relying on the transaction staying active through microtasks (spec and fake-indexeddb: yes; Safari 14 target: unproven; a failure would make every copy `TransactionInactiveError` and the copy `skipped`). A synchronous put throw rejects without `tx.abort()`. Separately, a forced replace over `migration-failed` / `unknown-version` / migrated-corrupt takes no write-once `backup-v<from>` of `outcome.raw`; the old bytes survive only through the card's "Zachowaj kopię". Also: `noteBackup` goes through `run`'s lost-connection retry and could overwrite a fresher `kept` record; on real IndexedDB a hung record transaction queues the next write on the same store.

Trigger: the tablet row 15.4 or 4.6 showing no copy, a Safari floor change, or the next change to `putBackupOnce` / the forced replace path.

## 27. `olderWriter` stays a put (impl review O3)

An older build that wrote over this page's v4 save (only builds before the v3 guard can) is overwritten by this page's next write; only a log line and `olderWriterSeen` remain. Same item as entry 21 seen from the verdict side.

Trigger: as entry 21.
