---
date: 2026-10-13T20:44:28+0200
researcher: Claude (autonomous run 2026-10-13-s12-s14, research step)
git_commit: ca0c645
branch: feat/save-export-import-reset
repository: Martynka-urzadza
topic: "S-12: how export, import and reset of the save work in the parent panel, and how the audit items M-S3, L-S2, N-8, M-S2 fit in"
tags: [research, save, autosave, import, export, reset, settings-panel, pwa, e2e]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run 2026-10-13-s12-s14)
---

# Research: export, import and reset of the save (S-12)

**Date**: 2026-10-13T20:44:28+0200
**Researcher**: Claude (autonomous run, research step)
**Git Commit**: ca0c645
**Branch**: feat/save-export-import-reset
**Repository**: Martynka-urzadza

## Research Question

Derived from `change.md` (decision 8, § Roadmap claims, § Triggered follow-ups) and the step prompt:

1. How does an import or a reset replace the state of a game that is already running, safely (autosaver snapshot vs a
   direct store write; block → write → reload or another path)?
2. Export file format: FR-022 "plik JSON" vs the existing raw export (`martynka-zapis.txt`, `text/plain`); where the
   build id and the reason (M-S3) go.
3. How the file picker and the download/share behave on iPad Safari and Android Chrome inside an installed PWA.
4. How e2e drives the download and the file upload in the hook build without touching IndexedDB.
5. Save format: does anything force v2? Where runtime fields (M-S2 `persist()`, N-8 history) live.
6. Design: bound views, shared components, copy, DESIGN-GAP rows; whether the new dialogs stay inside the settings
   panel's input session (follow-ups F5, F2, F6).

## Summary

- **Apply path (Q1).** The session state lives only in the Phaser registry, filled once in `src/main.ts`
  `createGame` → `preBoot`; the autosaver writes `snapshot()` of that registry (`src/main.ts` `start`,
  `createAutosaver({ snapshot })`). A direct `store.write` alone would be overwritten by the next `markDirty` or by the
  `pagehide`/`visibilitychange` flush that a reload itself triggers (`src/main.ts` `start`: `pagehide` →
  `saver.flush('hidden')`). The store is not reachable from scenes (only `REGISTRY_KEYS.saver` is). **Recommended:** a
  new autosaver method in `src/core/autosave.ts` (working name `replace(state: SaveState)`) that (a) stops every
  later snapshot write, (b) waits for an in-flight write, (c) writes the given state through the injected store, and
  (d) on failure re-enables autosave and reports the error name, on success keeps writes off until the page reloads;
  then the caller does `location.reload()`, and `start` loads the new save through the tested load path
  (`loadSave` → `decodeSave` → `floorToCalendar` → `repairCurrentRoom`). It must not reuse `block()` (that is one-way:
  `blockedBy ??= reason`, no unblock, so a failed import would leave the game without saving). Reset = `replace` with
  `encodeSave(fresh session)` (learner `null` → `BootScene` sends to the welcome via `needsPlacement`), so `SaveStore`
  needs no `delete`.
- **File format (Q2).** Recommended: one JSON envelope for both exports — `{ app: 'martynka-urzadza', kind:
  'save' | 'raw', build, exportedAt, reason?, save | raw }` — so the file carries build + reason (M-S3) and import can
  say "this is not a file of this game". Import accepts the envelope and also a bare v1 value (an older raw export or a
  hand-made copy), then goes through `decodeSave` unchanged. The save format stays v1. File name/extension: see Q3.
- **Devices (Q3).** Keep `.txt` + `text/plain` (Chrome's share allow-list rejects `.json`/`application/json`;
  WebKit's `canShare` accepts any type). Share sheet first, download as fallback (blob download is unreliable in the
  iPad home-screen app). `share()` needs the tap's transient activation (5 s in WebKit), so it runs in the confirm
  button's handler. Import: an attached `<input type=file>` clicked synchronously from a tap, permissive `accept`
  (extensions + MIME), content validated. File System Access API is absent on both tablets.
