# Follow-ups — save-reason-and-recovery

Each item has a `Trigger:`; a later slice greps for it. This list closes SIR-07 for these items (the archive is not edited).

- S12-02: `replace` has no time limit.
  Trigger: a parent report of an import/reset dialog stuck with disabled buttons, or S-15's v2 migration touching replace
- S12-03: `stateOf` does not read `status.replace`; invisible today because every successful `replace` ends in `reload()` in the same dialog.
  Trigger: any replace path that does not reload the page right after apply (saveImportDialog/saveResetDialog), or S-15 moving the import out of the dialog
- S12-11: failures of `replace` are counted in `failures`, but while saving is blocked the section shows `off` anyway.
  Trigger: S-15 save format v2 writing a migrated save through replace, or a parent report of "failing" right after a failed import
- S12-05: `broken` closes the panel without any text; reachable only when `validateSave` rejects `saver.current()` in memory.
  Trigger: a deviceSaveView 'broken' seen in any test, e2e run or parent report
- S12-07, S12-08, S12-09, S12-12, S12-13, S12-14, S12-15.
  Trigger: S-15 save format v2
- A separate card body for `timeout` and the N-7 measurement of a cold IndexedDB open on an iPad.
  Trigger: the [human] iPad measurement of a cold IndexedDB open
- A counter of `unavailable` starts (decision 2 of the plan).
  Trigger: a report that the second confirmation was not enough, or N-7 showing permanent timeouts
- ASL-02 to ASL-09 (art health and filter).
  Trigger: the next change to artHealth.ts, artFilter.ts or ArtImage
- Import from the welcome screen.
  Trigger: unchanged from the S-12 archive (a parent who needs to restore before the first round)

Closed here (see the archive): S12-04, S12-06, S12-10, and "Import or reset over an unreadable save (impl-review F1)" for the `future` part.
