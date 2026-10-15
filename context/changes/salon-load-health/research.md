---
date: 2026-10-15T20:32:58+02:00
researcher: Claude (autonomous run 2026-10-15-fix-salon-load-health, research step)
git_commit: 3062de6
branch: feat/salon-load-health
repository: Martynka-urzadza
topic: "salon-load-health: save v3 migration of the legacy salon (H-1, M-2), loader time limit (H-2), save at start after a migration (M-3)"
tags: [research, save, migration, autosave, loader, phaser, e2e]
status: complete
last_updated: 2026-10-15
last_updated_by: Claude (research step)
---

# Research: salon-load-health

**Date**: 2026-10-15T20:32:58+02:00
**Researcher**: Claude (autonomous research step)
**Git Commit**: 3062de6
**Branch**: feat/salon-load-health
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (scope H-1, M-2, H-2, M-3; save format v3 approved): how does `MIGRATIONS[2]` (v2 → v3) get the salon
data while `src/core/save.ts` stays free of content imports; how import/export/`deviceSaveView`/`replaceGate` treat a v3
save and a v2 file; how the backup key and policy generalise from v1 to v2 (and what a v1 save does now); what M-3 "mark
dirty" means for the `Autosaver` at start; how Phaser 4.2.1's loader timeout behaves and whether a timed-out file reaches
the existing stand-in / art health path; which e2e seams are needed (a v2 legacy-salon save, a stalled loader request).
Research only, no product code. Audit finding ids refer to the observability audit 2026-10-15_2010.

## Summary

