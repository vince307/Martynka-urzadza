---
date: 2026-10-14T13:52:41+02:00
researcher: Claude (autonomous run 2026-10-14-save-s13b-s15-s14b, research step)
git_commit: ef8f950
branch: feat/save-reason-and-recovery
repository: Martynka-urzadza
topic: "save-reason-and-recovery: SIR-01..04 + ASL-01 — load reason through the path, exit from a permanent `unavailable`, honest copy, freshRound wiring test"
tags: [research, save, autosave, saveFile, saveHealth, e2e, TaskScene, artFilter]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (research step)
---

# Research: save-reason-and-recovery

**Date**: 2026-10-14T13:52:41+02:00
**Researcher**: Claude (autonomous run, research step)
**Git Commit**: ef8f950
**Branch**: feat/save-reason-and-recovery
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (scope SIR-01..04, ASL-01; audit 2026-10-14_1110, PR #45) and the run step prompt:

1. SIR-01: for a `future` save, refuse import/reset, or allow with the text "zapis z nowszej wersji gry"? What does the PRD say?
2. SIR-02: what is the mechanism of the exit from a permanent `unavailable`? Options are a cross-start counter outside the save, or an explicit second confirmation. What do browsers allow? What can a parent do with "wyczyść dane strony" on iPad Safari and Android Chrome?
3. Which e2e specs depend on `?e2eSave=unreadable` being a `future` (v99) save, and what does a separate `corrupt` seam need?
4. SIR-03 / SIR-04: where the reason and the error are lost, and which copy keys are involved.
5. ASL-01: what is the cheapest honest test that `TaskScene.freshRound` passes the missing art ids?

Fixed constraints: the save format stays v1, and the design must hold for a v2 build reading a v3 save. Only existing DOM dialogs and cards are used (profile § 6). New copy goes in `src/data/pl.ts` with a DESIGN-GAP row (next free number: 69).

## Summary

- **SIR-01 → refuse.** A `future` save is healthy. Overwriting it is the only irreversible loss on this path. The PRD guardrail "Postęp nigdy nie ginie" (prd.md, guardrails) and FR-021 ("nieudane przeniesienie zostawia stary zapis nietknięty") back keeping it. FR-022 (import/reset with confirmation) is silent on a newer-format device save. Recommendation:
  - Carry `LoadOutcome.reason` into a runtime status field: `AutosaverOptions`/`AutosaveStatus` get a new `loadReason`.
  - `deviceSaveView` returns `{ kind: 'blocked', cause: 'future' }`. Corrupt and unknown-version saves stay `unreadable`.
  - `Autosaver.replace` refuses with `Blocked` when `loadReason === 'future'`, in the same guard as `unavailable`.
  - Add one new line: "zapis z nowszej wersji gry… zaktualizuj grę". `pl.saveTransfer.rejected.future` already words it for a file.
  - The condition is `reason === 'future'`, never a version number. `decodeSave` sets `future` for any `version > SAVE_VERSION`, so a v2 build reading v3 behaves the same.
  - The parent's exit is the existing "Zachowaj kopię" on the start card (raw export) plus updating the game. The `future` refusal needs no SIR-02 escape hatch, because the save is readable by a newer build.
- **SIR-02 → explicit second confirmation in the dialog, plus a named "wyczyść dane strony" fallback. No cross-start counter in this change.** Two facts drive this:
  - The e2e `unavailable` seam (`e2eSaveStore('unavailable')`) rejects reads but accepts writes. That is exactly the audit's "read rejects, write works" case, where a confirmed `replace` would succeed and end the loop.
  - When IDB is fully broken, the write fails too. The dialog then shows `applyFailed`, and only clearing site data helps.

  A counter in `localStorage` adds a second storage path with its own failure modes for little gain, because the second confirmation is reachable on the first start. Safari private mode keeps localStorage for the session only, and nothing documents localStorage surviving a broken IDB backing store (see "PRD and browser facts"). The counter stays as the rejected alternative, with a reversal condition.
- **e2e:** one spec test breaks under SIR-01: `tests/e2e/save-transfer-blocked.spec.ts` "#2 an unreadable save warns instead of showing the fresh session". It expects `resetConfirm` and `choose` visible and the exact `deviceUnreadable` text, all under `?e2eSave=unreadable` (v99 = `future`).
  - `save-restart.spec.ts` "#2 FR-021 …" asserts `Kod: future` and `"reason": "future"`. That still holds if the card keeps its `detail` line.
  - Recommendation: add the seam value `?e2eSave=corrupt` (initial value e.g. `{ version: 1, … }` that fails `validateSave`, or a non-record). Move the "warns, allows" test to `corrupt`. Repurpose `unreadable` (v99) as the `future` refusal test.
  - No new guard marker is needed: `'e2eSave'` already covers the value (`vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` matches query keys).
  - Lists to extend: `E2ESaveSeam`/`E2E_SAVE_SEAMS` in `src/testing/e2eHook.ts`, `tests/e2eSave.test.ts`, and `it.each` in `tests/e2eHookGuard.test.ts`.
- **SIR-03:** `lastError` already holds the load error name; it is set from `options.loadError` in `createAutosaver`. It is dropped in two places:
  - `saveHealth.ts` `stateOf` returns `{ kind: 'off', cause }` without an error.
  - `main.ts` `start` passes `detail` only when `reason !== null`, so the `unavailable` card has none.

  `timeout` is distinguishable as `outcome.error === 'timeout'` (`loadSave`). The fix is purely runtime/view work, with no format change.
- **SIR-04:** `UIScene.openExport` exports `saver.current()` with no view of `blockedBy`. Cheapest honest fix: pass `deviceSaveView(...)`, or just `blockedBy`, to `openSaveExportDialog` and show one warning line when not healthy. Optionally mark the envelope as well. Marking the envelope (an extra field such as `device: 'unread'`) is format-neutral for `parseImport`, which ignores unknown envelope keys, but it is invisible to the parent; the dialog line is the honest part.
- **ASL-01 → AST source test**, modelled on `tests/deviceSaveWiring.test.ts`: parse `src/scenes/TaskScene.ts` with the TypeScript compiler API and assert, inside `freshRound`:
  - the `buildAdaptiveRound` call has an argument object with `missingIds`;
  - the `buildWarmup` call passes `blocked` as its last argument;
  - `missingIds` is read from `REGISTRY_KEYS.artHealth`.

  It costs one file and no Phaser, and the deliberate break (dropping the argument) turns it red. An e2e alternative would be probabilistic, needs a stage whose rounds include MONEY_COUNT, and needs hook exposure of task types, so it is not recommended.

## Detailed Findings

### SIR-01 — reason flattened, `future` overwritable

- `src/core/autosave.ts` `LoadOutcome`: `unreadable` carries `reason: 'corrupt' | 'future' | 'unknown-version'` and `raw`. `BlockReason` is `'unreadable' | 'unavailable' | 'fatal'`. `AutosaverOptions` has `load`, `blockedBy` and `loadError?`, with no reason. `AutosaveStatus.load` is `LoadOutcome['kind']`.
- `src/main.ts` `start` builds `createAutosaver({ …, load: outcome.kind, blockedBy: outcome.kind === 'unreadable' || outcome.kind === 'unavailable' ? outcome.kind : null, loadError: outcome.kind === 'unavailable' ? outcome.error : undefined })`. On this inspected path the `unreadable` reason reaches only the card's `detail` and a `console.warn`.
- `src/core/saveFile.ts` `deviceSaveView(blockedBy, current, rooms)` maps `blockedBy === 'unreadable'` → `{ kind: 'unreadable' }` and any other non-null value → `{ kind: 'blocked', cause }`.
  - `DeviceSaveView.blocked.cause` is typed `'unavailable' | 'fatal'`.
  - Adding `'future'` to that union is the narrowest change. The dialogs already render `blocked` as "line + Zamknij only" (`saveImportDialog.ts` `blockedStep`, `saveResetDialog.ts` `blocked`).
  - Both dialogs currently use one text for every `blocked` cause (`pl.saveTransfer.deviceUnavailable`). A per-cause text map is needed; it also covers SIR-06's `fatal` text cheaply.
- `Autosaver.replace` refuses only `blockedBy === 'fatal' || 'unavailable'`. The UI gate and the core gate must change together, as they do today for `unavailable` (audit "sprawdzone jako dobre").
- `src/core/save.ts` `decodeSave`: `future` iff `raw.version > SAVE_VERSION`. A migration that throws, or an invalid result, gives `corrupt`. A lower version with no migration gives `unknown-version`. A `reason === 'future'` gate is therefore version-agnostic: when S-15 bumps `SAVE_VERSION` to 2, a v3 save gives `future` with no code change.
- Interaction with SIR-02: if SIR-02 adds a "confirm and overwrite anyway" path, it must not open for `future`. Either keep `future` outside `blocked` or give `replace` an explicit `force` that is refused for `future`.

### PRD and browser facts (resolve SIR-01 / SIR-02 unknowns)

**PRD (`context/foundation/prd.md`):**
- Guardrail "Postęp nigdy nie ginie" and US-04 (state "dokładnie taki sam" after closing, restart, update; "przenoszony, nie kasowany").
- FR-021: a failed migration leaves the old save untouched and offers the parent an export instead of an empty game.
- FR-022: export, validated import with a summary before overwriting, reset with confirmation.
- NFR: no network; data leaves the device only through a deliberate parent export.
- localStorage, `persist()` and "wyczyść dane strony" are not mentioned in the PRD or in `Martynka-urzadza.md` § 8 (IndexedDB/`idb-keyval` named).

**Where the PRD is silent:**
1. **Newer-format device save.** FR-021/US-04 cover only older → newer. FR-022 lets a parent import/reset after a summary but says nothing about a save the build cannot summarise. The spirit (FR-021 "zostawia stary zapis nietknięty", guardrail) favours keeping it, and deploy rollback (`workflow_dispatch` → `rollback`) makes this reachable once a v2 exists. **Recommendation: refuse** (the Summary gives the mechanism). This adds a `[human]` row: a decision taken where the PRD is silent.
2. **Permanently unreadable storage.** FR-021's remedy (export) has nothing to export. No parent action is defined and US-04 cannot hold. **Recommendation: SIR-02 option A + the named site-data advice**, with a `[human]` row next to the existing 6.7 decision ("wbrew literze FR-022").

**Browser storage (web research; sources listed in the worker report, key ones cited):**
- **localStorage as a fallback counter.** Nothing documents that localStorage reliably survives when IndexedDB fails with a backing-store `UnknownError`. That is uncertain, with a field report of both empty.
  - Safari private mode now keeps localStorage for the session only (WebKit bug 157010 fixed), so a cross-start counter would reset in exactly the private case.
  - This weakens option B. Rejected for this change.
- **Self-repair from the page.** `indexedDB.deleteDatabase` is the standard self-repair, but it can itself throw `UnknownError` on a broken store (Mozilla bug 1217257; Dexie.js issue 543).
  - Chrome may silently "recover" a corrupt store into an empty one, which the game sees as `fresh`.
  - So an in-app "delete the database" button is not a reliable exit and is not recommended.
- **iPad Safari, clearing data for one site.** Settings → Apps → Safari → Advanced → Website Data (older iPadOS: Settings → Safari → Advanced → Website Data), then swipe the site → Delete (Apple HT201265).
  - Home-screen web apps keep storage separate from Safari (WebKit bug 181849, "by design").
  - Clearing Safari's Website Data probably does not clear the installed app's data, and whether deleting the home-screen icon wipes it is unverified. Copy for the parent must therefore not promise one exact path. Recommendation: name both "dane witryny w ustawieniach przeglądarki" and "usunięcie ikony gry z ekranu i ponowne dodanie", marked as the last resort that also deletes the save.
- **Android Chrome, clearing data for one site.** Site info (lock icon) → Site settings / Cookies and site data → Clear & reset; or Settings → Site settings → All sites → the domain → Clear & reset.
  - An installed PWA (WebAPK) keeps its data in Chrome's profile, so this same path applies. Labels vary by version (third-party guides).
- **Safari eviction.** ITP deletes all script-writable storage (IndexedDB, localStorage, SW) after 7 days of Safari use without visiting, for in-tab sites. For home-screen apps HTML storage is not deleted (WebKit bug 237350, J. Wilander; WebKit blog "Updates to storage policy", 2023).
  - Not a cause of `unavailable` (eviction yields `fresh`), but it supports the existing install hint.

### SIR-02 — permanent `unavailable`

- `Autosaver.replace` returns `{ ok: false, error: 'Blocked' }` for `unavailable`, before any write (`tests/autosave.test.ts`, `describe('Autosaver.replace …')`, the `Blocked` cases).
- The dialogs offer only "Zamknij" (`blockedStep` / `blocked` branch), and `pl.saveTransfer.deviceUnavailable` ends with "Uruchom grę ponownie i spróbuj jeszcze raz."
- The card copy `pl.saveUnavailable.body` already says "Jeśli to się powtarza, sprawdź, czy przeglądarka nie blokuje danych stron."
- No `localStorage`/`sessionStorage` use exists in `src/` (grep over `src/`, 0 hits).
- `src/storage/idb.ts` `createIdbSaveStore` re-opens the store once on `InvalidStateError`/`UnknownError` (`LOST_CONNECTION`). There is no delete or clear operation, and `idb-keyval` is imported only there (ESLint).
- `loadSave` with a limit abandons a slow read. A `timeout` start may have a healthy, merely slow IDB; a confirmed overwrite would then destroy a save nobody saw. That is why the earlier change (archive `2026-10-14-art-stand-in-and-load-signal/plan.md`, decision 4, `[human]` 6.7) refused `unavailable` outright, against the letter of FR-022.
- **Options compared:**

  | Option | For | Against |
  |---|---|---|
  | A. Second confirmation in the dialog for `unavailable` (not `future`): line + "Zastąp mimo to" behind a second tap, which calls `replace` with `{ force: true }` | Reachable on the first start. Pure core change: the `replace` option is tested like the existing `Blocked` cases. Works in the seam that matches the audit case (read rejects, write works). | May overwrite a healthy but slow save (`timeout`). Mitigate by refusing `force` for `timeout` until the second start, or by the copy saying so. |
  | B. Cross-start counter outside the save (`localStorage`, injected into core), unlocks after N consecutive `unavailable` starts | Distinguishes transient from permanent. | A second storage with its own failure modes (see browser facts). Needs DOM wiring in `main.ts`, a new e2e that reloads, and still needs a dialog path. |
  | C. Text only: name "wyczyść dane strony" with per-platform steps | No code path. | Destroys everything, including a possibly healthy save. No in-app exit. |

  Recommendation: **A, with `timeout` kept refused** (the audit's slow-IDB case; its own text per SIR-03), **plus C's text** in the dialog for the case where the forced write itself fails (`applyFailed` → "wyczyść dane strony"). Rejected: B. Reversal condition: an iPad measurement (N-7, `[human]`) showing that `timeout` is the common permanent case. Then B, or a second read with a longer limit, becomes necessary.

### SIR-03 — reason and error not drawn

- `saveHealth.ts` `stateOf`: when `blockedBy !== null` it returns `{ kind: 'off', cause }` and drops `status.lastError`.
- `saveHealthView.ts` `createSaveHealthView` draws `pl.settings.saveOff[view.cause]` only.
- `pl.settings.saveOff.unavailable` = "przeglądarka nie udostępniła zapisu", the same for `timeout` and for a rejected read.
- `main.ts` `start` sets `detail: reason === null ? undefined : pl.saveFailed.detail(reason, __BUILD_ID__)`, so the `unavailable` card has no code or build. `outcome.error` (a name such as `UnknownError` or `timeout`) is available at that point.
- Recommendation:
  - `SaveHealthState.off` gains `error: string | null` (and the `future` reason via the new status field).
  - The view adds a muted line in the style of `saveEarlier` (`pl.settings.saveOffCode` or a reuse of `pl.saveFailed.detail`).
  - `saveOff` gains a `timeout` text, chosen in `stateOf` when `lastError === 'timeout'`.
  - The `unavailable` card gets `detail: pl.saveFailed.detail(outcome.error, __BUILD_ID__)`. `detail` takes any string, so `Kod: timeout`/`Kod: UnknownError` comes free.
- Existing assertions this touches:
  - `save-restart.spec.ts` "#2 C-1 …" uses `section.getByText(pl.settings.saveOff.unavailable)`, so an extra line is safe; the sentence must stay or the test must change.
  - `tests/saveHealth.test.ts` "every block reason is off with that cause…" expects an exact object; it gets the new field.

### SIR-04 — export under a blocked save

- `UIScene.openExport` → `exportFileText({ kind: 'save', build, exportedAt, save: saver.current() })`. No `blockedBy` is read.
- `openSaveExportDialog` takes `file` and `onClose`, and is shared with the raw export on the start card (`main.ts` `start`).
- Recommendation:
  - Optional `warning?: string` in `openSaveExportDialog`, set by `openExport` when `saver.status().blockedBy !== null`. New copy goes in `pl.saveTransfer`, e.g. "Ta kopia zawiera tylko obecną grę, nie zapis z tego urządzenia."
  - Extend the S12-01 wiring test (`tests/deviceSaveWiring.test.ts`) to `openExport` reading `saver.status().blockedBy`.
  - Envelope marking is optional. `parseImport` ignores unknown envelope keys (only `app`, `kind`, `save`/`raw`, `build`, `exportedAt` are read), so a field such as `device` is backward-compatible. It is not needed for honesty if the dialog line exists.

### ASL-01 — freshRound wiring

- `src/scenes/TaskScene.ts` `freshRound`:
  - `missingIds` comes from `(this.registry.get(REGISTRY_KEYS.artHealth) as ArtHealth | undefined)?.missingIds ?? new Set()`.
  - The warm-up branch builds `blocked` from `artBlocked` and passes it as the last argument of `buildWarmup(…)`.
  - The ordinary path passes `{ missingIds, unlockShare: balance.curriculum.unlockShare }` as the last argument of `buildAdaptiveRound(…)`. That parameter is optional (`src/core/curriculum.ts` `buildAdaptiveRound`, param `art?`), so dropping it type-checks.
  - The `__E2E_HOOK__` `forcedSkills` path returns before `buildAdaptiveRound`, which is why `tests/e2e/art-stand-in.spec.ts` (with `?e2eSkills`) cannot catch the regression.
- Precedent: `tests/deviceSaveWiring.test.ts` and `tests/dialogSessions.test.ts` read scene source with `ts.createSourceFile` and assert calls and text within a named method.
- Cheapest honest test: in `freshRound`,
  - the call `buildAdaptiveRound` has an object-literal argument with property `missingIds`;
  - the call `buildWarmup` has `blocked` as an argument;
  - the body text contains `REGISTRY_KEYS.artHealth`.

  Deliberate break: remove `{ missingIds, … }` → red. Meta-check: this proves the wiring syntax, not runtime behaviour. Runtime filtering is already proven in `tests/artFilter.test.ts` (pure core). The combination closes the gap the audit names.

## Code References

- `src/core/autosave.ts` — `LoadOutcome`, `BlockReason`, `AutosaveStatus`, `AutosaverOptions`, `loadSave` (timeout name `'timeout'`), `createAutosaver` (`lastError = options.loadError`), `replace` (`Blocked` guard)
- `src/core/saveFile.ts` — `DeviceSaveView`, `deviceSaveView`, `exportFileText`, `parseImport` (envelope keys read)
- `src/core/save.ts` — `decodeSave` (`future` / `unknown-version` / `corrupt`)
- `src/core/saveHealth.ts` — `SaveHealthState`, `stateOf`, `saveHealthView`
- `src/ui/dom/saveHealthView.ts` — `createSaveHealthView`
- `src/ui/dom/saveImportDialog.ts` — `openSaveImportDialog`, `blockedStep`; `src/ui/dom/saveResetDialog.ts` — `openSaveResetDialog` (`blocked` branch); `src/ui/dom/saveExportDialog.ts` — `openSaveExportDialog`; `src/ui/dom/saveFailedCard.ts` — `mountSaveFailedCard` (`detail`)
- `src/main.ts` — `start` (seam choice, `loadSave`, card `copy`/`detail`, `createAutosaver` options)
- `src/scenes/UIScene.ts` — `openExport`, `openImport`, `openReset`
- `src/scenes/TaskScene.ts` — `freshRound`
- `src/storage/idb.ts` — `createIdbSaveStore` (`LOST_CONNECTION`)
- `src/testing/e2eHook.ts` — `E2ESaveSeam`, `e2eSave`, `e2eSaveStore`, `E2E_LOAD_TIMEOUT_MS`
- `vite/e2eHookGuard.mjs` — `E2E_HOOK_MARKERS` (`'e2eSave'` covers new values)
- `src/data/pl.ts` — `pl.settings.saveOff`, `pl.settings.saveEarlier`, `pl.saveFailed.detail`, `pl.saveUnavailable`, `pl.saveTransfer.deviceUnavailable`, `pl.saveTransfer.deviceUnreadable`, `pl.saveTransfer.rejected.future`, `pl.saveTransfer.export*`, `pl.saveTransfer.applyFailed`
- Tests: `tests/autosave.test.ts` (`Autosaver.replace` describe), `tests/saveHealth.test.ts`, `tests/saveFile.test.ts`, `tests/deviceSaveWiring.test.ts`, `tests/dialogSessions.test.ts`, `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts`, `tests/saveTransferCopy.test.ts`; e2e `tests/e2e/save-transfer-blocked.spec.ts`, `tests/e2e/save-restart.spec.ts`

## E2E dependency map (`?e2eSave=`)

| Spec / test | Seam | Asserts | Under SIR-01 refusal |
|---|---|---|---|
| `save-transfer-blocked.spec.ts` "#2 an unavailable save cannot be overwritten by import or reset" | `unavailable` | `deviceUnavailable` text, no `choose`/`resetConfirm`, 0 writes | unaffected by SIR-01. **SIR-02 option A changes it** (a second-confirmation button appears; the test must assert the first step still shows no overwrite) |
| `save-transfer-blocked.spec.ts` "#2 an unreadable save warns instead of showing the fresh session" | `unreadable` (v99 = `future`) | `deviceUnreadable` exact text, `resetConfirm` visible, `choose` visible, 0 writes | **breaks** → move to the new `corrupt` seam; add a `future` refusal test on `unreadable` |
| `save-restart.spec.ts` "#2 FR-021 an unreadable save shows the parent card, exports the raw copy and is never written" | `unreadable` | card title, `/^Kod: future · Wersja /`, raw export with `"version": 99`, `"reason": "future"`, 0 writes | holds if the card keeps `detail` and raw export for `future` |
| `save-restart.spec.ts` "#2 C-1 a save the browser will not give…" | `unavailable` | card without export, `lastError: 'UnknownError'`, panel `data-state="off"` + `saveOff.unavailable` text | SIR-03 adds a line in the section and `detail` on the card; check the matcher on the panel text |
| `save-restart.spec.ts` "#2 M-S4 a read that never answers…" | `hang` | card, `lastError: 'timeout'` | SIR-03 timeout text: extend this test to assert it |
| `save-restart.spec.ts` "#2 C-2 failed writes show in the parent panel" | `writefail` | `failing` panel | unaffected |

A new `corrupt` seam needs:
- the value in `E2ESaveSeam`/`E2E_SAVE_SEAMS` and an initial value in `e2eSaveStore`;
- the parse and store cases in `tests/e2eSave.test.ts` and the `it.each` list in `tests/e2eHookGuard.test.ts`;
- the comment in `main.ts` `start`.

No new marker is needed (`'e2eSave'` already in `E2E_HOOK_MARKERS`).

## Architecture Insights

- Every save decision is in pure `core` (`autosave`, `saveFile`, `saveHealth`), and the DOM only renders a view. Each SIR fix keeps that split: new status field → new view field → new `pl` line.
- The UI gate (`deviceSaveView`) and the core gate (`replace`) must stay in lockstep. A `future` or `force` change has to touch both, with a unit test on `replace` and the wiring test.
- Runtime-only state (`AutosaveStatus.replace`, `persistence`) is the established place for per-start facts. `loadReason` belongs there, never in `SaveState` or `SAVE_KEYS` (format v1 unchanged; `tests/saveKeys.test.ts` guards the keys).

## Historical Context (from prior changes)

- `context/archive/2026-10-14-art-stand-in-and-load-signal/plan.md`, decision 4: `unavailable` (also `timeout`) refused in core and dialog; `unreadable` allowed with a warning. "Wbrew literze FR-022" → `[human]` 6.7. The reversal named there ("pomiar N-7 z częstym `timeout` na zdrowym IDB → ponowny odczyt z limitem czasu") still applies; this research keeps `timeout` refused for the same reason. Verdict: supported, still current.
- `context/archive/2026-10-13-save-export-import-reset/plan.md`: `parseImport` already refuses a `future` file with `pl.saveTransfer.rejected.future`. The device-side `future` case was left open as impl-review F1, which SIR-01 closes.
- `context/archive/2026-10-13-save-observability-c1-c2/`: introduced `saveHealthView` and the `unavailable` card (DESIGN-GAP 45).

## Related Research

- `context/archive/2026-10-14-art-stand-in-and-load-signal/research.md`, `context/archive/2026-10-13-save-export-import-reset/research.md` (if present), `context/archive/2026-10-13-save-observability-c1-c2/research.md`.

## Open Questions

- Real iPad behaviour of a permanent `unavailable` and cold-IDB `timeout` (audit: "nieudowodnione"); needs the N-7 `[human]` measurement.
- Resolved: `save-restart.spec.ts` "#2 C-1" uses `section.getByText(pl.settings.saveOff.unavailable)` (substring match within the section), so an extra `<p>` line does not break it; changing the `unavailable` sentence itself would.
- Unverified browser facts (above): localStorage vs broken IDB, iPadOS icon deletion wiping storage, Android "App info → Storage" for a WebAPK. They affect the wording of the site-data advice only.