- **E2E (Q4).** Already proven pattern: `tests/e2e/save-restart.spec.ts` uses `page.waitForEvent('download')` +
  `download.path()` for "Zachowaj kopię" because headless Chromium takes the download branch. Upload: an
  `<input type="file">` attached to the dialog DOM, filled by `locator.setInputFiles({ name, mimeType, buffer })` — no
  new production seam. Import/reset end in a reload, so the specs must run on the real IndexedDB store (no `?e2eSave=`
  seam: the in-memory stores of `e2eSaveStore` do not survive a reload). The new spec file must be added to
  `ROUND_SPEC` in `playwright.config.ts`.
- **Format (Q5).** No migration needed: `SaveState` v1 already holds everything the summary needs; `persist()` result
  and failure history are runtime fields of `AutosaveStatus` (`src/core/autosave.ts`), never of `SaveState`.
- **Design (Q6).** The kit has no settings, export, import or reset views (gaps 26, 42–45 already record the parent
  dialogs as ours). New rows from 46. New sub-dialogs should be steps inside the settings panel's existing
  `openInputSession` (`src/scenes/UIScene.ts` `openSettings`), so follow-up F5 does not trigger; every new dialog
  callback that reaches `UIScene` runs in `session.run`, and `tests/dialogSessions.test.ts` `DIALOG_CALLBACKS` grows
  by the new callback names (F2).

## Detailed Findings

### 1. How the running session is built and saved

- `src/main.ts` `start`: reads the store once (`loadSave`), decides `session` (loaded / fresh / after the failed-save
  card), then `createGame(..., session)`; `preBoot` sets `REGISTRY_KEYS.settings/stars/rooms/currentRoom` and
  `learner` (only when present). Nothing else ever re-seeds the registry from a save (this inspected path only;
  `freshSession` is a module-local function in `src/main.ts`).
- The store object (`createIdbSaveStore()` or `e2eSaveStore(seam)`) is a local of `start`; it is passed only to
  `loadSave` and `createAutosaver({ store })`. Scenes get the saver through `REGISTRY_KEYS.saver`
  (`src/data/layout.ts` `REGISTRY_KEYS`: "the game's autosave ({ flush, status })").
- `src/core/autosave.ts` `createAutosaver`: `attempt` writes `encodeSave(snapshot())` after `validateSave`; `save`
  skips while `blockedBy !== null`; `block(reason)` is `blockedBy ??= reason` + `cancelTimer()` and there is no
  unblock in the `Autosaver` interface (`markDirty`, `flush`, `block`, `status`).
- Registry changes of `SAVE_KEYS` call `saver.markDirty()` (`src/main.ts` `onChange` on `changedata`/`setdata`);
  `visibilitychange` hidden and `pagehide` call `saver.flush('hidden')`.

**Consequence for import/reset.** Three ways were considered:

| Option | What happens | Verdict |
|---|---|---|
| A. Write the new state into the registry and let autosave write it | Every scene keeps its own state (`TaskScene` round, `RoomScene` panel, `UIScene` fields); `BootScene` decides welcome vs task only at boot; half-states likely. No path exists today to restart all scenes from new state. | Rejected (change.md decision 5 confirmed) |
| B. `store.write(newState)` directly, then reload | `store` is not reachable from scenes; even if exposed, a pending debounce timer or the reload's own `pagehide` flush (`src/main.ts` `start`) would write `snapshot()` of the old registry over it when `dirty` is true. | Rejected as-is |
| C. Saver-owned replace: stop snapshot writes, await in-flight, write the new state, reload | Store stays encapsulated in core; ordering is guaranteed inside one module; failure leaves the old save (IndexedDB `set` of one key is atomic — `src/storage/idb.ts` header comment) and re-enables autosave. Reload re-runs `start`, which is the path covered by `tests/e2e/save-restart.spec.ts` "#2 #10 a reload comes back…". | **Recommended** |

Details the plan has to settle for option C:

- Separate flag from `blockedBy` (e.g. `replacing`), checked in `save` and `markDirty` like `blockedBy`, so that
  `saveHealthView` and `pl.settings.saveOff` need no new `BlockReason`. On failure: clear the flag, `failures++`,
  `lastError = errorName(e)`, return `{ ok: false, error }`; leave `dirty` as it was so the normal autosave resumes.
