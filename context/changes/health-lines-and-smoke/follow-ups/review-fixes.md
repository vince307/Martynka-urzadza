# Follow-ups — health-lines-and-smoke

Deferred items of the change, each with the condition that brings it back.

## 1. O-1(b) install error name from the service worker
A custom `importScripts` snippet that `postMessage`s the Workbox install error, so "Gra bez internetu" can name it instead of the constant `InstallFailed`.
Trigger: an "InstallFailed" report from a device while the deploy smoke's per-entry check passes.

## 2. 2217 P-4, the `deploy/` half: refuse or warn on a rollback to a lower `SAVE_VERSION`
A guard in `deploy/martynka-deploy` (same item as save-truth follow-up #18). A run never ships `deploy/` (profile § 5).
Trigger: a human change to `deploy/`.

## 3. G-3 per-room thumbnail
`RoomDef.thumbnailKey` and the child's own pieces with stand-ins instead of the salon thumbnail on every room tile of "Pokój gotowy!".
Trigger: a second room in `src/data/rooms.ts`.

## 4. G-6 nudge when a full wallet refuses a coin
A cue for a refused drop in `stepTrayDrag` (`maxTotal`); the kit has no view for it.
Trigger: a kit view or author note for a refused drop, or the [human] tablet row showing children confused by the dimmed tray.

## 5. ASL-05 minimum stand-in label size
`ArtImage` shrinks the label to fit with no floor, and scale 0 is shown at 1.
Trigger: the next change to `ArtImage` stand-in text, or a stand-in seen on a real device under 12 CSS px.

## 6. ASL-08 unlock card for a step whose skills are art-blocked
The card may announce a skill that `withoutArtBlocked` then skips (accepted by triage).
Trigger: a parent report of an announced skill that never appears while "Obrazki" shows missing pictures.

## 7. A-6 per-file limit by size
The loader has one total wall-clock limit and no per-file limit scaled by file size.
Trigger: a throttled Android measurement of the cold start showing one slow file holding the others.

## 8. A-8 silent retry count
The number of loader retries is not visible in the record or the hook (phase 13's stalled-picture spec did not need it).
Trigger: the next change to the loader retry settings, or an e2e that must see the retry.

## 9. L-7 per-layer state in the hook
The room snapshot lists no state per `RoomLayer` (loaded or stand-in).
Trigger: a parent report of one missing piece the panel does not name, or the next change to `RoomLayer` or `salon-art.spec.ts`.

## 10. `FontFace` load limit
The task font has no limit of its own beyond the boot limit; `create()` only checks `document.fonts` for the result.
Trigger: a field report of a stuck start, or the next change to the font loading in `BootScene`.

## 11. VO3 drawn wallet fallback look
`artFallbacks` records that the drawn wallet showed; its look still needs a kit view.
Trigger: the next change to `CoinWallet`, or the author delivering a view of the fallback.

## 12. O-3 update check on return from the background
`registration.update()` runs once per launch only, so a tablet left open for days keeps the old build until the next launch (decision: no visibility or timer trigger).
Trigger: a parent report of an old build after days, or a decision that a worker may claim a page between rounds.

## 13. B-6 throttled cold-start measurement
`balance.loader.totalMs` (50 s) was not re-measured; the queue only moved the sounds last.
Trigger: a throttled (about 50 KB/s, worker installing) cold start on a real Android tablet, or a field report of a cut boot.

## 14. Salon carry note on the import preview, and `roomGrowth` for any `tasksDone` below the length
`saveFile.parseImport` has its own literal and carries no `salonCarried`; `roomGrowth` reports only a `tasksDone` equal to a former length.
Trigger: a reviewer or parent asking the import dialog for the note, or a saved room found short of the new task list that the log did not name.

## 15. Purchase flush proven only through the debounce (impl review)
Phase 12's planned break (`RoomScene.dispatch` without `flush('now')` after a purchase) stayed green: the 500 ms debounce writes anyway before the spec reads the failure count, so the immediate flush after a purchase is unit-proved only.
Trigger: a change to `RoomScene.dispatch` or the autosave debounce, or a report of a purchase lost when the tab closed at once.

## 16. A-9 round skip in the browser (impl review)
The stalled-money e2e (#15 A-9) asserts the panel line only; that the round leaves out the stalled skill is proved by `tests/artFilter.test.ts` (forced skills bypass the art filter in the hook build).
Trigger: a change to `withoutArtBlocked`, `?e2eSkills` or the forced-skill path in `TaskScene.freshRound`.

## 17. Dead helpers and one name helper (impl review)
`roomArtCheck` (`scripts/deploy-check/parse.ts`), `bootLoadPhase` (`src/core/bootLoad.ts`), `sectionState` (`src/core/artHealth.ts`, still named in CLAUDE.md) and `parseSoundPrefs` are used by tests only; `nameOf` in `src/pwa/registerServiceWorker.ts` and an inline name read in `src/ui/decodeSeam.ts` repeat `errorName` (`src/core/save.ts`).
Trigger: the next change touching any of these files.

## 18. `UI_MISSING_URL` is not a build marker (impl review)
`'missing-on-purpose'` stays out of `dist/` only because terser folds `seam === 'ui'` when `seam` is the constant null (checked: 0 hits in this branch's build); `vite/e2eHookGuard.mjs` does not list it.
Trigger: a change to `vite/e2eHookGuard.mjs`, the minifier settings, or the `ui` queuer in `BootScene.preload`.

## 19. `startMusic` once('addfile') listener (impl review, pre-existing)
If `loader.audio` queues no file, the `once('addfile')` listener in `src/ui/sound.ts` stays armed and wraps the next unrelated HUD file (harmless today: only audio is guarded).
Trigger: a second file type loaded on the HUD loader, or a change to `startMusic`.
