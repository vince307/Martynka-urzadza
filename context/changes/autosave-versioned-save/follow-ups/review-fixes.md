# Follow-ups — autosave-versioned-save (S-11)

Each item has a `Trigger:` line; later slices grep for them.

- First save-format change (v2): add a step `1 -> 2` to `MIGRATIONS` in `src/core/save.ts`, keep `tests/fixtures/save-v1.json`, add `save-v2.json` and a test that v1 decodes to the expected v2 state. Copy the old save to `profile:default:backup-v1` before the first save after a migration.
  Trigger: first save-format change (v2)
- The two-build e2e (test-plan risk #10, rollout phase 4): the old build writes, the new build reads. Deferred (decision 9): with one format it is the same code path as the restart e2e; one origin for two builds needs a new server or a build under a path with the service worker blocked. Today the restart e2e covers the state path.
  Trigger: first save-format change (v2)
- Two instances of one origin (Android home-screen app and a Chrome tab share IndexedDB): the last writer wins and an old tab can roll progress back (plan-review F5). A fix (`BroadcastChannel` or a write counter) changes the format.
  Trigger: first save-format change (v2), or a parent reporting lost progress
- Export, import and reset in the parent panel use `rawExportText` / `exportRawSave` (accepts `.txt` and `.json`), `validateSave` as the import validator (risk #7), and show the save state to the parent (decision 8 and DESIGN-GAP 43). Also F7: `pl.settings.empty`.
  Trigger: S-12
- Carried unchanged: observability F3 (`installErrorBoundary` `signalOfRejection`), F4 (`WelcomeScene.openParent` guard).
  Trigger: next change that touches `src/ui/dom/errorBoundary.ts` / `WelcomeScene`
- Test-plan refresh: section 6.5 "Adding a save migration test" gets the fixture convention; rollout phase 4 status: unit and restart e2e delivered, two builds wait for v2.
  Trigger: `/10x-test-plan refresh`
- Autonomous-run profile (sec. 10): `src/storage/idb.ts` is no longer a planned path; from S-11 a "fresh device" in e2e is a new browser context (IndexedDB is shared inside one). `docs/human-checklist.md` rows "do S-11 wszystko jest sesyjne" are obsolete.
  Trigger: next autonomous run / profile refresh
- `SAVE_KEYS` stays in `src/data/layout.ts` next to `REGISTRY_KEYS` (it is a subset of those keys and the only list of registry names); `core` cannot import it and `main.ts` already imports layout. Revisit if a second consumer outside `main.ts` and tests appears.
  Trigger: a second consumer of `SAVE_KEYS`

## Closing of earlier follow-ups with `Trigger: S-11`

- S-06 (persist the learner with `warmupPending`, `needsPlacement` on the loaded state): done in phases 1 and 4 (`SavedLearner`, `start()` in `main.ts`).
- S-06 (earlier save of age and stage): done, the whole learner is saved.
- S-07 (mastery resets on every cold start; floor `max(saved, calendarStart)`; explicit `Adaptation` keys): done, phases 1-2 (`floorToCalendar`, `SavedLearner` picks keys).
- S-08 (save `Settings` and the history with `example`): done, phase 1 (`settings`, `history`).
- S-09 / S-10 (save after a purchase and after a variant change; no "seen" flag for "Pokój gotowy!"): purchase is immediate (`flush('now')`), a variant change goes through the 500 ms debounce (decision 4); the room-done card is derived from the rooms, no flag was needed.
- Observability (error card promise, noise list, `BootScene` hand-over): decisions 8 and 12; the save module catches its own errors, the error boundary blocks the autosave on a fatal error; the hand-over runs outside the font promise.