- `replace` must be allowed while `blockedBy` is `unreadable` (the recovery path from change.md decision 5) and refuse
  under `fatal` (the error boundary already owns the screen; `src/main.ts` `installErrorBoundary` callback). Under
  `unavailable` the write will most likely reject and the flow reports it; worth allowing (no harm, the old state is
  untouched because there is none readable).
- It validates the state (`validateSave`) before writing, like `attempt` does.
- In-flight: `save` returns `inflight` when one runs; `replace` awaits `inflight` (the `.finally` wrapper never
  rejects because `attempt` never throws) before its own write. IndexedDB transactions on one store run in creation
  order, so awaiting is enough.
- Reload: `window.location.reload()` from the DOM layer after `replace` resolves ok. The SW config is `skipWaiting` +
  `clientsClaim` + `registerType: 'autoUpdate'` (`vite/config.shared.mjs`), so a reload can start a newer build that
  was waiting — the same as any next launch, and FR-003/FR-021 already require it to read v1. The hook build keeps the
  query string (`?e2eMonth=…`) across the reload.
- Speech unlock is per page (`src/main.ts` `unlockSpeech` listens for the first tap); after the reload the first tap
  unlocks it again — no loss beyond one tap.
- Reset writes `encodeSave({ stars: 0, rooms: { [FIRST_ROOM]: emptyRoomState() }, currentRoom: FIRST_ROOM, settings:
  initialSettings(), learner: null })` — the same value `freshSession(0)` builds in `src/main.ts`. Moving
  `freshSession` out of `main.ts` (to a core function taking `FIRST_ROOM` as a parameter, `core` may not import
  `data/rooms`) lets reset and start share it. After reload the outcome is `loaded` with `learner: null`;
  `preBoot` leaves `REGISTRY_KEYS.learner` unset, and `src/scenes/BootScene.ts` starts the welcome through
  `needsPlacement`. Difference from a true first launch: `?e2eStars` does not apply (it seeds `fresh` only) and the
  autosaver status says `load: 'loaded'`. Neither is player-visible.
- Two tabs of one origin: the other tab keeps its registry and will overwrite the imported save at its next write.
  Carried risk, unchanged (follow-up of `2026-10-13-autosave-versioned-save`).

### 2. Import validation pipeline (risk #7)

- `src/core/save.ts` `decodeSave(raw)`: never throws; not-a-record or non-integer `version` → `corrupt`; `version >
  SAVE_VERSION` → `future`; missing migration step → `unknown-version`; `validateSave` false → `corrupt`; else
  `{ kind: 'ok', session, migratedFrom }`. `validateSave` checks types and counts but not data-level facts that core
  cannot know: unknown room ids, `tasksDone` larger than the room's task count, skill ids that no longer exist.
- After the reload those are handled by `start` exactly as for a stored save (`floorToCalendar`, `repairCurrentRoom`).
  The import summary must clamp `tasksDone` to the room's task count for display (`src/data/rooms.ts` `ROOMS` is data;
  pass it in, like `roomsListView` takes the rooms).
- Missing pieces for import (all new): size check before reading (`File.size` against a new
  `balance.save.importMaxBytes`; a v1 save with `balance.mastery.historyLength` = 200 entries is tens of KB, the frozen
  fixtures are 200 B and 888 B, so ~1 MB is generous), `JSON.parse` with a caught `SyntaxError`, envelope unwrap,
  `decodeSave`. A pure core function (working name `parseImport(text): ImportResult`) returning
  `{ kind: 'ok', session, file: { build, exportedAt } } | { kind: 'rejected', reason: 'too-big' | 'not-json' |
  'not-ours' | 'corrupt' | 'future' | 'unknown-version' }` keeps all of risk #7 unit-testable; the anti-pattern in
  `context/foundation/test-plan.md` § risk #7 ("JSON.parse succeeding means the file is valid") is covered by feeding
  it parsable-but-wrong JSON.