1. **Migration data (H-1).** `src/core/save.ts` (header: "no data imports") holds `MIGRATIONS` with step `1` only and
   `decodeSave(raw, migrations = MIGRATIONS)`. The default argument is used by every production caller found:
   `loadSave` (`src/core/autosave.ts`), `parseImport` and `deviceSaveView` (`src/core/saveFile.ts`), and `importProblem`
   recurses with the same default. Injecting the salon tables through the `migrations` parameter would need every one of
   these four callers changed, and any missed one would read a v2 save as `unknown-version`. **Recommendation:** the step
   owns FROZEN tables (old 10-task list + renames, and a snapshot of the v3 target list as `{slot|stage, cost}`), kept in
   `src/core` (e.g. a small `src/core/migrations/` module), so `MIGRATIONS[2]` is complete by default. A unit test (tests
   may import `src/data`) pins the snapshot to today's `SALON.tasks` and the old list to `LEGACY_SALON`. Reason for the
   frozen target, not the live `SALON`: `SALON.tasks` may grow at its end (`src/data/rooms.ts` comment "New tasks go at
   the END"), and rule B in `remapLegacySalon` caps the prefix at the whole list; old total cost 96 > new total 71, so a
   fully-done old salon would map to MORE tasks as the list grows. A migration must give the same v3 for the same v2 bytes.
2. **Import/export/gates (H-1).** After the bump, a v2 file in `parseImport` migrates inside `decodeSave`, so the
   preview (`UIScene.openImport` `summarize`) can drop `remapLegacySalon` and show `saveSummary(s, ROOMS)` directly;
   `Autosaver.replace` writes `encodeSave(session)` = v3. `deviceSaveView` decodes `saver.current()` (v3, no step runs).
   `replaceGate` needs no change: an older build (SAVE_VERSION 2) meets v3 as `future` in its own `decodeSave` and its
   `replaceGate` blocks `future`; its import rejects a v3 file as `future`.
3. **Backup (H-1/M-1).** `createIdbSaveStore` `backup(raw, from)` writes `${key}:backup-v${from}` (`src/storage/idb.ts`),
   and `createAutosaver` passes `options.migrated.from` = `decodeSave`'s `migratedFrom` = the ORIGINAL version. So a v2
   save gets `profile:default:backup-v2`, and a v1 save chains v1 → v2 → v3 in one decode with ONE copy, the raw v1,
   under `backup-v1` (no intermediate v2 copy exists or is needed). The policy (`backupAttempts`, `withTimeLimit`,
   `skipBackup`, `replace` taking an owed copy once) is version-agnostic in code; only strings say "v1"/"v2": the
   `skipBackup` log `'autosave: writing v2 without the v1 copy'`, the `AutosaveStatus.backup` doc comment, the
   `saveHealth.ts` comment, the `pl.ts` DESIGN-GAP 95 comment, and the `balance.save` comment. `pl.settings.saveMigrated`
   already takes `from`.
4. **M-3.** `main.ts` `start` builds the session, `createGame` sets it in `preBoot`, then `createAutosaver` and the
   `changedata`/`setdata` listeners are attached; nothing marks the migrated state dirty, so today a migrated v1 (and the
   remapped salon) is written only after the child's first change and the migration repeats on every launch until then.
   Minimum fix: after `createAutosaver`, `if (outcome.kind === 'loaded' && outcome.migratedFrom !== null) saver.markDirty()`
   (debounced write with the copy first). No conflict found: a blocked saver (`unreadable`/`unavailable`, incl. "Graj
   dalej" on the slow card) only counts `skipped`; a load resolved by "Poczekaj dłużej" is a normal `loaded` outcome;
   `replace` awaits `inflight` and cancels the timer. Visibility: `saveHealthView` `migration` line already appears once
   `writes > 0`; whether to add a `WriteReason` like `'migration'` for `lastReason` is the plan's call.
5. **H-2.** Phaser 4.2.1: `loader.timeout` (default 0 = none) and `loader.maxRetries` (default 2) in the game config;
   images load by XHR by default, `xhr.ontimeout` → `File.onError` → retry while `retryAttempts > 0`, then
   `LoaderPlugin.nextFile(file, false)` emits `loaderror` and the loader still completes, so `create` runs. A failed file
   is never cached, so `textures.exists(key)` is false and `artHealth` / room art health count it with no other change.
   Worst case per file ≈ (maxRetries + 1) × timeout. The font's second fetch (`FontFace`) has no timeout.
6. **E2E seams.** (a) The `legacy-salon` seam builds its value with `encodeSave(...)`, which becomes v3 after the bump
   — it must become a FROZEN v2 fixture (new `tests/fixtures/save-v2-legacy-salon.json`, imported like `save-v1.json`).
   (b) A stalled request: the hook build is served by plain `vite preview` (no middleware) and the service worker runs
   there and precaches every WebP, so the spec needs `serviceWorkers: 'block'` + a `page.route` that never answers for
   one file, and a hook-build seam (e.g. `?e2eArt=stall`, under the existing `e2eArt` marker) that shortens the loader
   limit so the test does not wait (maxRetries + 1) × the production limit. Two e2e asserts on `writtenVersion` 2
   (`save-backup-health.spec.ts`, `salon-art.spec.ts`) change to 3.

## Detailed Findings

### Save format today (v2) and the migration chain

- `src/core/save.ts`: `SAVE_VERSION = 2`; `MIGRATIONS = { 1: ... }` (v1 → v2 adds `variants`); `saveProblem` checks
  `value.version !== 2`; `encodeSave` writes literal `version: 2`; `decodeSave` returns `future` when `from > SAVE_VERSION`,
  `unknown-version` when a step is missing, `migration-failed` (with `step`) when a step throws, `corrupt` when the result
  fails `validateSave`; `migratedFrom` is `from` when `from < SAVE_VERSION`. All four version literals (`SAVE_VERSION`,
  `saveProblem`, `encodeSave`, and the types) move to 3 together.
- `src/core/types.ts`: `SaveV1` (`version: 1`), `SaveV2 extends Omit<SaveV1,'version'>` (`version: 2`), and "the current
  save version's shape" alias. v3 has the same shape as v2 except `version: 3` (no new field in this change).
- `MIGRATIONS[2]` runs on RAW, unvalidated data (decode order: steps, then `validateSave`). It must be total: a value whose
  `rooms`/`rooms.salon`/`chosen` is not a plain object, or whose `tasksDone` is not a whole number ≥ 0, passes through
  with only `version: 3` set, so `validateSave` reports `corrupt` (not `migration-failed`). `Object.keys(null)` throws, so
  the guard is needed. This keeps follow-up F7/SRR-09/SRR-01 (`replaceGate` treats `migration-failed` like `corrupt`,
  i.e. overwritable) at its current trigger only if the step genuinely cannot throw — a test with malformed rooms proves it.
- `src/core/rooms.ts` `remapLegacySalon` works on a `SessionSave`. Marker today: any `chosen` key not a new slot (M-2).
  Old slot ids (`LEGACY_SALON.tasks`): floor, walls, curtains, sofa, rug, table, lamp, shelf, plant, picture. New slot
  ids (`SALON.slots`): sofa, rug, coffee-table, cabinet, armchair, wall-frames. Overlap: sofa, rug. M-2 marker = a key
  in the old list that is not a new slot: {floor, walls, curtains, table, lamp, shelf, plant, picture}. Because old
  `chosen` keys fill in task order and `floor` is task 1, every old save with `tasksDone ≥ 1` has `floor`; an old save
  with `tasksDone 0` has `chosen {}` and needs no remap (prefix 0 either way).
- Saves already remapped by the S-16a build (merged #61, deployed) are v2 with only new keys; the step leaves them
  unchanged except `version` (idempotent). A v2 with an unknown non-legacy key (a later slot) is kept as is (M-2).
- `remapLegacySalon` rebuilds `chosen` from the new prefix only: an unknown non-legacy key in the SAME old salon would be
  dropped. Edge case only (no build ever wrote both); plan may carry such keys over.

### Where the migration gets its tables

- ESLint (`eslint.config.mjs`) lets `src/core` import `src/data` (examples: `src/core/curriculum.ts`, `src/core/roomHit.ts`
  import `../data/balance`); the restriction is the other way (`src/data` → core only `core/text/*` and types). But
  `src/core/save.ts` and `src/core/saveFile.ts` state in their headers "no data imports" (rooms passed in as parameters).
- Options: (A) frozen tables in core, step complete by default — recommended (see Summary 1). (B) `save.ts` imports
  `LEGACY_SALON`/`SALON` from `src/data/rooms.ts` — breaks the header rule and, with the live `SALON`, makes the result
  drift as the list grows. (C) inject via `decodeSave(raw, migrations)` — four call sites (`loadSave`, `parseImport`,
  `deviceSaveView`, `importProblem` default), and the default `MIGRATIONS` would lack step 2.
- With (A), `LEGACY_SALON` in `src/data/rooms.ts` and `LegacyRoomLayout` in `types.ts` lose their last runtime readers
  once `main.ts` `start` and `UIScene.openImport` stop calling `remapLegacySalon` (grep: only these two call it in `src/`);
  tests `tests/salonRemap.test.ts` and `tests/roomsData.test.ts` read them. Plan decides: move the frozen list into core,
  or keep the data copy and pin equality in a test.

### Import, export, device view, replace gate

- `src/core/saveFile.ts` `parseImport` → `decodeSave(value)`; `kind: 'raw'` envelopes decode `parsed.raw`, `kind: 'save'`
  `parsed.save`; a bare object with `version` decodes directly. So a v2 export (pre-change) imports and migrates; a v3
  export into a v2 build is `future`.
- `deviceSaveView` decodes `current` (`saver.current()` = `encodeSave(snapshot())`, v3) — no migration on that path.
- `replaceGate` (`src/core/autosave.ts`): `unreadable` + `future` → `Blocked`; other `unreadable` → `ok`; `unavailable`
  → `ok` only with `force` and not a timeout. No v3-specific change needed.
- `src/scenes/UIScene.ts` `openImport` `summarize` wraps `remapLegacySalon(...)`; after v3 it must not (double remap is
  harmless only because the remap is idempotent, but the contract asks for none).
- Export of the device save: `UIScene` export uses `saver.current()` → v3.

### Backup copy and runtime status

- `createAutosaver` (`src/core/autosave.ts`): `backup` starts `pending` iff `options.migrated` is set; `attempt` copies
  before writing; after `backupAttempts` failures (or a `hidden` flush after one failure) `skipBackup` writes without the
  copy; `replace` tries an owed copy once. `status().migratedFrom = options.migrated?.from`.
- `main.ts` `start` passes `migrated: { from: outcome.migratedFrom, raw: outcome.raw }`; `raw` is the bytes as read.
- e2e seam store (`src/testing/e2eHook.ts` `e2eSaveStore`) logs `ops` (`backup`/`write`) and `writtenVersion`; its
  `backup` ignores `from`. A test that the copy key is `backup-v2` belongs at the unit level (`createIdbSaveStore` key
  format is not exercised by e2e; e2e never opens IndexedDB per the contract).

### M-3 at start

- Order in `main.ts` `start`: `loadSave` → optional slow/failed card → build `session` (`floorToCalendar`,
  `repairCurrentRoom`, `remapLegacySalon`) → `createGame` (`preBoot` sets registry) → `createAutosaver` → listeners.
  `preBoot` sets happen before the listeners exist, so no `markDirty`.
- `Autosaver.markDirty` sets `dirty`, counts `skipped` when `writesOff()`, else arms the `delayMs` timer. Calling it
  right after `createAutosaver` when `migratedFrom !== null` yields the first write ~500 ms after start with the copy
  first. `repairCurrentRoom`'s `repairedFrom` has the same unsaved-until-change gap; plan may include it.
- e2e impact: `save-migration.spec.ts` "#2 after a round the migrated save is written as v2 with a v1 backup first"
  expects `ops.slice(0,2) = ['backup','write']` and one backup — still true, but now without a round; titles/versions
  change to v3. `salon-art.spec.ts` legacy test reads `writtenVersion` after a change; M-3 lets it assert the write with
  no child action.

### Phaser 4.2.1 loader (from `node_modules/phaser/src`)

- `core/Config.js`: `loaderTimeout = GetValue(config, 'loader.timeout', 0)`, `loaderMaxRetries = ... 'loader.maxRetries', 2`,
  `loaderImageLoadType = ... 'XHR'`, `loaderMaxParallelDownloads` 6 on Android, else 32.
- `loader/LoaderPlugin.js` builds its `xhr` settings with `timeout` from the scene's loader config or `loaderTimeout`;
  `loader/XHRLoader.js` merges per-file `xhrSettings`, sets `xhr.timeout`, `xhr.ontimeout = file.onError`.
- `loader/File.js` `onError`: `resetXHR`, retry while `retryAttempts > 0` (from `maxRetries`, per-file override), else
  `loader.nextFile(this, false)` → `totalFailed++`, `FILE_LOAD_ERROR` (`'loaderror'`) with the file, then completion
  (`COMPLETE`), so `BootScene.create` runs.
- `ImageFile` uses XHR unless `imageLoadType` is `HTMLImageElement` or the URL is base64; on the XHR path a decode
  failure goes to `onProcessError` with no `loaderror` (the existing `?e2eArt=corrupt` case).
- `src/main.ts` `createGame` sets no `loader` key → timeout 0: a stalled file keeps the `LoadingScreen` bar short of 1
  forever and `create` never runs (H-2 confirmed in source; runtime on WebKit unproven — no WebKit project).
- `src/scenes/BootScene.ts` `preload`: `loaderror` handler logs `Task font failed to load` / `Task art failed to load`
  (room files too: L-3, out of scope unless the plan touches the handler); `create` writes `REGISTRY_KEYS.artHealth`
  and room art health from `textures.exists` (`src/core/artHealth.ts`).
- Sizing input for `balance`: `public/assets` is 1.7 MB in total, the largest file `rooms/salon/furnishings-before.webp`
  is 289 KB; the service worker precaches all of it, so after the first launch files come from cache. The value and
  whether to lower `maxRetries` (worst case (maxRetries + 1) × timeout) are the plan's call.

### E2E seams

- Existing: `e2eSave` (`E2ESaveSeam` incl. `v1`, `backupfail`, `backuphang`, `legacy-salon`), `e2eArt`
  (`missing|corrupt|room`), markers in `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` (incl. `e2eArt`, `legacy-salon`).
  `playwright.config.ts`: two Chromium projects; `chromium-hook` (port 4397) runs specs matching `ROUND_SPEC` — a new
  spec file must be added there.
- Legacy-salon seam: `legacySalonSession` + `encodeSave` → becomes v3 after the bump, so it would no longer test the
  migration. Needs a frozen v2 JSON fixture (L-2 ride-along); a `legacy-salon` + backup-failure variant is optional.
- Stalled request: no server can hold a request; `registerServiceWorker` registers in every non-DEV build, including the
  hook build, and the SW (`clientsClaim`, `skipWaiting`) precaches WebP, so `page.route` alone can be bypassed. Use
  `test.use({ serviceWorkers: 'block' })` + `page.route('**/<one file>.webp', () => {})` (never fulfilled) and a hook-only
  seam shortening the loader limit (e.g. `?e2eArt=stall` → small `timeout`, `maxRetries: 0` for the game config or that
  file), mirroring `E2E_LOAD_TIMEOUT_MS`. Assert: the boot reaches the next screen, the stand-in box is drawn, the
  settings "Obrazki" section counts the file. No spec today uses `page.route` or `serviceWorkers`.

## Code References

- `src/core/save.ts` — `SAVE_VERSION`, `MIGRATIONS`, `saveProblem`, `importProblem`, `encodeSave`, `decodeSave`
- `src/core/types.ts` — `SaveV1`, `SaveV2`, `LegacyRoomLayout`
- `src/core/rooms.ts` — `remapLegacySalon`, `repairCurrentRoom`
- `src/data/rooms.ts` — `SALON.tasks` (append-only comment), `LEGACY_SALON`
- `src/core/autosave.ts` — `createAutosaver` (`attempt`, `skipBackup`, `replace`, `markDirty`), `replaceGate`, `loadSave`
- `src/core/saveFile.ts` — `parseImport`, `deviceSaveView`, `saveSummary`
- `src/core/saveHealth.ts` — `migrationOf`, `saveHealthView`
- `src/storage/idb.ts` — `createIdbSaveStore` `backup`
- `src/main.ts` — `createGame` (no `loader`), `start` (remap, `createAutosaver`, listeners)
- `src/scenes/UIScene.ts` — `openImport` `summarize`
- `src/scenes/BootScene.ts` — `preload` (`loaderror`, `forcedArt`), `create` (art health)
- `src/testing/e2eHook.ts` — `e2eSaveStore`, `legacySalonSession`, `e2eArt`, `E2ESaveSeam`
- `vite/e2eHookGuard.mjs` — `E2E_HOOK_MARKERS`
- `playwright.config.ts` — `ROUND_SPEC`
- `node_modules/phaser/src/core/Config.js`, `loader/XHRLoader.js`, `loader/File.js` `onError`, `loader/LoaderPlugin.js` `nextFile`
- Tests to update/extend: `tests/save.test.ts` ("the current version is 2", v2 fixtures "encode back to themselves"),
  `tests/autosave.test.ts`, `tests/salonRemap.test.ts`, `tests/roomsData.test.ts`, `tests/saveFile.test.ts`,
  `tests/e2e/save-migration.spec.ts`, `tests/e2e/salon-art.spec.ts`, `tests/e2e/save-backup-health.spec.ts`

## Architecture Insights

- A save version is a one-way door (header of `save.ts`); every format change = version + `MIGRATIONS` step + frozen
  fixture. A migration step must be a pure function of the bytes: depending on live content data breaks that.
- The backup policy is keyed by the original version, so chains need no extra copies.
- Runtime status fields (`migratedFrom`, `backup`, `lastReason`) are never saved; the format stays exactly as typed.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-minigame-daily-puzzle/` — v1 → v2, `backup-v1`, `migration-failed`, `future`, frozen
  fixtures (pattern for this change).
- `context/archive/2026-10-15-save-v2-backup-health/` — `backupAttempts`, `withTimeLimit`, runtime `backup`/`backupError`,
  "przeniesiono" line only after a write; impl-review F3/F4 (`replace` marks `skipped` after one failure, log
  `attempts: 0`) re-triggered on "next change to replace, or v3".
- `context/archive/2026-10-15-final-art-salon/` — S-16a: `remapLegacySalon`, `LEGACY_SALON`, `?e2eSave=legacy-salon`,
  rollback risk (closed by H-1's `future` card).

## Related Research

- `context/archive/2026-10-14-minigame-daily-puzzle/research.md`, `context/archive/2026-10-15-save-v2-backup-health/research.md`
  (both exist; not re-read here).

## Open Questions

- Balance values: loader `timeout` and `maxRetries` (plan; constraint: 289 KB largest file, cold first launch on a slow
  network vs. SW cache afterwards).
- Whether `WriteReason` gains a value for the start write (M-3 visibility) and whether `repairedFrom` also marks dirty.
- Whether `LEGACY_SALON` moves into core or stays in data with an equality test.
- WebKit behaviour of a stalled XHR with `timeout` is unproven locally (Chromium-only Playwright; iPad is a manual check).