- Follow-up F3 (audit C-2): a `saveProblem(value): string | null` returning the path of the first bad field is cheap
  only if written alongside `validateSave` — `validateSave` today is a chain of `return false`; a parallel function
  duplicates the checks. A lower-cost version: return the first failing top-level key (`version`, `profileId`,
  `stars`, `rooms`, `currentRoom`, `settings`, `learner`) — enough for a `console.warn`. The plan decides; it is not
  needed for the parent-facing message.

### 3. Export file format

- Today: `src/ui/dom/saveExport.ts` `exportRawSave(raw)` builds `new File([rawExportText(raw)], pl.saveFailed.fileName,
  { type: 'text/plain' })`, tries `navigator.share({ files })` when `canShare({ files })`, else `a.download` with an
  object URL. `rawExportText` = `JSON.stringify(raw, null, 2)` or `String(raw)`. File name `martynka-zapis.txt`
  (`src/data/pl.ts` `saveFailed.fileName`). DESIGN-GAP 44 and the archived plan
  (`context/archive/2026-10-13-autosave-versioned-save/plan.md`, decision 7) chose `.txt` because the earlier research
  believed Chromium's share allow-list excludes `.json` (marked unverified there).
- FR-022 (`context/foundation/prd.md`): "Rodzic eksportuje zapis do pliku JSON". The content is JSON either way; the
  extension is a delivery detail. The archived "believed to exclude `.json`; unverified" is now verified (§ 4,
  chromium `share_service_impl.cc`). Recommendation: keep `text/plain` + `.txt` for the share
  path (works on both platforms), content is JSON; import accepts both `.json` and `.txt`.
- Envelope (M-S3: "plik eksportu niesie build i powód"):
  `{ "app": "martynka-urzadza", "kind": "save", "build": "<__BUILD_ID__>", "exportedAt": "<ISO>", "save": <SaveState v1> }`
  and for the raw copy `{ "app": …, "kind": "raw", "build": …, "exportedAt": …, "reason": "corrupt|future|unknown-version", "raw": <value> }`.
  `raw` that cannot be serialised falls back to a string (as `rawExportText` does today). The envelope is a FILE
  format; `SaveState` stays v1 (change.md "Migration expected? Nie"). Import reads `save` (or `raw`) out of an
  envelope, or takes a bare object with a numeric `version` as the save itself; anything else is `not-ours`.
  Build id comes from `__BUILD_ID__` (global define in `vite/config.shared.mjs`); core stays pure by taking it as a
  parameter.
- L-S2: the current raw export downloads right after the adult gate (`src/main.ts` `start` → `openParentGate` →
  `onPass: () => void exportRawSave(raw)`). Recommended: one confirm dialog ("Zapisz plik" + a muted privacy note,
  follow-up F6 of parent-settings-progress) before the share/download, and a status line after it (shared /
  downloaded / cancelled), returned by `exportRawSave` as a result instead of `void`. Note: on iPad the share sheet
  needs transient user activation, so the share call must happen in the click handler of that confirm button, not
  after an `await` of something slow (see § 4).

### 4. File picker, share and download on tablets

Web research by a delegated worker (primary sources linked; confidence H/M/L as reported; device behaviour itself
was not observed on hardware in this step).

| Question | Finding | Source | Conf. |
|---|---|---|---|
| iPad home-screen app, blob `<a download>` | Unreliable: nothing visible or a Quick Look preview the user must save; in a Safari tab it works | WebKit 275288 (iOS 17 PWA, moved to Apple's tracker), 209407, 231892 | M |
| iPad `navigator.share({ files })` | Supported since Safari/iOS 14; WebKit `Navigator::canShare` does no MIME/extension filtering (true for `.json` too); share sheet targets are up to iOS | MDN browser-compat-data `Navigator.json` `data_files_parameter`; WebKit `Source/WebCore/page/Navigator.cpp` | H / M |
| Share user activation | `share()` consumes transient activation and rejects with `NotAllowedError` without it; WebKit activation lasts 5 s | WebKit `Navigator.cpp`, `LocalDOMWindow.cpp` `defaultTransientActivationDuration`; MDN `Navigator.share` | H |
| Android Chrome share allow-list | Exact list: `.txt`/`text/plain` allowed; **`.json`/`application/json` NOT allowed** (`canShare` false) | chromium `chrome/browser/webshare/share_service_impl.cc` | H |
| iPad `<input type=file>` in standalone | Opens the Files picker; must be clicked synchronously in the tap handler (scripted click outside a gesture fails); detached input on iOS unverified → attach it (visually hidden) | WebKit 277884 (macOS 17.6, fixed), 220182 | M / L |
| `accept` filtering | Partial on iOS and Android; providers may grey out `.json` when only the extension is listed → list MIME + extension, or omit `accept` and validate content | caniuse `input-file-accept`, WebKit 229456 | M |
| `File.text()` | Safari 14+, Chrome yes | MDN `Blob.text` | H |
| File System Access API | Not on iOS Safari nor Chrome Android; present in desktop headless Chromium → feature-detect, never rely | caniuse `native-filesystem-api` | H |
| Headless Chromium (Playwright, macOS) | `navigator.share` and `canShare` are `undefined` → the code takes the download branch (matches `tests/e2e/save-restart.spec.ts` comment "headless Chromium has no share sheet") | probe run by the worker, scratchpad only | H |
| Playwright download | `page.waitForEvent('download')` → `suggestedFilename()`, `path()`; blob downloads covered by Playwright's own suite | playwright.dev/docs/downloads | H |
| Playwright upload | `locator.setInputFiles({ name, mimeType, buffer })` on an attached (even hidden) input; for a detached input `waitForEvent('filechooser')` fires too and `fileChooser.setFiles` takes the same payload | playwright.dev/docs/input; `tests/page/page-filechooser.spec.ts` "should work when file input is not attached to DOM" | H |
| `location.reload()` with the SW | A navigation served by the controlling worker; no prompt; with `skipWaiting` + `clientsClaim` (this project) an already-activated new build is served | web.dev service-worker-lifecycle | M-H |

**Conclusions for the plan.**

- Keep `text/plain` and a `.txt` name for the share path (Android rejects `.json`); the content is JSON (FR-022 is
  met in substance). Keep the share-first → download-fallback order of `exportRawSave`, now for both exports.
- The share call must run inside the tap of the explicit confirm button (L-S2) and before any slow `await`: build the
  `File` synchronously (the snapshot is already in memory — `encodeSave` of the registry state), then call `share`.
- Import: an `<input type="file" accept=".txt,.json,text/plain,application/json">` attached inside the dialog
  (visually hidden or styled as the button), `input.click()` synchronously from the button's tap, `file.size` check,
  `await file.text()`, then the pure parser. E2E fills it with `setInputFiles` (no production seam needed).
- The status after export (L-S2: "udostępniono / pobrano / anulowano") is honest only as "the system took the file";
  on iPad the download fallback may still be a preview. The plan keeps a manual device row for it.

### 5. Where the actions sit and the input session

- `src/scenes/UIScene.ts` `openSettings`: returns early without a learner, suspender, or with an active session;
  opens `openInputSession(suspender)`, then `openParentGate` → `openSettingsPanel`, all callbacks wrapped in
  `session.run`. `closeSettings` ends the session. The panel is reachable only after the welcome (no learner before).
- `src/ui/dom/settingsPanel.ts` `openSettingsPanel` builds one `openDialog` with stage choices, reading, "Zapis gry"
  (`createSaveHealthView`), progress, sticky "Zatwierdź"/"Anuluj". Natural place: buttons "Zapisz kopię", "Wczytaj z
  pliku", "Zacznij od nowa" (copy to be set in the plan; DESIGN-GAP) inside or under the "Zapis gry" section.
- Sub-steps (export confirm, import summary, reset confirm, rejected-file message) can be rendered as further
  `openDialog`s that replace the panel (close panel, open step, "Anuluj" returns to a re-opened panel or closes all)
  while `UIScene` keeps the same `session`. No second `suspend()` → follow-up F5 ("any new overlay that calls
  suspend() while the HUD exists") does not trigger. New callbacks routed through `UIScene` (`onExport`, `onImport`,
  `onReset`, or one `onSaveAction`) must be arrow functions whose body is `session.run(...)`, and their names must be
  added to `DIALOG_CALLBACKS` in `tests/dialogSessions.test.ts` (F2; the test inspects property assignments in
  `src/scenes/`).
- Async work (`file.text()`, `saver.replace`, `navigator.share`) cannot be wrapped by `session.run` (it only catches
  synchronous throws: `src/core/inputSuspend.ts` `openInputSession`). Recommended split: DOM modules own the async
  part with their own try/catch and report a result; the scene-level callbacks stay synchronous.
- Follow-up F6 (`WelcomeScene.openParent` guard) triggers only if `UIScene` changes; it will (new handlers), so the
  one-line alignment is in scope per change.md.
- Recovery case (saver `unreadable`): the child taps "Graj dalej", passes the welcome (a fresh learner in the
  registry; no write because the saver is blocked), then the parent can import from the panel. Import from the welcome
  screen's "Rodzic" path is not required by FR-022/US-03 (they name the settings); leaving it out is a plan decision.

### 6. Audit items (scope extension)

- **M-S3** — `src/main.ts` `start` logs `Save unreadable (${outcome.reason})` and mounts `mountSaveFailedCard` with
  `copy: pl.saveFailed`; `SaveCardCopy` has `title/body/continue/note/export?`. Pattern for the build line:
  `pl.errorCard.build(id)` = `Wersja ${id}` used by `src/ui/dom/errorCard.ts` `mountErrorCard`. Recommendation: an
  optional `detail` line on the card (`Kod: corrupt · Wersja abc1234`, muted), plus reason/build in the envelope (§ 3).
- **L-S2** — § 3.
- **N-8** — `src/core/saveHealth.ts` `saveHealthView` returns `ok` regardless of `writes`; `AutosaveStatus` already
  has `writes`, `failures`, `lastError`. Extend the view union: `{ kind: 'ok', lastWriteAt, earlierFailures?:
  { count, error } }` and a `{ kind: 'notYet' }` (writes === 0 and not blocked). Pure, unit-testable; strings in
  `pl.settings`. Numeral agreement for "N nieudanych prób" via `src/core/text/plural.ts` `countNoun` (1 próba, 2 próby,
  5 prób).
- **M-S2** — `src/storage/idb.ts` `requestPersistence` drops the `persist()` result; it is passed as
  `onFirstWrite` (`() => void`) to `createAutosaver`. Recommended: `requestPersistence(): Promise<PersistResult>`
  with `PersistResult = 'granted' | 'denied' | 'unsupported' | 'error'`, `onFirstWrite` typed to return
  `Promise<PersistResult> | void`, and the autosaver stores the settled value in `AutosaveStatus.persistence`
  (`'unknown'` until settled). `src/storage/idb.ts` stays the only `idb-keyval` importer; `persist()` is not
  `idb-keyval`, but keeping it there matches the module's role. `saveHealthView` gains the field; one sentence in
  "Zapis gry".

## Code References

- `src/main.ts` `start`, `createGame` (`preBoot`), `freshSession`, `installErrorBoundary` callback — session build,
  autosaver wiring, `pagehide`/`visibilitychange` flush, failed-save card, raw export behind the gate.
- `src/core/autosave.ts` `createAutosaver` (`attempt`, `save`, `block`, `status`), `loadSave`, `AutosaveStatus`,
  `BlockReason`, `SaveStore`.
- `src/core/save.ts` `decodeSave`, `validateSave`, `encodeSave`, `rawExportText`, `SAVE_VERSION`, `MIGRATIONS`.
- `src/storage/idb.ts` `createIdbSaveStore`, `requestPersistence`.
- `src/core/saveHealth.ts` `saveHealthView`; `src/ui/dom/saveHealthView.ts` `createSaveHealthView`.
- `src/ui/dom/saveExport.ts` `exportRawSave`; `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard`, `SaveCardCopy`.
- `src/ui/dom/settingsPanel.ts` `openSettingsPanel`; `src/ui/dom/dialog.ts` `openDialog`; `src/ui/dom/overlay.ts`
  `createButton`, `createText`; `src/ui/dom/parentGate.ts` `openParentGate`.
- `src/scenes/UIScene.ts` `openSettings`, `applySettings`, `closeSettings`; `src/core/inputSuspend.ts`
  `openInputSession`.
- `src/core/rooms.ts` `roomDone`, `roomsListView`, `emptyRoomState`, `repairCurrentRoom`; `src/data/rooms.ts`
  `ROOMS`, `FIRST_ROOM`.
- `src/core/text/plural.ts` `countNoun`, `inflect`.
- `src/data/pl.ts` `settings.save*`, `saveFailed`, `saveUnavailable`, `errorCard.build`; `src/data/balance.ts`
  `save` (`debounceMs`, `loadTimeoutMs`), `mastery.historyLength`.
- `vite/config.shared.mjs` (PWA `skipWaiting`, `clientsClaim`, `registerType: 'autoUpdate'`, `__BUILD_ID__`);
  `src/pwa/registerServiceWorker.ts`.
- `tests/e2e/save-restart.spec.ts` (download via `waitForEvent('download')`, reload pattern),
  `tests/e2e/support/welcome.ts` `openSettings`, `passWelcome`; `playwright.config.ts` `ROUND_SPEC`;
  `tests/dialogSessions.test.ts` `DIALOG_CALLBACKS`; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`;
  `src/testing/e2eHook.ts` `e2eSave`, `e2eSaveStore`.

## Architecture Insights

- Pure core + injected effects is the established pattern for saving (`SaveStore`, `timers`, `now`, `log`,
  `onFirstWrite`); `replace`, `parseImport`, the summary and the extended health view all fit it and are testable
  with vitest without a browser.
- "Restart through the load path" beats "hot-swap the registry": the load path is the one already tested by unit
  (`loadSave`, `decodeSave`) and e2e (`save-restart.spec.ts`); hot-swap would need a new restart choreography for 5
  scenes.
- DOM dialogs are built from `openDialog` + `createButton`/`createText`, styles in `src/style.css` (`parent-*`,
  `overlay-*` classes). No new component library is needed.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-autosave-versioned-save/research.md` § 9: blob `<a download>` unreliable in the iPad
  home-screen app (WebKit 209407, 231892, 290847, 275288); share sheet first; "S-12's import should accept `.txt` and
  `.json`" — supported, still the recommendation.
- Same archive, `plan.md` decision 7 and `plan-brief.md`: `.txt` chosen against the research's recommendation (marked
  `[human]`); the file name `martynka-zapis.txt` — still current (`src/data/pl.ts` `saveFailed.fileName`).
- `context/archive/2026-10-13-save-observability-c1-c2/`: status fields `blockedBy/lastError/lastWriteAt/
  consecutiveFailures`, "Zapis gry" section, `?e2eSave=unavailable|hang|writefail` — all present in code.
- `context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md` § 5: M-S2, M-S3, L-S2, N-8 still open
  at `d13d9a3`; this research confirms the files/symbols are unchanged at `ca0c645` for `requestPersistence`,
  `mountSaveFailedCard`, `exportRawSave`, `saveHealthView`.

## Related Research

- `context/archive/2026-10-13-autosave-versioned-save/research.md`
- `context/archive/2026-10-13-save-observability-c1-c2/research.md`
- No spec in `tests/e2e/` uses `setInputFiles` or `filechooser` yet (grep over `tests/e2e`); the upload pattern is new.

## Open Questions

- Product (plan decides, recorded in handoff § 6 of this step): the exact Polish copy of the new buttons/dialogs
  (DESIGN-GAP rows from 46), whether the import summary shows "teraz" next to "z pliku" (change.md decision 3 says yes).
- Device-only facts that no local test can prove (manual checklist, test-plan rollout phase 7): share sheet "Zapisz w
  Plikach" and the Files picker in the iPad home-screen app; Android Chrome installed PWA share/download; the
  `persist()` answer on each.
